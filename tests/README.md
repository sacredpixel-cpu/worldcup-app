# Tests

## Structure

- `unit/`        — pure function and hook tests (Jest)
- `integration/` — service + store integration tests
- `e2e/`         — end-to-end flows (Maestro or Detox)

## Running

```bash
npm test              # unit + integration
npm run test:e2e      # e2e (requires running device)
```

## Coverage target: 70%+ on services and hooks
