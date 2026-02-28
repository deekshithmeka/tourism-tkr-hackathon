"""
Open-Meteo Air Quality Service — 100% free, NO API key needed.
Docs: https://open-meteo.com/en/docs/air-quality-api
"""

import httpx

AQI_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"


async def get_aqi(lat: float, lon: float) -> int:
    """
    Fetch current US-AQI from Open-Meteo Air Quality API.
    Returns an integer AQI value (0-500). Defaults to 50 on failure.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "us_aqi",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(AQI_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            aqi_val = data.get("current", {}).get("us_aqi")
            return int(aqi_val) if aqi_val is not None else 50
    except Exception:
        return 50


async def get_aqi_batch(coords: list[tuple[float, float]]) -> list[int]:
    """
    Fetch AQI for multiple coordinates in a single Open-Meteo call.
    Open-Meteo supports comma-separated lat/lon lists.
    Returns a list of AQI ints, one per coordinate.
    """
    if not coords:
        return []

    lats = ",".join(str(c[0]) for c in coords)
    lons = ",".join(str(c[1]) for c in coords)
    params = {
        "latitude": lats,
        "longitude": lons,
        "current": "us_aqi",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(AQI_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        # Single coord returns a dict; multiple returns a list
        if isinstance(data, dict):
            data = [data]

        results = []
        for item in data:
            aqi_val = item.get("current", {}).get("us_aqi")
            results.append(int(aqi_val) if aqi_val is not None else 50)
        return results
    except Exception:
        return [50] * len(coords)
