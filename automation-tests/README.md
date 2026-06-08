# ATMOS Automation Tests

This is a separate automation testing folder for full app backend flow validation.

## What it tests
- Backend health
- OTP send (dev mode)
- OTP verify + token issuance
- Authenticated profile fetch (`/auth/me`)
- Project creation
- MRV pipeline polling (status progression)
- Projects list includes created project

## Prerequisites
1. Backend is running at `http://localhost:3000`
2. Database is connected
3. Backend dev OTP mode is enabled (Twilio not configured), so `devOtp` is returned

## Setup
```bash
cd automation-tests
npm install
```

## Config
Copy `.env.example` to `.env` and adjust if needed.

```bash
API_BASE_URL=http://localhost:3000
PIPELINE_TIMEOUT_MS=120000
POLL_INTERVAL_MS=5000
```

## Run tests
```bash
cd automation-tests
npm test
```

Or run only the full E2E file:
```bash
cd automation-tests
npm run test:full
```

## Run 100+ production-level automation suite
```bash
cd automation-tests
npm run test:production
```

This suite adds high-volume production-style coverage including:
- Payload validation matrix (auth + project create)
- Authorization enforcement checks on protected endpoints
- Project list query-contract checks across pagination/status filters
- Refresh token failure-path checks
- Reliability checks for authenticated `/auth/me`

## Generate CI reports (JUnit + HTML)
```bash
cd automation-tests
npm run test:production:report
```

Generated artifacts:
- `reports/production.tap`
- `reports/junit.xml`
- `reports/junit.html`

## Run performance smoke automation
```bash
cd automation-tests
npm run perf:smoke
```

Generated artifact:
- `reports/perf-smoke.json`

## Run mobile UI automation (Playwright)
```bash
cd automation-tests
npm run ui:mobile
```

Environment variable:
- `MOBILE_UI_BASE_URL` (default: `http://localhost:8083`)

Generated artifacts:
- `reports/ui-html/index.html`
- `reports/ui-junit.xml`

## Notes
- These tests are intentionally sequential to mimic real user flow.
- A unique phone number is generated per run.
- If Twilio is enabled in backend, test `02` will fail because `devOtp` is not exposed.
