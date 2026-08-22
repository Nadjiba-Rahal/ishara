# ISHARA ML

Machine-learning workspace for Algerian Sign Language research.

Planned flow:

1. Collect or adapt legally usable ALSL data.
2. Extract MediaPipe landmarks.
3. Build signer-independent train/validation/test splits.
4. Train an isolated-sign recognition baseline.
5. Export to ONNX.
6. Integrate inference into the .NET backend with ONNX Runtime.

No datasets or model weights are committed by default.

## Current implementation

`preprocessing/landmarks.py` provides translation/scale normalization and
`data/loader.py` reads user-provided JSONL landmark records. Run
`python ml/smoke_test.py` from the repository root to verify the plumbing with
a synthetic fixture labelled `DEVELOPMENT_ONLY`. This is not ALSL data and not
a recognition model.

`training/baseline.py` contains a small nearest-centroid baseline,
`evaluation/metrics.py` provides accuracy, and `inference/predictor.py` defines
the stable prediction result shape. Run `python ml/end_to_end_smoke_test.py` to
exercise loading → splitting → training → evaluation → serialization contract
on synthetic development labels. Its output must never be described as ALSL
accuracy.

The API exposes `GET /api/recognition/status` and
`POST /api/recognition/predict`. Until a legally obtained, evaluated ALSL model
and its inference adapter are supplied, the backend returns
`Recognition model is not available` and never emits a predicted sign.
