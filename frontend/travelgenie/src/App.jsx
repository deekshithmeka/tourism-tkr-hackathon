import { Routes, Route } from "react-router-dom";
import { Box } from "@mui/material";
import LandingPage from "./components/LandingPage";
import ChatInterface from "./components/ChatInterface";
import ResultsPage from "./components/ResultsPage";
import PaymentPage from "./components/PaymentPage";
import TeamMembers from "./components/TeamMembers";
import Navbar from "./components/navbar";
import Footer from "./components/Footer";

function App({ mode, setMode }) {
  return (
    <>
      <Navbar mode={mode} setMode={setMode} />
      {/* offset for fixed navbar */}
      <Box sx={{ pt: "64px" }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<ChatInterface />} />
        <Route path="/team-members" element={<TeamMembers />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/payment" element={<PaymentPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;