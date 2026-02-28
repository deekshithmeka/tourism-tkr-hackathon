"""
OpenStreetMap Overpass service — 100% free, NO API key needed.
Single query fetches places of interest + nearby emergency services.

Now includes:
  - 15+ category-to-OSM-tag mappings (covers waterfalls, forts, lakes, …)
  - Auto-radius expansion (10 km → 30 km → 50 km)
  - Broad tourism fallback when category-specific query returns nothing
  - OpenTripMap as secondary free API source
"""

import math
import hashlib
import random
import os
import time
import urllib.parse

import httpx
import asyncio

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# ---------------------------------------------------------------------------
# Simple in-memory TTL cache (avoids re-fetching the same coords/category)
# ---------------------------------------------------------------------------
_cache: dict[str, tuple[float, object]] = {}
_CACHE_TTL = 300  # 5 minutes


def _cache_get(key: str):
    """Return cached value or None if expired / missing."""
    entry = _cache.get(key)
    if entry and (time.time() - entry[0]) < _CACHE_TTL:
        return entry[1]
    return None


def _cache_set(key: str, value):
    _cache[key] = (time.time(), value)
    # Evict old entries if cache grows too large
    if len(_cache) > 200:
        cutoff = time.time() - _CACHE_TTL
        stale = [k for k, (t, _) in _cache.items() if t < cutoff]
        for k in stale:
            _cache.pop(k, None)

# OpenTripMap — completely free (register at https://opentripmap.io/product)
# Set env var  OPENTRIPMAP_KEY=<your-key>  or leave blank to skip
OTM_KEY = os.environ.get("OPENTRIPMAP_KEY", "5ae2e3f221c38a28845f05b6aed67ed1f8df16a04b07c374f7a7c397")
OTM_BASE = "https://api.opentripmap.com/0.1/en/places"

