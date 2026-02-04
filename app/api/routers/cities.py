from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from core.database import get_db
from schemas.city import CityResponse, CityListResponse
from crud.city import get_cities, get_city_by_uuid

router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("", response_model=CityListResponse)
async def list_cities(
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
):
    """List all cities."""
    cities, total = await get_cities(db, active_only=active_only)
    return CityListResponse(
        items=[
            CityResponse(
                id=city.uuid,
                code=city.code,
                name=city.name,
                is_active=city.is_active,
            )
            for city in cities
        ],
        total=total,
    )


@router.get("/{city_id}", response_model=CityResponse)
async def get_city(
    city_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a city by ID."""
    city = await get_city_by_uuid(db, city_id)
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return CityResponse(
        id=city.uuid,
        code=city.code,
        name=city.name,
        is_active=city.is_active,
    )
