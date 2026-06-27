"""
Adzuna Scraper
Fetches job listings from the Adzuna REST API.

Requires .env file with:
    ADZUNA_APP_ID=your_app_id
    ADZUNA_APP_KEY=your_app_key

Usage:
    python scrapers/adzuna_scraper.py --query "python developer" --country pk --pages 2
    python scrapers/adzuna_scraper.py --query "data analyst" --country us --output data/adzuna_jobs.json
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

BASE_URL = "https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"
RESULTS_PER_PAGE = 50


def get_credentials() -> tuple[str, str]:
    app_id = os.getenv("ADZUNA_APP_ID", "")
    app_key = os.getenv("ADZUNA_APP_KEY", "")

    if not app_id or not app_key:
        print(
            "[adzuna] ERROR: Missing ADZUNA_APP_ID or ADZUNA_APP_KEY in .env",
            file=sys.stderr,
        )
        sys.exit(1)

    if app_key == "your_app_key_here":
        print(
            "[adzuna] ERROR: Replace 'your_app_key_here' in .env with your real Adzuna API key.\n"
            "         Get it at: https://developer.adzuna.com/",
            file=sys.stderr,
        )
        sys.exit(1)

    return app_id, app_key


def fetch_page(query: str, country: str, page: int, app_id: str, app_key: str) -> list[dict]:
    """Fetch a single page of results from Adzuna."""
    url = BASE_URL.format(country=country, page=page)
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": RESULTS_PER_PAGE,
        "what": query,
        "content-type": "application/json",
    }

    try:
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        return data.get("results", [])
    except requests.HTTPError as e:
        body = {}
        try:
            body = resp.json()
        except Exception:
            pass
        print(f"[adzuna] HTTP {resp.status_code} on page {page}: {body}", file=sys.stderr)
        return []
    except requests.RequestException as e:
        print(f"[adzuna] ERROR on page {page}: {e}", file=sys.stderr)
        return []


def normalize(job: dict, country: str) -> dict:
    """Convert raw Adzuna job dict to standard schema."""
    location_parts = job.get("location", {}).get("display_name", "N/A")
    company = job.get("company", {}).get("display_name", "N/A")
    category = job.get("category", {}).get("label", "")

    return {
        "title": job.get("title", "N/A"),
        "company": company,
        "location": location_parts,
        "link": job.get("redirect_url", ""),
        "description_snippet": job.get("description", "")[:300],
        "salary_min": job.get("salary_min"),
        "salary_max": job.get("salary_max"),
        "category": category,
        "country": country,
        "posted_at": job.get("created", ""),
        "source": "adzuna.com",
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }


def main():
    parser = argparse.ArgumentParser(description="Scrape jobs from Adzuna API")
    parser.add_argument("--query", required=True, help="Job search keyword(s)")
    parser.add_argument(
        "--country",
        default="pk",
        help="Country code: pk, us, gb, ca, au, de, fr, in, nl, nz, sg (default: pk)",
    )
    parser.add_argument("--pages", type=int, default=1, help="Number of pages to fetch (default: 1)")
    parser.add_argument("--output", default=None, help="Save results to JSON file")
    args = parser.parse_args()

    app_id, app_key = get_credentials()

    all_jobs = []
    for page in range(1, args.pages + 1):
        print(f"[adzuna] Fetching page {page}/{args.pages} for '{args.query}' in '{args.country}'...")
        raw = fetch_page(args.query, args.country, page, app_id, app_key)
        all_jobs.extend([normalize(j, args.country) for j in raw])

        if page < args.pages:
            time.sleep(1)  # be polite

    print(f"[adzuna] Found {len(all_jobs)} job(s)")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(all_jobs, f, indent=2, ensure_ascii=False)
        print(f"[adzuna] Saved to {args.output}")
    else:
        print(json.dumps(all_jobs, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
