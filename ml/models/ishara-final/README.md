# Installed recognition model

This directory contains the exported VDzSL v2 model package used by the
backend recognition service.

Keep these matching files from one training run together:

- `model.onnx`
- `labels.json`
- `metadata.json`

The backend reads the frame and feature dimensions from `metadata.json`; the
web app supports 258 raw features or 516 raw-plus-velocity features. Never mix
files from different training runs.
