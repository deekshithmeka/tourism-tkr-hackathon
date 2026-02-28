"""
/api/destinations — the CORE endpoint.
Aggregates data from five free APIs in parallel, filters by budget,
and returns fully enriched destination cards.
"""

import asyncio

from fastapi import APIRouter, Query

from services.osm_service import (
    fetch_places_and_emergency,
    estimate_crowd,
    suggest_activities,
    generate_links,
    find_nearest_emergency,
)
from services.weather_service import get_weather, get_weather_batch
from services.aqi_service import get_aqi, get_aqi_batch
from services.safety_score import compute_safety_score
from services.wiki_service import get_place_images_batch
from services.cost_estimator import estimate_cost
from services.transport_service import estimate_all_modes

router = APIRouter(prefix="/api", tags=["destinations"])


@router.get("/destinations")
async def get_destinations(
    lat: float = Query(..., description="User latitude"),
    lon: float = Query(..., description="User longitude"),
    budget: int = Query(..., gt=0, description="Budget in INR"),
    category: str = Query(..., description="Place category (comma-separated for multiple)"),
    radius: int = Query(10000, ge=1000, le=50000, description="Search radius (m)"),
    travel_mode: str = Query("car", description="Travel mode: bus, train, plane, car"),
    guide: bool = Query(False, description="Whether a personal guide is needed"),
):
    """
    1. Overpass API  → nearby places + hospitals/police  (OSM — free)
    2. Open-Meteo   → current weather                   (free, no key)
    3. Open-Meteo   → air-quality index                  (free, no key)
    4. Wikipedia     → place thumbnail images             (free, no key)
    5. Local compute → safety score, cost estimate,
                       crowd level, activities, links
    All calls are parallelised where possible.
    Supports multiple categories (comma-separated): results are merged.
    """

    # Support comma-separated categories
    categories = [c.strip().lower() for c in category.split(",") if c.strip()]
    if not categories:
        categories = ["nature"]
    primary_category = categories[0]

    # ── Step 1: fetch places from OSM + user-location weather (for summary) ──
    # Query each category in parallel, then merge results
    fetch_tasks = [fetch_places_and_emergency(lat, lon, cat, radius) for cat in categories]
    fetch_tasks.append(get_weather(lat, lon))
    fetch_tasks.append(get_aqi(lat, lon))

    results = await asyncio.gather(*fetch_tasks, return_exceptions=True)

    # Merge places from all categories, deduplicate by name
    all_places = []
    emergency = []
    seen_names = set()
    seen_emergency = set()

    for res in results[:-2]:  # all except weather & aqi
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
                all_places.append(p)

    # Sort merged results by distance
    all_places.sort(key=lambda x: x["distance_km"])
    places = all_places

    user_weather = results[-2] if not isinstance(results[-2], Exception) else None
    user_aqi = results[-1] if not isinstance(results[-1], Exception) else None

    if not places:
        return {
            "destinations": [],
            "count": 0,
            "budget": budget,
            "weather_summary": user_weather,
            "aqi_summary": user_aqi,
            "message": "No places found. Try a wider radius or different category.",
        }

    # Limit to top 15 nearest (more variety with multi-category)
    top_places = places[:15]

    # ── Step 2: parallel — per-place weather + AQI + Wikipedia images ─────
    place_coords = [(p["latitude"], p["longitude"]) for p in top_places]

    images, place_weather_list, place_aqi_list = await asyncio.gather(
        get_place_images_batch(
            [p["name"] for p in top_places], primary_category
        ),
        get_weather_batch(place_coords),
        get_aqi_batch(place_coords),
    )

    # ── Step 3: enrich each place with per-location data ──────────────────
    destinations = []
    for i, place in enumerate(top_places):
        cost_data = estimate_cost(
            place["distance_km"], primary_category, travel_mode, guide,
            place_name=place["name"],
        )

        # Show all places — flag over-budget ones instead of hiding them
        over_budget = cost_data["total"] > budget

        safety = compute_safety_score(
            place["latitude"], place["longitude"], emergency,
            distance_km=place["distance_km"],
            category=primary_category,
            place_name=place["name"],
        )
        crowd = estimate_crowd(place["distance_km"], primary_category)
        activities = suggest_activities(primary_category, place["name"])
        links = generate_links(
            place["name"], place["latitude"], place["longitude"]
        )
        nearest_emergency = find_nearest_emergency(
            place["latitude"], place["longitude"], emergency
        )

        # Transport alternatives (all modes: bus, train, plane, car)
        transport_alternatives = estimate_all_modes(place["distance_km"])

        # Per-place weather & AQI (fallback to user-location data)
        pw = place_weather_list[i] if i < len(place_weather_list) else user_weather
        pa = place_aqi_list[i] if i < len(place_aqi_list) else user_aqi

        destinations.append(
            {
                "name": place["name"],
                "distance": place["distance_km"],
                "safetyScore": safety,
                "aqi": pa,
                "crowd": crowd,
                "weather": pw["description"],
                "temperature": pw.get("temperature"),
                "windspeed": pw.get("windspeed"),
                "estimatedCost": cost_data["total"],
                "costBreakdown": cost_data,
                "overBudget": over_budget,
                "image": images[i],
                "links": links,
                "activities": activities,
                "latitude": place["latitude"],
                "longitude": place["longitude"],
                "emergency": nearest_emergency,
                "transportAlternatives": transport_alternatives,
            }
        )

    # Default sort: safest first
    destinations.sort(key=lambda x: x["safetyScore"], reverse=True)

    return {
        "destinations": destinations,
        "count": len(destinations),
        "budget": budget,
        "weather_summary": user_weather,
        "aqi_summary": user_aqi,
    }
