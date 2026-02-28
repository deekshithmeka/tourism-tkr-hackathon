import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadIcon from "@mui/icons-material/Download";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BadgeIcon from "@mui/icons-material/Badge";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";

const API_BASE = "http://localhost:8000";

const PAYMENT_METHODS = [
  { value: "upi", label: "UPI", icon: <PhoneAndroidIcon sx={{ fontSize: 18 }} /> },
  { value: "debit", label: "Debit Card", icon: <CreditCardIcon sx={{ fontSize: 18 }} /> },
  { value: "credit", label: "Credit Card", icon: <CreditCardIcon sx={{ fontSize: 18 }} /> },
  { value: "netbanking", label: "Net Banking", icon: <AccountBalanceIcon sx={{ fontSize: 18 }} /> },
];

export default function PaymentPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const location = useLocation();
  const navigate = useNavigate();

  const {
    tripTotal = 0,
    travelMode = "car",
    groupSize = 1,
    guide = false,
    guideCost = 0,
    insurance = true,
    insuranceAmount = 0,
    destinations = [],
    days = 1,
    budget = 0,
    category = "",
    itinerary = null,
    transport = null,
    guideInfo = null,
  } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState(null);

  // Government ID upload state
  const [govtIdFile, setGovtIdFile] = useState(null);
  const [govtIdPreview, setGovtIdPreview] = useState(null);

  const handleGovtIdUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Please upload a valid image (JPG/PNG) or PDF for your Government ID.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5 MB.");
      return;
    }
    setGovtIdFile(file);
    setError(null);
    if (file.type.startsWith("image/")) {
      setGovtIdPreview(URL.createObjectURL(file));
    } else {
      setGovtIdPreview(null);
    }
  };

  const handleRemoveGovtId = () => {
    setGovtIdFile(null);
    setGovtIdPreview(null);
  };

  // Tax calculations (dynamic insurance based on trip duration)
  const gst = Math.round(tripTotal * 0.05);
  const computedInsurance = Math.max(99, days * 50);
  const insuranceAmt = insurance ? (insuranceAmount || computedInsurance) : 0;
  const platformFee = 49;
  const guideAmt = guide ? guideCost : 0;
  const grandTotal = Math.round(tripTotal + gst + insuranceAmt + guideAmt + platformFee);
  const budgetDiff = budget > 0 ? budget - grandTotal : 0;

  const handlePayment = async () => {
    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!govtIdFile) {
      setError("Please upload a Government ID as proof before proceeding.");
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_total: tripTotal,
          travel_mode: travelMode,
          group_size: groupSize,
          guide,
          guide_cost: guideCost,
          insurance,
          payment_method: paymentMethod,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          govt_id_filename: govtIdFile?.name || "",
          destinations,
          days,
          budget,
        }),
      });
      if (!res.ok) throw new Error(`Payment failed (${res.status})`);
      const data = await res.json();
      setReceipt(data);
    } catch (err) {
      setError(err.message || "Payment processing failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!receipt) return;
    const win = window.open("", "_blank");
    const rows = [
      ["Transaction ID", receipt.transaction_id],
      ["Date", new Date(receipt.timestamp).toLocaleString()],
      ["Customer", receipt.customer?.name || "—"],
      ["Email", receipt.customer?.email || "—"],
      ["Phone", receipt.customer?.phone || "—"],
      ["Payment Method", receipt.payment_method?.toUpperCase()],
      ["", ""],
      ["Destinations", receipt.trip_summary?.destinations?.join(", ") || "—"],
      ["Duration", `${receipt.trip_summary?.days} day(s)`],
      ["Group Size", `${receipt.trip_summary?.group_size || 1} person(s)`],
      ["Transport", receipt.trip_summary?.travel_mode || "—"],
      ["Guide", receipt.trip_summary?.guide ? "Yes" : "No"],
      ["", ""],
      ["Trip Cost", `₹${receipt.breakdown?.trip_cost?.toLocaleString("en-IN")}`],
      ["GST (5%)", `₹${receipt.breakdown?.gst_5_percent?.toLocaleString("en-IN")}`],
      ["Travel Insurance", `₹${receipt.breakdown?.travel_insurance?.toLocaleString("en-IN")}`],
      ["Guide Fees", `₹${receipt.breakdown?.guide_fees?.toLocaleString("en-IN")}`],
      ["Platform Fee", `₹${receipt.breakdown?.platform_fee?.toLocaleString("en-IN")}`],
      ["", ""],
      ["GRAND TOTAL", `₹${receipt.grand_total?.toLocaleString("en-IN")}`],
    ];

    const htmlRows = rows
      .map(([k, v]) =>
        k === ""
          ? `<tr><td colspan="2" style="border-bottom:1px dashed #e2e8f0;padding:6px 0;"></td></tr>`
          : `<tr><td style="padding:8px 12px;font-weight:${k === "GRAND TOTAL" ? "800" : "500"};color:${k === "GRAND TOTAL" ? "#0F766E" : "#475569"};font-size:${k === "GRAND TOTAL" ? "16px" : "14px"}">${k}</td><td style="padding:8px 12px;text-align:right;font-weight:${k === "GRAND TOTAL" ? "800" : "400"};font-size:${k === "GRAND TOTAL" ? "16px" : "14px"};color:${k === "GRAND TOTAL" ? "#0F766E" : "#1e293b"}">${v}</td></tr>`
      )
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>TravelGenie Invoice — ${receipt.transaction_id}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; max-width: 600px; margin: 0 auto; }
            h1 { color: #0F766E; font-size: 24px; margin-bottom: 4px; }
            .subtitle { color: #94a3b8; font-size: 13px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; }
            .status { display: inline-block; background: #D1FAE5; color: #065F46; padding: 4px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 20px; }
            .footer { margin-top: 30px; color: #94a3b8; font-size: 11px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>🧳 TravelGenie AI — Invoice</h1>
          <p class="subtitle">Tax Invoice / Payment Receipt</p>
          <div class="status">✓ Payment Successful</div>
          <table>${htmlRows}</table>
          <p class="footer">
            ${receipt.note}<br/>
            Generated on ${new Date().toLocaleString()}
          </p>
          <script>window.print();window.onafterprint=()=>window.close();<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  // Success state
  if (receipt) {
    return (
      <Box sx={{ minHeight: "calc(100vh - 64px)", py: 6, background: isDark ? "transparent" : "linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 100%)" }}>
        <Container maxWidth="sm">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <Paper elevation={0} sx={{ p: 5, borderRadius: 5, textAlign: "center", border: "1px solid", borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", bgcolor: isDark ? "rgba(30,41,59,0.7)" : "#fff" }}>
              <CheckCircleIcon sx={{ fontSize: 64, color: "#10B981", mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#10B981", mb: 1 }}>
                Payment Successful!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Transaction ID: <strong>{receipt.transaction_id}</strong>
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 3 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Trip Cost</TableCell>
                      <TableCell align="right">₹{receipt.breakdown?.trip_cost?.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>GST (5%)</TableCell>
                      <TableCell align="right">₹{receipt.breakdown?.gst_5_percent?.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Insurance</TableCell>
                      <TableCell align="right">₹{receipt.breakdown?.travel_insurance?.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Guide Fees</TableCell>
                      <TableCell align="right">₹{receipt.breakdown?.guide_fees?.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Platform Fee</TableCell>
                      <TableCell align="right">₹{receipt.breakdown?.platform_fee?.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: isDark ? "rgba(15,118,110,0.08)" : "rgba(15,118,110,0.04)" }}>
                      <TableCell sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Grand Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: "1.05rem", color: "primary.main" }}>
                        ₹{receipt.grand_total?.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadPDF} sx={{ borderRadius: 3, px: 4 }}>
                  Download Invoice (PDF)
                </Button>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate("/")} sx={{ borderRadius: 3 }}>
                  Plan Another Trip
                </Button>
              </Stack>
            </Paper>
          </motion.div>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "calc(100vh - 64px)", py: 4, background: isDark ? "transparent" : "linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 100%)" }}>
      <Container maxWidth="sm">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2, color: "text.secondary" }}>
          Back to Results
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 5,
              border: "1px solid",
              borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
              bgcolor: isDark ? "rgba(30,41,59,0.7)" : "#fff",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 3, background: "linear-gradient(135deg, #7C3AED, #6366F1)" }}>
                <PaymentIcon sx={{ color: "#fff", fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>Payment</Typography>
                <Typography variant="body2" color="text.secondary">Complete your trip booking</Typography>
              </Box>
            </Box>

            {/* Trip summary */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Trip Summary</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                <Chip label={`${days} day${days > 1 ? "s" : ""}`} size="small" />
                <Chip label={category} size="small" color="primary" />
                <Chip label={travelMode} size="small" variant="outlined" />
                {guide && <Chip label="Guide" size="small" color="warning" />}
              </Stack>
              {destinations.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {destinations.join(" → ")}
                </Typography>
              )}
              {groupSize > 1 && (
                <Chip icon={<GroupIcon />} label={`${groupSize} people`} size="small" color="secondary" sx={{ mt: 0.5 }} />
              )}
            </Paper>

            {/* Cost breakdown */}
            <TableContainer sx={{ mb: 3 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Trip Cost</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>₹{tripTotal.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>GST (5%)</TableCell>
                    <TableCell align="right">₹{gst.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Travel Insurance ({days} day{days > 1 ? "s" : ""})</TableCell>
                    <TableCell align="right">₹{insuranceAmt.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                  {guide && (
                    <TableRow>
                      <TableCell>Guide Fees</TableCell>
                      <TableCell align="right">₹{guideAmt.toLocaleString("en-IN")}</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell>Platform Fee</TableCell>
                    <TableCell align="right">₹{platformFee.toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: isDark ? "rgba(15,118,110,0.08)" : "rgba(15,118,110,0.04)" }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: "1.05rem" }}>Grand Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: "1.05rem", color: "primary.main" }}>
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                  {budget > 0 && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: budgetDiff >= 0 ? "#10B981" : "#EF4444" }}>
                        {budgetDiff >= 0 ? "💰 Budget Savings" : "⚠️ Over Budget"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: budgetDiff >= 0 ? "#10B981" : "#EF4444" }}>
                        {budgetDiff >= 0 ? `₹${budgetDiff.toLocaleString("en-IN")}` : `-₹${Math.abs(budgetDiff).toLocaleString("en-IN")}`}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ mb: 3 }} />

            {/* Customer details */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Your Details</Typography>
            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                label="Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Email (optional)"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Phone (optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                fullWidth
                size="small"
              />
            </Stack>

            {/* Government ID Upload */}
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 0.5 }}>
              <BadgeIcon sx={{ fontSize: 18 }} /> Upload Government ID <Typography component="span" color="error.main" sx={{ fontWeight: 700 }}>*</Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              Upload a valid government-issued photo ID (Aadhaar, PAN, Passport, Voter ID, or Driving License) as proof of identity. Accepted: JPG, PNG, or PDF (max 5 MB).
            </Typography>

            {!govtIdFile ? (
              <Box
                component="label"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 4,
                  px: 2,
                  mb: 3,
                  border: "2px dashed",
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: isDark ? "rgba(15,118,110,0.06)" : "rgba(15,118,110,0.04)",
                  },
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  hidden
                  onChange={handleGovtIdUpload}
                />
                <CloudUploadIcon sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                  Click to upload or drag & drop
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  JPG, PNG, or PDF — max 5 MB
                </Typography>
              </Box>
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: 2,
                  mb: 3,
                  borderRadius: 3,
                  borderColor: "#10B981",
                  bgcolor: isDark ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.04)",
                }}
              >
                {govtIdPreview ? (
                  <Box
                    component="img"
                    src={govtIdPreview}
                    alt="Government ID preview"
                    sx={{ width: 80, height: 56, objectFit: "cover", borderRadius: 2, border: "1px solid", borderColor: "divider" }}
                  />
                ) : (
                  <BadgeIcon sx={{ fontSize: 40, color: "#10B981" }} />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{govtIdFile.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(govtIdFile.size / 1024).toFixed(1)} KB — {govtIdFile.type.split("/")[1]?.toUpperCase()}
                  </Typography>
                </Box>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={handleRemoveGovtId}>
                  Remove
                </Button>
              </Paper>
            )}

            {/* Payment method */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>Payment Method</Typography>
            <ToggleButtonGroup
              value={paymentMethod}
              exclusive
              onChange={(e, val) => val && setPaymentMethod(val)}
              sx={{ mb: 3, flexWrap: "wrap", gap: 0.5 }}
            >
              {PAYMENT_METHODS.map((m) => (
                <ToggleButton key={m.value} value={m.value} sx={{ px: 2.5, borderRadius: "12px !important" }}>
                  {m.icon}
                  <Box component="span" sx={{ ml: 0.5 }}>{m.label}</Box>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handlePayment}
              disabled={processing}
              startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <PaymentIcon />}
              sx={{
                borderRadius: 3,
                py: 1.5,
                fontWeight: 700,
                fontSize: "1rem",
                background: "linear-gradient(135deg, #7C3AED, #6366F1)",
                boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
                "&:hover": { background: "linear-gradient(135deg, #6D28D9, #4F46E5)" },
              }}
            >
              {processing ? "Processing..." : `Pay ₹${grandTotal.toLocaleString("en-IN")}`}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mt: 2 }}>
              This is a simulated payment for demonstration purposes.
            </Typography>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}
