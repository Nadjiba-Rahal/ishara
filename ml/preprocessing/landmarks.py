"""Small, dependency-free landmark preprocessing primitive.

The input format is intentionally simple so MediaPipe/OpenCV adapters can be
added without coupling the training code to a camera implementation.
"""

from __future__ import annotations

from math import sqrt
from typing import Iterable, Sequence


def normalize_landmarks(points: Iterable[Sequence[float]]) -> list[float]:
    values = [(float(p[0]), float(p[1]), float(p[2]) if len(p) > 2 else 0.0) for p in points]
    if not values:
        raise ValueError("at least one landmark is required")
    origin = values[0]
    centered = [(x - origin[0], y - origin[1], z - origin[2]) for x, y, z in values]
    scale = max((sqrt(x * x + y * y + z * z) for x, y, z in centered), default=0.0)
    if scale == 0:
        scale = 1.0
    return [coordinate / scale for point in centered for coordinate in point]