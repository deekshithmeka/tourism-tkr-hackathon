"""
GET /api/weather — standalone weather + forecast endpoint.
"""

from fastapi import APIRouter, Query
from services.weather_service import get_weather, get_forecast

router = APIRouter(prefix="/api", tags=["weather"])


@router.get("/weather")
async def weather_endpoint(
    lat: float = Query(...),
    lon: float = Query(...),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
):
    current = await get_weather(lat, lon)
    forecast, buffer_day = await get_forecast(lat, lon, start_date, end_date)
    return {
        "current": current,
        "forecast": forecast,
        "buffer_day_added": buffer_day,
    }
