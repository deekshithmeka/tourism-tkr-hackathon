"""
Budget-aware cost estimator.
Estimates the total visit cost for a destination based on distance,
travel mode, category, and optional personal guide.
Uses realistic Indian transport rates per km.
"""

# Average costs per category in INR (entry + activity + food per person)
CATEGORY_COSTS = {
    "temples":       {"entry": 0,   "activity": 100,  "food": 250},
    "nature":        {"entry": 75,  "activity": 200,  "food": 300},
    "malls":         {"entry": 0,   "activity": 800,  "food": 600},
    "beaches":       {"entry": 0,   "activity": 350,  "food": 400},
    "monuments":     {"entry": 150, "activity": 200,  "food": 300},
    "forts":         {"entry": 100, "activity": 150,  "food": 250},
    "palaces":       {"entry": 200, "activity": 150,  "food": 300},
    "museums":       {"entry": 100, "activity": 100,  "food": 250},
    "lakes":         {"entry": 50,  "activity": 300,  "food": 300},
    "waterfalls":    {"entry": 50,  "activity": 200,  "food": 250},
    "wildlife":      {"entry": 500, "activity": 400,  "food": 350},
    "adventure":     {"entry": 200, "activity": 800,  "food": 400},
    "pilgrimage":    {"entry": 0,   "activity": 100,  "food": 200},
    "hill stations": {"entry": 50,  "activity": 300,  "food": 350},
    "caves":         {"entry": 75,  "activity": 150,  "food": 250},
    "gardens":       {"entry": 30,  "activity": 100,  "food": 200},
    "islands":       {"entry": 100, "activity": 500,  "food": 450},
    "ruins":         {"entry": 100, "activity": 150,  "food": 250},
}

# Realistic per-km rates for Indian transport (one-way)
TRANSPORT_RATES = {
    "bus":   1.8,    # State/city bus ≈ ₹1.5–2/km
    "train": 2.5,    # Sleeper/general ≈ ₹1–1.5/km, AC ≈ ₹2.5–4/km (avg)
    "plane": 6.0,    # ≈ ₹5–8/km domestic (only sensible for 200+ km)
    "car":   12.0,   # Auto / hired cab ≈ ₹10–15/km
}

# Base fares (minimum charge) for each mode
BASE_FARES = {
    "bus":   30,
    "train": 50,
    "plane": 2500,   # Minimum airport fee+ticket
    "car":   50,
}

GUIDE_COST_PER_PLACE = 500  # ₹500 per destination for a local guide


def estimate_cost(
    distance_km: float,
    category: str,
    travel_mode: str = "car",
    guide: bool = False,
    place_name: str = "",
    group_size: int = 1,
) -> dict:
    """
    Estimate total visit cost (INR) broken down by component.
    Uses per-place variation so every destination has a unique budget.
    Per-person costs (entry, activity, food) are multiplied by group_size.
    Transport is shared (not multiplied).

    Returns dict with:
      total, travel, entry, activity, food, guide, group_size
    """
    import hashlib

    base = CATEGORY_COSTS.get(
        category.lower(),
        {"entry": 100, "activity": 200, "food": 300},
    )

    # Per-place variation: ±18% based on place name hash
    if place_name:
        h = int(hashlib.md5(place_name.encode()).hexdigest()[:8], 16)
        variation = 0.82 + (h % 37) / 100  # 0.82 to 1.18
    else:
        variation = 1.0

    entry = round(base["entry"] * variation)
    activity = round(base["activity"] * variation)
    food = round(base["food"] * variation)

    # Distance-tier pricing: farther = different cost profile
    if distance_km > 50:
        entry = round(entry * 0.8)    # farther = less touristy
        food = round(food * 0.85)
    elif distance_km > 25:
        activity = round(activity * 1.1)
    elif distance_km < 5:
        entry = round(entry * 1.25)   # very close = premium
        food = round(food * 1.15)

    mode = travel_mode.lower() if travel_mode else "car"
    rate = TRANSPORT_RATES.get(mode, TRANSPORT_RATES["car"])
    base_fare = BASE_FARES.get(mode, 50)

    # Round-trip travel cost
    one_way = max(base_fare, round(distance_km * rate))
    travel_cost = one_way * 2

    guide_cost = GUIDE_COST_PER_PLACE if guide else 0

    # Scale per-person costs by group size
    gs = max(1, group_size)
    entry *= gs
    activity *= gs
    food *= gs
    guide_cost *= gs  # one guide per person in large groups

    total = entry + activity + food + travel_cost + guide_cost

    return {
        "total": total,
        "travel": travel_cost,
        "entry": entry,
        "activity": activity,
        "food": food,
        "guide": guide_cost,
        "travel_mode": mode,
        "group_size": gs,
    }

