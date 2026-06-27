"""
SQLAlchemy ORM model for the jobs table.
"""

import hashlib
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from backend.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id          = Column(Integer, primary_key=True, index=True)
    hash        = Column(String(64), unique=True, index=True, nullable=False)  # dedup key

    title       = Column(String(255), nullable=False)
    company     = Column(String(255))
    location    = Column(String(255))
    remote      = Column(Boolean, default=False)
    link        = Column(Text)
    description = Column(Text)
    tags        = Column(Text)          # JSON array stored as string
    salary_min  = Column(String(50))
    salary_max  = Column(String(50))
    source      = Column(String(100))   # "arbeitnow.com", "adzuna.com", etc.
    posted_at   = Column(String(50))
    scraped_at  = Column(String(50))
    created_at  = Column(DateTime, server_default=func.now())


def make_hash(title: str, company: str, link: str) -> str:
    """Generate a deduplication hash from title + company + link."""
    raw = f"{(title or '').lower().strip()}|{(company or '').lower().strip()}|{(link or '').strip()}"
    return hashlib.sha256(raw.encode()).hexdigest()
