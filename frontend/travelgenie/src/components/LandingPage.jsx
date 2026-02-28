import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  InputBase,
  IconButton,
  Paper,
  Chip,
  Stack,
  CircularProgress,
  Tooltip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Switch,
  TextField,
  Slider,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import SendIcon from "@mui/icons-material/Send";
import ExploreIcon from "@mui/icons-material/Explore";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CategoryIcon from "@mui/icons-material/Category";
import EventIcon from "@mui/icons-material/Event";
import AccessibleIcon from "@mui/icons-material/Accessible";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import TrainIcon from "@mui/icons-material/Train";
import FlightIcon from "@mui/icons-material/Flight";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import RouteIcon from "@mui/icons-material/Route";
import parseQuery from "../utils/parseQuery";

// Large pool — 5 are picked each refresh with no repeat for 10 refreshes
const SUGGESTION_POOL = [
  "Temples in Jaipur under ₹5000",
  "Beach trip to Goa for 3 days with 20k budget",
  "Nature spots near Manali under ₹3000",
  "Historical monuments in Delhi within ₹8000",
  "Shopping malls near Mumbai under 2000 rupees",
  "Waterfalls near Lonavala under ₹2000",
  "Heritage forts in Rajasthan within ₹10000",
  "Hill stations near Bangalore under ₹6000",
  "Lakes around Udaipur for 2 days under ₹4000",
  "Museums in Kolkata under ₹1500",
  "Trekking trails near Rishikesh within ₹5000",
  "Palaces in Mysore under ₹3500",
  "Beaches near Pondicherry for 2 days with 8k budget",
  "Wildlife safari in Jim Corbett under ₹7000",
  "Temples near Varanasi within ₹4000",
  "Scenic spots in Ooty under ₹5000",
  "Caves near Aurangabad within ₹3000",
  "Gardens in Pune under ₹1000",
  "Islands near Andaman for 5 days under ₹15000",
  "Monuments in Agra under ₹2500",
  "Street food tour in Lucknow under ₹2000",
  "Backwaters in Kerala for 3 days under ₹9000",
  "Snow spots in Shimla within ₹6000",
  "Desert camping in Jaisalmer under ₹5000",
  "Ruins near Hampi for 2 days with 4k budget",
  "Tea gardens in Darjeeling under ₹3500",
  "Coastal drive from Mumbai to Goa under ₹8000",
  "Temples in Madurai under ₹2500",
  "Nature trails in Coorg within ₹4000",
  "Adventure sports in Rishikesh under ₹6000",
  "Houseboats in Alleppey for 2 days under ₹7000",
  "Forts near Pune under ₹1500",
  "Pilgrimage to Tirupati under ₹5000",
  "Shopping in Jaipur within ₹3000",
  "Sunset points in Mount Abu under ₹2000",
  "Bird sanctuary near Bharatpur under ₹1500",
  "Rock climbing in Badami under ₹3000",
  "Hot springs in Manikaran within ₹4000",
  "Riverside camping near Shivpuri under ₹2500",
  "Colonial architecture in Goa under ₹3000",
  "Forest stay in Wayanad under ₹5000",
  "Valley views in Munnar for 3 days under ₹6000",
  "Heritage walk in Ahmedabad under ₹1000",
  "Monastery visit in Leh under ₹8000",
  "Coral reefs in Lakshadweep for 4 days under ₹12000",
  "Rafting in Kolad under ₹2000",
  "National park in Ranthambore under ₹6000",
  "Stargazing in Spiti Valley under ₹7000",
  "Flower valley trek in Uttarakhand under ₹5000",
  "Yoga retreat in Rishikesh for 3 days under ₹4000",
];

const SHOW_COUNT = 5;
const NO_REPEAT_CYCLES = 10;

function pickSuggestions() {
  const storageKey = "tg_suggestion_history";
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(storageKey) || "[]");
  } catch { /* ignore */ }

  // IDs that must not appear (last NO_REPEAT_CYCLES * SHOW_COUNT shown)
  const recentLimit = NO_REPEAT_CYCLES * SHOW_COUNT;
  const blocked = new Set(history.slice(-recentLimit));

  // Available pool
  let available = SUGGESTION_POOL.filter((s) => !blocked.has(s));
  // If pool exhausted, allow all
  if (available.length < SHOW_COUNT) available = [...SUGGESTION_POOL];

  // Shuffle (Fisher-Yates) and pick
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  const picked = available.slice(0, SHOW_COUNT);

  // Update history
  history.push(...picked);
  // Trim to keep only what's needed
  if (history.length > recentLimit + SHOW_COUNT) {
    history = history.slice(-recentLimit);
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(history));
  } catch { /* quota exceeded — ignore */ }

  return picked;
}

