import React from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const projectReadme =
  "https://github.com/omsudhamsh/tourism-tkr-hackathon/blob/main/README.md";

const members = [
  {
    name: "Padma Om Sudhamsh",
    github: "https://github.com/omsudhamsh",
    avatar: "https://github.com/omsudhamsh.png?size=200",
  },
  {
    name: "Khushal Viswas (Team Lead)",
    github: "https://github.com/khushalviswas",
    avatar: "https://github.com/khushalviswas.png?size=200",
  },
  {
    name: "Deekshith",
    github: "https://github.com/deekshithmeka",
    avatar: "https://github.com/deekshithmeka.png?size=200",
  },
  {
    name: "Mukesh Rao",
    github: "https://github.com/Mukeshrao986",
    avatar: "https://github.com/Mukeshrao986.png?size=200",
  },
];

export default function TeamMembers() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        py: 5,
        background: isDark
          ? "transparent"
          : "linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 40%, #EEF2FF 100%)",
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            bgcolor: isDark ? "rgba(30,41,59,0.72)" : "background.paper",
          }}
        >
          <Typography variant="h4" sx={{ mb: 1 }}>
            Team Members
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Meet the people behind this project.
          </Typography>

          <Typography variant="h6" sx={{ mb: 1.5 }}>
            About this Project
          </Typography>
          <Button
            component="a"
            href={projectReadme}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
            sx={{ mb: 3 }}
          >
            Readme.md
          </Button>

          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Team Members
          </Typography>

          <Stack spacing={1.25}>
            {members.map((member) => (
              <Paper
                key={member.github}
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar src={member.avatar} alt={member.name} sx={{ width: 44, height: 44 }} />
                  <Typography sx={{ fontWeight: 600 }}>{member.name}</Typography>
                </Box>
                <Button
                  component="a"
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  endIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
                >
                  GitHub
                </Button>
              </Paper>
            ))}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}