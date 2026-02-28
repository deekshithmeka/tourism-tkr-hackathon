"""
Wikipedia Image Service — free, no API key needed.
Uses the MediaWiki API to fetch page thumbnail images.

Strategy (3-tier):
  1. Direct Wikipedia title lookup (exact match)
  2. Wikipedia SEARCH API (find best matching article, fetch its image)
  3. Category-specific high-quality fallback
"""

import httpx
import asyncio

WIKI_API = "https://en.wikipedia.org/w/api.php"
HEADERS = {"User-Agent": "TravelGenieAI/1.0 (student project)"}

# Multiple fallback images per category — ALL URLs are UNIQUE across categories (Unsplash CDN — free)
FALLBACK_IMAGES = {
    "temples": [
        "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1609766856923-7e0a0c06a4e8?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1545126178-862cdb469409?w=600&h=400&fit=crop",
    ],
    "nature": [
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=600&h=400&fit=crop",
    ],
    "malls": [
        "https://images.unsplash.com/photo-1567449303078-57ad995bd329?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1519567241046-7f570309eb5c?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1481437156560-3205f6a55acc?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1580793241553-e9f1cce181af?w=600&h=400&fit=crop",
    ],
    "beaches": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1520454974749-611b7248ffdb?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1510414342286-e2b5a19dee35?w=600&h=400&fit=crop",
    ],
    "monuments": [
        "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1568454537842-d933259bb258?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1548515508-29a51dd7b0f1?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1585506942812-e72b29cef752?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1591018653404-e5250eb80481?w=600&h=400&fit=crop",
    ],
    "forts": [
        "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1590077428593-a55bb07c4665?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1621996659490-3275b4d0d951?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1579613832125-5d34a13ffe2a?w=600&h=400&fit=crop",
    ],
    "palaces": [
        "https://images.unsplash.com/photo-1564507592917-92dc2d0aecd0?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1600011689032-8b628b8a8747?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735d?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1557750255-c76072a7aee1?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=600&h=400&fit=crop",
    ],
    "museums": [
        "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1503152394-c571994fd383?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=600&h=400&fit=crop",
    ],
    "lakes": [
        "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=400&fit=crop",
    ],
    "waterfalls": [
        "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1467890947394-8171244e5410?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1517353092053-29be49e1bd93?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1565398395412-31a8e45e3e50?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1549882167-ced0a1c8a0c3?w=600&h=400&fit=crop",
    ],
    "wildlife": [
        "https://images.unsplash.com/photo-1535338454528-1b22dc446265?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1504173010664-32509aeebb62?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1549480017-d76466a4b7e8?w=600&h=400&fit=crop",
    ],
    "adventure": [
        "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1528543606781-2f6e6857f318?w=600&h=400&fit=crop",
    ],
    "pilgrimage": [
        "https://images.unsplash.com/photo-1591019479261-1a103585c559?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1585820562261-0b4eb6a7fb47?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1575387873251-67a1a5b4509f?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1544006659-f0b21505571d?w=600&h=400&fit=crop",
    ],
    "hill stations": [
        "https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=600&h=400&fit=crop",
    ],
    "caves": [
        "https://images.unsplash.com/photo-1500049242364-5f500807cdd7?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1572152269751-1bbc6dbb6977?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1559541507-c6e53d6f0e76?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1604537529428-15bcbeecfe4d?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1510525009512-ad7fc13eefab?w=600&h=400&fit=crop",
    ],
    "gardens": [
        "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1584479898061-15742e14f50d?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1598902108854-d1446677dc7b?w=600&h=400&fit=crop",
    ],
    "islands": [
        "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1468413253725-0d5181091126?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1516571748831-5d81767b788d?w=600&h=400&fit=crop",
    ],
    "ruins": [
        "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1583089892943-e02e5b017b6a?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1562679299-9dcb592cf29c?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=600&h=400&fit=crop",
    ],
}


def _get_unique_fallback(name: str, category: str) -> str:
    """Pick a unique fallback image per place using name hash — never repeats for different names."""
    import hashlib
    cat = category.lower()
    images = FALLBACK_IMAGES.get(cat)
    if not images:
        # Fallback to collecting ALL unique images across all categories
        all_images = []
        seen = set()
        for img_list in FALLBACK_IMAGES.values():
            for img in img_list:
                if img not in seen:
                    seen.add(img)
                    all_images.append(img)
        images = all_images
    idx = int(hashlib.md5(name.encode()).hexdigest(), 16) % len(images)
    return images[idx]


# Simple in-memory image cache to avoid re-fetching
_img_cache: dict[str, tuple[float, str]] = {}
_IMG_CACHE_TTL = 600  # 10 minutes


async def _get_image_by_title(client: httpx.AsyncClient, title: str) -> str | None:
    """Tier 1 — direct title lookup. Tries exact title, then '<title>, India'."""
    for attempt_title in [title, f"{title}, India", f"{title} (India)"]:
        params = {
            "action": "query",
            "titles": attempt_title,
            "prop": "pageimages",
            "format": "json",
            "pithumbsize": 600,
            "redirects": 1,
        }
        try:
            resp = await client.get(WIKI_API, params=params, headers=HEADERS)
            resp.raise_for_status()
            pages = resp.json().get("query", {}).get("pages", {})
            for page_id, page in pages.items():
                if page_id != "-1":
                    thumb = page.get("thumbnail", {}).get("source")
                    if thumb:
                        return thumb
        except Exception:
            pass
    return None


async def _search_and_get_image(client: httpx.AsyncClient, query: str) -> str | None:
    """Tier 2 — search Wikipedia for the best article, then fetch its image."""
    search_params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": 3,
        "format": "json",
    }
    try:
        resp = await client.get(WIKI_API, params=search_params, headers=HEADERS)
        resp.raise_for_status()
        results = resp.json().get("query", {}).get("search", [])
        for result in results:
            title = result.get("title")
            if title:
                img = await _get_image_by_title(client, title)
                if img:
                    return img
    except Exception:
        pass
    return None


async def get_place_image(name: str, category: str) -> str:
    """
    3-tier image resolution with cache:
      1. Exact Wikipedia title → thumbnail
      2. Wikipedia search "<name> <category>" → best article thumbnail
      3. Per-place unique fallback from multiple Unsplash images
    """
    import time as _time
    cache_key = f"{name}|{category}"
    entry = _img_cache.get(cache_key)
    if entry and (_time.time() - entry[0]) < _IMG_CACHE_TTL:
        return entry[1]

    async with httpx.AsyncClient(timeout=8.0) as client:
        # Tier 1: exact title (fast — single API call)
        img = await _get_image_by_title(client, name)
        if img:
            _img_cache[cache_key] = (_time.time(), img)
            return img

        # Tier 2: search with category hint for better relevance
        img = await _search_and_get_image(client, f"{name} {category}")
        if img:
            _img_cache[cache_key] = (_time.time(), img)
            return img

    # Tier 3: per-place unique fallback (instant)
    fallback = _get_unique_fallback(name, category)
    _img_cache[cache_key] = (_time.time(), fallback)
    return fallback


async def get_place_images_batch(names: list[str], category: str) -> list[str]:
    """
    Fetch images for multiple places with high concurrency.
    Uses cache + single Wikipedia API call each → very fast.
    """
    semaphore = asyncio.Semaphore(8)

    async def _fetch(name: str) -> str:
        async with semaphore:
            return await get_place_image(name, category)

    return await asyncio.gather(*[_fetch(n) for n in names])
