# ADR 001 — State Management: Zustand + React Query

## Status
Accepted

## Context
Needed client state (auth, draft predictions) and server state (matches, leaderboard) management.

## Decision
- **React Query** for all server state — caching, refetching, background sync
- **Zustand** for UI/client state — auth token, draft prediction inputs

## Consequences
- No Redux boilerplate
- Clear separation: server data never lives in Zustand
