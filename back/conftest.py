from collections.abc import AsyncIterator

import pytest_asyncio
from sqlalchemy.exc import InvalidRequestError
from sqlalchemy.ext.asyncio import AsyncConnection

from db import engine


@pytest_asyncio.fixture
async def db_conn() -> AsyncIterator[AsyncConnection]:
    async with engine.connect() as conn:
        transaction = await conn.begin()
        try:
            yield conn
        finally:
            try:
                if transaction.is_active:
                    await transaction.rollback()
                else:
                    await conn.rollback()
            except InvalidRequestError:
                pass
