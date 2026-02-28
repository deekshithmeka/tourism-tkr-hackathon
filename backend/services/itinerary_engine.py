"""
Itinerary Generation Engine — builds a structured day-by-day plan
from selected destinations, hotels, restaurants, and adds a buffer day.
Hotels and restaurants are assigned per-destination (geographically relevant).
"""

import math
from datetime import date, timedelta


def _haversine(lat1, lon1, lat2, lon2) -> float:
    """Quick haversine to find nearest hotel/restaurant to a destination."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _find_nearest(target_lat, target_lon, candidates, used_names, count=1):
    """Pick the `count` nearest candidates to a lat/lon, avoiding repeats."""
    scored = []
    for c in candidates:
        clat = c.get("latitude", 0)
        clon = c.get("longitude", 0)
        if not clat or not clon:
            continue
        dist = _haversine(target_lat, target_lon, clat, clon)
        scored.append((dist, c))
    scored.sort(key=lambda x: x[0])

    result = []
    for _, c in scored:
        if c["name"] not in used_names:
            result.append(c)
            used_names.add(c["name"])
            if len(result) >= count:
                break
    # If not enough unique ones, allow reuse
    if len(result) < count:
        for _, c in scored:
            if c not in result:
                result.append(c)
                if len(result) >= count:
                    break
    return result


def build_itinerary(
    destinations: list[dict],
    hotels: list[dict],
    restaurants: list[dict],
    days: int,
    budget: int,
    travel_mode: str = "car",
    guide: bool = False,
    group_size: int = 1,
    dest_hotels: dict | None = None,
    dest_restaurants: dict | None = None,
) -> dict:
    """
    Build a day-by-day itinerary with accommodation, meals, and buffer day.
    Uses per-destination hotel/restaurant maps when available so each day
    shows geographically relevant nearby places — not the same global list.

    Returns
    -------
    {
      "days": [ { day, label, is_buffer, destinations, hotel, meals, day_cost } ],
      "total_cost": int,
      ...
    }
    """
    effective_days = max(days, 2)
    activity_days = effective_days - 1   # last day = buffer/reserve

    # Distribute destinations evenly across activity days
    dest_per_day = max(1, len(destinations) // activity_days) if activity_days > 0 else len(destinations)

    day_plans = []
    dest_idx = 0
    total_travel = 0
    total_food = 0
    total_accommodation = 0
    total_guide = 0
    start = date.today()

    used_hotel_names = set()
    used_rest_names = set()

    for d in range(1, effective_days + 1):
        is_buffer = d == effective_days
        current_date = (start + timedelta(days=d - 1)).isoformat()
        label = f"Day {d}" if not is_buffer else f"Day {d} — Reserve / Buffer"

        # Pick destinations for this day
        day_dests = []
        day_dest_indices = []  # track original indices in `destinations`
        if not is_buffer and dest_idx < len(destinations):
            count = dest_per_day if d < activity_days else len(destinations) - dest_idx
            day_dests = destinations[dest_idx: dest_idx + count]
            day_dest_indices = list(range(dest_idx, dest_idx + count))
            dest_idx += count

        # ── Pick hotel nearest to this day's PRIMARY destination ──────
        # ONLY use hotels fetched near THIS day's destinations, not the
        # entire merged pool — this ensures geographically correct results.
        hotel = None
        if day_dests and d < effective_days:
            primary = day_dests[0]
            plat = primary.get("latitude", 0)
            plon = primary.get("longitude", 0)

            # Collect hotels only from this day's destination indices
            candidate_hotels = []
            if dest_hotels:
                for di in day_dest_indices:
                    candidate_hotels.extend(dest_hotels.get(di, []))
            # Fallback to global list only if per-destination data is empty
            if not candidate_hotels:
                candidate_hotels = hotels

            # Deduplicate candidates by name
            seen = set()
            unique_candidates = []
            for ch in candidate_hotels:
                if ch["name"] not in seen:
                    seen.add(ch["name"])
                    unique_candidates.append(ch)

            if plat and plon and unique_candidates:
                nearest = _find_nearest(plat, plon, unique_candidates, used_hotel_names, count=1)
                if nearest:
                    hotel = nearest[0]
            elif unique_candidates:
                hotel = unique_candidates[0]

        # ── Pick restaurants nearest to this day's destinations ─────────
        # Same approach: only use restaurants fetched near THIS day's places.
        lunch = None
        dinner = None
        if day_dests:
            primary = day_dests[0]
            plat = primary.get("latitude", 0)
            plon = primary.get("longitude", 0)

            candidate_rests = []
            if dest_restaurants:
                for di in day_dest_indices:
                    candidate_rests.extend(dest_restaurants.get(di, []))
            if not candidate_rests:
                candidate_rests = restaurants

            seen = set()
            unique_rests = []
            for cr in candidate_rests:
                if cr["name"] not in seen:
                    seen.add(cr["name"])
                    unique_rests.append(cr)

            if plat and plon and unique_rests:
                nearest = _find_nearest(plat, plon, unique_rests, used_rest_names, count=2)
                if len(nearest) >= 1:
                    lunch = nearest[0]
                if len(nearest) >= 2:
                    dinner = nearest[1]
                elif lunch:
                    dinner = lunch
            elif unique_rests:
                lunch = unique_rests[0]
                dinner = unique_rests[1 % len(unique_rests)] if len(unique_rests) > 1 else lunch
        elif restaurants and not is_buffer:
            lunch = restaurants[(d * 2) % len(restaurants)]
            dinner = restaurants[(d * 2 + 1) % len(restaurants)] if len(restaurants) > 1 else lunch

        # Costs for this day — accommodation scales by rooms needed
        rooms_needed = max(1, (group_size + 1) // 2)  # 2 persons per room
        day_travel = sum(dd.get("costBreakdown", {}).get("travel", 0) for dd in day_dests)
        day_food = sum(dd.get("costBreakdown", {}).get("food", 0) for dd in day_dests)
        if not day_food and not is_buffer:
            day_food = 500 * max(1, group_size)
        day_accommodation = (hotel["estimated_rate"] * rooms_needed) if hotel else 0
        day_guide = sum(dd.get("costBreakdown", {}).get("guide", 0) for dd in day_dests)
        day_cost = day_travel + day_food + day_accommodation + day_guide
        if is_buffer:
            day_cost = 500

        total_travel += day_travel
        total_food += day_food
        total_accommodation += day_accommodation
        total_guide += day_guide

        day_plans.append({
            "day": d,
            "date": current_date,
            "label": label,
            "is_buffer": is_buffer,
            "destinations": [
                {
                    "name": dd["name"],
                    "distance": dd.get("distance"),
                    "estimatedCost": dd.get("estimatedCost", 0),
                    "image": dd.get("image", ""),
                    "weather": dd.get("weather", ""),
                    "temperature": dd.get("temperature"),
                    "activities": dd.get("activities", []),
                    "maps_link": f"https://www.google.com/maps/search/?api=1&query={dd.get('latitude', 0)},{dd.get('longitude', 0)}",
                }
                for dd in day_dests
            ],
            "hotel": {
                "name": hotel["name"],
                "type": hotel["type"],
                "estimated_rate": hotel["estimated_rate"],
                "distance_km": hotel.get("distance_km", 0),
                "maps_link": hotel.get("maps_link", ""),
                "phone": hotel.get("phone", ""),
            } if hotel else None,
            "meals": {
                "lunch": {
                    "name": lunch["name"],
                    "cuisine": lunch.get("cuisine", ""),
                    "maps_link": lunch.get("maps_link", ""),
                } if lunch else None,
                "dinner": {
                    "name": dinner["name"],
                    "cuisine": dinner.get("cuisine", ""),
                    "maps_link": dinner.get("maps_link", ""),
                } if dinner else None,
            },
            "day_cost": day_cost,
        })

    computed_total = sum(dp["day_cost"] for dp in day_plans)

    # ── Budget scaling ────────────────────────────────────────────────────
    budget_status = "within_budget"
    savings = 0
    if budget > 0 and computed_total > budget:
        scale = budget / computed_total if computed_total > 0 else 1.0
        for dp in day_plans:
            dp["day_cost"] = round(dp["day_cost"] * scale)
        computed_total = sum(dp["day_cost"] for dp in day_plans)
        budget_status = "scaled_to_fit"
    elif budget > 0 and computed_total < budget:
        savings = budget - computed_total
        budget_status = "under_budget"

    return {
        "days": day_plans,
        "total_cost": computed_total,
        "accommodation_cost": total_accommodation,
        "food_cost": total_food,
        "travel_cost": total_travel,
        "guide_cost": total_guide,
        "group_size": group_size,
        "buffer_day_included": True,
        "budget_given": budget,
        "budget_status": budget_status,
        "savings": savings,
    }

