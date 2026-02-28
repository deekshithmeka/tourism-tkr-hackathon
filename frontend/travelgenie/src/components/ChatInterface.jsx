import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Chip,
  Stack,
  Paper,
  InputAdornment,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ExploreIcon from "@mui/icons-material/Explore";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";

const categories = [
  { label: "Temples", icon: "🛕" },
  { label: "Nature", icon: "🌿" },
  { label: "Malls", icon: "🛍️" },
  { label: "Beaches", icon: "🏖️" },
  { label: "Monuments", icon: "🏛️" },
  { label: "Forts", icon: "🏰" },
  { label: "Palaces", icon: "👑" },
  { label: "Museums", icon: "🏛️" },
  { label: "Lakes", icon: "🌊" },
  { label: "Waterfalls", icon: "💧" },
  { label: "Wildlife", icon: "🦁" },
  { label: "Adventure", icon: "🧗" },
  { label: "Pilgrimage", icon: "🙏" },
  { label: "Hill Stations", icon: "⛰️" },
  { label: "Caves", icon: "🗺️" },
  { label: "Gardens", icon: "🌻" },
];

const MotionPaper = motion.create(Paper);

function ChatInterface() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState(null);       // { lat, lon }
  const [locationEdited, setLocationEdited] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [budget, setBudget] = useState("");
  const [categories, setCategories] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Auto-fetch user location and reverse geocode to a readable name
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address;
          const parts = [
            addr.suburb || addr.neighbourhood || addr.village || "",
            addr.city || addr.town || addr.county || "",
            addr.state || "",
          ].filter(Boolean);
          setLocation(parts.join(", ") || data.display_name);
          setCoords({ lat: latitude, lon: longitude });
        } catch {
          setLocation(`${latitude}, ${longitude}`);
          setCoords({ lat: latitude, lon: longitude });
        } finally {
          setLoadingLocation(false);
        }
      },
      () => setLoadingLocation(false)
    );
  }, []);

  const handleSubmit = async () => {
    if (!location || !budget || categories.length === 0) return;
    setSubmitting(true);
    try {
      let finalCoords = coords;
      // Forward-geocode if user typed/edited the location
      if (!finalCoords || locationEdited) {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            location
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
        alert("Could not detect your location. Please enter a valid place.");
        return;
      }
      navigate("/results", {
        state: {
          latitude: finalCoords.lat,
          longitude: finalCoords.lon,
          budget: parseInt(budget, 10),
          category: categories.join(","),
        },
      });
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        py: 6,
        background: isDark
          ? "radial-gradient(ellipse at 20% 50%, rgba(15,118,110,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(139,92,246,0.1) 0%, transparent 60%)"
          : "linear-gradient(160deg, #0F766E 0%, #0EA5E9 40%, #8B5CF6 70%, #EC4899 100%)",
      }}
    >
      {/* Decorative blobs */}
      <motion.div
        animate={{ y: [0, -15, 0], x: [0, 8, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: -60, right: -60 }}
      >
        <Box
          sx={{
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: isDark
              ? "rgba(20,184,166,0.06)"
              : "rgba(255,255,255,0.08)",
          }}
        />
      </motion.div>
      <motion.div
        animate={{ y: [0, 12, 0], x: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", bottom: -40, left: -40 }}
      >
        <Box
          sx={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: isDark
              ? "rgba(245,158,11,0.05)"
              : "rgba(255,255,255,0.06)",
          }}
        />
      </motion.div>

      <MotionPaper
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        elevation={0}
        sx={{
          p: { xs: 3, sm: 5 },
          width: "92%",
          maxWidth: 560,
          borderRadius: 5,
          position: "relative",
          zIndex: 1,
          background: isDark
            ? "rgba(30,41,59,0.85)"
            : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(24px)",
          border: "1px solid",
          borderColor: isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(255,255,255,0.6)",
          boxShadow: isDark
            ? "0 25px 60px -12px rgba(0,0,0,0.5)"
            : "0 25px 60px -12px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          >
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: 3,
                background: "linear-gradient(135deg, #0F766E, #14B8A6)",
                mb: 2,
                boxShadow: "0 8px 24px rgba(15,118,110,0.3)",
              }}
            >
              <ExploreIcon sx={{ color: "#fff", fontSize: 30 }} />
            </Box>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <Typography
              variant="h4"
              sx={{
                background: isDark
                  ? "linear-gradient(135deg, #14B8A6, #FCD34D)"
                  : "linear-gradient(135deg, #0F172A, #334155)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 0.5,
              }}
            >
              Plan Your Trip
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tell us your preferences — we'll do the rest
            </Typography>
          </motion.div>
        </Box>

        <Stack spacing={2.5}>
          {/* Location */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <TextField
              label="Your Current Location"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setLocationEdited(true);
              }}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnIcon sx={{ color: "primary.main" }} />
                  </InputAdornment>
                ),
                endAdornment: loadingLocation ? (
                  <InputAdornment position="end">
                    <CircularProgress size={18} />
                  </InputAdornment>
                ) : null,
              }}
            />
          </motion.div>

          {/* Budget */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <TextField
              label="Your Budget (₹)"
              value={budget}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d+$/.test(val)) setBudget(val);
              }}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountBalanceWalletIcon sx={{ color: "primary.main" }} />
                  </InputAdornment>
                ),
              }}
            />
          </motion.div>

          {/* Category pills */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1.5, color: "text.secondary" }}
              >
                What are you looking for?
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {categories.map((cat, i) => (
                  <motion.div
                    key={cat.label}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Chip
                      label={`${cat.icon}  ${cat.label}`}
                      clickable
                      onClick={() => setCategories((prev) =>
                        prev.includes(cat.label)
                          ? prev.filter((c) => c !== cat.label)
                          : [...prev, cat.label]
                      )}
                      sx={{
                        px: 1.5,
                        py: 2.5,
                        fontSize: "0.85rem",
                        borderRadius: 3,
                        border: "2px solid",
                        borderColor:
                          categories.includes(cat.label) ? "primary.main" : "transparent",
                        bgcolor:
                          categories.includes(cat.label)
                            ? "primary.main"
                            : isDark
                            ? "rgba(20,184,166,0.08)"
                            : "rgba(15,118,110,0.05)",
                        color:
                          categories.includes(cat.label) ? "#fff" : "text.primary",
                        transition: "all 0.25s ease",
                        "&:hover": {
                          bgcolor:
                            categories.includes(cat.label)
                              ? "primary.dark"
                              : isDark
                              ? "rgba(20,184,166,0.15)"
                              : "rgba(15,118,110,0.1)",
                        },
                      }}
                    />
                  </motion.div>
                ))}
              </Stack>
            </Box>
          </motion.div>

          {/* Date row */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon sx={{ color: "primary.main" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonthIcon sx={{ color: "primary.main" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </motion.div>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={submitting || !location || !budget || categories.length === 0}
                startIcon={
                  submitting ? (
                    <CircularProgress size={20} sx={{ color: "#fff" }} />
                  ) : (
                    <FlightTakeoffIcon />
                  )
                }
                fullWidth
                sx={{ mt: 1, py: 1.6, fontSize: "1.05rem" }}
              >
                {submitting ? "Finding destinations…" : "Plan My Trip"}
              </Button>
            </motion.div>
          </motion.div>
        </Stack>
      </MotionPaper>
    </Box>
  );
}

export default ChatInterface;