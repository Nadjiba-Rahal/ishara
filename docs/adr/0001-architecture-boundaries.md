# ADR 0001: Architecture Boundaries

## Status

Accepted

## Context

ISHARA needs to support web, mobile, backend, ML research, ONNX inference, and future avatar animation without duplicating business logic.

## Decision

Use a monorepo with a Clean Architecture backend:

- Domain owns core entities and rules.
- Application owns use cases and contracts.
- Infrastructure owns persistence and external implementations.
- API owns transport concerns.

Python remains the training and research environment. Exported ONNX models are consumed by .NET for production inference.

## Consequences

The codebase can grow without coupling clients directly to ML experiments or persistence details. It also makes the Python-to-C# inference story clear for portfolio and research value.
