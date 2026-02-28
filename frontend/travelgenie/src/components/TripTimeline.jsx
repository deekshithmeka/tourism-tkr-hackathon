import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Stack,
  Paper,
  Tooltip,
  useTheme,
  Button,
} from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import FlagIcon from "@mui/icons-material/Flag";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PrintIcon from "@mui/icons-material/Print";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import { motion, AnimatePresence } from "framer-motion";

function TripTimeline({ itinerary, onRemove, onReorder, budget, onPrint, onShareWhatsApp, onShareTelegram }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const totalCost = itinerary.reduce((sum, p) => sum + p.estimatedCost, 0);
  const remaining = (budget || 0) - totalCost;

  return (
    <Box>
      {/* Section header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 3,
              background: "linear-gradient(135deg, #0F766E, #14B8A6)",
              boxShadow: "0 4px 14px rgba(15,118,110,0.3)",
            }}
          >
            <FlagIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                background: "linear-gradient(135deg, #0F766E, #0EA5E9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Your Trip Plan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {itinerary.length} stop{itinerary.length !== 1 && "s"} · Total:
              ₹{totalCost.toLocaleString("en-IN")}
              {budget ? ` · Remaining: ₹${remaining.toLocaleString("en-IN")}` : ""}
            </Typography>
          </Box>
        </Box>

        {/* Print & Share buttons */}
        <Stack direction="row" spacing={1}>
          {onPrint && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<PrintIcon sx={{ fontSize: 16 }} />}
              onClick={onPrint}
              sx={{
                borderRadius: 3,
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
                color: "text.secondary",
                fontSize: "0.8rem",
                "&:hover": { borderColor: "primary.main", color: "primary.main" },
              }}
            >
              Print
            </Button>
          )}
          {onShareWhatsApp && (
            <Tooltip title="Share on WhatsApp" arrow>
              <IconButton
                size="small"
                onClick={onShareWhatsApp}
                sx={{
                  color: "#25D366",
                  bgcolor: "rgba(37,211,102,0.08)",
                  "&:hover": { bgcolor: "rgba(37,211,102,0.18)" },
                }}
              >
                <WhatsAppIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          {onShareTelegram && (
            <Tooltip title="Share on Telegram" arrow>
              <IconButton
                size="small"
                onClick={onShareTelegram}
                sx={{
                  color: "#0088cc",
                  bgcolor: "rgba(0,136,204,0.08)",
                  "&:hover": { bgcolor: "rgba(0,136,204,0.18)" },
                }}
              >
                <TelegramIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* Timeline nodes */}
      <Box sx={{ position: "relative", pl: { xs: 3, sm: 5 } }}>
        {/* Vertical connector line */}
        <Box
          sx={{
            position: "absolute",
            left: { xs: 14, sm: 22 },
            top: 24,
            bottom: 24,
            width: 3,
            borderRadius: 2,
            background: isDark
              ? "linear-gradient(180deg, #14B8A6, rgba(20,184,166,0.15))"
              : "linear-gradient(180deg, #0F766E, rgba(15,118,110,0.1))",
          }}
        />

        <AnimatePresence mode="popLayout">
          {itinerary.map((place, index) => (
            <motion.div
              key={place.name}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{
                duration: 0.35,
                layout: { type: "spring", stiffness: 300, damping: 30 },
              }}
            >
              <Box sx={{ position: "relative", mb: 3 }}>
                {/* Node dot */}
                <Box
                  sx={{
                    position: "absolute",
                    left: { xs: -21, sm: -29 },
                    top: 20,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "3px solid",
                    borderColor: "primary.main",
                    bgcolor: index === 0 ? "primary.main" : "background.paper",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}
                >
                  {index === 0 && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "#fff",
                      }}
                    />
                  )}
                </Box>

                {/* Card */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.06)",
                    bgcolor: isDark
                      ? "rgba(30,41,59,0.6)"
                      : "rgba(255,255,255,0.8)",
                    backdropFilter: "blur(8px)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: isDark
                        ? "rgba(20,184,166,0.2)"
                        : "rgba(15,118,110,0.15)",
                      boxShadow: isDark
                        ? "0 8px 24px rgba(0,0,0,0.3)"
                        : "0 8px 24px rgba(0,0,0,0.06)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: { xs: "flex-start", sm: "center" },
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 2,
                    }}
                  >
                    {/* Image thumbnail */}
                    <Box
                      component="img"
                      src={place.image}
                      alt={place.name}
                      sx={{
                        width: { xs: "100%", sm: 80 },
                        height: { xs: 120, sm: 80 },
                        borderRadius: 3,
                        objectFit: "cover",
                        flexShrink: 0,
                      }}
                    />

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Chip
                          label={`Stop ${index + 1}`}
                          size="small"
                          sx={{
                            bgcolor: "primary.main",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            height: 22,
                          }}
                        />
                        <Typography variant="subtitle1" noWrap>
                          {place.name}
                        </Typography>
                      </Box>

                      {/* Distance + Cost */}
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.4,
                          }}
                        >
                          <PlaceIcon
                            sx={{ fontSize: 15, color: "text.secondary" }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {place.distance} km
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.3,
                          }}
                        >
                          <CurrencyRupeeIcon
                            sx={{ fontSize: 14, color: "primary.main" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              color: "primary.main",
                              fontWeight: 600,
                            }}
                          >
                            {place.estimatedCost.toLocaleString("en-IN")}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Activities (sub-nodes) */}
                      {place.activities && place.activities.length > 0 && (
                        <Stack
                          direction="row"
                          spacing={0.7}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {place.activities.map((act) => (
                            <Chip
                              key={act}
                              label={act}
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: "0.72rem",
                                height: 24,
                                borderColor: isDark
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(0,0,0,0.08)",
                                color: "text.secondary",
                              }}
                            />
                          ))}
                        </Stack>
                      )}
                    </Box>

                    {/* Actions */}
                    <Stack
                      direction={{ xs: "row", sm: "column" }}
                      spacing={0.5}
                      sx={{ flexShrink: 0 }}
                    >
                      <Tooltip title="Move up" arrow>
                        <span>
                          <IconButton
                            size="small"
                            disabled={index === 0}
                            onClick={() => onReorder(index, index - 1)}
                            sx={{
                              bgcolor: isDark
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(0,0,0,0.03)",
                              "&:hover": {
                                bgcolor: isDark
                                  ? "rgba(20,184,166,0.1)"
                                  : "rgba(15,118,110,0.08)",
                              },
                            }}
                          >
                            <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Move down" arrow>
                        <span>
                          <IconButton
                            size="small"
                            disabled={index === itinerary.length - 1}
                            onClick={() => onReorder(index, index + 1)}
                            sx={{
                              bgcolor: isDark
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(0,0,0,0.03)",
                              "&:hover": {
                                bgcolor: isDark
                                  ? "rgba(20,184,166,0.1)"
                                  : "rgba(15,118,110,0.08)",
                              },
                            }}
                          >
                            <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Remove from trip" arrow>
                        <IconButton
                          size="small"
                          onClick={() => onRemove(place.name)}
                          sx={{
                            color: "#EF4444",
                            bgcolor: isDark
                              ? "rgba(239,68,68,0.06)"
                              : "rgba(239,68,68,0.04)",
                            "&:hover": {
                              bgcolor: isDark
                                ? "rgba(239,68,68,0.15)"
                                : "rgba(239,68,68,0.1)",
                            },
                          }}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Paper>
              </Box>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* End node */}
        <Box sx={{ position: "relative" }}>
          <Box
            sx={{
              position: "absolute",
              left: { xs: -21, sm: -29 },
              top: 4,
              zIndex: 2,
            }}
          >
            <CheckCircleIcon
              sx={{ fontSize: 18, color: "primary.main" }}
            />
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontStyle: "italic",
              pt: 0.3,
            }}
          >
            End of trip — enjoy your journey!
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default TripTimeline;
