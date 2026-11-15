"""Veille technologique : récupère les derniers articles de quelques flux RSS
et écrit data/veille.json (lu par le site). Lancé par GitHub Actions chaque semaine.

Bibliothèque standard uniquement : pas de dépendance à installer.
"""
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path

FEEDS = {
    "ia": [  # nouveautés de l'IA
        ("Hugging Face", "https://huggingface.co/blog/feed.xml"),
        ("Google DeepMind", "https://deepmind.google/blog/rss.xml"),
        ("OpenAI", "https://openai.com/news/rss.xml"),
        ("MIT Technology Review", "https://www.technologyreview.com/topic/artificial-intelligence/feed"),
    ],
    "data": [  # data & machine learning
        ("KDnuggets", "https://www.kdnuggets.com/feed"),
        ("Towards Data Science", "https://towardsdatascience.com/feed"),
        ("Machine Learning Mastery", "https://machinelearningmastery.com/feed/"),
        ("Google Research", "https://research.google/blog/rss/"),
    ],
}
PER_CATEGORY = 3
UA = "Mozilla/5.0 (compatible; portfolio-veille/1.0; +https://yassinehq.github.io/portfolio/)"
ATOM = "{http://www.w3.org/2005/Atom}"


def fetch(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def parse_date(text):
    if not text:
        return None
    text = text.strip()
    try:
        return parsedate_to_datetime(text).astimezone(timezone.utc)
    except Exception:
        pass
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None


def entries(xml_bytes, source):
    root = ET.fromstring(xml_bytes)
    out = []
    # RSS 2.0
    for item in root.iter("item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        date = parse_date(item.findtext("pubDate") or item.findtext("{http://purl.org/dc/elements/1.1/}date"))
        if title and link:
            out.append({"title": title, "url": link, "source": source, "date": date})
    # Atom
    for entry in root.iter(ATOM + "entry"):
        title = (entry.findtext(ATOM + "title") or "").strip()
        link = ""
        for l in entry.findall(ATOM + "link"):
            if l.get("rel", "alternate") == "alternate":
                link = l.get("href", "")
                break
        date = parse_date(entry.findtext(ATOM + "published") or entry.findtext(ATOM + "updated"))
        if title and link:
            out.append({"title": title, "url": link, "source": source, "date": date})
    return out


def collect(category):
    items = []
    for source, url in FEEDS[category]:
        try:
            got = entries(fetch(url), source)[:5]
            items.extend(got)
            print(f"  {source}: {len(got)} article(s)")
        except Exception as e:  # un flux en panne ne doit pas bloquer les autres
            print(f"  {source}: ignoré ({e})", file=sys.stderr)
    items = [i for i in items if i["date"]]
    items.sort(key=lambda i: i["date"], reverse=True)
    # au plus un article par source, pour varier
    seen, picked = set(), []
    for i in items:
        if i["source"] in seen:
            continue
        seen.add(i["source"])
        picked.append(i)
        if len(picked) == PER_CATEGORY:
            break
    return [{**i, "date": i["date"].date().isoformat()} for i in picked]


def main():
    out_path = Path(__file__).resolve().parent.parent / "data" / "veille.json"
    previous = {}
    if out_path.exists():
        previous = json.loads(out_path.read_text(encoding="utf-8"))
    data = {"updated": datetime.now(timezone.utc).date().isoformat(), "ia": [], "data": []}
    for cat in ("ia", "data"):
        print(f"[{cat}]")
        picked = collect(cat)
        # si tout a échoué, on garde la liste précédente plutôt que de vider la page
        data[cat] = picked or previous.get(cat, [])
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"écrit {out_path} ({len(data['ia'])} IA, {len(data['data'])} data/ML)")


if __name__ == "__main__":
    main()
