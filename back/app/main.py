import pydantic as pyd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.place import router as place_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Greating(pyd.BaseModel):
    hello: str = "world"


@app.get("/healthcheck")
async def root() -> Greating:
    return Greating(hello="world")


app.include_router(place_router)