# ---------------------------------------------------------------------------
# Category → Overpass tag filters  (significantly expanded)
# ---------------------------------------------------------------------------
CATEGORY_TAGS = {
    "temples": [
        '"amenity"="place_of_worship"',
        '"building"="temple"',
        '"building"="church"',
        '"building"="mosque"',
        '"building"="cathedral"',
        '"religion"',
    ],
    "nature": [
        '"leisure"="park"',
        '"leisure"="garden"',
        '"leisure"="nature_reserve"',
        '"tourism"="viewpoint"',
        '"boundary"="national_park"',
        '"natural"="peak"',
        '"natural"="wood"',
        '"natural"="cliff"',
        '"natural"="valley"',
        '"natural"="cave_entrance"',
        '"natural"="spring"',
        '"natural"="water"',
        '"waterway"="waterfall"',
        '"tourism"="camp_site"',
        '"tourism"="picnic_site"',
        '"tourism"="attraction"',
    ],
    "malls": [
        '"shop"="mall"',
        '"shop"="department_store"',
        '"shop"="supermarket"',
        '"amenity"="marketplace"',
        '"building"="retail"',
        '"shop"="wholesale"',
    ],
    "beaches": [
        '"natural"="beach"',
        '"leisure"="beach_resort"',
        '"tourism"="resort"',
        '"natural"="coastline"',
        '"leisure"="swimming_area"',
    ],
    "monuments": [
        '"historic"',
        '"tourism"="attraction"',
        '"tourism"="museum"',
        '"tourism"="artwork"',
        '"tourism"="gallery"',
        '"amenity"="arts_centre"',
        '"building"="castle"',
        '"building"="palace"',
        '"man_made"="tower"',
        '"tourism"="monument"',
    ],
    # ── Additional categories ──────────────────────────────────────────
    "forts": [
        '"historic"="fort"',
        '"historic"="castle"',
        '"building"="castle"',
        '"building"="fort"',
        '"historic"="ruins"',
        '"historic"="citadel"',
        '"historic"',
        '"tourism"="attraction"',
    ],
    "palaces": [
        '"building"="palace"',
        '"historic"="palace"',
        '"tourism"="attraction"',
        '"historic"="castle"',
        '"historic"',
    ],
    "museums": [
        '"tourism"="museum"',
        '"tourism"="gallery"',
        '"amenity"="arts_centre"',
        '"amenity"="library"',
        '"building"="museum"',
    ],
    "lakes": [
        '"natural"="water"',
        '"water"="lake"',
        '"water"="reservoir"',
        '"water"="pond"',
        '"leisure"="fishing"',
        '"natural"="spring"',
    ],
    "waterfalls": [
        '"waterway"="waterfall"',
        '"natural"="cliff"',
        '"tourism"="viewpoint"',
        '"tourism"="attraction"',
        '"natural"="water"',
    ],
    "wildlife": [
        '"tourism"="zoo"',
        '"leisure"="nature_reserve"',
        '"boundary"="national_park"',
        '"tourism"="attraction"',
        '"leisure"="bird_hide"',
        '"landuse"="forest"',
    ],
    "adventure": [
        '"sport"="climbing"',
        '"sport"="paragliding"',
        '"sport"="surfing"',
        '"sport"="scuba_diving"',
        '"sport"="skiing"',
        '"leisure"="sports_centre"',
        '"tourism"="camp_site"',
        '"tourism"="attraction"',
        '"natural"="peak"',
    ],
    "pilgrimage": [
        '"amenity"="place_of_worship"',
        '"building"="temple"',
        '"building"="church"',
        '"building"="mosque"',
        '"religion"',
        '"tourism"="attraction"',
    ],
    "hill stations": [
        '"natural"="peak"',
        '"tourism"="viewpoint"',
        '"tourism"="attraction"',
        '"tourism"="hotel"',
        '"leisure"="park"',
        '"tourism"="camp_site"',
    ],
    "caves": [
        '"natural"="cave_entrance"',
        '"tourism"="attraction"',
        '"geological"',
        '"historic"',
    ],
    "gardens": [
        '"leisure"="garden"',
        '"leisure"="park"',
        '"tourism"="attraction"',
        '"landuse"="recreation_ground"',
    ],
    "islands": [
        '"place"="island"',
        '"place"="islet"',
        '"natural"="beach"',
        '"tourism"="attraction"',
    ],
    "ruins": [
        '"historic"="ruins"',
        '"historic"="archaeological_site"',
        '"historic"',
        '"tourism"="attraction"',
    ],
}

# ── Broad fallback tags (used when category-specific returns nothing) ─────
FALLBACK_TAGS = [
    '"tourism"~"attraction|viewpoint|museum|monument|artwork|camp_site|picnic_site"',
    '"historic"',
    '"leisure"~"park|garden|nature_reserve"',
    '"amenity"="place_of_worship"',
    '"natural"~"peak|beach|cave_entrance|water|cliff"',
]

