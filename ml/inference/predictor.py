"""Stable model prediction result format."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone

from training.baseline import NearestCentroid


@dataclass(frozen=True)
class PredictionResult:
    available: bool
    label: str | None
    confidence: float | None
    top_predictions: list[dict[str, float | str]]
    timestamp: str
    model_version: str | None


def predict(model: NearestCentroid | None, vector: list[float], model_version: str | None = None) -> dict:
    timestamp = datetime.now(timezone.utc).isoformat()
    if model is None:
        return asdict(PredictionResult(False, None, None, [], timestamp, None))
    label, confidence = model.predict(vector)
    return asdict(PredictionResult(True, label, confidence, [{"label": label, "confidence": confidence}], timestamp, model_version))