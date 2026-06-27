"""
Live search — fetches jobs in real-time from Arbeitnow and Adzuna,
filters German-language jobs, saves new results to DB.
"""

import os
import json
import time
import requests
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv

load_dotenv()

GERMAN_CHARS = set("äöüßÄÖÜ")

def is_german(title: str) -> bool:
    """Return True if the job title appears to be in German."""
    return any(c in GERMAN_CHARS for c in (title or ""))


# ── Arbeitnow ────────────────────────────────────────────────────────────────

def fetch_arbeitnow(query: str, pages: int = 2) -> list[dict]:
    results = []
    headers = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}

    for page in range(1, pages + 1):
        try:
            resp = requests.get(
                "https://arbeitnow.com/api/job-board-api",
                params={"page": page, "tag": query},
                headers=headers,
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json().get("data", [])
            if not data:
                break
            for job in data:
                title = job.get("title", "")
                if is_german(title):
                    continue
                results.append({
                    "title":               title,
                    "company":             job.get("company_name"),
                    "location":            job.get("location", "Remote"),
                    "remote":              job.get("remote", False),
                    "link":                job.get("url", ""),
                    "tags":                job.get("tags", []),
                    "description_snippet": (job.get("description") or "")[:300],
                    "salary_min":          None,
                    "salary_max":          None,
                    "posted_at":           job.get("created_at", ""),
                    "source":              "arbeitnow.com",
                    "scraped_at":          datetime.now(timezone.utc).isoformat(),
                })
            time.sleep(0.5)
        except Exception:
            break

    return results


# ── Adzuna ────────────────────────────────────────────────────────────────────

def fetch_adzuna(query: str, country: str = "gb", pages: int = 1) -> list[dict]:
    app_id  = os.getenv("ADZUNA_APP_ID", "")
    app_key = os.getenv("ADZUNA_APP_KEY", "")
    if not app_id or not app_key:
        return []

    results = []
    for page in range(1, pages + 1):
        try:
            resp = requests.get(
                f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}",
                params={
                    "app_id":          app_id,
                    "app_key":         app_key,
                    "results_per_page": 50,
                    "what":            query,
                    "content-type":    "application/json",
                },
                timeout=10,
            )
            resp.raise_for_status()
            for job in resp.json().get("results", []):
                title = job.get("title", "")
                if is_german(title):
                    continue
                results.append({
                    "title":               title,
                    "company":             job.get("company", {}).get("display_name"),
                    "location":            job.get("location", {}).get("display_name"),
                    "remote":              False,
                    "link":                job.get("redirect_url", ""),
                    "tags":                [],
                    "description_snippet": (job.get("description") or "")[:300],
                    "salary_min":          job.get("salary_min"),
                    "salary_max":          job.get("salary_max"),
                    "posted_at":           job.get("created", ""),
                    "source":              "adzuna.com",
                    "scraped_at":          datetime.now(timezone.utc).isoformat(),
                })
            time.sleep(0.5)
        except Exception:
            break

    return results


# ── Combined live fetch ───────────────────────────────────────────────────────

def live_fetch(query: str, country: str = "gb") -> list[dict]:
    """Fetch from both sources in parallel and return combined results."""
    all_jobs = []
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = {
            pool.submit(fetch_arbeitnow, query, 2): "arbeitnow",
            pool.submit(fetch_adzuna, query, country, 1): "adzuna",
        }
        for future in as_completed(futures):
            try:
                all_jobs.extend(future.result())
            except Exception:
                pass
    return all_jobs
