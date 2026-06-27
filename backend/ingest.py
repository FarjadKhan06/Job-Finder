"""
Ingest scraped JSON files into the database.

Usage:
    python backend/ingest.py data/arbeitnow_jobs.json
    python backend/ingest.py data/arbeitnow_jobs.json data/adzuna_jobs.json
    python backend/ingest.py data/*.json
"""

import json
import sys
from pathlib import Path

# Make sure backend package is importable from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.database import SessionLocal, engine
from backend.models import Base
from backend.crud import upsert_job

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)


def ingest_file(path: str) -> tuple[int, int]:
    """Load a JSON file of job dicts into the DB. Returns (inserted, skipped)."""
    with open(path, encoding="utf-8") as f:
        jobs = json.load(f)

    if not isinstance(jobs, list):
        print(f"[ingest] Skipping {path} — expected a JSON array")
        return 0, 0

    inserted = skipped = 0
    db = SessionLocal()
    try:
        for job in jobs:
            _, created = upsert_job(db, job)
            if created:
                inserted += 1
            else:
                skipped += 1
    finally:
        db.close()

    return inserted, skipped


def main():
    if len(sys.argv) < 2:
        print("Usage: python backend/ingest.py <file1.json> [file2.json ...]")
        sys.exit(1)

    total_inserted = total_skipped = 0

    for path in sys.argv[1:]:
        print(f"[ingest] Processing {path}...")
        inserted, skipped = ingest_file(path)
        print(f"  ✓ {inserted} inserted, {skipped} duplicates skipped")
        total_inserted += inserted
        total_skipped += skipped

    print(f"\n[ingest] Done — {total_inserted} new jobs, {total_skipped} duplicates skipped")


if __name__ == "__main__":
    main()
