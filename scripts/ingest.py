# scripts/ingest.py
# pip install feedparser requests beautifulsoup4 psycopg2-binary python-dateutil
import os, time, hashlib, feedparser, requests, psycopg2
from bs4 import BeautifulSoup
from datetime import datetime, timedelta, timezone
from dateutil import parser as dtp

DB = os.environ["DATABASE_URL"]
DAYS = int(os.getenv("BACKFILL_DAYS", "30"))  # how far back to keep
UA = {"User-Agent": "BugDailyBot/1.0 (+https://example.com)"}

def norm(text: str) -> str:
    return " ".join((text or "").strip().split())

def make_hash(platform, url, title):
    base = f"{platform}|{norm(url)}|{norm(title)}".lower()
    return hashlib.sha256(base.encode()).hexdigest()

def upsert(cur, item):
    cur.execute("""
      insert into reports(source_id, title, platform, severity, program, bounty, currency, published_at, url, weakness, hash)
      values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
      on conflict (hash) do update set
        title = excluded.title,
        program = coalesce(excluded.program, reports.program),
        bounty  = coalesce(excluded.bounty, reports.bounty),
        currency= coalesce(excluded.currency, reports.currency),
        published_at = greatest(excluded.published_at, reports.published_at)
    """, (
      item["source_id"], item["title"], item["platform"], item["severity"], item.get("program"),
      item.get("bounty"), item.get("currency"), item["published_at"], item["url"], item.get("weakness"),
      item["hash"]
    ))

def h1_items():
    # community RSS that mirrors Hacktivity (easier/safer than brittle HTML)
    url = "https://h1rss.badtech.xyz/rss"
    feed = feedparser.parse(url)
    for e in feed.entries:
        title = norm(e.title)
        blob = (title + " " + norm(getattr(e, "summary", ""))).lower()
        if "critical" not in blob:
            continue
        link = getattr(e, "link", None)
        if not link: continue
        try:
            published = dtp.parse(getattr(e, "published", "")) if getattr(e, "published", "") else datetime.now(timezone.utc)
            if published.tzinfo is None: published = published.replace(tzinfo=timezone.utc)
        except Exception:
            published = datetime.now(timezone.utc)

        h = make_hash("HackerOne", link, title)
        yield {
            "source_id": link,
            "title": title,
            "platform": "HackerOne",
            "severity": "critical",
            "program": None,
            "bounty": None,
            "currency": "USD",
            "published_at": published,
            "url": link,
            "weakness": None,
            "hash": h,
        }

def get(url, **kw):
    for i in range(3):
        try:
            r = requests.get(url, headers=UA, timeout=20, **kw)
            if r.status_code == 200:
                return r.text
        except Exception:
            time.sleep(1.5 * (i+1))
    return ""

def bugcrowd_items():
    html = get("https://bugcrowd.com/crowdstream")
    if not html: return
    soup = BeautifulSoup(html, "html.parser")
    for card in soup.select("[data-test='crowdstream-card']"):
        text = norm(card.get_text(" "))
        low = text.lower()
        if "disclosed" not in low:  # we only want public
            continue
        if ("p1" not in low) and ("critical" not in low):
            continue
        a = card.find("a", href=True)
        if not a: continue
        url = "https://bugcrowd.com" + a["href"]
        title = norm(a.get_text(" ")) or "Disclosed report"
        h = make_hash("Bugcrowd", url, title)
        yield {
            "source_id": url,
            "title": title,
            "platform": "Bugcrowd",
            "severity": "critical",
            "program": None,
            "bounty": None,
            "currency": "USD",
            "published_at": datetime.now(timezone.utc),
            "url": url,
            "weakness": None,
            "hash": h,
        }

def cleanup(cur):
    cutoff = datetime.now(timezone.utc) - timedelta(days=DAYS)
    cur.execute("delete from reports where published_at < %s", (cutoff,))

def main():
    conn = psycopg2.connect(DB)
    cur = conn.cursor()
    for item in list(h1_items()) + list(bugcrowd_items()):
        upsert(cur, item)
    cleanup(cur)
    conn.commit()
    cur.close(); conn.close()

if __name__ == "__main__":
    main()
