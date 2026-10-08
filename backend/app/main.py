import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import configure
from app.models import Base
from app.routers import action_items, meetings
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(_app: FastAPI):
    import app.database as database

    configure()
    Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()
    try:
        if os.environ.get("SEED", "1") != "0":
            seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Meeting notes API", lifespan=lifespan)
origins = [origin.strip() for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(meetings.router, prefix="/api")
app.include_router(action_items.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/me")
def me():
    import app.database as database
    from app.services.meetings import get_or_create_user

    db = database.SessionLocal()
    try:
        user = get_or_create_user(db)
        return {"id": user.id, "name": user.name, "email": user.email}
    finally:
        db.close()
