# HimBean — Cross-Platform Mobile Foundation

The production mobile app's foundation (Expo / React Native, iOS + Android), sharing the web
backend (`/api/*`) and brand tokens (`theme.ts`, synced with web `globals.css`).

```bash
cd mobile && npx expo install && npx expo start
```

Set `EXPO_PUBLIC_API_BASE` to your deployed web URL.

## Milestones

**Phase 1 — Foundation (this release)**
Shared design system, tab shell, API integration points, 8-point grid, accessible tab bar.

**Phase 2 — Commerce**
Auth.js session bridge, order-ahead against `/api/orders`, live Altitude Perks from
`/api/rewards/me` (tier ladder with visible ranges), QR pickup rendering, saved orders,
subscription management via `/api/subscriptions`.

**Phase 3 — Engagement**
Push notifications (Firebase FCM/APNs), offline support, wallet, personalized home.
