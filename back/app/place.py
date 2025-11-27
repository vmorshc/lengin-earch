import logging
from collections.abc import Awaitable, Callable
from datetime import datetime, timezone
from typing import Annotated, Generic, Literal, TypeVar

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncConnection

from db import get_connection
from domain.place import query as place_query
from domain.place.models import CreatePlace, GeoPoint, Place

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/places", tags=["places"])

ConnectionDep = Annotated[AsyncConnection, Depends(get_connection)]
PayloadT = TypeVar("PayloadT")


class ResponseModel(BaseModel, Generic[PayloadT]):
    status: Literal["success", "error"]
    payload: PayloadT | None = None
    message: str | None = None


def _success_response(payload: PayloadT) -> ResponseModel[PayloadT]:
    return ResponseModel(status="success", payload=payload)


def _error_response(status_code: int, message: str) -> JSONResponse:
    body = ResponseModel[None](status="error", payload=None, message=message)
    return JSONResponse(body.model_dump(), status_code=status_code)


class LocationPayload(BaseModel):
    lat: float = Field(
        ..., ge=-90.0, le=90.0, description="Latitude in decimal degrees"
    )
    lng: float = Field(
        ..., ge=-180.0, le=180.0, description="Longitude in decimal degrees"
    )

    def to_geo_point(self) -> GeoPoint:
        return (self.lng, self.lat)


class CreatePlaceRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=2048)
    location: LocationPayload


async def _with_error_handling(
    operation: Callable[[], Awaitable[ResponseModel[PayloadT]]],
) -> ResponseModel[PayloadT] | JSONResponse:
    try:
        return await operation()
    except ValueError as exc:
        return _error_response(status.HTTP_400_BAD_REQUEST, str(exc))
    except SQLAlchemyError:
        logger.exception("Database error while executing place query")
        return _error_response(status.HTTP_500_INTERNAL_SERVER_ERROR, "Database error")
    except Exception:
        logger.exception("Unhandled error while executing place query")
        return _error_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Internal server error"
        )


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


@router.post(
    "", response_model=ResponseModel[Place], status_code=status.HTTP_201_CREATED
)
async def create_place_endpoint(
    payload: CreatePlaceRequest,
    conn: ConnectionDep,
) -> ResponseModel[Place] | JSONResponse:
    async def action() -> ResponseModel[Place]:
        timestamp = _now_utc()
        create_payload = CreatePlace(
            description=payload.description,
            location=payload.location.to_geo_point(),
            created_at=timestamp,
            updated_at=timestamp,
        )
        created_place = await place_query.create_place(conn, payload=create_payload)
        return _success_response(created_place)

    return await _with_error_handling(action)


LatitudeQuery = Annotated[
    float,
    Query(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees"),
]
LongitudeQuery = Annotated[
    float,
    Query(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees"),
]
LimitQuery = Annotated[
    int,
    Query(gt=0, le=1000, description="Maximum number of places to return"),
]
OffsetQuery = Annotated[
    int,
    Query(ge=0, description="Number of records to skip before returning data"),
]


@router.get("", response_model=ResponseModel[list[Place]])
async def list_places_endpoint(
    lat: LatitudeQuery,
    lng: LongitudeQuery,
    limit: LimitQuery,
    offset: OffsetQuery,
    conn: ConnectionDep,
) -> ResponseModel[list[Place]] | JSONResponse:
    async def action() -> ResponseModel[list[Place]]:
        target_location: GeoPoint = (lng, lat)
        places = await place_query.list_places_by_distance(
            conn,
            location=target_location,
            limit=limit,
            offset=offset,
        )
        return _success_response(places)

    return await _with_error_handling(action)
