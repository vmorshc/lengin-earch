import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI
from mangum import Mangum
from app.main import app as fastapi_app

handler = Mangum(fastapi_app)
