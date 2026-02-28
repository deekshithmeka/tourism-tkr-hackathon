import React from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  Link,
  useTheme,
  Tooltip,
  IconButton,
} from "@mui/material";
import HotelIcon from "@mui/icons-material/Hotel";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PlaceIcon from "@mui/icons-material/Place";
import EventIcon from "@mui/icons-material/Event";
import SavingsIcon from "@mui/icons-material/Savings";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { motion } from "framer-motion";

export default function ItineraryTable({ itinerary, transport, guide }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
    return null;
  }

  const { days, total_cost, accommodation_cost, food_cost, travel_cost, guide_cost } = itinerary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
          bgcolor: isDark ? "rgba(30,41,59,0.5)" : "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          overflow: "hidden",
          mb: 4,
        }}
      >
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(135deg, #0F766E, #0EA5E9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 1,
            }}
          >
            Day-by-Day Itinerary
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Chip icon={<SavingsIcon sx={{ fontSize: 16 }} />} label={`Total: ₹${total_cost?.toLocaleString("en-IN")}`} size="small" color="primary" />
            <Chip icon={<HotelIcon sx={{ fontSize: 16 }} />} label={`Stay: ₹${accommodation_cost?.toLocaleString("en-IN")}`} size="small" variant="outlined" />
            <Chip icon={<RestaurantIcon sx={{ fontSize: 16 }} />} label={`Food: ₹${food_cost?.toLocaleString("en-IN")}`} size="small" variant="outlined" />
            {guide_cost > 0 && <Chip label={`Guide: ₹${guide_cost?.toLocaleString("en-IN")}`} size="small" variant="outlined" />}
          </Stack>
        </Box>

        {/* Transport info */}
        {transport && (
          <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="subtitle2" color="text.secondary">
                Transport: {transport.label}
              </Typography>
              <Chip label={`₹${transport.one_way?.toLocaleString("en-IN")} one-way`} size="small" color="info" variant="outlined" />
              {transport.fuel_litres && (
                <Chip label={`Fuel: ${transport.fuel_litres}L · ₹${transport.fuel_cost?.toLocaleString("en-IN")}`} size="small" variant="outlined" />
              )}
              {transport.booking_links?.map((link, i) => (
                <Link key={i} href={link.url} target="_blank" rel="noopener" underline="hover" sx={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 0.3 }}>
                  {link.label} <OpenInNewIcon sx={{ fontSize: 14 }} />
                </Link>
              ))}
            </Stack>
          </Box>
        )}

        {/* Guide info */}
        {guide && (
          <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="subtitle2" color="text.secondary">
                Guide: {guide.name}
              </Typography>
              <Chip label={guide.phone} size="small" variant="outlined" />
              <Chip label={`${guide.experience_years} yrs exp`} size="small" variant="outlined" />
              <Chip label={`Rating: ${guide.rating}/5`} size="small" color="success" variant="outlined" />
              {guide.phc_trained && <Chip label="PHC Trained" size="small" color="secondary" />}
            </Stack>
          </Box>
        )}

        {/* Day-by-day table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? "rgba(15,118,110,0.08)" : "rgba(15,118,110,0.04)" }}>
                <TableCell sx={{ fontWeight: 700, width: 120 }}>Day</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Destinations</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Hotel</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Meals</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: "right", width: 100 }}>Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {days.map((day, idx) => (
                <TableRow
                  key={day.day}
                  sx={{
                    bgcolor: day.is_buffer
                      ? isDark ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)"
                      : "transparent",
                    "&:hover": {
                      bgcolor: isDark ? "rgba(20,184,166,0.06)" : "rgba(15,118,110,0.03)",
                    },
                  }}
                >
                  {/* Day column */}
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <EventIcon sx={{ fontSize: 16, color: day.is_buffer ? "#F59E0B" : "primary.main" }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {day.label}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {day.date}
                      </Typography>
                      {day.is_buffer && (
                        <Chip
                          icon={<WarningAmberIcon sx={{ fontSize: 14 }} />}
                          label="Buffer"
                          size="small"
                          sx={{ bgcolor: "rgba(245,158,11,0.15)", color: "#D97706", fontWeight: 600, width: "fit-content" }}
                        />
                      )}
                    </Stack>
                  </TableCell>

                  {/* Destinations column */}
                  <TableCell>
                    {day.destinations.length > 0 ? (
                      <Stack spacing={1}>
                        {day.destinations.map((dest, di) => (
                          <Box key={di} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <PlaceIcon sx={{ fontSize: 16, color: "primary.main" }} />
                            <Box>
                              <Link 
                                href={dest.maps_link} 
                                target="_blank" 
                                rel="noopener" 
                                underline="hover"
                                sx={{ fontWeight: 600, fontSize: "0.85rem" }}
                              >
                                {dest.name}
                              </Link>
                              {dest.weather && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                  {dest.weather} {dest.temperature != null && `· ${dest.temperature}°C`}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                        {day.is_buffer ? "Rest / Emergency buffer" : "—"}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Hotel column */}
                  <TableCell>
                    {day.hotel ? (
                      <Box>
                        <Link
                          href={day.hotel.maps_link}
                          target="_blank"
                          rel="noopener"
                          underline="hover"
                          sx={{ fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 0.3 }}
                        >
                          <HotelIcon sx={{ fontSize: 14 }} /> {day.hotel.name}
                        </Link>
                        <Typography variant="caption" color="text.secondary">
                          ₹{day.hotel.estimated_rate?.toLocaleString("en-IN")}/night · {day.hotel.distance_km} km
                        </Typography>
                        {day.hotel.phone && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            📞 {day.hotel.phone}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>

                  {/* Meals column */}
                  <TableCell>
                    <Stack spacing={0.5}>
                      {day.meals?.lunch && (
                        <Link
                          href={day.meals.lunch.maps_link}
                          target="_blank"
                          rel="noopener"
                          underline="hover"
                          sx={{ fontSize: "0.83rem", display: "flex", alignItems: "center", gap: 0.3 }}
                        >
                          <RestaurantIcon sx={{ fontSize: 14 }} />
                          🍽 {day.meals.lunch.name}
                          {day.meals.lunch.cuisine && (
                            <Chip label={day.meals.lunch.cuisine} size="small" sx={{ ml: 0.5, height: 18, fontSize: "0.7rem" }} />
                          )}
                        </Link>
                      )}
                      {day.meals?.dinner && day.meals.dinner.name !== day.meals?.lunch?.name && (
                        <Link
                          href={day.meals.dinner.maps_link}
                          target="_blank"
                          rel="noopener"
                          underline="hover"
                          sx={{ fontSize: "0.83rem", display: "flex", alignItems: "center", gap: 0.3 }}
                        >
                          <RestaurantIcon sx={{ fontSize: 14 }} />
                          🌙 {day.meals.dinner.name}
                          {day.meals.dinner.cuisine && (
                            <Chip label={day.meals.dinner.cuisine} size="small" sx={{ ml: 0.5, height: 18, fontSize: "0.7rem" }} />
                          )}
                        </Link>
                      )}
                      {!day.meals?.lunch && !day.meals?.dinner && (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </Stack>
                  </TableCell>

                  {/* Cost column */}
                  <TableCell align="right">
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 700,
                        color: day.is_buffer ? "#D97706" : "primary.main",
                      }}
                    >
                      ₹{day.day_cost?.toLocaleString("en-IN")}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </motion.div>
  );
}
