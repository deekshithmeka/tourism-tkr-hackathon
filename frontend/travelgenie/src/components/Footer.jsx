import React from "react";
import { Box, Container, Link, Typography } from "@mui/material";
import CopyrightOutlinedIcon from "@mui/icons-material/CopyrightOutlined";
import { Link as RouterLink } from "react-router-dom";

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        py: 1.5,
        bgcolor: "background.paper",
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.7,
            textAlign: "center",
            flexWrap: "wrap",
          }}
        >
          <CopyrightOutlinedIcon sx={{ fontSize: 16 }} />
          2026 | Team "Bug Slayers" |
          <Link component={RouterLink} to="/team-members" underline="hover" sx={{ fontWeight: 600 }}>
            Team Details
          </Link>
        </Typography>
      </Container>
    </Box>
  );
}