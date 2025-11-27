from collections.abc import Mapping
from datetime import datetime
from typing import cast

import sqlalchemy as sa
from sqlalchemy.engine import RowMapping
from sqlalchemy.ext.asyncio import AsyncConnection
from sqlalchemy.sql.elements import ColumnElement

from domain.place.models import CreatePlace, GeoPoint, Place
from domain.place.tables import PlacesTable


def _build_location_projection() -> ColumnElement[object]:
    location_geometry = PlacesTable.c.location.op("::")(sa.text("extensions.geometry"))
    projection = sa.func.jsonb_build_object(
        "lat",
        sa.func.extensions.ST_Y(location_geometry),
        "lng",
        sa.func.extensions.ST_X(location_geometry),
    ).label("location")
    return cast(ColumnElement[object], projection)


def _build_location_expression(location: tuple[float, float]) -> sa.ClauseElement:
    lng, lat = location
    return sa.func.ST_SetSRID(sa.func.ST_MakePoint(lng, lat), 4326).op("::")(
        sa.text("extensions.geography")
    )


def _coerce_coordinate(value: object, *, axis: str) -> float:
    if isinstance(value, (int, float, str)):
        try:
            return float(value)
        except ValueError as exc:
            raise ValueError(f"Invalid {axis} coordinate: {value}") from exc
    raise ValueError(f"Invalid {axis} coordinate type: {type(value)!r}")


def _normalize_location(value: object) -> GeoPoint:
    if not isinstance(value, Mapping):
        raise ValueError(f"Invalid location payload: {value}")
    location = cast("Mapping[str, object]", value)
    lat_raw = location.get("lat")
    lng_raw = location.get("lng")
    if lat_raw is None or lng_raw is None:
        raise ValueError(f"Invalid location payload: {value}")
    lat = _coerce_coordinate(lat_raw, axis="lat")
    lng = _coerce_coordinate(lng_raw, axis="lng")
    return (lng, lat)


def _row_to_place(row: RowMapping) -> Place:
    return Place(
        id=cast(int, row["id"]),
        description=cast(str, row["description"]),
        location=_normalize_location(cast(object, row["location"])),
        created_at=cast(datetime, row["created_at"]),
        updated_at=cast(datetime, row["updated_at"]),
    )


async def create_place(conn: AsyncConnection, payload: CreatePlace) -> Place:
    location_projection = _build_location_projection()
    stmt = (
        sa.insert(PlacesTable)
        .values(
            description=payload.description,
            location=_build_location_expression(payload.location),
            created_at=payload.created_at,
            updated_at=payload.updated_at,
        )
        .returning(
            PlacesTable.c.id,
            PlacesTable.c.description,
            location_projection,
            PlacesTable.c.created_at,
            PlacesTable.c.updated_at,
        )
    )
    result = await conn.execute(stmt)
    row: RowMapping = result.mappings().one()
    return _row_to_place(row)


async def list_places_by_distance(
    conn: AsyncConnection,
    *,
    location: GeoPoint,
    limit: int,
    offset: int = 0,
) -> list[Place]:
    location_projection = _build_location_projection()
    target_location = _build_location_expression(location)
    distance = cast(
        ColumnElement[float],
        sa.func.extensions.ST_Distance(PlacesTable.c.location, target_location),
    )
    stmt = (
        sa.select(
            PlacesTable.c.id,
            PlacesTable.c.description,
            location_projection,
            PlacesTable.c.created_at,
            PlacesTable.c.updated_at,
        )
        .order_by(distance)
        .limit(limit)
        .offset(offset)
    )
    result = await conn.execute(stmt)
    rows = result.mappings().all()
    return [_row_to_place(row) for row in rows]
