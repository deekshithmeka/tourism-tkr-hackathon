"""
/api/itinerary — builds a full day-by-day trip plan with hotels, restaurants,
transport, and a reserve/buffer day.
"""

import asyncio
from fastapi import APIRouter, Body
from pydantic import BaseModel, Field

from services.hotel_service import fetch_hotels, fetch_restaurants
from services.itinerary_engine import build_itinerary
from services.transport_service import estimate_transport

router = APIRouter(prefix="/api", tags=["itinerary"])


class ItineraryRequest(BaseModel):
    latitude: float
    longitude: float
    budget: int = Field(gt=0)
    category: str
    days: int = Field(default=2, ge=1, le=30)
    group_size: int = Field(default=1, ge=1, le=50)
    travel_mode: str = "car"
    guide: bool = False
    phc: bool = False
    destinations: list[dict] = []


@router.post("/itinerary")
async def generate_itinerary(req: ItineraryRequest = Body(...)):
    """
    Accepts the selected destination cards (from /api/destinations)
    plus trip metadata → returns a structured day-by-day plan.

    Hotels & restaurants are fetched *per-destination* so each place
    gets geographically relevant nearby accommodation and dining.
    """
    lat, lon = req.latitude, req.longitude

    # ── Collect coordinates for each destination (1:1 with req.destinations) ──
    # Use the destination's own lat/lon; fall back to user origin if missing.
    coords = []
    for d in req.destinations:
        dlat = d.get("latitude", 0)
        dlon = d.get("longitude", 0)
        if dlat and dlon:
            coords.append((dlat, dlon))
        else:
            coords.append((lat, lon))  # fallback so index stays 1:1
    # If no destinations at all, single origin entry
    if not coords:
        coords.append((lat, lon))

    # ── Fetch hotels & restaurants near EACH destination in parallel ────
    hotel_tasks = [fetch_hotels(c[0], c[1], radius=8000, max_results=5) for c in coords]
    rest_tasks = [fetch_restaurants(c[0], c[1], radius=5000, max_results=5) for c in coords]

    all_results = await asyncio.gather(*hotel_tasks, *rest_tasks, return_exceptions=True)

    n = len(coords)
    hotel_results = all_results[:n]
    rest_results = all_results[n:]

    # Build per-destination hotel/restaurant maps keyed by destination index
    # (1:1 with req.destinations so engine can look up by dest_idx)
    dest_hotels = {}      # dest_index → list[dict]
    dest_restaurants = {}  # dest_index → list[dict]
    all_hotels = []        # flat for backward-compat return
    all_restaurants = []
    seen_hotel_names = set()
    seen_rest_names = set()

    for i in range(n):
        hl = hotel_results[i] if not isinstance(hotel_results[i], Exception) else []
        rl = rest_results[i] if not isinstance(rest_results[i], Exception) else []
        dest_hotels[i] = hl
        dest_restaurants[i] = rl
        for h in hl:
            if h["name"] not in seen_hotel_names:
                seen_hotel_names.add(h["name"])
                all_hotels.append(h)
        for r in rl:
            if r["name"] not in seen_rest_names:
                seen_rest_names.add(r["name"])
                all_restaurants.append(r)

    # Transport estimate (for the average distance of selected destinations)
    avg_distance = 0
    if req.destinations:
        distances = [d.get("distance", 0) for d in req.destinations]
        avg_distance = sum(distances) / len(distances) if distances else 0
    transport = estimate_transport(avg_distance, req.travel_mode)

    # Build the itinerary (engine now receives per-dest hotel/restaurant maps)
    plan = build_itinerary(
        destinations=req.destinations,
        hotels=all_hotels,
        restaurants=all_restaurants,
        days=req.days,
        budget=req.budget,
        travel_mode=req.travel_mode,
        guide=req.guide,
        group_size=req.group_size,
        dest_hotels=dest_hotels,
        dest_restaurants=dest_restaurants,
    )

    # Guide details (mock — in production, would come from a real DB)
    guide_info = None
    if req.guide or req.phc:
        guide_info = {
            "name": "Raj Kumar",
            "phone": "+91-98765-43210",
            "languages": ["Hindi", "English"],
            "experience_years": 8,
            "rating": 4.7,
            "phc_trained": req.phc,
        }

    return {
        "itinerary": plan,
        "hotels": all_hotels,
        "restaurants": all_restaurants,
        "transport": transport,
        "guide": guide_info,
    }


@router.get("/hotels")
async def get_hotels(
    lat: float,
    lon: float,
    radius: int = 5000,
    max_results: int = 10,
):
    return await fetch_hotels(lat, lon, radius, max_results)


@router.get("/restaurants")
async def get_restaurants(
    lat: float,
    lon: float,
    radius: int = 3000,
    max_results: int = 8,
):
    return await fetch_restaurants(lat, lon, radius, max_results)


@router.get("/transport")
async def get_transport(
    distance_km: float,
    travel_mode: str = "car",
):
    return estimate_transport(distance_km, travel_mode)
