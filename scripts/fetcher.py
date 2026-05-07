"""Fetcher: pulls candidate articles from RSS feeds, HTML scrapes, and search.

Output is a list of `Candidate` dicts, each with:
  - title, url, published_date, snippet, source_name, source_tier
"""

import logging
import os
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from urllib.parse import urlencode

import feedparser
import requests
from bs4 import BeautifulSoup
from dateutil import parser as date_parser

from sources import (
    TIER_1_SOURCES,
    TIER_2_SOURCES,
    TIER_3_SEARCH_QUERIES,
    RELEVANCE_KEYWORDS,
    ACTION_KEYWORDS,
)

log = logging.getLogger(__name__)

# Look back this far for new items. Daily cron with 7-day window is forgiving;
# if the action fails for a few days, we still catch up.
LOOKBACK_DAYS = 7

USER_AGENT = "incident-watcher/1.0 (+https://github.com/AlgorhythmicIndustries)"


def _is_relevant(text: str) -> bool:
    """Conservative pre-filter: needs a Solana-ish word AND an exploit-ish word."""
    t = text.lower()
    has_solana = any(kw in t for kw in RELEVANCE_KEYWORDS)
    has_action = any(kw in t for kw in ACTION_KEYWORDS)
    return has_solana and has_action


def _fetch_rss(source: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Pull entries from an RSS feed and filter for relevance."""
    candidates = []
    cutoff = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)
    try:
        feed = feedparser.parse(source["url"], agent=USER_AGENT)
        if feed.bozo and not feed.entries:
            log.warning("Feed parse error for %s: %s", source["name"], feed.bozo_exception)
            return []

        for entry in feed.entries:
            # Date parsing: feeds vary wildly. Try published, then updated, then fall through.
            pub_str = entry.get("published") or entry.get("updated") or ""
            try:
                pub_dt = date_parser.parse(pub_str)
                if pub_dt.tzinfo is None:
                    pub_dt = pub_dt.replace(tzinfo=timezone.utc)
                if pub_dt < cutoff:
                    continue
            except (ValueError, TypeError):
                # If we can't parse the date, include it — the LLM will sort out staleness.
                pub_dt = None

            title = entry.get("title", "")
            summary = entry.get("summary", "") or entry.get("description", "")
            combined = f"{title} {summary}"

            if not _is_relevant(combined):
                continue

            candidates.append({
                "title": title,
                "url": entry.get("link", ""),
                "published_date": pub_dt.isoformat() if pub_dt else None,
                "snippet": _strip_html(summary)[:500],
                "source_name": source["name"],
                "source_tier": source.get("tier", 2),
            })
    except Exception as e:
        log.error("Failed to fetch RSS %s: %s", source["name"], e)
    return candidates


def _strip_html(html: str) -> str:
    """Quick-and-dirty HTML stripping for feed summaries."""
    if not html:
        return ""
    return BeautifulSoup(html, "html.parser").get_text(" ", strip=True)


def _fetch_slowmist() -> List[Dict[str, Any]]:
    """Scrape SlowMist's Solana incidents page.

    Their HTML is stable: each incident is in an article-style block with the
    date as the leading element. We grab everything in the lookback window.
    """
    candidates = []
    cutoff = datetime.now(timezone.utc).date() - timedelta(days=LOOKBACK_DAYS)
    try:
        resp = requests.get(
            "https://hacked.slowmist.io/?c=Solana",
            headers={"User-Agent": USER_AGENT},
            timeout=30,
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # SlowMist entries follow a pattern: a date header (YYYY-MM-DD format)
        # followed by "Hacked target:", "Description of the event:",
        # "Amount of loss:", "Attack method:", and a "View Reference Sources" link.
        text = soup.get_text("\n", strip=True)
        # Split on date markers — SlowMist uses YYYY-MM-DD prefix
        import re
        entry_pattern = re.compile(
            r"(\d{4}-\d{2}-\d{2})\s*Hacked target:\s*(.+?)"
            r"Description of the event:\s*(.+?)"
            r"Amount of loss:\s*(.+?)"
            r"Attack method:\s*(.+?)"
            r"View Reference Sources",
            re.DOTALL,
        )
        # Also grab the reference link associated with each block.
        for link in soup.find_all("a", string=lambda s: s and "View Reference Sources" in s):
            # Walk back to find the date marker
            href = link.get("href", "")
            block = link.parent.get_text("\n", strip=True) if link.parent else ""
            m = re.search(r"(\d{4}-\d{2}-\d{2})", block)
            if not m:
                continue
            try:
                entry_date = datetime.strptime(m.group(1), "%Y-%m-%d").date()
            except ValueError:
                continue
            if entry_date < cutoff:
                continue
            # Grab a bit of context for the snippet
            target_match = re.search(r"Hacked target:\s*(.+?)(?:Description|$)", block, re.DOTALL)
            target = target_match.group(1).strip() if target_match else ""
            desc_match = re.search(
                r"Description of the event:\s*(.+?)(?:Amount of loss|$)", block, re.DOTALL
            )
            desc = desc_match.group(1).strip()[:500] if desc_match else ""
            candidates.append({
                "title": f"SlowMist: {target}",
                "url": href,  # Points to the original X/news source SlowMist cites
                "published_date": entry_date.isoformat(),
                "snippet": block[:1000],  # Whole SlowMist entry as snippet
                "source_name": "SlowMist Hacked DB",
                "source_tier": 1,
                "_slowmist_full_text": block,  # Used for direct extraction later
            })
    except Exception as e:
        log.error("Failed to scrape SlowMist: %s", e)
    return candidates


def _fetch_brave_search(query: str) -> List[Dict[str, Any]]:
    """Brave Search API. Free tier: 2,000 queries/month, 1 query/sec.

    Returns recent web results matching the query.
    """
    api_key = os.environ.get("BRAVE_API_KEY")
    if not api_key:
        log.info("BRAVE_API_KEY not set; skipping web search step")
        return []

    candidates = []
    try:
        params = {
            "q": query,
            "count": 10,
            "freshness": f"pd{LOOKBACK_DAYS}",  # past N days
        }
        resp = requests.get(
            "https://api.search.brave.com/res/v1/web/search",
            params=params,
            headers={
                "Accept": "application/json",
                "X-Subscription-Token": api_key,
                "User-Agent": USER_AGENT,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        for result in data.get("web", {}).get("results", []):
            title = result.get("title", "")
            desc = result.get("description", "")
            combined = f"{title} {desc}"
            if not _is_relevant(combined):
                continue
            age_str = result.get("age", "")
            try:
                pub_dt = date_parser.parse(age_str) if age_str else None
            except (ValueError, TypeError):
                pub_dt = None
            candidates.append({
                "title": title,
                "url": result.get("url", ""),
                "published_date": pub_dt.isoformat() if pub_dt else None,
                "snippet": desc[:500],
                "source_name": f"Brave Search: '{query}'",
                "source_tier": 3,
            })
    except Exception as e:
        log.error("Brave Search failed for '%s': %s", query, e)
    return candidates


def fetch_all() -> List[Dict[str, Any]]:
    """Run every source, return deduplicated candidates."""
    all_candidates: List[Dict[str, Any]] = []

    # Tier 1: security firms (high signal)
    log.info("Fetching Tier 1 sources...")
    for src in TIER_1_SOURCES:
        src_with_tier = {**src, "tier": 1}
        if src["type"] == "rss":
            all_candidates.extend(_fetch_rss(src_with_tier))
        elif src.get("scraper") == "slowmist":
            all_candidates.extend(_fetch_slowmist())

    # Tier 2: news outlets
    log.info("Fetching Tier 2 sources...")
    for src in TIER_2_SOURCES:
        src_with_tier = {**src, "tier": 2}
        all_candidates.extend(_fetch_rss(src_with_tier))

    # Tier 3: web search (only if we have an API key)
    log.info("Running Tier 3 search queries...")
    for query in TIER_3_SEARCH_QUERIES:
        all_candidates.extend(_fetch_brave_search(query))

    # Dedupe by URL — a story showing up in both Decrypt's RSS and a Brave search
    # should be one candidate with the higher-tier source name preserved.
    seen: Dict[str, Dict[str, Any]] = {}
    for c in all_candidates:
        url = c.get("url", "").strip()
        if not url:
            continue
        # Normalize trailing slashes / fragments for dedup
        url_key = url.rstrip("/").split("#")[0]
        existing = seen.get(url_key)
        if existing is None or c["source_tier"] < existing["source_tier"]:
            seen[url_key] = c

    deduped = list(seen.values())
    log.info("Fetched %d candidates after dedup", len(deduped))
    return deduped


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    candidates = fetch_all()
    import json
    print(json.dumps(candidates, indent=2, default=str))
