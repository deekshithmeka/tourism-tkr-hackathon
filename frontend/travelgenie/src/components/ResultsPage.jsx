import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Grid,
  Box,
  Typography,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Container,
  FormControlLabel,
  Switch,
  Button,
  IconButton,
  Chip,
  useTheme,
  CircularProgress,
  Skeleton,
  Paper,
  Snackbar,
  Stack,
  Tooltip,
  Divider,
  Link,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import SortIcon from "@mui/icons-material/Sort";
import PersonIcon from "@mui/icons-material/Person";
import MapIcon from "@mui/icons-material/Map";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import TrainIcon from "@mui/icons-material/Train";
import FlightIcon from "@mui/icons-material/Flight";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PrintIcon from "@mui/icons-material/Print";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import ShareIcon from "@mui/icons-material/Share";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PaymentIcon from "@mui/icons-material/Payment";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HotelIcon from "@mui/icons-material/Hotel";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AccessibleIcon from "@mui/icons-material/Accessible";
import DestinationCard from "./DestinationCard";
import TripTimeline from "./TripTimeline";
import ItineraryTable from "./ItineraryTable";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const TRAVEL_MODES = [
  { value: "bus", label: "Bus", icon: <DirectionsBusIcon sx={{ fontSize: 18 }} /> },
  { value: "train", label: "Train", icon: <TrainIcon sx={{ fontSize: 18 }} /> },
  { value: "plane", label: "Plane", icon: <FlightIcon sx={{ fontSize: 18 }} /> },
  { value: "car", label: "Local Car", icon: <DirectionsCarIcon sx={{ fontSize: 18 }} /> },
];