# ── Category verification — now much more permissive ──────────────────────
# If a tag matches ANY of these for the category, it passes.
# None = any value for that key is accepted.
CATEGORY_VERIFY = {
    "temples": {
        "amenity": {"place_of_worship"},
        "building": {"temple", "church", "mosque", "cathedral", "chapel", "synagogue"},
        "religion": None,
    },
    "nature": {
        "leisure": {"park", "garden", "nature_reserve"},
        "tourism": {"viewpoint", "camp_site", "picnic_site", "attraction"},
        "boundary": {"national_park"},
        "natural": None,
        "waterway": None,
        "landuse": {"forest", "meadow", "recreation_ground"},
    },
    "malls": {
        "shop": {"mall", "department_store", "supermarket", "wholesale"},
        "amenity": {"marketplace"},
        "building": {"retail"},
    },
    "beaches": {
        "natural": {"beach", "coastline"},
        "leisure": {"beach_resort", "swimming_area"},
        "tourism": {"resort", "attraction"},
    },
    "monuments": {
        "historic": None,
        "tourism": {"attraction", "museum", "artwork", "monument", "gallery"},
        "amenity": {"arts_centre"},
        "building": {"castle", "palace"},
        "man_made": {"tower"},
    },
    "forts": {
        "historic": None,
        "building": {"castle", "fort"},
        "tourism": {"attraction"},
    },
    "palaces": {
        "historic": None,
        "building": {"palace", "castle"},
        "tourism": {"attraction"},
    },
    "museums": {
        "tourism": {"museum", "gallery"},
        "amenity": {"arts_centre", "library"},
        "building": {"museum"},
    },
    "lakes": {
        "natural": {"water", "spring"},
        "water": {"lake", "reservoir", "pond"},
        "leisure": {"fishing"},
    },
    "waterfalls": {
        "waterway": {"waterfall"},
        "natural": None,
        "tourism": {"viewpoint", "attraction"},
    },
    "wildlife": {
        "tourism": {"zoo", "attraction"},
        "leisure": {"nature_reserve", "bird_hide"},
        "boundary": {"national_park"},
        "landuse": {"forest"},
    },
    "adventure": {
        "sport": None,
        "leisure": {"sports_centre"},
        "tourism": {"camp_site", "attraction"},
        "natural": {"peak", "cliff"},
    },
    "pilgrimage": {
        "amenity": {"place_of_worship"},
        "building": {"temple", "church", "mosque"},
        "religion": None,
        "tourism": {"attraction"},
    },
    "hill stations": {
        "natural": {"peak"},
        "tourism": {"viewpoint", "attraction", "hotel", "camp_site"},
        "leisure": {"park"},
    },
    "caves": {
        "natural": {"cave_entrance"},
        "tourism": {"attraction"},
        "geological": None,
        "historic": None,
    },
    "gardens": {
        "leisure": {"garden", "park"},
        "tourism": {"attraction"},
        "landuse": {"recreation_ground"},
    },
    "islands": {
        "place": {"island", "islet"},
        "natural": {"beach"},
        "tourism": {"attraction"},
    },
    "ruins": {
        "historic": {"ruins", "archaeological_site"},
        "tourism": {"attraction"},
    },
}

# Exact amenity values to ALWAYS reject (emergency services, infrastructure)
REJECT_AMENITIES = {
    "hospital", "police", "clinic", "doctors", "pharmacy",
    "fire_station", "prison", "courthouse", "post_office",
    "bank", "atm", "toilets", "fuel", "parking",
}

# OpenTripMap kinds mapping — used when OTM is the fallback
OTM_CATEGORY_KINDS = {
    "temples":      "religion",
    "nature":       "natural",
    "malls":        "shops",
    "beaches":      "beaches",
    "monuments":    "historic,cultural,architecture",
    "forts":        "fortifications,historic",
    "palaces":      "historic,architecture",
    "museums":      "museums",
    "lakes":        "natural,water",
    "waterfalls":   "natural,waterfalls",
    "wildlife":     "natural,wildlife",
    "adventure":    "sport,amusements",
    "pilgrimage":   "religion",
    "hill stations":"natural,view_points",
    "caves":        "natural,geology",
    "gardens":      "gardens_and_parks",
    "islands":      "natural,beaches",
    "ruins":        "historic,archaeology",
}


def _matches_category(tags_dict: dict, category: str) -> bool:
    """Return True only if the element's OSM tags match the requested category."""
    amenity = tags_dict.get("amenity", "")
    if amenity in REJECT_AMENITIES:
        return False

    verify_rules = CATEGORY_VERIFY.get(category.lower())
    if not verify_rules:
        return True

    for key, allowed_values in verify_rules.items():
        tag_val = tags_dict.get(key)
        if tag_val is not None:
            if allowed_values is None:
                return True
            if tag_val in allowed_values:
                return True
    return False

