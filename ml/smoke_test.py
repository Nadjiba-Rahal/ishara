"""Pipeline smoke test using clearly synthetic development fixtures.

This verifies loading and normalization only. It is not a trained model and
does not claim ALSL recognition accuracy.
"""

import json
import tempfile
from pathlib import Path

from data.loader import load_landmarks_jsonl


def main() -> None:
    with tempfile.TemporaryDirectory() as directory:
        fixture = Path(directory) / "development_fixture.jsonl"
        fixture.write_text(json.dumps({
            "label": "DEVELOPMENT_ONLY",
            "landmarks": [[0, 0, 0], [2, 0, 0], [0, 2, 0]],
        }) + "\n", encoding="utf-8")
        rows = list(load_landmarks_jsonl(fixture))
        assert len(rows) == 1 and len(rows[0][1]) == 9
    print("ML pipeline smoke test passed (synthetic development fixture only).")


if __name__ == "__main__":
    main()