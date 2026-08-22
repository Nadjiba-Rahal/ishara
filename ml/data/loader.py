"""Loader for user-provided ALSL landmark fixtures (JSON Lines).

Each line must contain {"label": "...", "landmarks": [[x, y, z], ...]}.
The repository intentionally contains no ALSL dataset or labels.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterator

from preprocessing.landmarks import normalize_landmarks


def load_landmarks_jsonl(path: str | Path) -> Iterator[tuple[str, list[float]]]:
    for line_number, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        record = json.loads(line)
        if not isinstance(record.get("label"), str) or not record["label"].strip():
            raise ValueError(f"line {line_number}: label is required")
        yield record["label"], normalize_landmarks(record["landmarks"])