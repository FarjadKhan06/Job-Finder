"""
FastAPI application — Job Finder API

Run with:
    uvicorn backend.main:app --reload

Endpoints:
    GET  /              → health check
    GET  /jobs          → list/search jobs (DB only)
    GET  /jobs/{id}     → get single job
    GET  /stats         → job counts by source
    GET  /live-search   → real-time fetch from APIs + save to DB
"""

from fastapi import FastAPI, Depends, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional

from backend.database import engine, get_db, SessionLocal
from backend.models import Base, Job
from backend.schemas import JobOut, JobsResponse
from backend.crud import get_jobs, upsert_job
from backend.live_search import live_fetch

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Job Finder API",
    description="Real-time job aggregation from Arbeitnow and Adzuna",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "message": "Job Finder API is running"}


@app.get("/jobs", response_model=JobsResponse, tags=["jobs"])
def list_jobs(
    query:    Optional[str]  = Query(None),
    source:   Optional[str]  = Query(None),
    location: Optional[str]  = Query(None),
    remote:   Optional[bool] = Query(None),
    page:     int            = Query(1, ge=1),
    limit:    int            = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    total, jobs = get_jobs(db, query=query, source=source, location=location, remote=remote, page=page, limit=limit)
    return JobsResponse(total=total, page=page, limit=limit, results=jobs)


@app.get("/jobs/{job_id}", response_model=JobOut, tags=["jobs"])
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/live-search", response_model=JobsResponse, tags=["jobs"])
def live_search(
    query:   str           = Query(..., description="Job search query"),
    country: str           = Query("gb", description="Country code for Adzuna (gb, us, etc.)"),
    remote:  Optional[bool]= Query(None),
    page:    int           = Query(1, ge=1),
    limit:   int           = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Fetch jobs live from Arbeitnow + Adzuna, save new ones to DB,
    then return paginated DB results for the query.
    """
    # 1. Fetch live from both APIs in parallel
    fresh_jobs = live_fetch(query, country)

    # 2. Save new jobs to DB (dedup handled inside upsert_job)
    inserted = 0
    for job_data in fresh_jobs:
        _, created = upsert_job(db, job_data)
        if created:
            inserted += 1

    # 3. Query DB for all matching results (includes previously saved + new)
    total, jobs = get_jobs(db, query=query, remote=remote, page=page, limit=limit)

    return JobsResponse(total=total, page=page, limit=limit, results=jobs)


@app.get("/stats", tags=["jobs"])
def stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    rows = db.query(Job.source, func.count(Job.id)).group_by(Job.source).all()
    total = db.query(Job).count()
    return {
        "total_jobs": total,
        "by_source": {source: count for source, count in rows},
    }
