"""Small evaluation helpers with no third-party dependencies."""

from __future__ import annotations


def accuracy(expected: list[str], predicted: list[str]) -> float:
    if len(expected) != len(predicted) or not expected:
        raise ValueError("expected and predicted must have equal non-zero length")
    return sum(a == b for a, b in zip(expected, predicted)) / len(expected)