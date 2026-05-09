# ATMOS Bug-Wise Smoke Checklist (User Testing)

Date: 2026-05-10
Session type: Pre-demo smoke
Owner: QA + Product + Eng

## Bug 1: Mint address and Solana explorer broken

- [ ] Create project and complete verify flow.
- [ ] Mint asset from asset screen.
- [ ] Confirm mint address is not placeholder text and looks like base58.
- [ ] Tap "View Mint on Solana Explorer" and confirm explorer opens.
- [ ] Complete payment and open settlement.
- [ ] Tap "View on Explorer" and confirm tx or mint page opens on devnet.
- [ ] Validate displayed explorer identifier matches project/payment context.

Pass condition:
- Explorer links are valid and lead to corresponding Solana entries.

## Bug 2: User project not listed in marketplace after generation

- [ ] Mint a new user project.
- [ ] Tap "List on Market" from asset screen.
- [ ] Confirm new item appears in market list without app restart.
- [ ] Restart app and confirm the same listing still appears.

Pass condition:
- Newly minted user project appears in market and persists.

## Bug 3: Marketplace still mock/static

- [ ] Create two projects with different names/types.
- [ ] Mint at least one project.
- [ ] Open market and validate data reflects these generated records.
- [ ] Search by project name and validate filtering.
- [ ] Filter by type and grade and validate results.

Pass condition:
- Market reflects runtime project data, not fixed static cards.

## Bug 4: Home page still mock/static

- [ ] Open home before and after mint/payment actions.
- [ ] Validate Total CO2 updates after mint.
- [ ] Validate Pending Payments reflects current payment statuses.
- [ ] Validate Recent Activity shows actual project/payment events.

Pass condition:
- Home stats and activity are action-driven and update in real time.

## Bug 5: Satellite map preview not working

- [ ] In project capture, enter location text only and tap Preview Map.
- [ ] Capture GPS and tap Preview Map.
- [ ] Enter boundary polygon and tap Preview Map.
- [ ] Submit project with boundary and run verify.
- [ ] Confirm verify result includes satellite source and boundary points.

Pass condition:
- Map preview works for location/GPS/boundary paths and verify reports satellite data source correctly.

## API smoke (quick)

- [ ] GET /api/healthz returns 200.
- [ ] POST /api/verify with valid payload returns verification JSON.
- [ ] POST /api/payments/dodo/create in demo mode returns payment URL.
- [ ] POST webhook with invalid signature returns 401.

## Exit criteria

- [ ] All P0 smoke checks pass.
- [ ] No blocker in mint, explorer, market listing, home updates, or map preview.
- [ ] Any failure has reproducible steps and defect ID logged in QA_RUN_SHEET.csv.
