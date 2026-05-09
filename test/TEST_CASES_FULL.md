# ATMOS Full Test Cases

Date: 2026-05-09
Owner: QA + Engineering
Version: 1.0

## 1. Scope

This suite covers:
- Mobile app flows in app/mobile
- API server flows in app/api-server
- User-reported defects:
  - Mint address and Solana Explorer mismatch
  - Project not listed in marketplace after generation
  - Marketplace page still mock/static
  - Home page still mock/static
  - Satellite map preview not working

References used:
- ATMOS Mobile Production Blueprint - Critical Cross-Check
- Current code in app/mobile and app/api-server

## 2. Environments

Use at least these environments for execution:
- ENV-1 Local Dev
  - API: http://127.0.0.1:8080
  - Mobile: Expo dev client
  - DODO_MODE=demo and DODO_MODE=live
- ENV-2 Staging-like
  - Real API URL in EXPO_PUBLIC_DOMAIN
  - GOOGLE_MAPS_API_KEY configured
  - DODO webhook secret configured
- ENV-3 Solana Devnet validation
  - Real devnet mint/tx signatures available
  - Explorer cluster=devnet checks required

## 3. Entry / Exit Criteria

Entry criteria:
- Build installs and launches for mobile and api-server
- Required env vars are set for target test tier

Exit criteria:
- P0 tests: 100% pass
- P1 tests: >= 95% pass
- No open blocker for minting, listing, payment webhook, verify flow

## 4. Test Data Matrix

- TD-001 Valid biochar project
  - type=biochar
  - metadata includes biomassInput, biocharOutput, landBoundaryPolygon (>=3 points)
- TD-002 Valid agroforestry project
  - type=agroforestry with treeCount and area
- TD-003 Invalid boundary polygon
  - landBoundaryPolygon malformed JSON
- TD-004 Boundary with less than 3 points
- TD-005 Payment payload valid
  - assetId, amount, currency, buyerName, buyerEmail
- TD-006 Webhook with valid signature
- TD-007 Webhook duplicate event id
- TD-008 Mint address placeholder string
  - Example: AtmosSolABC123

## 5. Critical Regression Suite (User Reported)

| ID | Priority | Area | Precondition | Steps | Expected Result | Current Build Expectation |
|---|---|---|---|---|---|---|
| REG-001 | P0 | Minting | Open asset creation flow | Create project -> verify -> open asset screen | Mint uses real Solana mint call and returns valid base58 mint | FAIL likely (local random string mint address) |
| REG-002 | P0 | Mint format | Mint completed | Capture minted address shown in UI | Address matches base58 format and known token mint length | FAIL likely |
| REG-003 | P0 | Explorer link | Settlement page open | Tap View on Explorer | Opens explorer with valid tx signature that exists on devnet | FAIL likely (demo tx id) |
| REG-004 | P0 | Explorer consistency | Mint + settlement complete | Compare mint address and tx records between screens | Mint and tx are traceable to same on-chain transaction set | FAIL likely |
| REG-005 | P0 | Marketplace listing | New project minted | Tap List on Market from asset screen | New asset is created in marketplace data source and visible in market tab | FAIL likely (no creation path from updateProject to assets) |
| REG-006 | P0 | Marketplace dynamic data | API running | Refresh market tab after creating and minting a project | Data should come from API and include newly minted asset | FAIL likely (context mock list) |
| REG-007 | P1 | Home dynamic totals | Have new minted project | Return to home tab | totals (CO2/value/activity) update from real persisted records | PARTIAL/FAIL likely (hardcoded activity and stats) |
| REG-008 | P1 | Home recent activity | Complete verify + payment | Open home tab | Recent activity includes real events from user actions | FAIL likely |
| REG-009 | P0 | Satellite preview button | GPS captured in capture form | Tap Preview Map | External map opens with center near captured coordinates | PASS/PARTIAL |
| REG-010 | P0 | Satellite backend live check | GOOGLE_MAPS_API_KEY set and polygon provided | Submit project -> verify | verify response satellite.source=google-static-maps and imageryAvailable=true | PASS expected if key valid |
| REG-011 | P0 | Satellite fallback clarity | No GOOGLE_MAPS_API_KEY | Submit project -> verify | response clearly indicates mock fallback and reason | PASS expected |
| REG-012 | P1 | Boundary propagation | Enter boundary polygon in capture | Submit and inspect verify result | boundary point count reflected in satellite boundaryPoints | PASS expected |
| REG-013 | P0 | Persisted mint data | Mint once and restart app | Reopen same project | Mint address remains stable and unchanged | FAIL likely (new random address each render path) |
| REG-014 | P0 | Multi-user realism | Two users with separate data | Mint/list as user A, login user B | User B sees listed asset if marketplace is global | FAIL likely (local mock context only) |
| REG-015 | P1 | Error handling UX | Break network during verify/payment | Run flow | User gets clear error and retry option without corrupting state | PARTIAL |

