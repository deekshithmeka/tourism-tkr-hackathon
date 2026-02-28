"""
Hotel & Restaurant service — finds nearby accommodation and dining
via OpenStreetMap Overpass API (100% free, no API key).
Auto-expands search radius and generates fallback suggestions
when OSM data is sparse.
"""

import math
import hashlib
import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Booking link templates
HOTEL_BOOKING_LINKS = [
    {"label": "MakeMyTrip", "url": "https://www.makemytrip.com/hotels/"},
    {"label": "Goibibo", "url": "https://www.goibibo.com/hotels/"},
    {"label": "OYO Rooms", "url": "https://www.oyorooms.com/"},
    {"label": "Booking.com", "url": "https://www.booking.com/"},
]

# Fallback hotel name prefixes for generation when OSM has few results
FALLBACK_HOTEL_PREFIXES = [
    "Hotel Sunrise", "The Grand Inn", "Comfort Stay", "City Lodge",
    "Royal Residency", "Green Valley Resort", "Heritage Homestay",
    "Budget Inn Express", "Palace View Hotel", "Lakeview Retreat",
]


def _haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


# ── Rough nightly rates by OSM star rating / type ─────────────────────────
HOTEL_RATE_MAP = {
    "guest_house": 800,
    "hostel": 500,
    "motel": 1200,
    "hotel": 2000,       # default
}

STAR_RATE_MAP = {
    "1": 600,
    "2": 1000,
    "3": 1800,
    "4": 3500,
    "5": 6000,
}


def _estimate_hotel_rate(tags: dict) -> int:
    """Estimate per-night rate based on OSM tags."""
    stars = tags.get("stars", "")
    if stars and stars in STAR_RATE_MAP:
        return STAR_RATE_MAP[stars]
    tourism = tags.get("tourism", "hotel")
    return HOTEL_RATE_MAP.get(tourism, 2000)


async def fetch_hotels(
    lat: float, lon: float, radius: int = 5000, max_results: int = 10
) -> list[dict]:
    """
    Find hotels/guest houses/hostels near a point.
    Auto-expands radius if few results; generates realistic fallbacks
    when OSM data is sparse.
    Returns list of {name, type, lat, lon, distance_km, estimated_rate,
                     stars, maps_link, booking_links, phone, website}.
    """
    hotels = []

    # Try progressively wider radii
    for r in [radius, 10000, 20000]:
        hotels = await _query_hotels_osm(lat, lon, r)
        if len(hotels) >= 3:
            break

    # If still < 3 results, generate realistic fallback suggestions
    if len(hotels) < 3:
        needed = 3 - len(hotels)
        existing_names = {h["name"] for h in hotels}
        for i in range(needed):
            # Pick a unique name from the fallback list
            name = FALLBACK_HOTEL_PREFIXES[(i + int(lat * 100)) % len(FALLBACK_HOTEL_PREFIXES)]
            if name in existing_names:
                name = f"{name} {i + 1}"
            # Spread fallback hotels around the area
            offset_lat = lat + (i + 1) * 0.005 * (1 if i % 2 == 0 else -1)
            offset_lon = lon + (i + 1) * 0.004 * (1 if i % 2 == 1 else -1)
            rate = [800, 1500, 2500, 3500, 1200][(i + int(lon * 10)) % 5]
            hotel_type = ["guest_house", "hotel", "hotel", "hostel", "hotel"][i % 5]
            hotels.append({
                "name": name,
                "type": hotel_type,
                "stars": str(min(2 + i, 5)),
                "latitude": offset_lat,
                "longitude": offset_lon,
                "distance_km": round(_haversine(lat, lon, offset_lat, offset_lon), 2),
                "estimated_rate": rate,
                "phone": "",
                "website": "",
                "maps_link": f"https://www.google.com/maps/search/hotels/?api=1&query={offset_lat},{offset_lon}",
                "booking_links": HOTEL_BOOKING_LINKS,
                "generated": True,  # flag so frontend can show "estimated"
            })

    # Add booking links to all hotels
    for h in hotels:
        if "booking_links" not in h:
            h["booking_links"] = HOTEL_BOOKING_LINKS

    hotels.sort(key=lambda x: x["distance_km"])
    return hotels[:max_results]


async def _query_hotels_osm(
    lat: float, lon: float, radius: int
) -> list[dict]:
    """Raw OSM query for hotels within the given radius."""
    query = f"""
    [out:json][timeout:15];
    (
      node["tourism"~"hotel|guest_house|hostel|motel|resort|apartment"](around:{radius},{lat},{lon});
      way["tourism"~"hotel|guest_house|hostel|motel|resort|apartment"](around:{radius},{lat},{lon});
    );
    out center body;
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(OVERPASS_URL, data={"data": query})
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return []

    hotels = []
    seen = set()
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name or name in seen:
            continue
        seen.add(name)
        el_lat = el.get("lat") or (el.get("center") or {}).get("lat")
        el_lon = el.get("lon") or (el.get("center") or {}).get("lon")
        if not el_lat or not el_lon:
            continue
        dist = _haversine(lat, lon, el_lat, el_lon)
        hotels.append({
            "name": name,
            "type": tags.get("tourism", "hotel"),
            "stars": tags.get("stars", ""),
            "latitude": el_lat,
            "longitude": el_lon,
            "distance_km": dist,
            "estimated_rate": _estimate_hotel_rate(tags),
            "phone": tags.get("phone", tags.get("contact:phone", "")),
            "website": tags.get("website", ""),
            "maps_link": f"https://www.google.com/maps/search/?api=1&query={el_lat},{el_lon}",
        })

    return hotels


async def fetch_restaurants(
    lat: float, lon: float, radius: int = 3000, max_results: int = 8
) -> list[dict]:
    """
    Find restaurants / cafes near a point.
    Returns list of {name, cuisine, lat, lon, distance_km, maps_link}.
    """
    query = f"""
    [out:json][timeout:15];
    (
      node["amenity"~"restaurant|cafe|fast_food|food_court"](around:{radius},{lat},{lon});
      way["amenity"~"restaurant|cafe|fast_food|food_court"](around:{radius},{lat},{lon});
    );
    out center body;
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(OVERPASS_URL, data={"data": query})
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return []

    restaurants = []
    seen = set()
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name or name in seen:
            continue
        seen.add(name)
        el_lat = el.get("lat") or (el.get("center") or {}).get("lat")
        el_lon = el.get("lon") or (el.get("center") or {}).get("lon")
        if not el_lat or not el_lon:
            continue
        dist = _haversine(lat, lon, el_lat, el_lon)
        restaurants.append({
            "name": name,
            "type": tags.get("amenity", "restaurant"),
            "cuisine": tags.get("cuisine", ""),
            "latitude": el_lat,
            "longitude": el_lon,
            "distance_km": dist,
            "phone": tags.get("phone", tags.get("contact:phone", "")),
            "maps_link": f"https://www.google.com/maps/search/?api=1&query={el_lat},{el_lon}",
        })

    restaurants.sort(key=lambda x: x["distance_km"])
    return restaurants[:max_results]
