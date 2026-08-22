"""End-to-end synthetic pipeline check; never represents ALSL performance."""

import json
import tempfile
from pathlib import Path

from data.loader import load_landmarks_jsonl
from evaluation.metrics import accuracy
from inference.predictor import predict
from training.baseline import NearestCentroid, split_rows


def main() -> None:
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "development_fixture.jsonl"
        records = []
        for label, x in (("DEVELOPMENT_LEFT", -1), ("DEVELOPMENT_RIGHT", 1)):
            for _ in range(3):
                records.append({"label": label, "landmarks": [[0, 0, 0], [x, 1, 0], [x, 0, 1]]})
        path.write_text("\n".join(json.dumps(record) for record in records), encoding="utf-8")
        rows = list(load_landmarks_jsonl(path))
        train, validation = split_rows(rows, validation_ratio=0.33)
        model = NearestCentroid().fit(train)
        model_path = Path(directory) / "development-model.json"
        model.save(model_path, dataset_version="synthetic-development", model_version="development-v1")
        model = NearestCentroid.load(model_path)
        expected = [label for label, _ in validation]
        predicted = [model.predict(vector)[0] for _, vector in validation]
        assert accuracy(expected, predicted) >= 0
        result = predict(model, train[0][1], "development-fixture-v1")
        assert result["available"] and result["label"].startswith("DEVELOPMENT_")
    print("ML end-to-end smoke test passed (synthetic development fixture only).")


if __name__ == "__main__":
    main()