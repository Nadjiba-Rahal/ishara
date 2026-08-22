# Model Card

The supplied `IsharaFinal` ONNX model is included under
`ml/models/ishara-final/`. Its metadata identifies the dataset as VDzSL, with
415 classes, 16 frames, and 258 features per frame. Reported evaluation is
55.63% validation accuracy and 44.48% unseen-signer test accuracy. These
figures come from the supplied metadata and should be re-evaluated for any
new capture pipeline or deployment.

Future model cards must document:

- Task name
- Model version
- Dataset version
- Training data source and license
- Input format
- Output format
- Confidence interpretation
- Evaluation methodology
- Accuracy, precision, recall, F1
- Signer-independent performance
- Per-sign metrics
- Latency
- Known failure cases
- Appropriate and inappropriate uses
