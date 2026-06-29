from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class TripRequest(BaseModel):
    destination: str = Field(min_length=2, max_length=120)
    start_date: date
    end_date: date
    travelers: int = Field(default=1, ge=1, le=12)
    budget: float = Field(gt=0, le=1_000_000)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    pace: Literal["easy", "balanced", "packed"] = "balanced"
    interests: list[str] = Field(default_factory=list, max_length=10)
    notes: str = Field(default="", max_length=2_000)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must not be before start_date")
        if (self.end_date - self.start_date).days > 13:
            raise ValueError("trips are limited to 14 days per generation")
        return self


class TripPlan(BaseModel):
    id: str
    destination: str
    summary: str
    itinerary: list[dict]
    budget: dict
    safety_notes: list[str]
    agent_trace: list[dict]
    mode: Literal["groq", "fallback"]


class SavedTrip(BaseModel):
    id: str
    destination: str
    payload: dict
