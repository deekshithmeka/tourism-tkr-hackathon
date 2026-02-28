"""
/api/payment — mock payment gateway.
In production this would integrate with Razorpay / Stripe / PayU.
Here we simulate the payment flow and return a receipt.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Body
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api", tags=["payment"])

# Tax & fee constants
GST_RATE = 0.05  # 5% on travel services
INSURANCE_PER_DAY = 50  # ₹50 per day
INSURANCE_MINIMUM = 99  # minimum ₹99
PLATFORM_FEE = 49  # ₹49 convenience fee


class PaymentRequest(BaseModel):
    trip_total: float = Field(gt=0)
    travel_mode: str = "car"
    group_size: int = 1
    guide: bool = False
    guide_cost: float = 0
    insurance: bool = False
    payment_method: str = "upi"  # upi | debit | credit | netbanking
    customer_name: str = "Traveller"
    customer_email: str = ""
    customer_phone: str = ""
    govt_id_filename: str = ""  # uploaded government ID filename
    destinations: list[str] = []
    days: int = 1
    budget: float = 0  # user's original budget for comparison


@router.post("/payment")
async def process_payment(req: PaymentRequest = Body(...)):
    """
    Simulate payment processing.
    Returns a structured invoice/receipt JSON that the frontend can render as PDF.
    """
    subtotal = req.trip_total
    gst = round(subtotal * GST_RATE)
    insurance_amt = max(INSURANCE_MINIMUM, req.days * INSURANCE_PER_DAY) if req.insurance else 0
    guide_amt = req.guide_cost if req.guide else 0
    platform_fee = PLATFORM_FEE
    grand_total = round(subtotal + gst + insurance_amt + guide_amt + platform_fee)

    # Budget comparison
    budget_given = getattr(req, 'budget', 0) or 0
    budget_diff = budget_given - grand_total if budget_given > 0 else 0

    txn_id = f"TG-{uuid.uuid4().hex[:10].upper()}"

    receipt = {
        "transaction_id": txn_id,
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "payment_method": req.payment_method,
        "customer": {
            "name": req.customer_name,
            "email": req.customer_email,
            "phone": req.customer_phone,
        },
        "trip_summary": {
            "destinations": req.destinations,
            "days": req.days,
            "group_size": req.group_size,
            "travel_mode": req.travel_mode,
            "guide": req.guide,
            "govt_id": req.govt_id_filename,
        },
        "breakdown": {
            "trip_cost": subtotal,
            "gst_5_percent": gst,
            "travel_insurance": insurance_amt,
            "guide_fees": guide_amt,
            "platform_fee": platform_fee,
        },
        "grand_total": grand_total,
        "budget_given": budget_given,
        "budget_diff": budget_diff,
        "currency": "INR",
        "note": "This is a simulated transaction for demonstration purposes.",
    }

    return receipt


@router.post("/payment/verify")
async def verify_payment(txn_id: str = Body(..., embed=True)):
    """Mock verification — always returns verified for demo."""
    return {
        "transaction_id": txn_id,
        "verified": True,
        "message": "Payment verified successfully.",
    }