function ResultsPage() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    latitude, longitude, budget, category,
    days: initDays = 2,
    groupSize: initGroupSize = 1,
    travelMode: initTravelMode = "car",
    guide: initGuide = false,
    phc: initPhc = false,
    destinations: multiDestinations = [],
  } = location.state || {};

  // Redirect to home if no search params
  useEffect(() => {
    if (!latitude || !longitude || !budget || !category) {
      navigate("/", { replace: true });
    }
  }, [latitude, longitude, budget, category, navigate]);
  const isDark = theme.palette.mode === "dark";

  // Data from API
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherSummary, setWeatherSummary] = useState(null);
  const [aqiSummary, setAqiSummary] = useState(null);

  // UI state
  const [travelMode, setTravelMode] = useState(initTravelMode);
  const [guideEnabled, setGuideEnabled] = useState(initGuide || initPhc);
  const [sortMode, setSortMode] = useState("safe");
  const [insurance, setInsurance] = useState(true);
  const [itinerary, setItinerary] = useState([]);
  const [showTimeline, setShowTimeline] = useState(false);
  const [budgetSnack, setBudgetSnack] = useState(false);

  // New: itinerary plan, transport, hotels, restaurants from backend
  const [itineraryPlan, setItineraryPlan] = useState(null);
  const [transportInfo, setTransportInfo] = useState(null);
  const [guideInfo, setGuideInfo] = useState(null);
  const [showItinerary, setShowItinerary] = useState(false);
  const [itineraryLoading, setItineraryLoading] = useState(false);

  const printRef = useRef(null);
  const tripTimelineRef = useRef(null);
  const itinerarySectionRef = useRef(null);

  // Compute running trip total
  const tripTotal = itinerary.reduce((sum, p) => sum + p.estimatedCost, 0);
  const budgetRemaining = (budget || 0) - tripTotal;

  // ── Fetch destinations from backend ──────────────────────────────────
  useEffect(() => {
    const fetchDestinations = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          lat: latitude,
          lon: longitude,
          budget,
          category,
          radius: 10000,
          travel_mode: travelMode,
          guide: guideEnabled,
          group_size: initGroupSize,
        });
        const res = await fetch(`${API_BASE}/api/destinations?${params}`);
        if (!res.ok) throw new Error(`Server error (${res.status})`);
        const data = await res.json();
        setPlaces(data.destinations || []);
        setWeatherSummary(data.weather_summary || null);
        setAqiSummary(data.aqi_summary || null);
        // Clear itinerary when filters change
        setItinerary([]);
        setShowTimeline(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to load destinations.");
      } finally {
        setLoading(false);
      }
    };
    if (latitude && longitude && budget && category) {
      fetchDestinations();
    }
  }, [latitude, longitude, budget, category, travelMode, guideEnabled]);

  const handleAddToTrip = (place) => {
    if (itinerary.find((p) => p.name === place.name)) return;
    // Warn if adding this place would exceed budget, but still allow it
    const newTotal = tripTotal + place.estimatedCost;
    if (newTotal > budget) {
      setBudgetSnack(true);
    }
    setItinerary((prev) => [...prev, place]);
  };

  const handleRemoveFromTrip = (placeName) => {
    setItinerary((prev) => prev.filter((p) => p.name !== placeName));
  };

  const handleReorder = (fromIndex, toIndex) => {
    setItinerary((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  // ── Build shareable trip text ────────────────────────────────────────
  const buildTripText = () => {
    if (itinerary.length === 0) return "";
    const lines = [
      `🧳 *TravelGenie AI — Trip Plan*`,
      `📍 Category: ${category?.replace(/,/g, ", ")}`,
      `💰 Budget: ₹${budget?.toLocaleString("en-IN")}`,
      `🚗 Travel mode: ${travelMode}`,
      `👤 Guide: ${guideEnabled ? "Yes" : "No"}`,
      ``,
      `*Destinations:*`,
    ];
    itinerary.forEach((p, i) => {
      lines.push(
        `${i + 1}. ${p.name} — ${p.distance} km — ₹${p.estimatedCost.toLocaleString("en-IN")}`
      );
    });
    lines.push(``);
    lines.push(`💵 *Total: ₹${tripTotal.toLocaleString("en-IN")}*`);
    lines.push(`💰 *Remaining: ₹${budgetRemaining.toLocaleString("en-IN")}*`);
    lines.push(`\nPowered by TravelGenie AI`);
    return lines.join("\n");
  };

  const handlePrint = () => {
    const text = buildTripText().replace(/\*/g, "");
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head>
          <title>TravelGenie Trip Plan</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #0F766E; }
            pre { white-space: pre-wrap; font-family: inherit; font-size: 15px; line-height: 1.8; }
            .footer { margin-top: 30px; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>🧳 TravelGenie AI — Trip Plan</h1>
          <pre>${text}</pre>
          <div class="footer">Generated on ${new Date().toLocaleDateString()}</div>
          <script>window.print();window.onafterprint=()=>window.close();<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleShareWhatsApp = () => {
    const text = buildTripText();
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const handleShareTelegram = () => {
    const text = buildTripText();
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  // ── Generate day-by-day itinerary from backend ─────────────────────
  const handleGenerateItinerary = async () => {
    if (itinerary.length === 0) return;
    setItineraryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude,
          longitude,
          budget,
          category,
          days: initDays,
          group_size: initGroupSize,
          travel_mode: travelMode,
          guide: guideEnabled,
          phc: initPhc,
          destinations: itinerary,
        }),
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setItineraryPlan(data.itinerary || null);
      setTransportInfo(data.transport || null);
      setGuideInfo(data.guide || null);
      setShowItinerary(true);
      // Auto-scroll to itinerary section
      setTimeout(() => {
        itinerarySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err) {
      console.error("Itinerary error:", err);
      alert("Failed to generate itinerary. Please try again.");
    } finally {
      setItineraryLoading(false);
    }
  };

  // ── Navigate to payment ──────────────────────────────────────────────
  const handleProceedToPayment = () => {
    const insuranceAmt = insurance ? Math.max(99, (initDays || 1) * 50) : 0;
    navigate("/payment", {
      state: {
        tripTotal,
        travelMode,
        groupSize: initGroupSize,
        guide: guideEnabled,
        guideCost: itineraryPlan?.guide_cost || 0,
        insurance,
        insuranceAmount: insuranceAmt,
        destinations: itinerary.map((p) => p.name),
        days: initDays,
        budget,
        category,
        itinerary: itineraryPlan,
        transport: transportInfo,
        guideInfo,
      },
    });
  };

  let sortedPlaces = [...places];
  if (sortMode === "safe") {
    sortedPlaces.sort((a, b) => b.safetyScore - a.safetyScore);
  } else if (sortMode === "crowd") {
    const crowdOrder = { Low: 0, Moderate: 1, High: 2 };
    sortedPlaces.sort(
      (a, b) => (crowdOrder[a.crowd] ?? 9) - (crowdOrder[b.crowd] ?? 9)
    );
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        background: isDark
          ? "transparent"
          : "linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 40%, #EEF2FF 100%)",
        pb: 8,
      }}
    >
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        {/* ── Loading state ────────────────────────────────────────── */}
        {loading && (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <CircularProgress size={48} sx={{ color: "primary.main", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Searching for the best destinations near you…
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Fetching live weather, air quality &amp; safety data
            </Typography>
            <Grid container spacing={3} sx={{ mt: 4 }}>
              {[1, 2, 3].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton
                    variant="rounded"
                    height={320}
                    sx={{ borderRadius: 4 }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* ── Error state ──────────────────────────────────────────── */}
        {!loading && error && (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Alert severity="error" sx={{ mb: 2, justifyContent: "center" }}>
              {error}
            </Alert>
            <Typography variant="body1" color="text.secondary">
              Please check that the backend is running on port 8000 and try again.
            </Typography>
          </Box>
        )}

        {/* ── Empty state ──────────────────────────────────────────── */}
        {!loading && !error && places.length === 0 && (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
              No destinations found
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Try increasing your budget or selecting a different category.
            </Typography>
          </Box>
        )}

        {/* ── Results ──────────────────────────────────────────────── */}
        {!loading && !error && places.length > 0 && (
          <>

        {/* Navigation bar */}
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/")}
            sx={{
              color: "text.secondary",
              fontWeight: 500,
              "&:hover": { color: "primary.main" },
            }}
          >
            Back to Search
          </Button>
        </Box>

        {/* Weather + AQI Alert */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Alert
            severity={
              weatherSummary?.description?.includes("Rain") ||
              weatherSummary?.description?.includes("Thunderstorm") ||
              weatherSummary?.description?.includes("Snow")
                ? "warning"
                : "info"
            }
            variant="outlined"
            sx={{
              mb: 3,
              backdropFilter: "blur(8px)",
              background: isDark
                ? "rgba(245,158,11,0.08)"
                : "rgba(255,243,205,0.6)",
            }}
          >
            {weatherSummary
              ? `Live weather: ${weatherSummary.description}${
                  weatherSummary.temperature != null
                    ? ` · ${weatherSummary.temperature}°C`
                    : ""
                }${aqiSummary ? ` · AQI ${aqiSummary}` : ""}`
              : "Weather data unavailable."}
          </Alert>
        </motion.div>

        {/* Header + Controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "flex-end" },
              gap: 3,
              mb: 3,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  background: "linear-gradient(135deg, #0F766E, #0EA5E9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 0.5,
                }}
              >
                Recommended Destinations
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                {(category || "").split(",").filter(Boolean).map((cat) => (
                  <Chip
                    key={cat}
                    label={cat.trim()}
                    size="small"
                    sx={{
                      bgcolor: "primary.main",
                      color: "#fff",
                      fontWeight: 600,
                      textTransform: "capitalize",
                      fontSize: "0.75rem",
                    }}
                  />
                ))}
                <Chip label={`${initDays} day${initDays > 1 ? "s" : ""}`} size="small" variant="outlined" sx={{ fontSize: "0.75rem" }} />
                {initPhc && (
                  <Chip icon={<AccessibleIcon sx={{ fontSize: 14 }} />} label="Accessible" size="small" color="secondary" sx={{ fontSize: "0.75rem" }} />
                )}
                {multiDestinations.length > 1 && (
                  <Chip label={multiDestinations.join(" → ")} size="small" variant="outlined" sx={{ fontSize: "0.75rem" }} />
                )}
                <Typography variant="body2" color="text.secondary">
                  {places.length} place{places.length !== 1 && "s"} within
                  ₹{budget?.toLocaleString("en-IN")} budget
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <ToggleButtonGroup
                value={sortMode}
                exclusive
                onChange={(e, val) => val && setSortMode(val)}
                size="small"
                sx={{
                  "& .MuiToggleButtonGroup-grouped": {
                    border: "1px solid",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.1)",
                  },
                }}
              >
                <ToggleButton value="safe">
                  <SortIcon sx={{ mr: 0.8, fontSize: 18 }} />
                  Safest
                </ToggleButton>
                <ToggleButton value="crowd">
                  <SortIcon sx={{ mr: 0.8, fontSize: 18 }} />
                  Less Crowded
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </motion.div>

        {/* ── Travel Mode + Guide + Budget bar ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 4,
              border: "1px solid",
              borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              bgcolor: isDark ? "rgba(30,41,59,0.5)" : "rgba(255,255,255,0.7)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Stack spacing={2}>
              {/* Travel Mode */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: "0.8rem" }}>
                  🚗 Travel Mode
                </Typography>
                <ToggleButtonGroup
                  value={travelMode}
                  exclusive
                  onChange={(e, val) => val && setTravelMode(val)}
                  size="small"
                  sx={{
                    "& .MuiToggleButtonGroup-grouped": {
                      border: "1px solid",
                      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  {TRAVEL_MODES.map((m) => (
                    <ToggleButton key={m.value} value={m.value}>
                      {m.icon}
                      <Box component="span" sx={{ ml: 0.6 }}>{m.label}</Box>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {/* Guide + Insurance row */}
              <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                <FormControlLabel
                  control={
                    <Switch
                      checked={guideEnabled}
                      onChange={() => setGuideEnabled(!guideEnabled)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#F59E0B" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#D97706" },
                      }}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <PersonIcon sx={{ fontSize: 18, color: "secondary.main" }} />
                      <span>Personal Guide (+₹500/place)</span>
                    </Stack>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={insurance}
                      onChange={() => setInsurance(!insurance)}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#14B8A6" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#0F766E" },
                      }}
                    />
                  }
                  label={`Travel Insurance (₹${Math.max(99, (initDays || 1) * 50)}/trip)`}
                />
              </Stack>

              {/* Budget tracker */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  px: 2,
                  py: 1.5,
                  borderRadius: 3,
                  bgcolor: budgetRemaining < 0
                    ? "rgba(239,68,68,0.08)"
                    : isDark
                    ? "rgba(20,184,166,0.06)"
                    : "rgba(15,118,110,0.04)",
                  border: "1px solid",
                  borderColor: budgetRemaining < 0
                    ? "rgba(239,68,68,0.2)"
                    : isDark
                    ? "rgba(20,184,166,0.12)"
                    : "rgba(15,118,110,0.1)",
                }}
              >
                <Chip
                  label={`Budget: ₹${budget?.toLocaleString("en-IN")}`}
                  size="small"
                  sx={{ fontWeight: 700, bgcolor: "primary.main", color: "#fff" }}
                />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Spent: ₹{tripTotal.toLocaleString("en-IN")}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: budgetRemaining < 0 ? "#EF4444" : "primary.main",
                  }}
                >
                  Remaining: ₹{budgetRemaining.toLocaleString("en-IN")}
                </Typography>
                {/* Budget progress bar */}
                <Box sx={{ flex: 1, minWidth: 100 }}>
                  <Box
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${Math.min((tripTotal / budget) * 100, 100)}%`,
                        borderRadius: 3,
                        background: tripTotal / budget > 0.9
                          ? "linear-gradient(135deg, #EF4444, #F59E0B)"
                          : "linear-gradient(135deg, #0F766E, #14B8A6)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Paper>
        </motion.div>

        {/* Cards Grid */}
        <Grid container spacing={2.5} sx={{ alignItems: "stretch" }}>
          <AnimatePresence mode="popLayout">
            {sortedPlaces.map((place, index) => (
              <Grid item xs={12} sm={6} md={4} key={place.name} sx={{ display: "flex" }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.08,
                  }}
                  style={{ width: "100%", display: "flex" }}
                >
                  <DestinationCard
                    place={place}
                    guide={guideEnabled}
                    isInTrip={!!itinerary.find((p) => p.name === place.name)}
                    onAddToTrip={handleAddToTrip}
                    onRemoveFromTrip={handleRemoveFromTrip}
                  />
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>

        {/* Itinerary floating bar */}
        <AnimatePresence>
          {itinerary.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{
                position: "fixed",
                bottom: 24,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 50,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 3,
                  py: 1.5,
                  borderRadius: 4,
                  background: isDark
                    ? "rgba(30,41,59,0.95)"
                    : "rgba(255,255,255,0.95)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid",
                  borderColor: isDark
                    ? "rgba(20,184,166,0.2)"
                    : "rgba(15,118,110,0.15)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: "primary.main",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  {itinerary.length}
                </Box>
                <Typography variant="subtitle2" sx={{ whiteSpace: "nowrap" }}>
                  {itinerary.length === 1 ? "destination" : "destinations"} · ₹{tripTotal.toLocaleString("en-IN")}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<MapIcon />}
                  onClick={() => {
                    setShowTimeline(!showTimeline);
                    if (!showTimeline) {
                      // Scroll to timeline after it renders
                      setTimeout(() => {
                        tripTimelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 150);
                    }
                  }}
                >
                  {showTimeline ? "Hide Plan" : "View Trip"}
                </Button>
                <Tooltip title="Print trip plan" arrow>
                  <IconButton
                    size="small"
                    onClick={handlePrint}
                    sx={{
                      bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                      "&:hover": { bgcolor: isDark ? "rgba(20,184,166,0.12)" : "rgba(15,118,110,0.08)" },
                    }}
                  >
                    <PrintIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share on WhatsApp" arrow>
                  <IconButton
                    size="small"
                    onClick={handleShareWhatsApp}
                    sx={{
                      color: "#25D366",
                      bgcolor: "rgba(37,211,102,0.08)",
                      "&:hover": { bgcolor: "rgba(37,211,102,0.18)" },
                    }}
                  >
                    <WhatsAppIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Share on Telegram" arrow>
                  <IconButton
                    size="small"
                    onClick={handleShareTelegram}
                    sx={{
                      color: "#0088cc",
                      bgcolor: "rgba(0,136,204,0.08)",
                      "&:hover": { bgcolor: "rgba(0,136,204,0.18)" },
                    }}
                  >
                    <TelegramIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={itineraryLoading ? <CircularProgress size={14} /> : <CalendarMonthIcon />}
                  onClick={handleGenerateItinerary}
                  disabled={itineraryLoading}
                  sx={{ borderRadius: 3, fontSize: "0.78rem" }}
                >
                  {itineraryLoading ? "Building..." : "Generate Itinerary"}
                </Button>
                {itineraryPlan && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PaymentIcon />}
                    onClick={handleProceedToPayment}
                    sx={{
                      borderRadius: 3,
                      fontSize: "0.78rem",
                      background: "linear-gradient(135deg, #7C3AED, #6366F1)",
                      "&:hover": { background: "linear-gradient(135deg, #6D28D9, #4F46E5)" },
                    }}
                  >
                    Pay & Book
                  </Button>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day-by-day Itinerary Table */}
        <AnimatePresence>
          {showItinerary && itineraryPlan && (
            <motion.div
              ref={itinerarySectionRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Box sx={{ mt: 4, mb: 4 }}>
                <ItineraryTable
                  itinerary={itineraryPlan}
                  transport={transportInfo}
                  guide={guideInfo}
                />
                {/* Proceed to payment CTA */}
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PaymentIcon />}
                    onClick={handleProceedToPayment}
                    sx={{
                      borderRadius: 4,
                      px: 5,
                      py: 1.5,
                      fontWeight: 700,
                      fontSize: "1rem",
                      background: "linear-gradient(135deg, #7C3AED, #6366F1)",
                      boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #6D28D9, #4F46E5)",
                        boxShadow: "0 12px 32px rgba(124,58,237,0.4)",
                      },
                    }}
                  >
                    Proceed to Payment — ₹{itineraryPlan.total_cost?.toLocaleString("en-IN")}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<PrintIcon />}
                    onClick={handlePrint}
                    sx={{ borderRadius: 4, px: 4 }}
                  >
                    Print Plan
                  </Button>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trip Timeline */}
        <AnimatePresence>
          {showTimeline && itinerary.length > 0 && (
            <motion.div
              ref={tripTimelineRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Box sx={{ mt: 6, mb: 12 }}>
                <TripTimeline
                  itinerary={itinerary}
                  onRemove={handleRemoveFromTrip}
                  onReorder={handleReorder}
                  budget={budget}
                  onPrint={handlePrint}
                  onShareWhatsApp={handleShareWhatsApp}
                  onShareTelegram={handleShareTelegram}
                />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

          </>
        )}

        {/* Budget exceeded snackbar */}
        <Snackbar
          open={budgetSnack}
          autoHideDuration={3500}
          onClose={() => setBudgetSnack(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setBudgetSnack(false)}
            severity="warning"
            variant="filled"
            icon={<WarningAmberIcon />}
            sx={{ fontWeight: 600 }}
          >
            Adding this destination would exceed your ₹{budget?.toLocaleString("en-IN")} budget!
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default ResultsPage;