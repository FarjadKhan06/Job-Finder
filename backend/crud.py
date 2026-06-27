"""
Database CRUD operations.
"""

import json
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.models import Job, make_hash


def upsert_job(db: Session, job_data: dict) -> tuple[Job, bool]:
    """
    Insert a job if it doesn't exist (by hash). Returns (job, created).
    """
    h = make_hash(
        job_data.get("title", ""),
        job_data.get("company", ""),
        job_data.get("link", ""),
    )
    existing = db.query(Job).filter(Job.hash == h).first()
    if existing:
        return existing, False

    tags = job_data.get("tags", [])
    tags_str = json.dumps(tags) if isinstance(tags, list) else (tags or "")

    job = Job(
        hash        = h,
        title       = job_data.get("title", "N/A"),
        company     = job_data.get("company"),
        location    = job_data.get("location"),
        remote      = job_data.get("remote", False),
        link        = job_data.get("link"),
        description = job_data.get("description_snippet"),
        tags        = tags_str,
        salary_min  = str(job_data["salary_min"]) if job_data.get("salary_min") else None,
        salary_max  = str(job_data["salary_max"]) if job_data.get("salary_max") else None,
        source      = job_data.get("source"),
        posted_at   = job_data.get("posted_at"),
        scraped_at  = job_data.get("scraped_at"),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job, True


def get_jobs(
    db: Session,
    query: str | None = None,
    source: str | None = None,
    location: str | None = None,
    remote: bool | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[int, list[Job]]:
    """
    Search jobs with optional filters. Returns (total_count, jobs).
    """
    q = db.query(Job)

    if query:
        term = f"%{query.lower()}%"
        q = q.filter(
            or_(
                Job.title.ilike(term),
                Job.company.ilike(term),
                Job.tags.ilike(term),
                Job.description.ilike(term),
            )
        )

    if source:
        q = q.filter(Job.source.ilike(f"%{source}%"))

    if location:
        q = q.filter(Job.location.ilike(f"%{location}%"))

    if remote is not None:
        q = q.filter(Job.remote == remote)

    total = q.count()
    jobs = q.order_by(Job.id.desc()).offset((page - 1) * limit).limit(limit).all()
    return total, jobs
