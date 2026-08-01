from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class Destination:
    id: str
    name: str
    region: str = ""
    city: str = ""
    latitude: float | None = None
    longitude: float | None = None
    category: str = ""


@dataclass(slots=True)
class Candidate:
    source: str
    title: str
    image_url: str
    original_source_url: str
    license: str = "unknown"
    photographer: str = ""
    width: int | None = None
    height: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    category_terms: list[str] = field(default_factory=list)
    query: str = ""
    source_id: str = ""
    score: float = 0.0
    rejection_reasons: list[str] = field(default_factory=list)
    score_breakdown: dict[str, float] = field(default_factory=dict)
    raw: dict[str, Any] = field(default_factory=dict)
