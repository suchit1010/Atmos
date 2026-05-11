# Dodo Payment Flow - Fixes & Improvements

## Summary
Fixed the Dodo payment redirect issue by improving error handling, adding WebBrowser warmup, and implementing comprehensive logging.

## Changes Made

### 1. **Backend (API Server)**
**File**: `app/api-server/src/routes/payments.ts`

#### Demo Mode Configuration
- Test Product ID: `pdt_0NeTZC7YUIaCtJSBukmEK`
- Test Checkout Host: `test.checkout.dodopayments.com`
- Demo mode returns consistent checkout URL format

#### Payload Normalization
- Ensures `quantity` is a valid integer (min 1)
- Ensures `amount` is a valid number (prevents NaN in URL)
- Logging includes normalized values for debugging

#### Response Format
```json
{
  "success": true,
  "paymentId": "dodo_demo_<timestamp>",
  "paymentUrl": "https://test.checkout.dodopayments.com/buy/pdt_0NeTZC7YUIaCtJSBukmEK?quantity=<qty>&redirect_url=https://www.atmosexample.com",
  "amount": <normalized_amount>,
  "currency": "INR|USD",
  "mock": true,
  "mode": "demo"
}
```

### 2. **Mobile App Payment Screen**
**File**: `app/mobile/app/payment/[id].tsx`

#### WebBrowser Initialization
**File**: `app/mobile/app/_layout.tsx`
- Added `WebBrowser.warmUpAsync()` at app startup
- Improves performance when opening external payment URLs
- Silently fails on web platform (graceful degradation)

#### Enhanced Error Handling
The payment handler now:
1. **Validates HTTP Response**: Checks `response.ok` before parsing JSON
2. **Validates API Response**: Ensures `success=true` and `paymentUrl` exists
3. **Validates Browser Open**: Checks if `window.open()` returned null (popup blocked)
4. **Clear Error Messages**: Displays specific error messages to user instead of silent failures
5. **Detailed Logging**: Comprehensive `[Payment]` prefixed logs for debugging

#### Logging Output
```
[Payment] Calling http://localhost:9001/api/payments/dodo/create with qty=48, total=71570
[Payment] API Response: {success: true, paymentId: "dodo_demo_...", paymentUrl: "https://..."}
[Payment] Redirecting to: https://test.checkout.dodopayments.com/buy/pdt_0NeTZC7YUIaCtJSBukmEK?quantity=48&...
[Payment] Opening with WebBrowser (native)  // or: Opening in new window (web)
[Payment] WebBrowser result: {type: 'opened'|'dismissed'|'locked'}
```

#### Platform-Specific Behavior
- **Web**: Uses `window.open(url, "_blank")` to open in new tab
- **Native (iOS/Android)**: Uses `WebBrowser.openBrowserAsync()` for in-app browser

#### Error Handling Flow
```
Success Case:
  1. API returns paymentUrl ✓
  2. Browser opens successfully ✓
  3. Payment recorded as "pending" ✓
  4. Route to settlement status page ✓

Error Case:
  1. API error / network error → Display error to user
  2. Missing paymentUrl → Display error to user
  3. Browser fails to open → Log warning, continue (user may already be in browser)
  4. User sees error message with actionable information
```

## API Testing

### Test Request
```powershell
$body = @{
  amount=10000
  currency="INR"
  assetId="test"
  assetName="Solar"
  quantity=48
  buyerName="Test User"
  buyerEmail="test@atmos.protocol"
} | ConvertTo-Json

Invoke-WebRequest `
  -Uri "http://localhost:9001/api/payments/dodo/create" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -UseBasicParsing | Select-Object -ExpandProperty Content
```

### Test Response
```json
{
  "success": true,
  "paymentId": "dodo_demo_1778488384764",
  "paymentUrl": "https://test.checkout.dodopayments.com/buy/pdt_0NeTZC7YUIaCtJSBukmEK?quantity=48&redirect_url=https://www.atmosexample.com",
  "amount": 10000,
  "currency": "INR",
  "mock": true,
  "mode": "demo"
}
```

## End-to-End Payment Flow

### User Journey
```
1. User selects carbon credits on marketplace
   ↓
2. Navigates to Asset Detail page
   ↓
3. Clicks "Buy with Dodo" button
   ↓
4. Payment screen displays total & fee breakdown
   ↓
5. User selects payment method (UPI / USDC)
   ↓
6. User clicks "Pay with Dodo ₹<amount>"
   ↓
7. Mobile app calls POST /api/payments/dodo/create
   ↓
8. API returns checkout URL in demo mode
   ↓
9. WebBrowser opens checkout URL:
   https://test.checkout.dodopayments.com/buy/pdt_0NeTZC7YUIaCtJSBukmEK?quantity=48...
   ↓
10. User completes payment on Dodo checkout (test mode)
   ↓
11. Browser returns to app (via redirect_url)
   ↓
12. App displays settlement page (order confirmation)
```

## Testing Instructions

### Local Development
1. **Start API Server** (demo mode):
   ```bash
   cd app/api-server
   export DODO_MODE=demo
   export PORT=9001
   pnpm dev
   ```

2. **Start Mobile Dev Server**:
   ```bash
   cd app/mobile
   pnpm dev
   ```

3. **Test Payment Flow**:
   - Open app on web (http://localhost:8081) or mobile device
   - Authenticate with Google
   - Create a project with evidence (solar panels, biochar, etc.)
   - Wait for AI verification
   - Navigate to marketplace
   - Select an asset and click "Buy"
   - On payment screen, adjust quantity if desired
   - Click "Pay with Dodo"
   - Check browser console for `[Payment]` logs
   - Verify checkout URL opens in new tab/browser

### Debugging Tips
- **Check Console Logs**: Look for `[Payment]` prefixed messages
- **Check API Logs**: Look for payment endpoint requests on port 9001
- **Check Network Tab**: Verify POST to `/api/payments/dodo/create` returns success
- **Check URL**: Verify Dodo checkout URL has correct product ID and quantity

## Commits
1. `6fa7a44` - fix: allow review status in verify flow, normalize Dodo payload numbers, improve API error handling
2. `b1b46c2` - fix: improve payment redirect with WebBrowser warmup, better error handling, and detailed logging

## Known Issues
- Satellite imagery optional (without GOOGLE_MAPS_API_KEY env)
- Database schema empty (data in AsyncStorage)
- Dodo test mode uses hardcoded product ID and checkout host
- Settlement page may not show real Dodo payment data (data ephemeral)

## Next Steps
- Monitor production Dodo API for webhook payment status updates
- Implement settlement persistence to database
- Add real payment flow testing (non-demo mode)
- Add integration tests for payment endpoint
