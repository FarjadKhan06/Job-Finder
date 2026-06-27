"""
JSearch Scraper (via RapidAPI)
-------------------------------
Fetches job listings using the JSearch API — aggregates from LinkedIn,
Indeed, Glassdoor and more. Supports location filtering including Pakistan.

Requires .env:
    JSEARCH_API_KEY=your_rapidapi_key

Usage:
    python scrapers/jsearch_scraper.py --query "software engineer" --location "Pakistan"
    python scrapers/jsearch_scraper.py --query "python developer" --location "Karachi" --pages 2
    python scrapers/jsearch_scraper.py --query "data analyst" --output data/jsearch_jobs.json
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://jsearch.p.rapidapi.com/search"
HOST = "jsearch.p.rapidapi.com"


def get_api_key() -> str:
    key = os.getenv("JSEARCH_API_KEY", "")
    if not key:
        print("[jsearch] ERROR: JSEARCH_API_KEY missing from .env", file=sys.stderr)
        sys.exit(1)
    return key


def fetch_page(query: str, location: str, page: int, api_key: str) -> list[dict]:
    search_query = f"{query} in {location}" if location else query

    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": HOST,
    }
    params = {
        "query": search_query,
        "page": page,
        "num_pages": 1,
    }

    try:
        resp = requests.get(BASE_URL, headers=headers, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])
    except requests.HTTPError as e:
        body = {}
        try:
            body = resp.json()
        except Exception:
            pass
        print(f"[jsearch] HTTP {resp.status_code}: {body}", file=sys.stderr)
        return []
    except requests.RequestException as e:
        print(f"[jsearch] ERROR on page {page}: {e}", file=sys.stderr)
        return []


def normalize(job: dict) -> dict:
    return {
        "title": job.get("job_title", "N/A"),
        "company": job.get("employer_name", "N/A"),
        "location": ", ".join(filter(None, [
            job.get("job_city"),
            job.get("job_state"),
            job.get("job_country"),
        ])) or "Remote",
        "remote": job.get("job_is_remote", False),
        "link": job.get("job_apply_link") or job.get("job_google_link", ""),
        "description_snippet": (job.get("job_description") or "")[:300],
        "employment_type": job.get("job_employment_type", ""),
        "salary_min": job.get("job_min_salary"),
        "salary_max": job.get("job_max_salary"),
        "posted_at": job.get("job_posted_at_datetime_utc", ""),
        "source": "jsearch (rapidapi)",
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }


def main():
    parser = argparse.ArgumentParser(description="Fetch jobs via JSearch RapidAPI")
    parser.add_argument("--query", required=True, help="Job title or keywords")
    parser.add_argument("--location", default="Pakistan", help="Location filter (default: Pakistan)")
    parser.add_argument("--pages", type=int, default=1, help="Pages to fetch (default: 1, ~10 jobs/page)")
    parser.add_argument("--output", default=None, help="Save to JSON file")
    args = parser.parse_args()

    api_key = get_api_key()
    all_jobs = []

    for page in range(1, args.pages + 1):
        print(f"[jsearch] Fetching page {page}/{args.pages} — '{args.query}' in '{args.location}'...")
        results = fetch_page(args.query, args.location, page, api_key)

        if not results:
            print(f"[jsearch] No results on page {page}, stopping.")
            break

        all_jobs.extend([normalize(j) for j in results])

        if page < args.pages:
            time.sleep(1)

    print(f"[jsearch] Found {len(all_jobs)} job(s)")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(all_jobs, f, indent=2, ensure_ascii=False)
        print(f"[jsearch] Saved to {args.output}")
    else:
        print(json.dumps(all_jobs, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
