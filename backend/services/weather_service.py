"""
Open-Meteo Weather Service — 100% free, NO API key needed.
Docs: https://open-meteo.com/en/docs
"""

import httpx

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

# WMO Weather Interpretation Codes → human-readable text
WMO_CODES = {
    0: "Clear",
    1: "Mostly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Rime Fog",
    51: "Light Drizzle",
    53: "Drizzle",
    55: "Heavy Drizzle",
    56: "Freezing Drizzle",
    57: "Heavy Freezing Drizzle",
    61: "Light Rain",
    63: "Rain",
    65: "Heavy Rain",
    66: "Freezing Rain",
    67: "Heavy Freezing Rain",
    71: "Light Snow",
    73: "Snow",
    75: "Heavy Snow",
    77: "Snow Grains",
    80: "Light Showers",
    81: "Showers",
    82: "Heavy Showers",
    85: "Light Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm + Hail",
    99: "Severe Thunderstorm",
}


async def get_weather(lat: float, lon: float) -> dict:
    """
    Fetch current weather from Open-Meteo (free, no API key).
    Returns: {"description": str, "temperature": float|None, "windspeed": float|None}
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": "true",
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            cw = data.get("current_weather", {})
            code = cw.get("weathercode", 0)
            return {
                "description": WMO_CODES.get(code, "Unknown"),
                "temperature": cw.get("temperature"),
                "windspeed": cw.get("windspeed"),
            }
    except Exception:
        return {"description": "N/A", "temperature": None, "windspeed": None}


async def get_weather_batch(coords: list[tuple[float, float]]) -> list[dict]:
    """
    Fetch weather for multiple coordinates in a single Open-Meteo call.
    Open-Meteo supports comma-separated lat/lon lists.
    Returns a list of weather dicts, one per coordinate.
    """
    if not coords:
        return []

    lats = ",".join(str(c[0]) for c in coords)
    lons = ",".join(str(c[1]) for c in coords)
    params = {
        "latitude": lats,
        "longitude": lons,
        "current_weather": "true",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        # Single coord returns a dict; multiple returns a list
        if isinstance(data, dict):
            data = [data]

        results = []
        for item in data:
            cw = item.get("current_weather", {})
            code = cw.get("weathercode", 0)
            results.append({
                "description": WMO_CODES.get(code, "Unknown"),
                "temperature": cw.get("temperature"),
                "windspeed": cw.get("windspeed"),
            })
        return results
    except Exception:
        fallback = {"description": "N/A", "temperature": None, "windspeed": None}
        return [fallback] * len(coords)
