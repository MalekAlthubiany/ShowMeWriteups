# pip install feedparser requests beautifulsoup4 psycopg2-binary
import os, hashlib, feedparser, requests, psycopg2
from bs4 import BeautifulSoup
from datetime import datetime, timezone

DB = os.environ["DATABASE_URL"]

def upsert(cur, item):
    cur.execute("""      insert into reports(source_id, title, platform, severity, program, bounty, currency, published_at, url, weakness, hash)
      values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
      on conflict (hash) do nothing
    """, (
      item["source_id"], item["title"], item["platform"], item["severity"], item.get("program"),
      item.get("bounty"), item.get("currency"), item["published_at"], item["url"], item.get("weakness"),
      item["hash"]
    ))

def h1_items():
    feed = feedparser.parse("https://h1rss.badtech.xyz/rss")
    for e in feed.entries:
        blob = (e.title + " " + getattr(e, "summary", "")).lower()
        if "critical" not in blob:
            continue
        url = e.link
        title = e.title.strip()
        h = hashlib.sha256((url + title).encode()).hexdigest()
        if getattr(e, "published_parsed", None):
            published = datetime(*e.published_parsed[:6], tzinfo=timezone.utc)
        else:
            published = datetime.now(timezone.utc)
        yield {
            "source_id": url, "title": title, "platform": "HackerOne", "severity": "critical",
            "program": None, "bounty": None, "currency": "USD",
            "published_at": published, "url": url, "weakness": None, "hash": h
        }

def bugcrowd_items():
    html = requests.get("https://bugcrowd.com/crowdstream", timeout=25).text
    soup = BeautifulSoup(html, "html.parser")
    for card in soup.select("[data-test='crowdstream-card']"):
        text = card.get_text(" ").lower()
        if "disclosed" not in text: continue
        if not ("p1" in text or "critical" in text): continue
        a = card.find("a", href=True)
        if not a: continue
        url = "https://bugcrowd.com" + a["href"]
        title = a.get_text(" ").strip() or "Disclosed report"
        h = hashlib.sha256((url + title).encode()).hexdigest()
        yield {
            "source_id": url, "title": title, "platform": "Bugcrowd", "severity": "critical",
            "program": None, "bounty": None, "currency": "USD",
            "published_at": datetime.now(timezone.utc), "url": url, "weakness": None, "hash": h
        }

def main():
    conn = psycopg2.connect(DB)
    cur = conn.cursor()
    for item in list(h1_items()) + list(bugcrowd_items()):
        upsert(cur, item)
    conn.commit()
    cur.close(); conn.close()

if __name__ == "__main__":
    main()
