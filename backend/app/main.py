import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from .database import TripRecord, initialize_database, session_scope
from .planner import plan_trip
from .schemas import SavedTrip, TripPlan, TripRequest


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="TripMate AI API",
    version="1.0.0",
    description="Multi-agent travel planning API inspired by the TripMate tutorial architecture.",
    lifespan=lifespan,
)
origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:8080").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health():
    return {"status": "ok", "planner_mode": "groq" if os.getenv("GROQ_API_KEY") else "fallback"}


@app.post("/api/plans/generate", response_model=TripPlan)
def generate_plan(request: TripRequest):
    return plan_trip(request)


@app.post("/api/trips", response_model=SavedTrip, status_code=status.HTTP_201_CREATED)
def save_trip(trip: SavedTrip):
    with session_scope() as session:
        existing = session.get(TripRecord, trip.id)
        if existing:
            existing.destination = trip.destination
            existing.payload = trip.payload
        else:
            session.add(TripRecord(id=trip.id, destination=trip.destination, payload=trip.payload))
    return trip


@app.get("/api/trips", response_model=list[SavedTrip])
def list_trips():
    with session_scope() as session:
        records = session.scalars(select(TripRecord).order_by(TripRecord.created_at.desc())).all()
        return [SavedTrip(id=item.id, destination=item.destination, payload=item.payload) for item in records]


@app.get("/api/trips/{trip_id}", response_model=SavedTrip)
def get_trip(trip_id: str):
    with session_scope() as session:
        record = session.get(TripRecord, trip_id)
        if not record:
            raise HTTPException(status_code=404, detail="Trip not found")
        return SavedTrip(id=record.id, destination=record.destination, payload=record.payload)


@app.delete("/api/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: str):
    with session_scope() as session:
        record = session.get(TripRecord, trip_id)
        if not record:
            raise HTTPException(status_code=404, detail="Trip not found")
        session.delete(record)
