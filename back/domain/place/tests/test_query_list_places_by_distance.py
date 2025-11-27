from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncConnection

from domain.place.models import CreatePlace, GeoPoint
from domain.place.query import create_place, list_places_by_distance


async def _seed_places(
    conn: AsyncConnection,
    *,
    locations: list[tuple[str, GeoPoint]],
) -> None:
    timestamp = datetime.now(UTC)
    for description, point in locations:
        await create_place(
            conn,
            CreatePlace(
                description=description,
                location=point,
                created_at=timestamp,
                updated_at=timestamp,
            ),
        )


async def test_list_places_by_distance_orders_and_limits(
    db_conn: AsyncConnection,
) -> None:
    await _seed_places(
        db_conn,
        locations=[
            ("Origin", (0.0, 0.0)),
            ("East-1", (0.5, 0.0)),
            ("East-2", (1.0, 0.0)),
        ],
    )

    places = await list_places_by_distance(
        db_conn,
        location=(0.0, 0.0),
        limit=2,
    )

    assert [place.description for place in places] == ["Origin", "East-1"]
    assert len(places) == 2


async def test_list_places_by_distance_applies_offset(
    db_conn: AsyncConnection,
) -> None:
    await _seed_places(
        db_conn,
        locations=[
            ("Origin", (0.0, 0.0)),
            ("East-1", (0.5, 0.0)),
            ("East-2", (1.0, 0.0)),
        ],
    )

    places = await list_places_by_distance(
        db_conn,
        location=(0.0, 0.0),
        limit=2,
        offset=1,
    )

    assert [place.description for place in places] == ["East-1", "East-2"]
    assert len(places) == 2
