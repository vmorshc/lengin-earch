from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncConnection

from domain.place.models import CreatePlace
from domain.place.query import create_place


async def test_create_place_persists_data(db_conn: AsyncConnection) -> None:
    timestamp = datetime.now(UTC)
    payload = CreatePlace(
        description="Test place",
        location=(12.34, 56.78),
        created_at=timestamp,
        updated_at=timestamp,
    )

    created = await create_place(db_conn, payload)

    assert isinstance(created.id, int)
    assert created.description == payload.description
    assert created.location == payload.location
    assert created.created_at == payload.created_at
    assert created.updated_at == payload.updated_at