# Suggested activities per category
CATEGORY_ACTIVITIES = {
    "temples": [
        "Temple visit", "Prayer", "Photography", "Cultural tour",
        "Architecture study", "Meditation",
    ],
    "nature": [
        "Hiking", "Photography", "Bird watching", "Picnic",
        "Nature walk", "Jogging", "Camping",
    ],
    "malls": [
        "Shopping", "Movie", "Food court", "Arcade",
        "Window shopping", "Bowling",
    ],
    "beaches": [
        "Swimming", "Sunbathing", "Beach sports", "Sunset view",
        "Surfing", "Shell collecting",
    ],
    "monuments": [
        "History tour", "Photography", "Guided walk",
        "Architecture study", "Museum visit", "Souvenir shopping",
    ],
    "forts": [
        "Fort exploration", "Photography", "History tour",
        "Trekking", "Panoramic views", "Architecture study",
    ],
    "palaces": [
        "Palace tour", "Photography", "History lesson",
        "Garden walk", "Museum visit", "Shopping",
    ],
    "museums": [
        "Exhibition tour", "Art appreciation", "Photography",
        "Guided walk", "Interactive displays", "Gift shop",
    ],
    "lakes": [
        "Boating", "Photography", "Fishing",
        "Picnic", "Nature walk", "Bird watching",
    ],
    "waterfalls": [
        "Waterfall viewing", "Photography", "Trekking",
        "Swimming", "Picnic", "Nature walk",
    ],
    "wildlife": [
        "Safari", "Bird watching", "Photography",
        "Nature walk", "Animal spotting", "Jeep ride",
    ],
    "adventure": [
        "Rock climbing", "Paragliding", "Rafting",
        "Trekking", "Zip-lining", "Camping",
    ],
    "pilgrimage": [
        "Temple visit", "Prayer", "Darshan",
        "Cultural tour", "Meditation", "Community meal",
    ],
    "hill stations": [
        "Sightseeing", "Photography", "Trekking",
        "Cable car ride", "Shopping", "Nature walk",
    ],
    "caves": [
        "Cave exploration", "Photography", "Guided tour",
        "Archaeology study", "Adventure walk", "Geology tour",
    ],
    "gardens": [
        "Garden walk", "Photography", "Picnic",
        "Botanical study", "Jogging", "Relaxation",
    ],
    "islands": [
        "Beach walk", "Snorkeling", "Photography",
        "Boat ride", "Sunset view", "Seafood tasting",
    ],
    "ruins": [
        "Ruins exploration", "Photography", "History tour",
        "Archaeology walk", "Sketching", "Guided tour",
    ],
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _haversine(lat1, lon1, lat2, lon2) -> float:
    """Return distance in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


# ---------------------------------------------------------------------------
# Core OSM fetch — with auto-radius expansion + OpenTripMap fallback
# ---------------------------------------------------------------------------

MIN_PLACES_THRESHOLD = 3  # Expand radius if fewer than this


async def _overpass_query(
    lat: float, lon: float, category: str, radius: int
) -> tuple[list, list]:
    """
    Run a single Overpass query for the given category + radius.
    Returns (raw_places, emergency_services).
    """
    cache_key = f"ovp:{lat:.3f},{lon:.3f},{category},{radius}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    cat = category.lower()
    tags = CATEGORY_TAGS.get(cat, CATEGORY_TAGS.get("nature"))

    place_lines = ""
    for tag in tags:
        place_lines += f"  node[{tag}](around:{radius},{lat},{lon});\n"
        place_lines += f"  way[{tag}](around:{radius},{lat},{lon});\n"

    query = f"""
    [out:json][timeout:12];
    (
{place_lines}
      node["amenity"="hospital"](around:{radius},{lat},{lon});
      node["amenity"="police"](around:{radius},{lat},{lon});
    );
    out center body;
    """

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(OVERPASS_URL, data={"data": query})
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return [], []

    result = _parse_overpass(data, lat, lon, category)
    _cache_set(cache_key, result)
    return result


async def _overpass_fallback(
    lat: float, lon: float, radius: int
) -> tuple[list, list]:
    """
    Broad tourism fallback — used when category-specific query returns nothing.
    """
    cache_key = f"ovp_fb:{lat:.3f},{lon:.3f},{radius}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    place_lines = ""
    for tag in FALLBACK_TAGS:
        place_lines += f"  node[{tag}](around:{radius},{lat},{lon});\n"
        place_lines += f"  way[{tag}](around:{radius},{lat},{lon});\n"

    query = f"""
    [out:json][timeout:12];
    (
{place_lines}
      node["amenity"="hospital"](around:{radius},{lat},{lon});
      node["amenity"="police"](around:{radius},{lat},{lon});
    );
    out center body;
    """

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(OVERPASS_URL, data={"data": query})
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return [], []

    result = _parse_overpass(data, lat, lon, category=None)
    _cache_set(cache_key, result)
    return result


async def _opentripmap_fallback(
    lat: float, lon: float, category: str, radius: int
) -> list:
    """
    Use OpenTripMap (free API) as secondary source.
    Returns a list of place dicts compatible with our schema.
    """
    if not OTM_KEY:
        return []

    cache_key = f"otm:{lat:.3f},{lon:.3f},{category},{radius}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    kinds = OTM_CATEGORY_KINDS.get(category.lower(), "interesting_places")
    url = f"{OTM_BASE}/radius"
    params = {
        "radius": min(radius, 50000),
        "lon": lon,
        "lat": lat,
        "kinds": kinds,
        "rate": "2",
        "format": "json",
        "limit": 25,
        "apikey": OTM_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return []

    places = []
    seen = set()
    for item in data:
        name = item.get("name", "").strip()
        if not name or name in seen or len(name) < 3:
            continue
        seen.add(name)
        pt = item.get("point", {})
        el_lat = pt.get("lat")
        el_lon = pt.get("lon")
        if not el_lat or not el_lon:
            continue
        dist = _haversine(lat, lon, el_lat, el_lon)
        places.append({
            "name": name,
            "latitude": el_lat,
            "longitude": el_lon,
            "distance_km": dist,
            "tags": {"source": "opentripmap", "kinds": item.get("kinds", "")},
        })

    places.sort(key=lambda x: x["distance_km"])
    _cache_set(cache_key, places)
    return places


def _parse_overpass(
    data: dict, lat: float, lon: float, category: str | None
) -> tuple[list, list]:
    """Parse raw Overpass JSON into (places, emergency) lists."""
    places = []
    emergency = []
    seen_names: set[str] = set()

    for el in data.get("elements", []):
        tags_dict = el.get("tags", {})
        amenity = tags_dict.get("amenity", "")

        el_lat = el.get("lat") or (el.get("center") or {}).get("lat")
        el_lon = el.get("lon") or (el.get("center") or {}).get("lon")
        if not el_lat or not el_lon:
            continue

        if amenity in ("hospital", "police"):
            svc_name = tags_dict.get("name", "Unknown")
            emergency.append(
                {"type": amenity, "name": svc_name, "lat": el_lat, "lon": el_lon}
            )
            continue

        name = tags_dict.get("name")
        if not name or name in seen_names:
            continue

        # Category gate — skip only if we have a specific category AND
        # verification rules exist AND the tags don't match.
        # For fallback (category=None), accept everything non-emergency.
        if category is not None:
            if amenity in REJECT_AMENITIES:
                continue
            if not _matches_category(tags_dict, category):
                continue

        seen_names.add(name)
        distance = _haversine(lat, lon, el_lat, el_lon)
        places.append({
            "name": name,
            "latitude": el_lat,
            "longitude": el_lon,
            "distance_km": distance,
            "tags": tags_dict,
        })

    places.sort(key=lambda x: x["distance_km"])
    return places, emergency


async def fetch_places_and_emergency(
    lat: float, lon: float, category: str, radius: int = 10000
) -> tuple[list, list]:
    """
    Main entry point.  All sources are queried IN PARALLEL:
      - Category-specific Overpass at requested radius + 30km + 50km
      - Broad tourism Overpass fallback at 50km
      - OpenTripMap free API at 50km
    Results are merged and de-duplicated.
    Typical wall-clock time: 3-8 seconds (one HTTP round-trip).
    """
    # Check top-level cache first
    top_key = f"places:{lat:.3f},{lon:.3f},{category},{radius}"
    cached = _cache_get(top_key)
    if cached is not None:
        return cached

    radii = list(dict.fromkeys([radius, 30000, 50000]))  # unique, ordered

    # Fire ALL queries in parallel — no sequential waiting
    tasks = []
    for r in radii:
        tasks.append(_overpass_query(lat, lon, category, r))
    tasks.append(_overpass_fallback(lat, lon, 50000))
    tasks.append(_opentripmap_fallback(lat, lon, category, 50000))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    places = []
    emergency = []
    seen_names: set[str] = set()
    seen_emergency: set[str] = set()

    # Merge Overpass results (first N tasks are category+radius, then fallback)
    for res in results[:-1]:  # all except OTM
        if isinstance(res, Exception):
            continue
        p_list, e_list = res
        for e in e_list:
            if e["name"] not in seen_emergency:
                seen_emergency.add(e["name"])
                emergency.append(e)
        for p in p_list:
            if p["name"] not in seen_names:
                seen_names.add(p["name"])
                places.append(p)

    # Merge OpenTripMap results (last task)
    otm_result = results[-1]
    if not isinstance(otm_result, Exception):
        for p in otm_result:
            if p["name"] not in seen_names:
                seen_names.add(p["name"])
                places.append(p)

    places.sort(key=lambda x: x["distance_km"])
    result = (places, emergency)
    _cache_set(top_key, result)
    return result


# ---------------------------------------------------------------------------
# Enrichment helpers
# ---------------------------------------------------------------------------

def find_nearest_emergency(
    place_lat: float,
    place_lon: float,
    emergency_services: list[dict],
    max_results: int = 3,
) -> dict:
    """
    Find the nearest hospitals and police stations from OSM data.
    Returns { hospitals: [{name, distance_km}], police: [{name, distance_km}] }
    """
    hospitals = []
    police = []

    for svc in emergency_services:
        dist = _haversine(place_lat, place_lon, svc["lat"], svc["lon"])
        entry = {
            "name": svc.get("name", "Unknown"),
            "distance_km": dist,
            "lat": svc["lat"],
            "lon": svc["lon"],
        }
        if svc["type"] == "hospital":
            hospitals.append(entry)
        elif svc["type"] == "police":
            police.append(entry)

    hospitals.sort(key=lambda x: x["distance_km"])
    police.sort(key=lambda x: x["distance_km"])

    return {
        "hospitals": hospitals[:max_results],
        "police": police[:max_results],
    }


def estimate_crowd(distance_km: float, category: str) -> str:
    """Heuristic crowd estimation based on distance + category."""
    cat = category.lower()
    if cat == "malls":
        return "High" if distance_km < 5 else "Moderate"
    if cat == "temples":
        return "Moderate" if distance_km < 3 else "Low"
    if cat == "monuments":
        if distance_km < 3:
            return "High"
        return "Moderate" if distance_km < 8 else "Low"
    # nature, beaches
    return "Low" if distance_km > 5 else "Moderate"


def suggest_activities(category: str, place_name: str = "", count: int = 3) -> list[str]:
    """Deterministic activity suggestions (same place → same activities)."""
    pool = CATEGORY_ACTIVITIES.get(
        category.lower(),
        ["Sightseeing", "Photography", "Exploration"],
    )
    if len(pool) <= count:
        return list(pool)
    seed = int(hashlib.md5(place_name.encode()).hexdigest(), 16) % (2**32)
    rng = random.Random(seed)
    return rng.sample(pool, count)


def generate_links(name: str, lat: float, lon: float) -> list[dict]:
    """Generate Google Maps / Wikipedia / TripAdvisor links."""
    encoded = urllib.parse.quote(name)
    return [
        {
            "label": "Google Maps",
            "url": f"https://www.google.com/maps/search/?api=1&query={lat},{lon}",
        },
        {
            "label": "Wikipedia",
            "url": f"https://en.wikipedia.org/wiki/{encoded.replace('%20', '_')}",
        },
        {
            "label": "TripAdvisor",
            "url": f"https://www.tripadvisor.com/Search?q={encoded}",
        },
    ]
