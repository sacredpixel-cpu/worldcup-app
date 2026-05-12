# Architecture

## Overview

Mobile-first React Native (Expo) app with a REST + WebSocket backend.

## Folder Map

```
src/
  app/          — screens (Expo Router file-based routing)
  components/   — UI components, organized by feature
  hooks/        — React Query hooks, one file per domain
  services/     — raw API calls, no UI logic
  store/        — Zustand slices for client state
  types/        — TypeScript interfaces shared across the app
  lib/
    api/        — base fetch client
    constants/  — scoring rules, tournament config, route names
    utils/      — pure helper functions
  styles/       — global tokens and theme
```

## Data Flow

1. Screen mounts → calls a `useXxx()` hook
2. Hook uses React Query to call a `xxxService` function
3. Service calls `apiClient` which attaches auth token
4. Response is typed via `src/types/`
5. UI-only state (draft predictions, modal open) lives in Zustand

## Live Scores
WebSocket connection opened on app launch, updates match status in React Query cache directly.

## Auth
JWT stored in SecureStore (Expo). Injected into every request by `apiClient`.
