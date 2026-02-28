"""
Safety score computation.
Scores a destination 0-100 based on proximity to hospitals & police stations,
category risk, distance from city center, and per-place variation.
"""

import math
import hashlib

# Category-specific safety adjustment (positive = safer, negative = riskier)
CATEGORY_RISK = {
    "temples": 6,  "pilgrimage": 5,  "gardens": 5,  "malls": 4,
    "museums": 4,  "palaces": 3,     "monuments": 3, "forts": 1,
    "lakes": 0,    "beaches": -1,    "nature": -2,  "hill stations": -2,
    "ruins": -3,   "waterfalls": -4, "caves": -5,   "islands": -4,
    "wildlife": -6, "adventure": -8,
}


def _haversine(lat1, lon1, lat2, lon2) -> float:
    """Returns distance in km between two lat/lon pairs."""
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
    return R * c


def compute_safety_score(
    place_lat: float,
    place_lon: float,
    emergency_services: list[dict],
    distance_km: float = 0.0,
    category: str = "",
    place_name: str = "",
) -> int:
    """
    Compute a dynamic safety score (0-100) using:
      - Emergency service proximity/density
      - Category risk factor
      - Distance from city center
      - Per-place deterministic variation
    """
    score = 45  # lower base allows wider range of final scores

    closest_hospital = float("inf")
    closest_police = float("inf")
    nearby_hospitals = 0
    nearby_police = 0

    for svc in emergency_services:
        dist = _haversine(place_lat, place_lon, svc["lat"], svc["lon"])

        if svc["type"] == "hospital":
            closest_hospital = min(closest_hospital, dist)
            if dist <= 5.0:
                nearby_hospitals += 1
        elif svc["type"] == "police":
            closest_police = min(closest_police, dist)
            if dist <= 5.0:
                nearby_police += 1

    # Hospital proximity bonus (max +20)
    if closest_hospital < 1:
        score += 20
    elif closest_hospital < 2:
        score += 16
    elif closest_hospital < 5:
        score += 10
    elif closest_hospital < 10:
        score += 5
    else:
        score += 2

    # Police proximity bonus (max +15)
    if closest_police < 1:
        score += 15
    elif closest_police < 2:
        score += 12
    elif closest_police < 5:
        score += 8
    elif closest_police < 10:
        score += 4
    else:
        score += 1

    # Density bonus (max +10)
    density_bonus = min((nearby_hospitals + nearby_police) * 2, 10)
    score += density_bonus

    # Category risk adjustment (±8)
    if category:
        score += CATEGORY_RISK.get(category.lower(), 0)

    # Distance from city center penalty
    if distance_km > 40:
        score -= 6
    elif distance_km > 25:
        score -= 4
    elif distance_km > 15:
        score -= 2
    elif distance_km < 3:
        score += 3  # very central = safer

    # Per-place deterministic variation (±7 points) based on name hash
    if place_name:
        name_hash = int(hashlib.md5(place_name.encode()).hexdigest()[:8], 16)
        variation = (name_hash % 15) - 7  # range: -7 to +7
        score += variation

    return min(max(score, 15), 98)
