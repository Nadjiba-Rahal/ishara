# Installed recognition model

The ISHARA VDzSL v2 model is installed in this folder. The app reads
`metadata.json` at load time and configures itself automatically, so replacing
the model later does not require a code change. Keep these 3 files from the
same training run together:

- `model.onnx`
- `labels.json`
- `metadata.json`

That's it. Reload the page.

## What the app expects

- `metadata.json` must contain at least: `frames`, `features_per_frame`,
  `input_name`, `output_name`.
- `features_per_frame` can be **258** (position only) or **516**
  (position + velocity, frame-to-frame delta) — the app detects which one
  automatically and builds the right input tensor either way.
- `labels.json` maps `"<class_index>": "<Arabic sign text>"`.
- `model.onnx` takes a `[1, frames, features_per_frame]` float32 tensor named
  `input_name` and returns raw (pre-softmax) logits of shape
  `[1, num_classes]` named `output_name`.

## Normalization the model was trained with (must match exactly)

- `center` = midpoint of pose landmarks 23 (left hip) and 24 (right hip)
- `scale` = distance between pose landmarks 11 (left shoulder) and 12 (right shoulder)
- every landmark (pose + both hands) → `(point - center) / max(scale, 1e-4)`
- pose keeps its 4th value (visibility); hands do not have a visibility value

The web app's `translate/page.tsx` already implements this exact formula —
you do not need to touch it. This file just documents it so the training
notebook and the app never drift apart again.

The installed model was evaluated at 59.16% stratified validation accuracy
and 54.51% on the held-out signer test. These are training-run metrics, not a
guarantee of camera accuracy for every user or environment.
