import feedparser
import json
import os
from datetime import datetime

SOURCES = [
    {"name": "Red Hat Enterprise Linux Blog", "category": "Red Hat", "url": "https://www.redhat.com/en/blog/feed"},
    {"name": "AWS What's New", "category": "AWS", "url": "https://aws.amazon.com/about-aws/whats-new/recent/feed/"},
    {"name": "Azure Updates", "category": "Azure", "url": "https://azurecomcdn.azureedge.net/en-us/updates/feed/"},
    {"name": "Google Cloud Blog", "category": "GCP", "url": "https://cloud.google.com/blog/rss"},
    {"name": "VMware Blogs", "category": "VMware", "url": "https://blogs.vmware.com/feed"},
    {"name": "Microsoft Windows Server", "category": "Microsoft", "url": "https://techcommunity.microsoft.com/t5/s/rss/board?board-id=WindowsServerBlog"}
]

categories = ["All", "Red Hat", "AWS", "Azure", "GCP", "VMware", "Microsoft"]
articles = []

for source in SOURCES:
    print(f"Fetching {source['name']}...")
    parsed_feed = feedparser.parse(source['url'])
    for entry in parsed_feed.entries[:10]: # Top 10 per feed
        # Handle date parsing safely
        pub_date = entry.get('published_parsed', entry.get('updated_parsed', None))
        if pub_date:
            dt = datetime(*pub_date[:6]).isoformat()
        else:
            dt = datetime.now().isoformat()
            
        articles.append({
            "title": entry.get('title', 'No Title'),
            "link": entry.get('link', '#'),
            "pubDate": dt,
            "description": entry.get('summary', '')[:150] + "...",
            "category": source['category'],
            "source": source['name']
        })

os.makedirs('data', exist_ok=True)
with open('data/news.json', 'w') as f:
    json.dump({"categories": categories, "articles": articles}, f, indent=2)
print("Successfully generated data/news.json")
