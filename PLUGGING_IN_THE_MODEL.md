# Plugging in the trained model

The translate page is fully built and works right now in **tracking-only
preview mode** — camera, hand/pose overlay, and the sentence-builder UI all
run without a model. Recognition just stays off until you add one.

## When your Colab training finishes

1. Download `ishara-model.zip` from the last export cell.
2. Unzip it — you'll get `model.onnx`, `labels.json`, `metadata.json`.
3. Copy all three matching files into both model slots:
   ```
   apps/web/public/model/
    ml/models/ishara-final/
   ```
4. Restart the API and reload the translate page.

The page and API read `metadata.json` and configure their input shape, feature
count (258 or 516, position-only or position+velocity), and input/output tensor
names from it automatically. Never combine files from separate runs.

## What used to be broken, now fixed

- **Normalization mismatch** — the browser was normalizing hand landmarks
  completely differently from how the training notebook did (wrist-relative
  vs. hip-centered/shoulder-scaled). Now identical on both sides — see
  `apps/web/public/model/README.md` for the exact formula.
- **Handedness bug** — hands were assigned to "left"/"right" by detection
  order, not by MediaPipe's actual handedness label. Fixed.
- **Sliding-window contamination** — after a sign was confirmed, the 16-frame
  buffer kept sliding instead of resetting, so the next prediction was often
  half made of the previous sign's trailing frames. Now the buffer clears on
  confirmation, which also acts as a natural debounce.
- **No sentence building** — the old page only ever showed one prediction at
  a time and threw it away on the next one. There's now a persistent,
  animated transcript with space/backspace/clear/copy controls.
- **`disabled={!session.current}` on the Start button** — reading a ref
  directly in render doesn't reliably reflect its latest value in React;
  replaced with real state (`trackingReady` / `modelReady`).
- **No visual feedback during capture** — added a live hand/pose overlay
  (skeleton + AR-style bounding brackets), a frame-buffer fill ring, and a
  streak-confidence bar, all driven by data already being computed each
  frame (no extra inference cost).

## Two accuracy numbers you'll see in `metadata.json`

- `stratified_validation_accuracy` — signers the model has seen before.
  This is closer to what a demo or "you personally" feels like.
- `unseen_signer_test_accuracy` — a signer the model never trained on. This
  is the honest "random new user" number. Expect it to be lower — that gap
  is a real, known limitation of a 4-signer dataset, not a bug.
