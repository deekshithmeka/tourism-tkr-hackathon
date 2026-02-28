"""
Itinerary Generation Engine — builds a structured day-by-day plan
from selected destinations, hotels, restaurants, and adds a buffer day.
"""

from datetime import date, timedelta


def build_itinerary(
    destinations: list[dict],
    hotels: list[dict],
    restaurants: list[dict],
    days: int,
    budget: int,
    travel_mode: str = "car",
    guide: bool = False,
) -> dict:
    """
    Build a day-by-day itinerary with accommodation, meals, and buffer day.

    Returns
    -------
    {
      "days": [ { day, label, is_buffer, destinations, hotel, meals, day_cost } ],
      "total_cost": int,
      "accommodation_cost": int,
      "food_cost": int,
      "travel_cost": int,
      "guide_cost": int,
      "buffer_day_included": bool,
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

    for d in range(1, effective_days + 1):
        is_buffer = d == effective_days
        current_date = (start + timedelta(days=d - 1)).isoformat()
        label = f"Day {d}" if not is_buffer else f"Day {d} — Reserve / Buffer"

        # Pick destinations for this day
        day_dests = []
        if not is_buffer and dest_idx < len(destinations):
            count = dest_per_day if d < activity_days else len(destinations) - dest_idx
            day_dests = destinations[dest_idx: dest_idx + count]
            dest_idx += count

        # Rotate hotel
        hotel = None
        if hotels and d < effective_days:
            hotel = hotels[(d - 1) % len(hotels)]

        # Rotate restaurants for meals
        lunch = None
        dinner = None
        if restaurants:
            lunch = restaurants[(d * 2) % len(restaurants)]
            dinner = restaurants[(d * 2 + 1) % len(restaurants)] if len(restaurants) > 1 else lunch

        # Costs for this day
        day_travel = sum(dd.get("costBreakdown", {}).get("travel", 0) for dd in day_dests)
        day_food = sum(dd.get("costBreakdown", {}).get("food", 0) for dd in day_dests)
        if not day_food and not is_buffer:
            day_food = 500
        day_accommodation = hotel["estimated_rate"] if hotel else 0
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
                "distance_km": hotel["distance_km"],
                "maps_link": hotel["maps_link"],
                "phone": hotel.get("phone", ""),
            } if hotel else None,
            "meals": {
                "lunch": {
                    "name": lunch["name"],
                    "cuisine": lunch.get("cuisine", ""),
                    "maps_link": lunch["maps_link"],
                } if lunch else None,
                "dinner": {
                    "name": dinner["name"],
                    "cuisine": dinner.get("cuisine", ""),
                    "maps_link": dinner["maps_link"],
                } if dinner else None,
            },
            "day_cost": day_cost,
        })

    computed_total = sum(dp["day_cost"] for dp in day_plans)

    # ── Budget scaling ────────────────────────────────────────────────────
    # If total exceeds budget, scale costs proportionally so the trip fits.
    # If total is well below budget, show savings.
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
        "buffer_day_included": True,
        "budget_given": budget,
        "budget_status": budget_status,
        "savings": savings,
    }

