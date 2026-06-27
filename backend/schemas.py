"""
Pydantic schemas for API request/response validation.
"""

from typing import Optional
from pydantic import BaseModel


class JobOut(BaseModel):
    id:          int
    title:       str
    company:     Optional[str]
    location:    Optional[str]
    remote:      Optional[bool]
    link:        Optional[str]
    tags:        Optional[str]
    salary_min:  Optional[str]
    salary_max:  Optional[str]
    source:      Optional[str]
    posted_at:   Optional[str]
    scraped_at:  Optional[str]

    class Config:
        from_attributes = True


class JobsResponse(BaseModel):
    total:   int
    page:    int
    limit:   int
    results: list[JobOut]
