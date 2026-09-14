import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import text

from .db.database import Base, engine
from .api.auth import router as auth_router
from .api.patients import router as patients_router
from .api.sessions import router as sessions_router
from .api.clinical import router as clinical_router

load_dotenv()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Import models so metadata includes every table before local creation.
    from .db import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="DialyCore API",
    description="Open-source hemodialysis unit records and workflow management.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS defaults to local development. Deployments must explicitly list origins.
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173",
    ).split(",")
    if origin.strip()
]

# Vite can select another port when its preferred development port is busy.
# Accept loopback origins in local/demo environments while production remains
# restricted to the exact origins configured above.
app_env = os.getenv("APP_ENV", "development").strip().lower()
configured_origin_regex = os.getenv("CORS_ORIGIN_REGEX", "").strip()
cors_origin_regex = configured_origin_regex or (
    r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"
    if app_env in {"development", "demo"}
    else None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
def health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok"}


# Mount routers
app.include_router(auth_router)
app.include_router(patients_router)
app.include_router(sessions_router)
app.include_router(clinical_router)
