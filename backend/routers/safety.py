"""
GET /api/safety-score — standalone safety score endpoint.
"""

from fastapi import APIRouter, Query
from services.osm_service import fetch_places_and_emergency
from services.safety_score import compute_safety_score
from services.aqi_service import get_aqi
from services.weather_service import get_weather
import asyncio

router = APIRouter(prefix="/api", tags=["safety"])


@router.get("/safety-score")
async def safety_score_endpoint(
    lat: float = Query(...),
    lon: float = Query(...),
    category: str = Query("nature"),
):
    (_, emergency), weather, aqi = await asyncio.gather(
        fetch_places_and_emergency(lat, lon, category.lower(), 10000),
        get_weather(lat, lon),
        get_aqi(lat, lon),
    )
    score = compute_safety_score(
        lat, lon, emergency,
        aqi=aqi,
        weather_description=weather.get("description", "Clear"),
    )
    return {"safety_score": score, "aqi": aqi, "weather": weather}
