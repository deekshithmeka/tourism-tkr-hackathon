import React, { useState } from "react";
import { CircularProgress, Link, Tooltip } from "@mui/material";
import {
  Button,
  Drawer,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CardMedia,
  Stack,
  IconButton,
  useTheme,
  Collapse,
} from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import PhoneIcon from "@mui/icons-material/Phone";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonIcon from "@mui/icons-material/Person";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { motion } from "framer-motion";

function getSafetyColor(score) {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "error";
}

function getAQIColor(aqi) {
  if (aqi <= 50) return "success";
  if (aqi <= 100) return "warning";
  return "error";
}

function getCrowdIcon(crowd) {
  if (crowd === "Low") return "🟢";
  if (crowd === "Moderate") return "🟡";
  return "🔴";
}

function DestinationCard({ place, guide, isInTrip, onAddToTrip, onRemoveFromTrip }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [open, setOpen] = useState(false);
  const [transportExpanded, setTransportExpanded] = useState(false);

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        overflow: "hidden",
        border: "1.5px solid",
        borderColor: isInTrip
          ? "primary.main"
          : isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.08)",
        bgcolor: isDark ? "rgba(30,41,59,0.6)" : "#fff",
        boxShadow: isDark
          ? "0 2px 12px rgba(0,0,0,0.3)"
          : "0 2px 12px rgba(0,0,0,0.06)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "default",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: isDark
            ? "0 12px 36px rgba(0,0,0,0.5)"
            : "0 12px 36px rgba(0,0,0,0.1)",
          borderColor: isDark
            ? "rgba(20,184,166,0.25)"
            : "rgba(15,118,110,0.2)",
        },
      }}
    >
      {/* Image section */}
      <Box sx={{ position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <CardMedia
          component="img"
          height="200"
          image={place.image}
          alt={place.name}
          sx={{ objectFit: "cover" }}
        />

        {/* Add / Remove trip button */}
        <Box position="absolute" top={10} left={10} zIndex={2}>
          <Tooltip title={isInTrip ? "Remove from trip" : "Add to trip"} arrow>
            <IconButton
              onClick={() =>
                isInTrip
                  ? onRemoveFromTrip?.(place.name)
                  : onAddToTrip?.(place)
              }
              sx={{
                bgcolor: isInTrip
                  ? "rgba(239,68,68,0.9)"
                  : "rgba(15,118,110,0.9)",
                color: "#fff",
                backdropFilter: "blur(8px)",
                width: 36,
                height: 36,
                transition: "all 0.25s ease",
                "&:hover": {
                  bgcolor: isInTrip
                    ? "rgba(220,38,38,1)"
                    : "rgba(13,93,86,1)",
                  transform: "scale(1.1)",
                },
              }}
            >
              {isInTrip ? (
                <RemoveCircleOutlineIcon sx={{ fontSize: 20 }} />
              ) : (
                <AddCircleOutlineIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Safety score badge */}
        <Box
          position="absolute"
          top={10}
          right={10}
          bgcolor="background.paper"
          borderRadius="50%"
          p={0.6}
          boxShadow={2}
          sx={{ lineHeight: 0 }}
        >
          <Box position="relative" display="inline-flex">
            <CircularProgress
              variant="determinate"
              value={place.safetyScore}
              size={48}
              thickness={4}
              color={getSafetyColor(place.safetyScore)}
            />
            <Box
              position="absolute"
              top={0} left={0} bottom={0} right={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, fontSize: "0.7rem" }}
              >
                {place.safetyScore}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Gradient overlay */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "55%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
            pointerEvents: "none",
          }}
        />
        <Box sx={{ position: "absolute", bottom: 12, left: 16, right: 16 }}>
          <Typography
            variant="h6"
            sx={{
              color: "#fff",
              textShadow: "0 1px 6px rgba(0,0,0,0.5)",
              fontSize: "1.05rem",
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {place.name}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5} mt={0.3}>
            <PlaceIcon sx={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }} />
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.78rem" }}
            >
              {place.distance} km away
            </Typography>
          </Stack>
        </Box>
      </Box>

      <CardContent
        sx={{
          p: 2,
          pb: "16px !important",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        {/* Metric chips */}
        <Box display="flex" gap={0.5} flexWrap="wrap" mb={1.5}>
          <Chip
            size="small"
            label={`Safety ${place.safetyScore}`}
            color={getSafetyColor(place.safetyScore)}
            variant="outlined"
            sx={{ fontSize: "0.72rem", height: 24, borderWidth: 1.5 }}
          />
          <Chip
            size="small"
            label={`AQI ${place.aqi}`}
            color={getAQIColor(place.aqi)}
            variant="outlined"
            sx={{ fontSize: "0.72rem", height: 24, borderWidth: 1.5 }}
          />
          <Chip
            size="small"
            label={`${getCrowdIcon(place.crowd)} ${place.crowd}`}
            sx={{
              fontSize: "0.72rem",
              height: 24,
              bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
            }}
          />
          <Chip
            size="small"
            label={`☀️ ${place.weather}`}
            sx={{
              fontSize: "0.72rem",
              height: 24,
              bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
            }}
          />
        </Box>

        {/* Cost badge */}
        <Box
          sx={{
            py: 1,
            px: 1.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: isDark
              ? "rgba(20,184,166,0.12)"
              : "rgba(15,118,110,0.1)",
            background: isDark
              ? "rgba(20,184,166,0.06)"
              : "rgba(15,118,110,0.03)",
            mb: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
            <CurrencyRupeeIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="subtitle1" sx={{ color: "primary.main" }}>
              {place.estimatedCost.toLocaleString("en-IN")}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 0.5, fontSize: "0.8rem" }}
            >
              total
            </Typography>
          </Box>
          {/* Cost breakdown row */}
          {place.costBreakdown && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              <Chip
                label={`🚗 ₹${place.costBreakdown.travel}`}
                size="small"
                sx={{ fontSize: "0.65rem", height: 20, bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
              />
              <Chip
                label={`🎟️ ₹${place.costBreakdown.entry}`}
                size="small"
                sx={{ fontSize: "0.65rem", height: 20, bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
              />
              <Chip
                label={`🍽️ ₹${place.costBreakdown.food}`}
                size="small"
                sx={{ fontSize: "0.65rem", height: 20, bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
              />
              {place.costBreakdown.guide > 0 && (
                <Chip
                  label={`👤 ₹${place.costBreakdown.guide}`}
                  size="small"
                  sx={{ fontSize: "0.65rem", height: 20, bgcolor: "rgba(245,158,11,0.08)" }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Guide badge */}
        {guide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1.5,
                py: 0.8,
                px: 1.5,
                borderRadius: 2,
                bgcolor: isDark
                  ? "rgba(245,158,11,0.06)"
                  : "rgba(245,158,11,0.04)",
                border: "1px solid",
                borderColor: isDark
                  ? "rgba(245,158,11,0.12)"
                  : "rgba(245,158,11,0.1)",
              }}
            >
              <PersonIcon sx={{ fontSize: 16, color: "secondary.main" }} />
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "0.78rem" }}>
                Guide Available (4+ yrs)
              </Typography>
            </Box>
          </motion.div>
        )}

        {/* Transport Options with availability */}
        {place.transportAlternatives && place.transportAlternatives.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Box
              onClick={() => setTransportExpanded(!transportExpanded)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                py: 0.5,
                "&:hover": { opacity: 0.8 },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontSize: "0.65rem",
                }}
              >
                🚆 Transport Options & Availability
              </Typography>
              <ExpandMoreIcon
                sx={{
                  fontSize: 18,
                  color: "text.secondary",
                  transition: "transform 0.3s",
                  transform: transportExpanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </Box>

            {/* Collapsed summary: quick chips */}
            {!transportExpanded && (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                {place.transportAlternatives.map((t) => (
                  <Chip
                    key={t.mode}
                    label={`${t.mode === "bus" ? "🚌" : t.mode === "train" ? "🚂" : t.mode === "plane" ? "✈️" : "🚗"} ₹${t.one_way}`}
                    size="small"
                    sx={{
                      fontSize: "0.65rem",
                      height: 22,
                      bgcolor: t.recommended
                        ? isDark ? "rgba(20,184,166,0.12)" : "rgba(15,118,110,0.08)"
                        : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                      border: t.recommended ? "1px solid" : "none",
                      borderColor: t.recommended ? "primary.main" : "transparent",
                      fontWeight: t.recommended ? 700 : 400,
                    }}
                  />
                ))}
              </Stack>
            )}

            {/* Expanded: full details per mode */}
            <Collapse in={transportExpanded} timeout="auto">
              <Stack spacing={1} sx={{ mt: 1 }}>
                {place.transportAlternatives.map((t) => (
                  <Box
                    key={t.mode}
                    sx={{
                      p: 1.2,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: t.recommended
                        ? "primary.main"
                        : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                      bgcolor: t.recommended
                        ? isDark ? "rgba(20,184,166,0.08)" : "rgba(15,118,110,0.04)"
                        : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                    }}
                  >
                    {/* Mode header */}
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <Typography sx={{ fontSize: "1.1rem" }}>
                          {t.mode === "bus" ? "🚌" : t.mode === "train" ? "🚂" : t.mode === "plane" ? "✈️" : "🚗"}
                        </Typography>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.8rem", lineHeight: 1.2 }}>
                            {t.label}
                          </Typography>
                          {t.recommended && (
                            <Chip
                              label="Recommended"
                              size="small"
                              color="primary"
                              sx={{ height: 16, fontSize: "0.55rem", fontWeight: 700, mt: 0.2 }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main", fontSize: "0.85rem" }}>
                          ₹{t.one_way.toLocaleString("en-IN")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem" }}>
                          one-way
                        </Typography>
                      </Box>
                    </Box>

                    {/* Duration & Frequency */}
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 0.8 }}>
                      <Chip
                        label={`⏱ ${t.estimated_hours}h travel`}
                        size="small"
                        sx={{ fontSize: "0.62rem", height: 20, bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                      />
                      <Chip
                        label={`🔄 ${t.frequency}`}
                        size="small"
                        sx={{ fontSize: "0.62rem", height: 20, bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                      />
                      <Chip
                        label={`↔ ₹${t.round_trip.toLocaleString("en-IN")} round trip`}
                        size="small"
                        sx={{ fontSize: "0.62rem", height: 20, bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                      />
                    </Box>

                    {/* Availability note */}
                    {t.availability && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mb: 0.5,
                          fontSize: "0.65rem",
                          color: isDark ? "rgba(20,184,166,0.9)" : "#0F766E",
                          fontWeight: 500,
                          fontStyle: "italic",
                        }}
                      >
                        📋 {t.availability}
                      </Typography>
                    )}

                    {/* Fuel info for car */}
                    {t.fuel_litres && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, fontSize: "0.62rem" }}>
                        ⛽ ~{t.fuel_litres}L fuel ({Math.round(t.fuel_litres * 105)} est.)
                      </Typography>
                    )}

                    {/* Booking links */}
                    {t.booking_links && t.booking_links.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {t.booking_links.map((link) => (
                          <Chip
                            key={link.label}
                            label={link.label}
                            component="a"
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            clickable
                            size="small"
                            icon={<OpenInNewIcon sx={{ fontSize: "10px !important" }} />}
                            sx={{
                              fontSize: "0.6rem",
                              height: 22,
                              bgcolor: isDark ? "rgba(14,165,233,0.06)" : "rgba(14,165,233,0.04)",
                              color: isDark ? "#38BDF8" : "#0369A1",
                              border: "1px solid",
                              borderColor: isDark ? "rgba(14,165,233,0.12)" : "rgba(14,165,233,0.1)",
                              "&:hover": {
                                bgcolor: isDark ? "rgba(14,165,233,0.15)" : "rgba(14,165,233,0.1)",
                              },
                            }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                ))}
              </Stack>
            </Collapse>
          </Box>
        )}

        {/* Related links */}
        {place.links && place.links.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontSize: "0.65rem",
              }}
            >
              Explore More
            </Typography>
            <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {place.links.map((link) => (
                <Chip
                  key={link.label}
                  label={link.label}
                  component="a"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                  size="small"
                  icon={<OpenInNewIcon sx={{ fontSize: "12px !important" }} />}
                  sx={{
                    fontSize: "0.7rem",
                    height: 26,
                    bgcolor: isDark
                      ? "rgba(14,165,233,0.06)"
                      : "rgba(14,165,233,0.04)",
                    color: isDark ? "#38BDF8" : "#0369A1",
                    border: "1px solid",
                    borderColor: isDark
                      ? "rgba(14,165,233,0.12)"
                      : "rgba(14,165,233,0.1)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: isDark
                        ? "rgba(14,165,233,0.12)"
                        : "rgba(14,165,233,0.08)",
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Emergency button */}
        <Box mt="auto" pt={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setOpen(true)}
            startIcon={<InfoOutlinedIcon sx={{ fontSize: "16px !important" }} />}
            fullWidth
            sx={{
              fontSize: "0.78rem",
              py: 0.8,
              borderRadius: 2,
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.08)",
              color: "text.secondary",
              "&:hover": {
                borderColor: "primary.main",
                color: "primary.main",
                bgcolor: isDark
                  ? "rgba(20,184,166,0.06)"
                  : "rgba(15,118,110,0.03)",
              },
            }}
          >
            Emergency Info
          </Button>
        </Box>

        {/* Emergency Drawer */}
        <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
          <Box
            sx={{
              width: 340,
              p: 3.5,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6">Emergency Info</Typography>
              <IconButton
                onClick={() => setOpen(false)}
                size="small"
                sx={{
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.04)",
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.04em" }}>
              Near {place.name}
            </Typography>

            <Stack spacing={2}>
              {/* Hospitals */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <LocalHospitalIcon sx={{ color: "#EF4444", fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Hospitals</Typography>
                </Box>
                {place.emergency?.hospitals?.length > 0 ? (
                  <Stack spacing={1}>
                    {place.emergency.hospitals.map((h, idx) => (
                      <Box
                        key={idx}
                        component="a"
                        href={`https://www.google.com/maps/search/?api=1&query=${h.lat},${h.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2.5,
                          textDecoration: "none",
                          bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                          border: "1px solid",
                          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#EF4444",
                            bgcolor: isDark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.04)",
                          },
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.3 }} noWrap>
                            {h.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {h.distance_km} km away
                          </Typography>
                        </Box>
                        <OpenInNewIcon sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0 }} />
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                    No hospitals found nearby
                  </Typography>
                )}
              </Box>

              {/* Police */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <LocalPoliceIcon sx={{ color: "#3B82F6", fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Police Stations</Typography>
                </Box>
                {place.emergency?.police?.length > 0 ? (
                  <Stack spacing={1}>
                    {place.emergency.police.map((p, idx) => (
                      <Box
                        key={idx}
                        component="a"
                        href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2.5,
                          textDecoration: "none",
                          bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                          border: "1px solid",
                          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: "#3B82F6",
                            bgcolor: isDark ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.04)",
                          },
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", lineHeight: 1.3 }} noWrap>
                            {p.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {p.distance_km} km away
                          </Typography>
                        </Box>
                        <OpenInNewIcon sx={{ fontSize: 14, color: "text.secondary", flexShrink: 0 }} />
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                    No police stations found nearby
                  </Typography>
                )}
              </Box>

              {/* Helpline */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: isDark ? "rgba(15,118,110,0.06)" : "rgba(15,118,110,0.03)",
                  border: "1px solid",
                  borderColor: isDark ? "rgba(20,184,166,0.12)" : "rgba(15,118,110,0.08)",
                }}
              >
                <PhoneIcon sx={{ color: "#0F766E", fontSize: 24 }} />
                <Box>
                  <Typography variant="subtitle2">Emergency Helpline</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                    112
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Drawer>
      </CardContent>
    </Card>
  );
}

export default DestinationCard;
