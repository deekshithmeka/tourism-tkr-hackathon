"""
POST /api/verify-id — ID verification prototype endpoint.
"""

from fastapi import APIRouter, UploadFile, File, Query
from services.id_verification import verify_id

router = APIRouter(prefix="/api", tags=["verification"])


@router.post("/verify-id")
async def verify_id_endpoint(
    image: UploadFile = File(...),
    min_age: int = Query(18, ge=0, le=120),
):
    image_bytes = await image.read()
    result = await verify_id(image_bytes, min_age)
    return result
