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
    travel_mode: str = "car"
    guide: bool = False
    phc: bool = False
    destinations: list[dict] = []


@router.post("/itinerary")
async def generate_itinerary(req: ItineraryRequest = Body(...)):
    """
    Accepts the selected destination cards (from /api/destinations)
    plus trip metadata → returns a structured day-by-day plan.
    """
    lat, lon = req.latitude, req.longitude

    # Fetch hotels & restaurants in parallel near the main destination
    hotels, restaurants = await asyncio.gather(
        fetch_hotels(lat, lon, radius=10000, max_results=10),
        fetch_restaurants(lat, lon, radius=5000, max_results=8),
    )

    # Transport estimate (for the average distance of selected destinations)
    avg_distance = 0
    if req.destinations:
        distances = [d.get("distance", 0) for d in req.destinations]
        avg_distance = sum(distances) / len(distances) if distances else 0
    transport = estimate_transport(avg_distance, req.travel_mode)

    # Build the itinerary
    plan = build_itinerary(
        destinations=req.destinations,
        hotels=hotels,
        restaurants=restaurants,
        days=req.days,
        budget=req.budget,
        travel_mode=req.travel_mode,
        guide=req.guide,
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
        "hotels": hotels,
        "restaurants": restaurants,
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
