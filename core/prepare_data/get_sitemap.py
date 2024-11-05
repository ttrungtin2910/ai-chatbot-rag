import json
import os
import requests
import xml.etree.ElementTree as ET

# URLs of the sitemaps
sitemap_urls = [
    'https://hoatuoimymy.com/product-sitemap1.xml',
    'https://hoatuoimymy.com/product-sitemap2.xml'
]

all_urls = []

# Function to fetch and parse XML
def fetch_sitemap(url):
    try:
        response = requests.get(url)
        response.raise_for_status()  # Check if the request was successful
        root = ET.fromstring(response.content)
        # Extract all <loc> elements that contain the URLs
        for url_element in root.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc'):
            all_urls.append(url_element.text)
    except Exception as e:
        print(f"Error fetching or parsing {url}: {e}")

# Fetch and parse both sitemaps
for sitemap_url in sitemap_urls:
    fetch_sitemap(sitemap_url)

output_dir = 'url'
os.makedirs(output_dir, exist_ok=True)
# Write the URLs to a JSON file
with open(os.path.join(output_dir,'all_urls.json'), 'w') as f:
    json.dump(all_urls, f, indent=4)

print(f"Extracted {len(all_urls)} URLs and saved to all_urls.json")
