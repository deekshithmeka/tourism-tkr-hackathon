from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import places, itinerary, payment

app = FastAPI(
    title="TravelGenie AI",
    description="Smart travel planning API — powered entirely by free, open-source data",
    version="2.0.0",
)

# Allow the Vite dev server (and any origin in dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
