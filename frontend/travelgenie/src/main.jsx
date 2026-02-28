import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

function Root() {
  const [mode, setMode] = useState("light");

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode,
        primary: {
          main: "#0F766E",
          light: "#14B8A6",
          dark: "#0D5D56",
        },
        secondary: {
          main: "#F59E0B",
          light: "#FCD34D",
          dark: "#D97706",
        },
        background: {
          default: mode === "light" ? "#F8FAFC" : "#0F172A",
          paper: mode === "light" ? "#FFFFFF" : "#1E293B",
        },
        text: {
          primary: mode === "light" ? "#0F172A" : "#F1F5F9",
          secondary: mode === "light" ? "#475569" : "#94A3B8",
        },
      },
      shape: { borderRadius: 16 },
      typography: {
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        h4: { fontWeight: 800, letterSpacing: "-0.02em" },
        h5: { fontWeight: 700, letterSpacing: "-0.01em" },
        h6: { fontWeight: 700, letterSpacing: "-0.01em" },
        subtitle1: { fontWeight: 600 },
        subtitle2: { fontWeight: 600 },
        body1: { lineHeight: 1.7 },
        body2: { lineHeight: 1.6 },
        button: { fontWeight: 600, textTransform: "none", letterSpacing: "0.01em" },
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              padding: "12px 28px",
              fontSize: "0.95rem",
              transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
            },
            containedPrimary: {
              background: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
              boxShadow: "0 4px 14px 0 rgba(15, 118, 110, 0.3)",
              "&:hover": {
                background: "linear-gradient(135deg, #0D5D56 0%, #0F766E 100%)",
                boxShadow: "0 6px 22px 0 rgba(15, 118, 110, 0.4)",
                transform: "translateY(-1px)",
              },
              "&:active": {
                transform: "translateY(0)",
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              transition: "box-shadow 0.3s ease, transform 0.3s ease",
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              fontWeight: 600,
              fontSize: "0.8rem",
              transition: "all 0.2s ease",
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              "& .MuiOutlinedInput-root": {
                borderRadius: 12,
                transition: "box-shadow 0.2s ease",
                "&:hover": {
                  boxShadow: "0 0 0 3px rgba(15,118,110,0.08)",
                },
                "&.Mui-focused": {
                  boxShadow: "0 0 0 3px rgba(15,118,110,0.15)",
                },
              },
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
            },
          },
        },
        MuiToggleButton: {
          styleOverrides: {
            root: {
              borderRadius: "10px !important",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              padding: "8px 20px",
              transition: "all 0.2s ease",
              "&.Mui-selected": {
                background: "linear-gradient(135deg, #0F766E, #14B8A6)",
                color: "#fff",
                boxShadow: "0 2px 10px rgba(15,118,110,0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #0D5D56, #0F766E)",
                },
              },
            },
          },
        },
        MuiAlert: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              fontWeight: 500,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              borderRadius: "20px 0 0 20px",
            },
          },
        },
      },
    }), [mode]
  );

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App mode={mode} setMode={setMode} />
      </ThemeProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);