const MotionBox = motion.create(Box);
const MotionPaper = motion.create(Paper);

export default function LandingPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [parsed, setParsed] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState(null);
  const [userLocation, setUserLocation] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [usingGPS, setUsingGPS] = useState(false);
  const [phcMode, setPhcMode] = useState(false);

  // Progressive wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState({
    budget: 5000,
    days: 2,
    groupSize: 1,
    categories: ["Nature"],
    travelMode: "car",
    guide: false,
  });

  // Pick 5 unique suggestions on mount (non-repeating across refreshes)
  const [suggestions] = useState(() => pickSuggestions());

  // Auto-detect user location on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lon: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address;
          const parts = [
            addr.city || addr.town || addr.county || "",
            addr.state || "",
          ].filter(Boolean);
          setUserLocation(parts.join(", ") || data.display_name);
        } catch {
          setUserLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } finally {
          setLoadingLocation(false);
        }
      },
      () => setLoadingLocation(false)
    );
  }, []);

  // Live-parse as user types
  useEffect(() => {
    if (query.trim().length > 2) {
      setParsed(parseQuery(query));
    } else {
      setParsed(null);
    }
  }, [query]);

  const handleSubmit = async () => {
    if (!query.trim()) return;
    const result = parseQuery(query);

    // Apply PHC toggle → force guide
    if (phcMode) {
      result.guide = true;
      result.phc = true;
    }

    // If missing essential fields → open wizard to fill them in
    const missing = [];
    if (!result.budget) missing.push("budget");
    if (!result.categories || result.categories.length === 0) missing.push("category");
    if (!result.days) missing.push("days");
    if (!result.travelMode) missing.push("travelMode");

    if (missing.length > 0 && (!result.categories || result.categories.length === 0)) {
      // Can't even guess category → fall back to wizard
      setWizardData((prev) => ({
        ...prev,
        budget: result.budget || prev.budget,
        days: result.days || prev.days,
        categories: result.categories?.length ? result.categories : prev.categories,
        travelMode: result.travelMode || prev.travelMode,
        guide: result.guide || phcMode || prev.guide,
      }));
      setWizardStep(0);
      setWizardOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      let finalCoords = coords;

      // Geocode the first destination (or multi-leg start)
      const destToGeocode = result.destinations[0] || result.destination;
      if (destToGeocode) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            destToGeocode
          )}&format=json&limit=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        if (data.length > 0) {
          finalCoords = {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
          };
        }
      }

      if (!finalCoords) {
        alert("Could not determine location. Please click the 📍 icon or include a place name in your query.");
        setSubmitting(false);
        return;
      }

      navigate("/results", {
        state: {
          latitude: finalCoords.lat,
          longitude: finalCoords.lon,
          budget: result.budget || 5000,
          category: (result.categories?.length ? result.categories : ["Nature"]).join(","),
          days: result.days || 2,
          groupSize: 1,
          travelMode: result.travelMode || "car",
          guide: result.guide || phcMode,
          phc: result.phc || phcMode,
          destinations: result.destinations,
        },
      });
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Wizard submit — fills in the blanks and navigates
  const handleWizardSubmit = async () => {
    setWizardOpen(false);
    setSubmitting(true);
    const result = parseQuery(query);
    try {
      let finalCoords = coords;
      const destToGeocode = result.destinations[0] || result.destination;
      if (destToGeocode) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            destToGeocode
          )}&format=json&limit=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        if (data.length > 0) {
          finalCoords = {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
          };
        }
      }
      if (!finalCoords) {
        alert("Could not determine location. Please click the 📍 icon or include a place name.");
        setSubmitting(false);
        return;
      }
      navigate("/results", {
        state: {
          latitude: finalCoords.lat,
          longitude: finalCoords.lon,
          budget: result.budget || wizardData.budget,
          category: (result.categories?.length ? result.categories : wizardData.categories).join(","),
          days: result.days || wizardData.days,
          groupSize: wizardData.groupSize,
          travelMode: result.travelMode || wizardData.travelMode,
          guide: result.guide || wizardData.guide || phcMode,
          phc: result.phc || phcMode,
          destinations: result.destinations,
        },
      });
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (text) => {
    setQuery(text);
    inputRef.current?.focus();
  };

  const handleGPSClick = () => {
    if (usingGPS) {
      setUsingGPS(false);
      return;
    }
    if (coords) {
      setUsingGPS(true);
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lon: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address;
          const parts = [
            addr.city || addr.town || addr.county || "",
            addr.state || "",
          ].filter(Boolean);
          setUserLocation(parts.join(", ") || data.display_name);
        } catch {
          setUserLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        } finally {
          setLoadingLocation(false);
          setUsingGPS(true);
        }
      },
      () => {
        setLoadingLocation(false);
        alert("Could not access your location. Please allow location access in your browser.");
      }
    );
  };

  const extractedTags = parsed
    ? [
        ...(parsed.destinations.length > 1
          ? [{ icon: <RouteIcon sx={{ fontSize: 14 }} />, label: parsed.destinations.join(" → "), color: "#0F766E" }]
          : parsed.destination
          ? [{ icon: <LocationOnIcon sx={{ fontSize: 14 }} />, label: parsed.destination, color: "#0F766E" }]
          : usingGPS && userLocation
          ? [{ icon: <MyLocationIcon sx={{ fontSize: 14 }} />, label: `Near: ${userLocation}`, color: "#0F766E" }]
          : []),
        parsed.budget && { icon: <AttachMoneyIcon sx={{ fontSize: 14 }} />, label: `₹${parsed.budget.toLocaleString("en-IN")}`, color: "#D97706" },
        parsed.categories?.length > 0 && { icon: <CategoryIcon sx={{ fontSize: 14 }} />, label: parsed.categories.join(", "), color: "#7C3AED" },
        parsed.days && { icon: <EventIcon sx={{ fontSize: 14 }} />, label: `${parsed.days} day${parsed.days > 1 ? "s" : ""}`, color: "#0EA5E9" },
        parsed.travelMode && { icon: <DirectionsBusIcon sx={{ fontSize: 14 }} />, label: parsed.travelMode, color: "#6366F1" },
        (parsed.guide || phcMode) && { icon: <PersonIcon sx={{ fontSize: 14 }} />, label: "Guide", color: "#F59E0B" },
        (parsed.phc || phcMode) && { icon: <AccessibleIcon sx={{ fontSize: 14 }} />, label: "Accessible", color: "#EC4899" },
      ].filter(Boolean)
    : [];

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        px: 2,
        background: isDark
          ? "radial-gradient(ellipse at 20% 50%, rgba(15,118,110,0.10) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(139,92,246,0.07) 0%, transparent 60%)"
          : "radial-gradient(ellipse at 30% 20%, rgba(15,118,110,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.04) 0%, transparent 50%)",
      }}
    >
      {/* Floating decorative blobs */}
      <motion.div
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: "10%", right: "10%", pointerEvents: "none" }}
      >
        <Box
          sx={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: isDark
              ? "rgba(20,184,166,0.04)"
              : "rgba(15,118,110,0.04)",
            filter: "blur(40px)",
          }}
        />
      </motion.div>
      <motion.div
        animate={{ y: [0, 15, 0], x: [0, -12, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", bottom: "15%", left: "8%", pointerEvents: "none" }}
      >
        <Box
          sx={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: isDark
              ? "rgba(245,158,11,0.03)"
              : "rgba(139,92,246,0.04)",
            filter: "blur(40px)",
          }}
        />
      </motion.div>

      {/* Hero content */}
      <Box sx={{ textAlign: "center", mb: 5, maxWidth: 680 }}>
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 4,
              background: "linear-gradient(135deg, #0F766E, #14B8A6)",
              mb: 3,
              boxShadow: "0 12px 32px rgba(15,118,110,0.3)",
            }}
          >
            <ExploreIcon sx={{ color: "#fff", fontSize: 34 }} />
          </Box>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              background: isDark
                ? "linear-gradient(135deg, #14B8A6, #FCD34D)"
                : "linear-gradient(135deg, #0F766E, #0EA5E9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
              fontSize: { xs: "1.8rem", sm: "2.5rem", md: "3rem" },
            }}
          >
            Where do you want to go?
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 480, mx: "auto", lineHeight: 1.6 }}
          >
            Describe your ideal trip in plain English — we'll find the best
            destinations, estimate costs, and check live weather & safety.
          </Typography>
        </motion.div>

        {/* Location badge */}
        {userLocation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Chip
              icon={usingGPS ? <MyLocationIcon sx={{ fontSize: 16 }} /> : <LocationOnIcon sx={{ fontSize: 16 }} />}
              label={usingGPS ? `Searching near: ${userLocation}` : `Your location: ${userLocation}`}
              size="small"
              clickable
              onClick={() => setUsingGPS(!usingGPS)}
              sx={{
                mt: 2,
                bgcolor: usingGPS
                  ? isDark ? "rgba(20,184,166,0.2)" : "rgba(15,118,110,0.12)"
                  : isDark ? "rgba(20,184,166,0.1)" : "rgba(15,118,110,0.06)",
                color: usingGPS ? "primary.main" : "text.secondary",
                border: usingGPS ? "1.5px solid" : "1.5px solid transparent",
                borderColor: usingGPS
                  ? isDark ? "rgba(20,184,166,0.4)" : "rgba(15,118,110,0.3)"
                  : "transparent",
                fontWeight: usingGPS ? 600 : 400,
                transition: "all 0.25s ease",
                "& .MuiChip-icon": { color: "primary.main" },
              }}
            />
          </motion.div>
        )}
      </Box>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        style={{ width: "100%", maxWidth: 680 }}
      >
        <MotionPaper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2.5,
            py: 1,
            borderRadius: 4,
            background: isDark
              ? "rgba(30,41,59,0.7)"
              : "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            border: "1.5px solid",
            borderColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.08)",
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.3)"
              : "0 8px 32px rgba(0,0,0,0.08)",
            transition: "border-color 0.25s ease, box-shadow 0.25s ease",
            "&:focus-within": {
              borderColor: "primary.main",
              boxShadow: isDark
                ? "0 8px 32px rgba(15,118,110,0.15)"
                : "0 8px 32px rgba(15,118,110,0.12)",
            },
          }}
        >
          <AutoAwesomeIcon
            sx={{
              mr: 1.5,
              color: "primary.light",
              fontSize: 22,
            }}
          />
          <InputBase
            inputRef={inputRef}
            placeholder={usingGPS ? `Explore near ${userLocation || "you"} — e.g. Temples under ₹5000` : "e.g. Temples in Jaipur under ₹5000 for 3 days..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            sx={{
              fontSize: "1.05rem",
              py: 0.8,
              "& ::placeholder": {
                color: "text.secondary",
                opacity: 0.6,
              },
            }}
          />
          <Tooltip title={usingGPS ? `Using: ${userLocation || "Current location"}` : "Use current location"}>
            <IconButton
              onClick={handleGPSClick}
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2.5,
                color: usingGPS ? "#fff" : coords ? "primary.main" : "text.disabled",
                background: usingGPS
                  ? "linear-gradient(135deg, #0F766E, #14B8A6)"
                  : "transparent",
                transition: "all 0.25s ease",
                "&:hover": {
                  background: usingGPS
                    ? "linear-gradient(135deg, #0D5D56, #0F766E)"
                    : isDark
                    ? "rgba(20,184,166,0.12)"
                    : "rgba(15,118,110,0.08)",
                },
              }}
            >
              {loadingLocation ? (
                <CircularProgress size={18} sx={{ color: usingGPS ? "#fff" : "primary.main" }} />
              ) : (
                <MyLocationIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>
          <Box
            sx={{
              width: "1px",
              height: 24,
              bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              mx: 0.5,
            }}
          />
          <IconButton
            onClick={handleSubmit}
            disabled={submitting || !query.trim()}
            sx={{
              ml: 1,
              width: 42,
              height: 42,
              borderRadius: 3,
              background:
                query.trim()
                  ? "linear-gradient(135deg, #0F766E, #14B8A6)"
                  : "transparent",
              color: query.trim() ? "#fff" : "text.disabled",
              transition: "all 0.25s ease",
              "&:hover": {
                background: query.trim()
                  ? "linear-gradient(135deg, #0D5D56, #0F766E)"
                  : "transparent",
              },
              "&.Mui-disabled": {
                color: "text.disabled",
              },
            }}
          >
            {submitting ? (
              <CircularProgress size={20} sx={{ color: "#fff" }} />
            ) : (
              <SendIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </MotionPaper>

        {/* Live-parsed tags */}
        <AnimatePresence>
          {extractedTags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 1.5, ml: 1, flexWrap: "wrap", gap: 0.5 }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", mr: 0.5, alignSelf: "center" }}
                >
                  Detected:
                </Typography>
                {extractedTags.map((tag) => (
                  <Chip
                    key={tag.label}
                    icon={tag.icon}
                    label={tag.label}
                    size="small"
                    sx={{
                      bgcolor: `${tag.color}15`,
                      color: tag.color,
                      border: `1px solid ${tag.color}30`,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      "& .MuiChip-icon": {
                        color: tag.color,
                      },
                    }}
                  />
                ))}
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Suggestion chips */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 3.5,
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 1,
            maxWidth: 680,
          }}
        >
          {suggestions.map((s) => (
            <motion.div
              key={s}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              <Chip
                icon={<FlightTakeoffIcon sx={{ fontSize: 14 }} />}
                label={s}
                clickable
                onClick={() => handleSuggestionClick(s)}
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: 3,
                  borderColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                  color: "text.secondary",
                  fontSize: "0.78rem",
                  transition: "all 0.22s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    color: "primary.main",
                    bgcolor: isDark
                      ? "rgba(20,184,166,0.08)"
                      : "rgba(15,118,110,0.04)",
                  },
                }}
              />
            </motion.div>
          ))}
        </Stack>
      </motion.div>

      {/* PHC toggle + Footer hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 3 }}>
          <Tooltip title="Enable accessible mode — guide will be assigned automatically" arrow>
            <FormControlLabel
              control={
                <Switch
                  checked={phcMode}
                  onChange={() => setPhcMode(!phcMode)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#EC4899" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#DB2777" },
                  }}
                />
              }
              label={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <AccessibleIcon sx={{ fontSize: 18, color: phcMode ? "#EC4899" : "text.secondary" }} />
                  <Typography variant="body2" sx={{ color: phcMode ? "#EC4899" : "text.secondary", fontWeight: phcMode ? 600 : 400 }}>
                    Accessible / PHC
                  </Typography>
                </Stack>
              }
            />
          </Tooltip>
        </Stack>
      </motion.div>

      {/* Footer hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 2, opacity: 0.5 }}
        >
          Press Enter to search &middot; or use the detailed form at{" "}
          <Box
            component="span"
            sx={{
              cursor: "pointer",
              textDecoration: "underline",
              "&:hover": { color: "primary.main" },
            }}
            onClick={() => navigate("/search")}
          >
            /search
          </Box>
        </Typography>
      </motion.div>

      {/* ── Progressive Wizard Dialog ──────────────────────────────────── */}
      <Dialog
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: isDark ? "#1e293b" : "#fff",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ✨ Complete Your Trip Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We need a few more details to find the best destinations for you.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stepper activeStep={wizardStep} alternativeLabel sx={{ mb: 3 }}>
            {["Budget", "Duration", "Group Size", "Category", "Transport", "Preferences"].map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 0: Budget */}
          {wizardStep === 0 && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                What's your budget? (₹)
              </Typography>
              <Slider
                value={wizardData.budget}
                onChange={(e, val) => setWizardData((p) => ({ ...p, budget: val }))}
                min={500}
                max={50000}
                step={500}
                valueLabelDisplay="on"
                valueLabelFormat={(v) => `₹${v.toLocaleString("en-IN")}`}
                sx={{ mx: "auto", maxWidth: 400 }}
              />
              <TextField
                type="number"
                value={wizardData.budget}
                onChange={(e) => setWizardData((p) => ({ ...p, budget: Math.max(500, parseInt(e.target.value) || 500) }))}
                size="small"
                sx={{ mt: 2, width: 160 }}
                slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5 }}>₹</Typography> } }}
              />
            </Box>
          )}

          {/* Step 1: Days */}
          {wizardStep === 1 && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                How many days?
              </Typography>
              <ToggleButtonGroup
                value={wizardData.days}
                exclusive
                onChange={(e, val) => val && setWizardData((p) => ({ ...p, days: val }))}
                sx={{ flexWrap: "wrap", justifyContent: "center" }}
              >
                {[1, 2, 3, 4, 5, 7, 10, 14].map((d) => (
                  <ToggleButton key={d} value={d} sx={{ px: 3 }}>
                    {d} {d === 1 ? "day" : "days"}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}

          {/* Step 2: Group Size */}
          {wizardStep === 2 && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                How many people in your group?
              </Typography>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={3}>
                <GroupIcon sx={{ fontSize: 40, color: "primary.main" }} />
                <ToggleButtonGroup
                  value={wizardData.groupSize}
                  exclusive
                  onChange={(e, val) => val && setWizardData((p) => ({ ...p, groupSize: val }))}
                  sx={{ flexWrap: "wrap", justifyContent: "center" }}
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                    <ToggleButton key={n} value={n} sx={{ px: 3 }}>
                      {n} {n === 1 ? "Solo" : n === 2 ? "Couple" : "People"}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>
              <TextField
                type="number"
                label="Custom group size"
                value={wizardData.groupSize}
                onChange={(e) => setWizardData((p) => ({ ...p, groupSize: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)) }))}
                size="small"
                sx={{ mt: 2, width: 180 }}
                slotProps={{ input: { inputProps: { min: 1, max: 50 } } }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Costs like food, entry & activities scale per person. Transport is shared.
              </Typography>
            </Box>
          )}

          {/* Step 3: Category */}
          {wizardStep === 3 && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                What kind of places?
              </Typography>
              <ToggleButtonGroup
                value={wizardData.categories}
                onChange={(e, val) => {
                  if (val.length > 0) setWizardData((p) => ({ ...p, categories: val }));
                }}
                sx={{ flexWrap: "wrap", justifyContent: "center", gap: 1 }}
              >
                {["Temples", "Nature", "Beaches", "Monuments", "Malls", "Forts", "Palaces", "Museums", "Lakes", "Waterfalls", "Wildlife", "Adventure", "Hill Stations", "Caves", "Gardens", "Ruins"].map((c) => (
                  <ToggleButton key={c} value={c} sx={{ px: 2.5, borderRadius: "20px !important", fontSize: "0.82rem" }}>
                    {c}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          )}

          {/* Step 4: Transport */}
          {wizardStep === 4 && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Mode of transport?
              </Typography>
              <ToggleButtonGroup
                value={wizardData.travelMode}
                exclusive
                onChange={(e, val) => val && setWizardData((p) => ({ ...p, travelMode: val }))}
                sx={{ flexWrap: "wrap", justifyContent: "center", gap: 1 }}
              >
                <ToggleButton value="bus"><DirectionsBusIcon sx={{ mr: 0.5 }} /> Bus</ToggleButton>
                <ToggleButton value="train"><TrainIcon sx={{ mr: 0.5 }} /> Train</ToggleButton>
                <ToggleButton value="plane"><FlightIcon sx={{ mr: 0.5 }} /> Flight</ToggleButton>
                <ToggleButton value="car"><DirectionsCarIcon sx={{ mr: 0.5 }} /> Own Vehicle / Cab</ToggleButton>
              </ToggleButtonGroup>
              {wizardData.travelMode === "car" && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  Fuel costs will be estimated based on distance
                </Typography>
              )}
            </Box>
          )}

          {/* Step 5: Preferences */}
          {wizardStep === 5 && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Additional preferences
              </Typography>
              <Stack spacing={2} alignItems="center">
                <FormControlLabel
                  control={
                    <Switch
                      checked={wizardData.guide || phcMode}
                      onChange={() => setWizardData((p) => ({ ...p, guide: !p.guide }))}
                      disabled={phcMode}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <PersonIcon sx={{ fontSize: 18 }} />
                      <span>Personal Guide {phcMode ? "(required for PHC)" : "(+₹500/place)"}</span>
                    </Stack>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={phcMode}
                      onChange={() => setPhcMode(!phcMode)}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <AccessibleIcon sx={{ fontSize: 18 }} />
                      <span>Accessible / PHC mode</span>
                    </Stack>
                  }
                />
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: "space-between" }}>
          <Button
            disabled={wizardStep === 0}
            onClick={() => setWizardStep((s) => s - 1)}
          >
            Back
          </Button>
          <Box>
            {wizardStep < 5 ? (
              <Button
                variant="contained"
                onClick={() => setWizardStep((s) => s + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleWizardSubmit}
                startIcon={<ExploreIcon />}
              >
                Find Destinations
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
