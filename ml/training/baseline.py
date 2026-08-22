"""Dependency-free baseline classifier for normalized landmark vectors.

This is intentionally a nearest-centroid baseline, not a claim of ALSL
performance. It makes the supplied real dataset a drop-in training input.
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Iterable


def split_rows(rows: list[tuple[str, list[float]]], validation_ratio: float = 0.2):
    if not rows:
        raise ValueError("cannot split an empty dataset")
    cut = max(1, int(len(rows) * (1 - validation_ratio)))
    return rows[:cut], rows[cut:] or rows[:1]


class NearestCentroid:
    def __init__(self) -> None:
        self.centroids: dict[str, list[float]] = {}

    def fit(self, rows: Iterable[tuple[str, list[float]]]) -> "NearestCentroid":
        grouped: dict[str, list[list[float]]] = defaultdict(list)
        for label, vector in rows:
            grouped[label].append(vector)
        if not grouped:
            raise ValueError("cannot train without rows")
        self.centroids = {
            label: [sum(values) / len(values) for values in zip(*vectors)]
            for label, vectors in grouped.items()
        }
        return self

    def predict(self, vector: list[float]) -> tuple[str, float]:
        if not self.centroids:
            raise RuntimeError("model is not trained")
        distances = sorted(
            ((sum((a - b) ** 2 for a, b in zip(vector, centroid)), label)
             for label, centroid in self.centroids.items()),
            key=lambda item: item[0],
        )
        distance, label = distances[0]
        confidence = 1.0 / (1.0 + distance)
        return label, confidence

    def save(self, path: str | Path, *, dataset_version: str, model_version: str) -> None:
        Path(path).write_text(json.dumps({
            "model_type": "nearest_centroid",
            "model_version": model_version,
            "dataset_version": dataset_version,
            "labels": self.centroids,
        }, indent=2), encoding="utf-8")

    @classmethod
    def load(cls, path: str | Path) -> "NearestCentroid":
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
        model = cls()
        model.centroids = payload["labels"]
        return model