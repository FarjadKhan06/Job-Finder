"""
Arbeitnow Scraper
Fetches remote job listings from the Arbeitnow public API — no API key required.

Usage:
    python scrapers/arbeitnow_scraper.py --query "python" --pages 2 --output data/arbeitnow_jobs.json
    python scrapers/arbeitnow_scraper.py --query "data analyst" --pages 3
"""

import argparse
import json
import sys
import time
from datetime import datetime, timezone

import requests

BASE_URL = "https://arbeitnow.com/api/job-board-api"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json",
}


def fetch_page(query: str, page: int) -> list[dict]:
    params = {
        "page": page,
        "tag": query,
    }

    try:
        resp = requests.get(BASE_URL, params=params, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return resp.json().get("data", [])
    except requests.RequestException as e:
        print(f"[arbeitnow] ERROR on page {page}: {e}", file=sys.stderr)
        return []


def normalize(job: dict) -> dict:
    return {
        "title": job.get("title", "N/A"),
        "company": job.get("company_name", "N/A"),
        "location": job.get("location", "Remote"),
        "remote": job.get("remote", False),
        "link": job.get("url", ""),
        "tags": job.get("tags", []),
        "job_types": job.get("job_types", []),
        "description_snippet": job.get("description", "")[:300],
        "posted_at": job.get("created_at", ""),
        "source": "arbeitnow.com",
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }


def main():
    parser = argparse.ArgumentParser(description="Scrape jobs from Arbeitnow API")
    parser.add_argument("--query", required=True, help="Job search keyword (e.g. python, react, data analyst)")
    parser.add_argument("--pages", type=int, default=1, help="Number of pages (default: 1, ~10 jobs/page)")
    parser.add_argument("--output", default=None, help="Save results to JSON file")
    args = parser.parse_args()

    all_jobs = []
    for page in range(1, args.pages + 1):
        print(f"[arbeitnow] Fetching page {page}/{args.pages} for '{args.query}'...")
        results = fetch_page(args.query, page)

        if not results:
            print(f"[arbeitnow] No more results at page {page}, stopping.")
            break

        all_jobs.extend([normalize(j) for j in results])

        if page < args.pages:
            time.sleep(1)

    print(f"[arbeitnow] Found {len(all_jobs)} job(s) matching '{args.query}'")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(all_jobs, f, indent=2, ensure_ascii=False)
        print(f"[arbeitnow] Saved to {args.output}")
    else:
        print(json.dumps(all_jobs, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
