"""
Transport service — realistic pricing + external booking links + multi-modal comparison.
No free real-time booking APIs exist for Indian transport,
so we provide accurate distance-based estimates, estimated durations,
frequency info, and direct links to RedBus, IRCTC, Google Flights, etc.
"""

import math

# ── Realistic Indian transport rates per km (one-way) ─────────────────────
TRANSPORT_RATES = {
    "bus":   {"rate": 1.8,  "base": 30,   "label": "State Bus / Volvo"},
    "train": {"rate": 2.5,  "base": 50,   "label": "Indian Railways"},
    "plane": {"rate": 6.0,  "base": 2500, "label": "Domestic Flight"},
    "car":   {"rate": 12.0, "base": 50,   "label": "Cab / Own Vehicle"},
}

# Fuel estimation for own vehicle
FUEL_PRICE_PER_LITRE = 105  # ₹ (approximate petrol price)
AVG_MILEAGE_KMPL = 15       # average car mileage

# Estimated travel speeds and overhead
DURATION_ESTIMATES = {
    "bus":   {"speed_kmph": 40, "wait_hours": 0.5},
    "train": {"speed_kmph": 55, "wait_hours": 1.0},
    "plane": {"speed_kmph": 500, "wait_hours": 2.5},  # includes airport time
    "car":   {"speed_kmph": 45, "wait_hours": 0},
}

# Frequency information for each mode
FREQUENCY_INFO = {
    "bus":   "Every 30–60 min on major routes",
    "train": "2–6 trains/day on most routes",
    "plane": "1–4 flights/day (major cities only)",
    "car":   "Available on demand",
}

# Distance-aware availability notes
AVAILABILITY_NOTES = {
    "bus": {
        "short":  "Frequent city/local buses available",
        "medium": "State transport & private Volvo buses run regularly",
        "long":   "Sleeper & AC coaches available; book 1–2 days ahead",
    },
    "train": {
        "short":  "Local/suburban trains if rail line exists",
        "medium": "Express & Shatabdi trains; book 2–7 days ahead on IRCTC",
        "long":   "Rajdhani/Duronto available; book 7–30 days ahead for confirmed seats",
    },
    "plane": {
        "short":  "Not recommended for short distances",
        "medium": "Limited flights; check IndiGo, SpiceJet, Air India",
        "long":   "Multiple daily flights; best prices 2–4 weeks ahead",
    },
    "car": {
        "short":  "Quick ride via Ola/Uber or auto-rickshaw",
        "medium": "Self-drive or cab; fuel stops available en route",
        "long":   "Long drive; plan rest stops. Rental recommended.",
    },
}


def _get_distance_tier(distance_km: float) -> str:
    if distance_km < 50:
        return "short"
    elif distance_km < 300:
        return "medium"
    return "long"

# Booking links per mode
BOOKING_LINKS = {
    "bus": [
        {"label": "RedBus", "url": "https://www.redbus.in/"},
        {"label": "AbhiBus", "url": "https://www.abhibus.com/"},
        {"label": "MakeMyTrip Bus", "url": "https://www.makemytrip.com/bus-tickets/"},
    ],
    "train": [
        {"label": "IRCTC", "url": "https://www.irctc.co.in/"},
        {"label": "ConfirmTkt", "url": "https://www.confirmtkt.com/"},
        {"label": "RailYatri", "url": "https://www.railyatri.in/"},
    ],
    "plane": [
        {"label": "Google Flights", "url": "https://www.google.com/travel/flights"},
        {"label": "MakeMyTrip", "url": "https://www.makemytrip.com/flights/"},
        {"label": "Skyscanner", "url": "https://www.skyscanner.co.in/"},
    ],
    "car": [
        {"label": "Ola", "url": "https://www.olacabs.com/"},
        {"label": "Uber", "url": "https://www.uber.com/in/en/"},
    ],
}


def _is_recommended(mode: str, distance_km: float) -> bool:
    """Recommend the best transport mode for the given distance."""
    if distance_km < 20:
        return mode == "car"
    elif distance_km < 100:
        return mode == "bus"
    elif distance_km < 500:
        return mode == "train"
    else:
        return mode == "plane"


def estimate_transport(
    distance_km: float,
    travel_mode: str = "car",
) -> dict:
    """
    Estimate one-way transport cost with breakdown.
    Returns: {
        mode, label, one_way, round_trip, fuel_litres, fuel_cost,
        estimated_hours, frequency, booking_links: [{label, url}]
    }
    """
    mode = travel_mode.lower() if travel_mode else "car"
    info = TRANSPORT_RATES.get(mode, TRANSPORT_RATES["car"])

    one_way = max(info["base"], round(distance_km * info["rate"]))
    round_trip = one_way * 2

    dur = DURATION_ESTIMATES.get(mode, DURATION_ESTIMATES["car"])
    hours = round(distance_km / max(dur["speed_kmph"], 1) + dur["wait_hours"], 1)

    result = {
        "mode": mode,
        "label": info["label"],
        "one_way": one_way,
        "round_trip": round_trip,
        "fuel_litres": None,
        "fuel_cost": None,
        "estimated_hours": hours,
        "frequency": FREQUENCY_INFO.get(mode, ""),
        "booking_links": BOOKING_LINKS.get(mode, []),
    }

    # Fuel calc for own vehicle
    if mode == "car":
        litres = round(distance_km / AVG_MILEAGE_KMPL, 1)
        fuel_cost = round(litres * FUEL_PRICE_PER_LITRE)
        result["fuel_litres"] = litres
        result["fuel_cost"] = fuel_cost
        result["one_way"] = min(one_way, fuel_cost) if fuel_cost > 0 else one_way
        result["round_trip"] = result["one_way"] * 2

    return result


def estimate_all_modes(distance_km: float) -> list[dict]:
    """
    Return cost + duration + availability for ALL transport modes.
    This lets the user compare bus vs train vs plane vs car at a glance.
    Includes distance-aware availability notes.
    """
    tier = _get_distance_tier(distance_km)
    modes = []
    for mode, info in TRANSPORT_RATES.items():
        # Skip plane for short distances (< 200 km)
        if mode == "plane" and distance_km < 200:
            continue

        one_way = max(info["base"], round(distance_km * info["rate"]))
        dur = DURATION_ESTIMATES[mode]
        hours = round(distance_km / max(dur["speed_kmph"], 1) + dur["wait_hours"], 1)

        fuel_litres = None
        fuel_cost = None
        effective_one_way = one_way
        if mode == "car":
            fuel_litres = round(distance_km / AVG_MILEAGE_KMPL, 1)
            fuel_cost = round(fuel_litres * FUEL_PRICE_PER_LITRE)
            effective_one_way = min(one_way, fuel_cost) if fuel_cost > 0 else one_way

        modes.append({
            "mode": mode,
            "label": info["label"],
            "one_way": effective_one_way,
            "round_trip": effective_one_way * 2,
            "estimated_hours": hours,
            "frequency": FREQUENCY_INFO[mode],
            "availability": AVAILABILITY_NOTES.get(mode, {}).get(tier, ""),
            "recommended": _is_recommended(mode, distance_km),
            "booking_links": BOOKING_LINKS.get(mode, []),
            "fuel_litres": fuel_litres,
            "fuel_cost": fuel_cost,
        })

    return modes
