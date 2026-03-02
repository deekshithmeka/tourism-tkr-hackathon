import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Switch,
  Box,
  Button,
} from "@mui/material";
import ExploreIcon from "@mui/icons-material/Explore";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import HomeIcon from "@mui/icons-material/Home";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import GroupIcon from "@mui/icons-material/Group";

const navItems = [
  { label: "Home", path: "/", icon: <HomeIcon sx={{ fontSize: 18 }} /> },
  { label: "Search", path: "/search", icon: <TravelExploreIcon sx={{ fontSize: 18 }} /> },
  { label: "Team Members", path: "/team-members", icon: <GroupIcon sx={{ fontSize: 18 }} /> },
];

function Navbar({ mode, setMode }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background:
          mode === "light"
            ? "rgba(255,255,255,0.8)"
            : "rgba(15,23,42,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid",
        borderColor:
          mode === "light"
            ? "rgba(0,0,0,0.06)"
            : "rgba(255,255,255,0.06)",
        color: "text.primary",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
        {/* Logo + Brand */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: 2.5,
              background: "linear-gradient(135deg, #0F766E, #14B8A6)",
              boxShadow: "0 4px 12px rgba(15,118,110,0.25)",
              transition: "transform 0.3s ease",
              "&:hover": { transform: "rotate(15deg) scale(1.05)" },
            }}
          >
            <ExploreIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontSize: "1.15rem",
              background: "linear-gradient(135deg, #0F766E, #14B8A6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: { xs: "none", sm: "block" },
            }}
          >
            TravelGenie AI
          </Typography>
        </Box>

        {/* Nav Links — centered */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mx: "auto",
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                startIcon={item.icon}
                onClick={() => navigate(item.path)}
                sx={{
                  px: 2.5,
                  py: 1,
                  borderRadius: 3,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.88rem",
                  color: isActive ? "primary.main" : "text.secondary",
                  background: isActive
                    ? mode === "light"
                      ? "rgba(15,118,110,0.08)"
                      : "rgba(20,184,166,0.12)"
                    : "transparent",
                  position: "relative",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    background:
                      mode === "light"
                        ? "rgba(15,118,110,0.06)"
                        : "rgba(20,184,166,0.08)",
                    color: "primary.main",
                  },
                  "&::after": isActive
                    ? {
                        content: '""',
                        position: "absolute",
                        bottom: 2,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 20,
                        height: 3,
                        borderRadius: 2,
                        background: "linear-gradient(135deg, #0F766E, #14B8A6)",
                      }
                    : {},
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        {/* Dark mode toggle */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <LightModeIcon
            sx={{
              fontSize: 18,
              color: mode === "light" ? "secondary.main" : "text.secondary",
              transition: "color 0.3s ease",
            }}
          />
          <Switch
            checked={mode === "dark"}
            onChange={() =>
              setMode(mode === "light" ? "dark" : "light")
            }
            size="small"
            sx={{
              "& .MuiSwitch-thumb": {
                transition: "all 0.3s ease",
              },
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "#14B8A6",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "#0F766E",
              },
            }}
          />
          <DarkModeIcon
            sx={{
              fontSize: 18,
              color: mode === "dark" ? "#14B8A6" : "text.secondary",
              transition: "color 0.3s ease",
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;