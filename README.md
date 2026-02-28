# 🌍 TravelGenie AI — Your Personalized AI Travel Companion

> **Hackathon Project** · Built for the TKR Hackathon · Team **Bug Slayers**

---

## 🚀 Introduction

**TravelGenie AI** is a next-generation, **personalized AI-powered travel planning platform** that puts you in the driver's seat — safely and smartly. Unlike traditional travel apps that demand form-filling, TravelGenie AI understands you the way a human would: through **natural, conversational language**.

Simply tell it what you want — *"I want to visit beaches near Goa for 3 days under ₹8000 by train"* — and TravelGenie AI does the rest.

### 🎯 Core Philosophy

| Pillar | What it means |
|---|---|
| **Personalized AI** | Every trip plan is unique to you — your budget, your category preferences, your travel mode, your dates |
| **User Safety First** | Every destination card carries a real-time **Safety Score (0–100)** computed from hospital/police proximity, AQI, and weather conditions |

---

## ✨ Key Features

- 🗣️ **Natural Language Input** — Type freely, no forms needed
- 🔍 **Smart Query Parsing** — `parseQuery.js` extracts destinations, budget, category, days, travel mode & more from raw text
- 🛡️ **Safety Score** — Live score per destination based on emergency services proximity, Air Quality Index (AQI) & weather
- 🗺️ **Multi-Destination Trip Planning** — Supports "Pune → Thane → Mumbai" style multi-leg journeys
- 📅 **AI Itinerary Builder** — Day-by-day plan with hotels, restaurants & a buffer/reserve day
- 🚌 **Multi-Modal Transport Estimates** — Bus, Train, Flight, Car with booking links (RedBus, IRCTC, etc.)
- 💰 **Budget-Aware Cost Estimation** — Transparent breakdown: travel + food + entry + guide + GST
- 🧾 **Mock Payment Gateway** — UPI, Debit, Credit, Netbanking with receipt generation
- ♿ **PHC / Accessibility Mode** — Special support for physically handicapped travelers
- 🌤️ **Live Weather & AQI** — Powered by Open-Meteo (free, no API key)
- 🖼️ **Wikipedia Place Images** — Auto-fetched thumbnails for every destination card
- 🗺️ **Interactive Maps** — Leaflet-powered maps with React-Leaflet integration
- 🎞️ **Smooth Animations** — Framer Motion transitions throughout the UI
- 🪪 **ID Verification** — Prototype endpoint for traveller identity verification
- 📊 **Trip Timeline & Itinerary Table** — Visual day-by-day timeline and structured itinerary views

---

## 🧠 How It Works — The NLP Pipeline

The magic starts with **unstructured natural language input**. The user types anything — no structured form required.

```
"Plan a 3-day trip to Manali with nature spots, budget ₹12000, by car, with a guide"
```

This raw text is passed to **`parseQuery.js`**, the core NLP engine of TravelGenie AI.

### 🔬 `parseQuery.js` — What it Extracts

| Extracted Field | Example Input | Extracted Value |
|---|---|---|
| `destinations` | *"from Pune to Mumbai"* | `['Pune', 'Mumbai']` |
| `budget` | *"under ₹8000"* / *"10k"* | `8000` / `10000` |
| `category` | *"beaches"* / *"trekking"* | `"Beaches"` / `"Nature"` |
| `categories` | *"fort and waterfall"* | `['Forts', 'Waterfalls']` |
| `days` | *"3 days"* / *"a week"* | `3` / `7` |
| `travelMode` | *"by train"* / *"flight"* | `"train"` / `"plane"` |
| `guide` | *"with guide"* | `true` |
| `phc` | *"wheelchair accessible"* | `true` |

**Supported categories:** Temples · Nature · Malls · Beaches · Monuments · Forts · Palaces · Lakes · Waterfalls · Wildlife · Adventure · Hill Stations · Caves · Gardens · Ruins

**Multi-leg trips supported:**
```
"Hyderabad to Warangal to Bhadrachalam"   →  destinations: ["Hyderabad", "Warangal", "Bhadrachalam"]
```

Once parsed, the structured data is sent to the **FastAPI backend**, which aggregates data from 5 free APIs in parallel and returns fully enriched destination cards.

---

## 🛡️ Safety Score — How We Keep You Safe

Every destination carries a **Safety Score (0–100)**, computed in real-time:

| Signal | Source |
|---|---|
| 🏥 Nearest hospital distance | OpenStreetMap (Overpass API) |
| 🚔 Nearest police station distance | OpenStreetMap (Overpass API) |
| 💨 Air Quality Index (AQI) | Open-Meteo Air Quality API |
| 🌦️ Weather conditions | Open-Meteo Weather API |
| 📍 Category risk factor | Built-in risk table |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite 7, Material UI (MUI v7), React Router v7, Framer Motion, Leaflet + React-Leaflet |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, HTTPX, Pydantic |
| **NLP Parser** | Custom JS (`parseQuery.js`) — zero external dependencies |
| **Maps & Places** | OpenStreetMap Overpass API + OpenTripMap |
| **Weather / AQI** | Open-Meteo (free, no API key) |
| **Place Images** | Wikipedia MediaWiki API |

---

## 📁 Folder Structure

```
tourism-tkr-hackathon/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── models/
│   ├── routers/
│   │   ├── places.py
│   │   ├── itinerary.py
│   │   ├── payment.py
│   │   ├── safety.py
│   │   ├── weather.py
│   │   └── verification.py
│   └── services/
│       ├── osm_service.py
│       ├── weather_service.py
│       ├── aqi_service.py
│       ├── safety_score.py
│       ├── cost_estimator.py
│       ├── transport_service.py
│       ├── hotel_service.py
│       ├── itinerary_engine.py
│       ├── wiki_service.py
│       └── id_verification.py
└── frontend/
    └── travelgenie/
        ├── index.html
        ├── vite.config.js
        ├── eslint.config.js
        ├── package.json
        └── src/
            ├── main.jsx
            ├── App.jsx
            ├── App.css
            ├── index.css
            ├── assets/
            ├── components/
            │   ├── LandingPage.jsx
            │   ├── ChatInterface.jsx
            │   ├── ResultsPage.jsx
            │   ├── PaymentPage.jsx
            │   ├── DestinationCard.jsx
            │   ├── TripTimeline.jsx
            │   ├── ItineraryTable.jsx
            │   └── navbar.jsx
            └── utils/
                └── parseQuery.js  ⭐ NLP Parser
```

---

## ⚙️ Commands to Run

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Runs at: `http://localhost:8000` · Docs at: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend/travelgenie
npm install
npm run dev
```
Runs at: `http://localhost:5173`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/destinations` | Core endpoint — fetches enriched destination cards |
| `POST` | `/api/itinerary` | Generates day-by-day itinerary with hotels & restaurants |
| `GET` | `/api/hotels` | Finds nearby hotels via OSM |
| `GET` | `/api/restaurants` | Finds nearby restaurants via OSM |
| `GET` | `/api/transport` | Transport cost & duration estimate |
| `POST` | `/api/payment` | Mock payment processing with receipt |
| `POST` | `/api/payment/verify` | Mock payment verification |
| `GET` | `/api/safety-score` | Standalone safety score for a location |
| `GET` | `/api/weather` | Weather + forecast for a location |
| `POST` | `/api/verify-id` | ID verification prototype endpoint |

---

### 👥 Made by Team **Bug Slayers** · TKR Hackathon 2026