## 6. API Test Cases

### 6.1 Verify API: POST /api/verify

| ID | Priority | Preconditions | Steps | Expected |
|---|---|---|---|---|
| API-VER-001 | P0 | API up | POST with valid type + metadata | 200 with co2, confidence, grade, fraudRisk, methodology |
| API-VER-002 | P0 | API up | POST missing type | 400 with error message |
| API-VER-003 | P1 | API up | POST unknown type value | 200 with fallback methodology and bounded grade |
| API-VER-004 | P1 | API up + no Anthropic key | POST valid payload | Returns fallback values, no server crash |
| API-VER-005 | P0 | API up + GOOGLE_MAPS_API_KEY missing | POST with boundary polygon | satellite.source=mock and evidenceSummary explains fallback |
| API-VER-006 | P0 | API up + GOOGLE_MAPS_API_KEY valid | POST with valid polygon | satellite.source=google-static-maps and imageryAvailable=true |
| API-VER-007 | P1 | API up | POST malformed boundary JSON | No crash; boundaryPoints=0; response still valid |
| API-VER-008 | P1 | API up | Validate confidence range | confidence always in [0,100] |
| API-VER-009 | P1 | API up | Validate grade mapping against confidence | grade follows S/A/B/C/D thresholds |
| API-VER-010 | P2 | API up | Send large metadata object | Handles safely, returns in acceptable latency |

### 6.2 Payments API: POST /api/payments/dodo/create

| ID | Priority | Preconditions | Steps | Expected |
|---|---|---|---|---|
| API-PAY-001 | P0 | DODO_MODE=demo | POST valid payment payload | 200, success=true, mock=true, paymentUrl returned |
| API-PAY-002 | P0 | Any mode | POST missing amount | 400 error |
| API-PAY-003 | P0 | Any mode | POST missing assetId | 400 error |
| API-PAY-004 | P1 | live mode + invalid key | POST valid payload | graceful fallback response with mock/fallback mode |
| API-PAY-005 | P1 | live mode + valid key | POST valid payload | paymentId + payment link from provider |

### 6.3 Webhook API: POST /api/payments/dodo/webhook

| ID | Priority | Preconditions | Steps | Expected |
|---|---|---|---|---|
| API-WEB-001 | P0 | Secret configured | Send payload with valid signature | 200 received=true |
| API-WEB-002 | P0 | Secret configured | Send invalid signature | 401 invalid webhook signature |
| API-WEB-003 | P0 | Secret configured | Replay same event id | duplicate=true and idempotent handling |
| API-WEB-004 | P1 | Secret not configured | Send any webhook | Rejected with 401 |

## 7. Mobile Functional Test Cases

### 7.1 Capture and Verification

| ID | Priority | Steps | Expected |
|---|---|---|---|
| MOB-CAP-001 | P0 | Fill Step-1 required fields only | Next button enabled only when mandatory data valid |
| MOB-CAP-002 | P0 | Capture GPS without permission | Permission error shown and no crash |
| MOB-CAP-003 | P1 | Add GPS point to boundary | boundary count increases |
| MOB-CAP-004 | P0 | Submit project with valid metadata | Creates project with status=verifying and navigates to verify |
| MOB-CAP-005 | P1 | Submit with malformed numeric values | Numeric parsing handles gracefully |
| MOB-VER-001 | P0 | Complete verify flow online | Project updates to verified with co2/confidence/grade |
| MOB-VER-002 | P0 | Verify flow offline/API down | fallback estimate shown, app remains functional |
| MOB-VER-003 | P1 | Reopen verify for already verified project | Uses cached state and does not re-run full pipeline |

### 7.2 Mint, Market, Home

| ID | Priority | Steps | Expected |
|---|---|---|---|
| MOB-MINT-001 | P0 | Mint first time | Project status changes to minted and address shown |
| MOB-MINT-002 | P0 | Reopen minted asset | Same address persists |
| MOB-MKT-001 | P0 | Tap List on Market after mint | Asset appears in market list |
| MOB-MKT-002 | P1 | Use search text in market | Results filter by name/location |
| MOB-MKT-003 | P1 | Filter by type and grade | Correct subset shown |
| MOB-HOME-001 | P0 | Mint additional project then open home | totalCO2 and value reflect new state |
| MOB-HOME-002 | P1 | Validate active project count | Count reflects verifying/verified/minted projects |
| MOB-HOME-003 | P1 | Validate recent activity data source | Activity should be data-driven, not hardcoded |

