import argparse
import asyncio
import csv
from datetime import datetime, timezone
from pathlib import Path

from db import conn_manager
from domain.place.models import CreatePlace, GeoPoint
from domain.place.query import create_place

DEFAULT_LIMIT = 5000
NAME_FIELD = "\ufeffName EN"
COORDINATES_FIELD = "Coordinates"
DEFAULT_DATASET_PATH = Path(__file__).resolve().with_name("dataset.csv")


def _parse_coordinates(raw_value: str) -> GeoPoint:
    if not raw_value:
        raise ValueError("empty coordinates value")
    parts = [part.strip() for part in raw_value.split(",")]
    if len(parts) < 2:
        raise ValueError(f"invalid coordinates format: {raw_value}")
    lat = float(parts[0])
    lng = float(parts[1])
    return (lng, lat)


def _row_to_payload(row: dict[str, str]) -> CreatePlace:
    name = (row.get(NAME_FIELD) or "").strip()
    if not name:
        raise ValueError("missing Name EN value")
    coordinates_raw = (row.get(COORDINATES_FIELD) or "").strip()
    location = _parse_coordinates(coordinates_raw)
    timestamp = datetime.now(timezone.utc)
    return CreatePlace(
        description=name,
        location=location,
        created_at=timestamp,
        updated_at=timestamp,
    )


async def load_places(dataset_path: Path, limit: int) -> None:
    inserted = 0
    skipped = 0
    async with conn_manager() as conn:
        with dataset_path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            for row_index, row in enumerate(reader, start=2):
                if inserted >= limit:
                    break
                try:
                    payload = _row_to_payload(row)
                    await create_place(conn, payload)
                except Exception as exc:
                    skipped += 1
                    print(f"Skipping row {row_index}: {exc}")
                    continue
                inserted += 1
    print(f"Finished import: inserted={inserted}, skipped={skipped}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Populate the database with places from dataset.csv.",
    )
    parser.add_argument(
        "--dataset",
        type=Path,
        default=DEFAULT_DATASET_PATH,
        help="Path to the dataset CSV file (default: scripts/dataset.csv).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=DEFAULT_LIMIT,
        help="Maximum number of places to insert (default: 5000).",
    )
    return parser.parse_args()


async def main() -> None:
    args = parse_args()
    dataset_path = args.dataset.expanduser().resolve()
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset not found: {dataset_path}")
    await load_places(dataset_path=dataset_path, limit=args.limit)


if __name__ == "__main__":
    asyncio.run(main())
