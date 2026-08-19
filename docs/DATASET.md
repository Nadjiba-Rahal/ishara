# Dataset Policy

ISHARA must not fabricate ALSL data.

Before using any dataset:

1. Verify actual availability.
2. Inspect the license.
3. Document attribution requirements.
4. Avoid redistributing restricted data.
5. Build adapters rather than hard-coding dataset assumptions.

Train/validation/test splits must be signer-independent. Frames from the same recording must not be split across train and test.
