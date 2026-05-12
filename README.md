# ⚽ World Cup 2026 — Prediction & Score Tracker

A mobile-first app for tracking the 2026 FIFA World Cup: live scores, bracket predictions, group competitions, and leaderboards.

## Quick Start

```bash
npm install
npm run dev
```

## Project Structure

See [`docs/architecture.md`](./docs/architecture.md) for a full breakdown of the folder structure and data flow.

## Key Features

- 📅 Full tournament schedule with live scores
- 🏆 Bracket predictions with scoring
- 👥 Private friend groups
- 📊 Leaderboards (global + per group)
- 🔮 Prediction vs. crowd comparison

## Stack

- **Framework**: React Native (Expo)
- **State**: Zustand
- **API**: REST + WebSockets for live scores
- **Auth**: JWT / OAuth (Google, Apple)
- **Backend**: See `/docs/architecture.md`

## Docs

- [Architecture](./docs/architecture.md)
- [Setup](./docs/setup.md)
- [Scoring Rules](./docs/scoring-rules.md)
- [Deployment](./docs/deployment.md)
- [Contributing](./CONTRIBUTING.md)
