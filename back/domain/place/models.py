from datetime import datetime
import pydantic as pyd


GeoPoint = tuple[float, float]  # (longitude, latitude)


class Place(pyd.BaseModel):
    id: int
    description: str
    location: GeoPoint
    created_at: datetime
    updated_at: datetime


class CreatePlace(pyd.BaseModel):
    description: str
    location: GeoPoint
    created_at: datetime
    updated_at: datetime
