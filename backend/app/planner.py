import json
import os
from datetime import timedelta
from typing import TypedDict
from uuid import uuid4

from langgraph.graph import END, START, StateGraph

from .schemas import TripPlan, TripRequest


class PlannerState(TypedDict, total=False):
    request: TripRequest
    research: list[str]
    itinerary: list[dict]
    budget: dict
    safety_notes: list[str]
    trace: list[dict]
    mode: str


def trace(state: PlannerState, agent: str, output: str) -> list[dict]:
    return [*state.get("trace", []), {"agent": agent, "output": output}]


def research_agent(state: PlannerState) -> PlannerState:
    request = state["request"]
    interests = ", ".join(request.interests) or "culture, food, and local neighborhoods"
    fallback_notes = [
        f"Prioritize compact neighborhood clusters in {request.destination}.",
        f"Bias recommendations toward {interests}.",
        "Treat opening hours, prices, entry rules, and weather as live facts to verify.",
    ]
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {
            "research": fallback_notes,
            "mode": "fallback",
            "trace": trace(state, "research", "Used deterministic destination research."),
        }

    try:
        from langchain_groq import ChatGroq

        model = ChatGroq(
            api_key=api_key,
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            temperature=0.2,
            timeout=float(os.getenv("GROQ_TIMEOUT_SECONDS", "15")),
            max_retries=0,
        )
        response = model.invoke(
            "Return a JSON array of exactly five concise, practical research notes for a trip "
            f"to {request.destination}. Interests: {interests}. Notes: {request.notes}. "
            "Do not invent live prices, opening hours, or safety claims."
        )
        content = str(response.content).strip().removeprefix("```json").removesuffix("```").strip()
        notes = json.loads(content)
        if not isinstance(notes, list):
            raise ValueError("model did not return a list")
        return {
            "research": [str(note) for note in notes[:5]],
            "mode": "groq",
            "trace": trace(state, "research", "Groq produced destination research notes."),
        }
    except Exception as exc:
        return {
            "research": fallback_notes,
            "mode": "fallback",
            "trace": trace(state, "research", f"Groq fallback: {type(exc).__name__}."),
        }


def route_agent(state: PlannerState) -> PlannerState:
    request = state["request"]
    count = (request.end_date - request.start_date).days + 1
    slots = 2 if request.pace == "easy" else 4 if request.pace == "packed" else 3
    templates = [
        ("Neighborhood orientation", "Walkable introduction and local breakfast"),
        ("Signature culture", "A high-value landmark or museum with time buffer"),
        ("Local table", "Regional food stop selected for the group's preferences"),
        ("Open-air discovery", "Park, waterfront, market, or viewpoint"),
    ]
    itinerary = []
    for day_index in range(count):
        day = request.start_date + timedelta(days=day_index)
        itinerary.append(
            {
                "day": day_index + 1,
                "date": day.isoformat(),
                "theme": "Arrive and orient" if day_index == 0 else "Explore one area deeply",
                "activities": [
                    {
                        "time": ["09:00", "11:30", "14:30", "18:30"][slot],
                        "title": templates[(day_index + slot) % len(templates)][0],
                        "reason": templates[(day_index + slot) % len(templates)][1],
                    }
                    for slot in range(slots)
                ],
            }
        )
    return {
        "itinerary": itinerary,
        "trace": trace(state, "route", f"Built {count} days at a {request.pace} pace."),
    }


def budget_agent(state: PlannerState) -> PlannerState:
    request = state["request"]
    ratios = {"stay": 0.38, "food": 0.23, "local_travel": 0.14, "experiences": 0.17, "buffer": 0.08}
    allocation = {name: round(request.budget * ratio, 2) for name, ratio in ratios.items()}
    return {
        "budget": {"currency": request.currency.upper(), "total": request.budget, "allocation": allocation},
        "trace": trace(state, "budget", "Allocated the full budget with an 8% reserve."),
    }


def safety_agent(state: PlannerState) -> PlannerState:
    notes = [
        "Verify current government entry and travel advisories before purchase.",
        "Re-check weather, closures, transit disruptions, and opening hours 24 hours before each day.",
        "Keep emergency contacts, insurance details, and the first-night address available offline.",
    ]
    return {"safety_notes": notes, "trace": trace(state, "safety", "Added live-fact checks and offline readiness.")}


def build_graph():
    graph = StateGraph(PlannerState)
    graph.add_node("research", research_agent)
    graph.add_node("route", route_agent)
    graph.add_node("budget", budget_agent)
    graph.add_node("safety", safety_agent)
    graph.add_edge(START, "research")
    graph.add_edge("research", "route")
    graph.add_edge("route", "budget")
    graph.add_edge("budget", "safety")
    graph.add_edge("safety", END)
    return graph.compile()


planner_graph = build_graph()


def plan_trip(request: TripRequest) -> TripPlan:
    result = planner_graph.invoke({"request": request, "trace": []})
    interests = ", ".join(request.interests[:2]) or "local culture"
    return TripPlan(
        id=f"trip-{uuid4().hex[:12]}",
        destination=request.destination,
        summary=f"A {request.pace} itinerary centered on {interests}, compact routing, and practical buffers.",
        itinerary=result["itinerary"],
        budget=result["budget"],
        safety_notes=result["safety_notes"],
        agent_trace=result["trace"],
        mode=result.get("mode", "fallback"),
    )
