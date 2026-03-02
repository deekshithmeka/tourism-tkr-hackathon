import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import places, itinerary, payment

app = FastAPI(
    title="TravelGenie AI",
    description="Smart travel planning API — powered entirely by free, open-source data",
    version="2.0.0",
)

# CORS config via env:
# - CORS_ALLOW_ORIGINS: comma-separated list of origins
# - defaults include local frontend dev origins
cors_allow_origins = os.getenv(
    "CORS_ALLOW_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
allowed_origins = [origin.strip() for origin in cors_allow_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(places.router)
app.include_router(itinerary.router)
app.include_router(payment.router)


@app.get("/")
async def root():
    return {"message": "Welcome to TravelGenie AI", "status": "online", "version": "2.0.0"}