### 7.3 Settlement and Explorer

| ID | Priority | Steps | Expected |
|---|---|---|---|
| MOB-SET-001 | P0 | Open settlement after payment | Recording phase transitions to complete |
| MOB-SET-002 | P0 | Tap View on Explorer | Opens valid explorer tx URL |
| MOB-SET-003 | P0 | Share certificate | Share payload includes tx id and asset data |
| MOB-SET-004 | P1 | Open certificate modal | Data matches settlement summary |

## 8. Integration Test Cases

| ID | Priority | Scenario | Expected |
|---|---|---|---|
| INT-001 | P0 | Capture -> Verify -> ZK -> Mint -> Market list | End-to-end state transition successful and consistent |
| INT-002 | P0 | Verify response metadata propagation into project state | methodology, explanation, pricePerTonne stored |
| INT-003 | P0 | Payment create -> settlement screen data binding | amount, tx id, asset details consistent |
| INT-004 | P1 | Webhook duplicate handling | No duplicate settlement side effects |
| INT-005 | P1 | App restart after verify/mint | Persisted state restored accurately |
| INT-006 | P0 | Boundary polygon in capture -> API satellite parser | boundaryPoints and area values coherent |

## 9. Security and Abuse Test Cases

| ID | Priority | Scenario | Expected |
|---|---|---|---|
| SEC-001 | P0 | Webhook signature tampering | request rejected |
| SEC-002 | P0 | Replay webhook event | deduplicated |
| SEC-003 | P1 | Oversized verify payload | API rejects or handles within limits without crash |
| SEC-004 | P1 | Script injection in text metadata | Stored/rendered safely |
| SEC-005 | P1 | Invalid map coordinates out of bounds | clamped/sanitized; no crash |

## 10. Non-Functional Test Cases

| ID | Priority | Scenario | Threshold |
|---|---|---|---|
| NFT-001 | P1 | Verify API latency (fallback path) | p95 < 2.5s |
| NFT-002 | P1 | Verify API latency (live AI path) | p95 < 8s |
| NFT-003 | P1 | Market tab initial render (100 assets) | < 2s on mid device |
| NFT-004 | P2 | App memory stability during 20 sequential verify flows | no crash/OOM |
| NFT-005 | P1 | Payment create endpoint under burst load | no 5xx at agreed RPS |

## 11. Current Known Gaps (Expected Failures)

These are expected to fail until implementation is hardened:
- Real on-chain mint linkage is not implemented in mobile asset flow.
- Settlement tx id is demo/fallback string in many paths, not real signature.
- Marketplace list is driven by context mock data, not backend persistence.
- Home screen activity blocks are hardcoded examples.
- DB schema/persistence for projects/assets/payments is incomplete in runtime flow.

## 12. Automation Plan

Recommended automation split:
- Unit tests
  - API utility functions: signature verification, boundary parsing, area estimation
  - Mobile state helpers and reducers in context logic
- Integration tests
  - Supertest for /api/verify, /api/payments/dodo/create, /api/payments/dodo/webhook
- E2E tests
  - Detox/Expo for create -> verify -> mint -> market path
  - Explorer link smoke checks

Suggested CI gates:
- Gate-1: unit + lint + typecheck on every PR
- Gate-2: API integration tests on PR and main
- Gate-3: nightly mobile E2E smoke

## 13. Traceability to Reported Bugs

Bug-1 Solana explorer/mint mismatch:
- Covered by REG-001, REG-002, REG-003, REG-004, MOB-MINT-002, MOB-SET-002

Bug-2 Project not listed in marketplace:
- Covered by REG-005, REG-006, MOB-MKT-001, INT-001

Bug-3 Marketplace still mock/static:
- Covered by REG-006, MOB-MKT-001, MOB-MKT-003, INT-001

Bug-4 Home page still mock/static:
- Covered by REG-007, REG-008, MOB-HOME-001, MOB-HOME-003

Bug-5 Satellite connection map preview not working:
- Covered by REG-009, REG-010, REG-011, REG-012, INT-006

## 14. Execution Template

For each test execution record:
- Test ID
- Build SHA
- Environment
- Tester
- Status (Pass/Fail/Blocked)
- Evidence (screenshots/video/log)
- Defect ID if failed
