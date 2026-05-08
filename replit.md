# ATMOS

Climate fintech mobile app for carbon markets — lets project developers (farmers, biochar producers) verify carbon reductions via AI+satellite, generate ZK proofs, mint carbon assets on Solana, and sell via Dodo Payments.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- Expo (SDK 54), React Native, TypeScript, Expo Router (file-based navigation)
- Fonts: Inter (400/500/600/700) via @expo-google-fonts/inter
- Icons: @expo/vector-icons (Feather)
- Auth: Phone OTP (mock, 6-digit any code works in demo)
- State: React Context (AuthContext, AtmosContext) + AsyncStorage
- Charts: react-native-svg + custom SparklineChart component
- API hooks: @tanstack/react-query

## Where things live

- `artifacts/mobile/` — Expo React Native app
- `artifacts/mobile/app/` — All screens (Expo Router file-based)
- `artifacts/mobile/app/(auth)/` — Auth screens (index + OTP)
- `artifacts/mobile/app/(tabs)/` — Main app (Home, Projects, Market, Portfolio, Profile)
- `artifacts/mobile/app/project/` — Project creation flow (create, capture)
- `artifacts/mobile/app/verify/[id].tsx` — AI Verification screen (animated)
- `artifacts/mobile/app/zk/[id].tsx` — ZK Proof generation screen (animated)
- `artifacts/mobile/app/asset/[id].tsx` — Asset creation success screen
- `artifacts/mobile/app/payment/[id].tsx` — Dodo Payments screen
- `artifacts/mobile/app/settlement/[id].tsx` — Settlement + certificate screen
- `artifacts/mobile/components/` — Reusable components
- `artifacts/mobile/context/` — AuthContext, AtmosContext (mock data)
- `artifacts/mobile/constants/colors.ts` — ATMOS dark theme tokens
- `artifacts/mobile/assets/images/` — AI-generated: icon, splash_bg, biochar_hero, agroforestry_hero

## Architecture decisions

- **Dark-only theme**: ATMOS always forces dark mode (#07110B bg, #0DFF6E primary, #00D4FF secondary)
- **Mock-first**: All data (projects, assets, payments) is mocked in AtmosContext with AsyncStorage persistence for new items — no backend required for demo
- **ZK proof simulation**: Steps animated with Groth16 terminology; proof hash stored per project
- **Solana mint**: Simulated with a random mint address stored in project state
- **Auth**: 6-digit OTP (any 6 digits work in demo) stored in AsyncStorage
- **Navigation**: Root Stack with (auth) group and (tabs) group; Stack screens for all flow screens

## Product

Full user journey implemented:
1. **Auth** → phone + OTP (demo: any 6 digits) + Google/Apple login buttons
2. **Dashboard** → total CO₂ assets, sparkline chart, activity feed
3. **Create Project** → 9 project types (biochar, agroforestry, solar, EV, building, shipping, aviation, city, individual)
4. **Capture Data** → 3-step form with **project-specific fields per type** (e.g. solar gets owner name, kW capacity, panel count, kWh generation; biochar gets biomass input, equipment type, feedstock type; etc.) + **real camera/gallery image picker** with thumbnail preview
5. **AI Verification** → 4-phase animation + **real Anthropic AI carbon calculation** via `/api/verify`, methodology-specific (e.g. AMS-I.D for solar, VM0044 for biochar), with full explanation
6. **ZK Proof** → animated 3-step proof generation with privacy disclosure
7. **Asset Created** → SPL token mint on Solana with asset details card
8. **Marketplace** → search, filter by type+grade, browse 5 assets
9. **Payment** → UPI / USDC via Dodo Payments, fee breakdown
10. **Settlement** → Solana recording animation + gold-border carbon certificate

## AI Integration

- `POST /api/verify` — Anthropic claude-haiku AI computes real CO₂ reduction based on project type + metadata
- Uses certified methodologies: VM0044 (biochar), AMS-I.D (solar, 0.82 kgCO₂/kWh Indian grid), ACM0003 (agroforestry), AMS-III.C (EV), etc.
- Returns: co2 (tonnes), confidence (0-100), grade (S/A/B/C/D), fraudRisk, explanation, pricePerTonne
- AI key provisioned via Replit AI Integrations (no user API key needed)

## User preferences

- Dark-only UI — no light mode
- ATMOS branding: primary #0DFF6E (green), secondary #00D4FF (cyan), bg #07110B
- Production-quality screens, no placeholders, no lorem ipsum
- Demo: any 6-digit OTP works for sign-in
- Production-ready: real AI carbon calculations, real camera/image picker, real OAuth flow structure
- Google login: uses expo-web-browser OAuth flow; set EXPO_PUBLIC_GOOGLE_CLIENT_ID to enable real Google sign-in (falls back to demo user if not set)
- Apple login: creates demo user (native Apple Sign-In requires development build)

## Gotchas

- `useColors()` always returns dark palette regardless of device color scheme
- Bottom tab padding: web uses `insets.top + 67` / `insets.bottom + 34` to account for proxy bar
- `react-native-svg` must be installed for SparklineChart
- `@react-native-async-storage/async-storage` is pre-installed in the scaffold

## Pointers

- See the `expo` skill for Expo-specific patterns
- See the `pnpm-workspace` skill for workspace structure
