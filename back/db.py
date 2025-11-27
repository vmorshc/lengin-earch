from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from uuid import uuid4

from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncEngine,
    create_async_engine,
)

from config import config

engine: AsyncEngine = create_async_engine(
    str(config.postgresql_dns),
    echo=False,
    poolclass=NullPool,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_name_func": lambda: f"__asyncpg_{uuid4()}__",
    },
)


async def get_connection() -> AsyncIterator[AsyncConnection]:
    async with engine.connect() as conn:
        async with conn.begin():
            yield conn


@asynccontextmanager
async def conn_manager():
    async for conn in get_connection():
        yield conn
