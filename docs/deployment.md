# Deployment

## Mobile
- **iOS**: EAS Build → App Store Connect
- **Android**: EAS Build → Google Play Console

```bash
npx eas build --platform all
npx eas submit
```

## OTA Updates
Non-breaking JS changes can be pushed via Expo Updates without a store submission.

## CI/CD
See `.github/workflows/ci.yml` and `deploy.yml`.
