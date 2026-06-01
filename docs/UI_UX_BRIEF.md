# Atmos — UI/UX Design Brief

**Version:** 1.0  
**Date:** June 1, 2026  
**Design Lead:** Product Design Team

---

## Executive Summary

Atmos is a mobile-first carbon credit platform targeting farmers and small-scale producers in rural India. The UI must be **simple, trustworthy, and work on low-end devices with poor connectivity**. The design language balances **environmental authenticity** (greens, earth tones) with **financial credibility** (clean, professional).

**Design Principles:**
1. **Mobile-First:** 95% of users on Android (3G networks)
2. **Low Literacy:** Visual > text, icons > labels
3. **Trust Signals:** Verification badges, satellite imagery, blockchain proof
4. **Offline-Ready:** Queue actions, sync when connected
5. **Accessibility:** High contrast, large touch targets, screen reader support

---

## Brand Identity

### Color Palette

**Primary Colors:**
```
Forest Green:    #2D5016  (Trust, nature, growth)
Leaf Green:      #4A7C2C  (Action buttons, success states)
Sky Blue:        #3B82F6  (Links, info, secondary actions)
```

**Secondary Colors:**
```
Earth Brown:     #8B4513  (Soil, grounding)
Sunset Orange:   #F97316  (Warnings, attention)
Cloud White:     #F9FAFB  (Backgrounds)
Charcoal:        #1F2937  (Text, headers)
```

**Semantic Colors:**
```
Success:         #10B981  (Verification passed, payment received)
Warning:         #F59E0B  (Manual review required)
Error:           #EF4444  (Verification failed, payment error)
Info:            #3B82F6  (Tips, guidance)
```

**Grade Colors:**
```
Grade S:         #8B5CF6  (Premium purple)
Grade A:         #10B981  (Excellent green)
Grade B:         #3B82F6  (Good blue)
Grade C:         #F59E0B  (Fair orange)
Grade D:         #EF4444  (Poor red)
```

### Typography

**Font Family:**
```
Primary:   Inter (400, 500, 600, 700)
Fallback:  -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto
```

**Type Scale:**
```
Display:   32px / 700 / -0.02em  (Hero headlines)
H1:        24px / 700 / -0.01em  (Page titles)
H2:        20px / 600 / -0.01em  (Section headers)
H3:        18px / 600 / 0        (Card titles)
Body:      16px / 400 / 0        (Default text)
Small:     14px / 400 / 0        (Captions, labels)
Tiny:      12px / 400 / 0        (Metadata, timestamps)
```

### Iconography

**Icon Library:** Lucide React (consistent, open-source)

**Key Icons:**
```
Leaf:          Project/carbon credit
Zap:           Verification/instant
Lock:          Privacy/Umbra
Globe:         Satellite/location
Coins:         Payment/money
CheckCircle:   Success/verified
AlertTriangle: Warning/review
XCircle:       Error/failed
Camera:        Photo capture
MapPin:        Location
```


---

## Screen Inventory

### 1. Authentication Flow

#### 1.1 Welcome Screen
**Purpose:** First impression, value proposition  
**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│         🌱 ATMOS Logo           │
│                                 │
│   "Turn Carbon Reductions       │
│    into Instant Revenue"        │
│                                 │
│   [Continue with Phone]         │
│   [Continue with Google]        │
│   [Continue with Apple]         │
│                                 │
│   Already have account? Login   │
└─────────────────────────────────┘
```

**Key Elements:**
- Large logo (80px)
- Tagline (20px, centered)
- 3 auth buttons (56px height, full width)
- Footer link (14px)

**Interactions:**
- Tap button → Navigate to auth flow
- Tap "Login" → Navigate to login screen

---

#### 1.2 Phone OTP Screen
**Purpose:** Phone verification  
**Layout:**
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  Enter your phone number        │
│                                 │
│  ┌─────────────────────────┐   │
│  │ +91 |                   │   │
│  └─────────────────────────┘   │
│                                 │
│  We'll send you a 6-digit code │
│                                 │
│  [Continue]                     │
└─────────────────────────────────┘
```

**Key Elements:**
- Back button (top-left)
- Title (24px, bold)
- Phone input (country code dropdown + number)
- Helper text (14px, gray)
- Continue button (disabled until valid)

**Validation:**
- Phone: 10 digits (India)
- Show error below input if invalid

---

#### 1.3 OTP Verification Screen
**Purpose:** Verify phone with 6-digit code  
**Layout:**
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  Enter verification code        │
│                                 │
│  Sent to +91 98765 43210        │
│                                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘
│                                 │
│  Didn't receive? Resend (0:30)  │
│                                 │
│  [Verify]                       │
└─────────────────────────────────┘
```

**Key Elements:**
- 6 OTP input boxes (48px each)
- Auto-focus next box on input
- Resend timer (30 seconds)
- Verify button (auto-submit when 6 digits entered)

**States:**
- Loading: Show spinner on button
- Error: Shake animation + red border
- Success: Navigate to home

---

### 2. Home / Dashboard

#### 2.1 Producer Dashboard
**Purpose:** Overview of projects, earnings, pending verifications  
**Layout:**
```
┌─────────────────────────────────┐
│  👤 Profile    🔔 Notifications │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Total CO2 Reduced       │   │
│  │ 127.5 tonnes            │   │
│  │                         │   │
│  │ Total Earnings          │   │
│  │ ₹1,27,500               │   │
│  └─────────────────────────┘   │
│                                 │
│  [+ Create New Project]         │
│                                 │
│  Your Projects                  │
│  ┌─────────────────────────┐   │
│  │ 🌱 Biochar Project      │   │
│  │ 12.5 tonnes • Grade A   │   │
│  │ ✅ Verified • Minted    │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ 🌳 Agroforestry         │   │
│  │ 8.3 tonnes • Grade B    │   │
│  │ ⏳ Pending Verification │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

**Key Elements:**
- Stats card (gradient background)
- CTA button (prominent, green)
- Project cards (thumbnail + status badge)
- Pull-to-refresh

**Interactions:**
- Tap project card → Project detail
- Tap "Create" → Project type selector
- Swipe left on card → Delete (with confirmation)

---

#### 2.2 Buyer Dashboard
**Purpose:** Browse marketplace, view portfolio  
**Layout:**
```
┌─────────────────────────────────┐
│  👤 Profile    🔔 Notifications │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Your Portfolio          │   │
│  │ 48 tonnes CO2e          │   │
│  │ ₹48,000 value           │   │
│  └─────────────────────────┘   │
│                                 │
│  Browse Credits                 │
│  [All] [Biochar] [Solar] [More]│
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🌱 Biochar • Grade A    │   │
│  │ 12.5 tonnes available   │   │
│  │ ₹1,000/tonne            │   │
│  │ Jaipur, India           │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

---

### 3. Project Creation Flow

#### 3.1 Project Type Selector
**Purpose:** Choose carbon reduction type  
**Layout:**
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  What type of project?          │
│                                 │
│  ┌───────────┐ ┌───────────┐   │
│  │ 🌱        │ │ 🌳        │   │
│  │ Biochar   │ │Agroforestry│  │
│  └───────────┘ └───────────┘   │
│  ┌───────────┐ ┌───────────┐   │
│  │ ☀️        │ │ ⚡        │   │
│  │ Solar     │ │ EV Fleet  │   │
│  └───────────┘ └───────────┘   │
│  ┌───────────┐ ┌───────────┐   │
│  │ 🏢        │ │ 🚢        │   │
│  │ Building  │ │ Shipping  │   │
│  └───────────┘ └───────────┘   │
│                                 │
│  [More Types ↓]                 │
└─────────────────────────────────┘
```

**Key Elements:**
- Grid layout (2 columns)
- Icon + label cards (120px × 120px)
- Tap card → Navigate to capture screen

---

#### 3.2 Project Capture Screen (Biochar Example)
**Purpose:** Collect project data + photos  
**Layout:**
```
┌─────────────────────────────────┐
│  ← Back          [Save Draft]   │
│                                 │
│  Biochar Project                │
│  Step 1 of 3: Basic Info        │
│                                 │
│  Project Name                   │
│  ┌─────────────────────────┐   │
│  │ Rice Husk Biochar       │   │
│  └─────────────────────────┘   │
│                                 │
│  Location                       │
│  ┌─────────────────────────┐   │
│  │ 📍 Jaipur, Rajasthan    │   │
│  └─────────────────────────┘   │
│                                 │
│  Photos (2-10 required)         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│  │ + │ │📷 │ │📷 │ │📷 │       │
│  └───┘ └───┘ └───┘ └───┘       │
│                                 │
│  [Next: Project Details]        │
└─────────────────────────────────┘
```

**Key Elements:**
- Progress indicator (step 1/3)
- Text inputs (name, location)
- Location picker (GPS + manual)
- Photo grid (tap to add/view)
- Next button (disabled until valid)

---

#### 3.3 Project Details Screen (Biochar)
**Purpose:** Collect methodology-specific data  
**Layout:**
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  Biochar Project                │
│  Step 2 of 3: Project Details   │
│                                 │
│  Biomass Input (kg)             │
│  ┌─────────────────────────┐   │
│  │ 12000                   │   │
│  └─────────────────────────┘   │
│                                 │
│  Biochar Output (kg)            │
│  ┌─────────────────────────┐   │
│  │ 3200                    │   │
│  └─────────────────────────┘   │
│                                 │
│  Conversion Efficiency (%)      │
│  ┌─────────────────────────┐   │
│  │ 26.7% (auto-calculated) │   │
│  └─────────────────────────┘   │
│                                 │
│  [Next: Review]                 │
└─────────────────────────────────┘
```

**Validation:**
- Biochar output ≤ biomass input
- Efficiency 15-35% (typical range)
- Show warning if outside range

---

### 4. Verification Flow

#### 4.1 Verification Progress Screen
**Purpose:** Show real-time verification status  
**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│         Verifying...            │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ✅ Image Analysis      │   │
│  │  ⏳ Carbon Calculation  │   │
│  │  ⏳ Quality Check       │   │
│  │  ⏳ Fraud Detection     │   │
│  └─────────────────────────┘   │
│                                 │
│  This usually takes 1-2 minutes │
│                                 │
│  [Cancel]                       │
└─────────────────────────────────┘
```

**Animations:**
- Spinner on active step
- Checkmark on completed step
- Progress bar (0-100%)

---

#### 4.2 Verification Results Screen
**Purpose:** Show verification outcome  
**Layout:**
```
┌─────────────────────────────────┐
│  ✅ Verification Complete       │
│                                 │
│  ┌─────────────────────────┐   │
│  │ CO2 Reduction           │   │
│  │ 2.46 tonnes             │   │
│  │                         │   │
│  │ Confidence: 87%         │   │
│  │ Grade: A                │   │
│  │ Fraud Risk: LOW         │   │
│  └─────────────────────────┘   │
│                                 │
│  Methodology: VM0044 (Biochar)  │
│  Satellite: ✅ Verified         │
│                                 │
│  [Mint SPL Token]               │
│  [View Full Report]             │
└─────────────────────────────────┘
```

**Key Elements:**
- Success icon (large, animated)
- Stats card (gradient, prominent)
- Grade badge (colored)
- CTA buttons (primary + secondary)


---

### 5. Minting Flow

#### 5.1 Mint Confirmation Screen
**Purpose:** Confirm SPL token minting  
**Layout:**
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  Mint Carbon Credit Token       │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Project: Biochar        │   │
│  │ Amount: 2.46 tonnes     │   │
│  │ Grade: A                │   │
│  │                         │   │
│  │ Recipient Wallet:       │   │
│  │ 7xKXt...9yMNp           │   │
│  │                         │   │
│  │ Estimated Cost:         │   │
│  │ ~0.002 SOL (~₹40)       │   │
│  └─────────────────────────┘   │
│                                 │
│  [Confirm & Mint]               │
│  [Change Wallet]                │
└─────────────────────────────────┘
```

**Key Elements:**
- Summary card (project details)
- Wallet address (truncated)
- Cost estimate (SOL + INR)
- Primary CTA (green)
- Secondary action (link)

---

#### 5.2 Minting Progress Screen
**Purpose:** Show blockchain transaction status  
**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│      Minting on Solana...       │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ⏳ Creating token       │   │
│  │  ⏳ Minting supply       │   │
│  │  ⏳ Anchoring proof      │   │
│  └─────────────────────────┘   │
│                                 │
│  Transaction: abc123...         │
│                                 │
│  This may take up to 1 minute   │
└─────────────────────────────────┘
```

**Animations:**
- Blockchain animation (blocks connecting)
- Progress spinner
- Real-time status updates

---

#### 5.3 Mint Success Screen
**Purpose:** Confirm successful minting  
**Layout:**
```
┌─────────────────────────────────┐
│  ✅ Token Minted Successfully   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🪙 2.46 ATMOS-BIO       │   │
│  │                         │   │
│  │ Mint Address:           │   │
│  │ 9yMNp...7xKXt           │   │
│  │                         │   │
│  │ Transaction:            │   │
│  │ abc123...def456         │   │
│  └─────────────────────────┘   │
│                                 │
│  [View on Solana Explorer]      │
│  [List for Sale]                │
│  [Back to Dashboard]            │
└─────────────────────────────────┘
```

**Key Elements:**
- Success animation (confetti)
- Token details card
- Explorer link (external)
- Multiple CTAs (prioritized)

---

### 6. Marketplace / Buyer Flow

#### 6.1 Marketplace Browse Screen
**Purpose:** Discover available carbon credits  
**Layout:**
```
┌─────────────────────────────────┐
│  🔍 Search    🎛️ Filters        │
│                                 │
│  [All] [Biochar] [Solar] [More]│
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🌱 Biochar Project      │   │
│  │ Grade A • 12.5 tonnes   │   │
│  │ ₹1,000/tonne            │   │
│  │ Jaipur, India           │   │
│  │ ✅ Verified • 87% conf. │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ ☀️ Solar Farm           │   │
│  │ Grade S • 48 tonnes     │   │
│  │ ₹1,500/tonne            │   │
│  │ Gujarat, India          │   │
│  │ ✅ Verified • 95% conf. │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

**Key Elements:**
- Search bar (top)
- Filter chips (horizontal scroll)
- Credit cards (image + details)
- Grade badge (colored)
- Verification badge

**Filters:**
- Type (biochar, solar, etc.)
- Grade (S, A, B, C, D)
- Location (state, country)
- Price range
- Availability

---

#### 6.2 Credit Detail Screen
**Purpose:** Show full project details before purchase  
**Layout:**
```
┌─────────────────────────────────┐
│  ← Back          ⭐ Save        │
│                                 │
│  [Project Image]                │
│                                 │
│  Biochar Project                │
│  Grade A • 12.5 tonnes          │
│  ₹1,000/tonne                   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Verification Details    │   │
│  │ Confidence: 87%         │   │
│  │ Methodology: VM0044     │   │
│  │ Satellite: ✅ Verified  │   │
│  │ Fraud Risk: LOW         │   │
│  └─────────────────────────┘   │
│                                 │
│  Location: Jaipur, Rajasthan    │
│  Producer: Ramesh Kumar         │
│  Minted: May 15, 2026           │
│                                 │
│  [View Proof on Solana]         │
│  [Purchase Credits]             │
└─────────────────────────────────┘
```

**Key Elements:**
- Hero image (full-width)
- Title + grade badge
- Verification card (expandable)
- Metadata (location, producer, date)
- CTAs (view proof, purchase)

---

#### 6.3 Purchase Screen
**Purpose:** Select quantity and payment method  
**Layout:**
```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  Purchase Carbon Credits        │
│                                 │
│  Quantity (tonnes)              │
│  ┌─────────────────────────┐   │
│  │ [−]  5.0  [+]           │   │
│  └─────────────────────────┘   │
│                                 │
│  Price: ₹1,000 × 5 = ₹5,000     │
│                                 │
│  Payment Method                 │
│  ┌─────────────────────────┐   │
│  │ ○ Public (UPI/Card)     │   │
│  │   Visible on blockchain │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ ○ Private (Umbra)       │   │
│  │   🔒 Amount hidden      │   │
│  └─────────────────────────┘   │
│                                 │
│  [Continue to Payment]          │
└─────────────────────────────────┘
```

**Key Elements:**
- Quantity stepper (−/+)
- Price calculation (live update)
- Payment method radio buttons
- Privacy badge (lock icon)
- CTA button (disabled until valid)

---

### 7. Payment Flow

#### 7.1 Dodo Checkout (Public Payment)
**Purpose:** Redirect to Dodo payment gateway  
**Layout:**
```
┌─────────────────────────────────┐
│  Redirecting to payment...      │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Order Summary           │   │
│  │                         │   │
│  │ 5 tonnes CO2e           │   │
│  │ ₹5,000                  │   │
│  │                         │   │
│  │ Payment via Dodo        │   │
│  │ UPI • Cards • Wallets   │   │
│  └─────────────────────────┘   │
│                                 │
│  Opening payment page...        │
│                                 │
│  [Cancel]                       │
└─────────────────────────────────┘
```

**Flow:**
1. Show loading screen
2. Open Dodo checkout in WebBrowser
3. User completes payment
4. Redirect back to app
5. Show settlement status

---

#### 7.2 Payment Status Screen
**Purpose:** Show payment confirmation  
**Layout:**
```
┌─────────────────────────────────┐
│  ✅ Payment Successful          │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 5 tonnes CO2e           │   │
│  │ ₹5,000 paid             │   │
│  │                         │   │
│  │ Payment ID:             │   │
│  │ dodo_1234567890         │   │
│  │                         │   │
│  │ Settlement Status:      │   │
│  │ ⏳ Processing...        │   │
│  └─────────────────────────┘   │
│                                 │
│  Credits will appear in your    │
│  wallet within 1 minute         │
│                                 │
│  [View Settlement]              │
│  [Back to Marketplace]          │
└─────────────────────────────────┘
```

**States:**
- Processing: Spinner + "Processing..."
- Completed: Checkmark + "Settled"
- Failed: X + "Failed" + retry button

---

### 8. Settlement / Certificate Screen

#### 8.1 Settlement Detail Screen
**Purpose:** Show settlement proof + certificate  
**Layout:**
```
┌─────────────────────────────────┐
│  ← Back          📤 Share       │
│                                 │
│  Settlement Certificate         │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🏆 5 tonnes CO2e        │   │
│  │    Retired              │   │
│  │                         │   │
│  │ Project: Biochar        │   │
│  │ Grade: A                │   │
│  │ Date: June 1, 2026      │   │
│  │                         │   │
│  │ Blockchain Proof:       │   │
│  │ Slot: 123456789         │   │
│  │ TX: abc123...def456     │   │
│  └─────────────────────────┘   │
│                                 │
│  [View on Solana Explorer]      │
│  [Download PDF]                 │
│  [Share Certificate]            │
└─────────────────────────────────┘
```

**Key Elements:**
- Certificate card (styled like diploma)
- Blockchain proof (slot + tx hash)
- Share options (PDF, image, link)

---

## Component Library

### Buttons

**Primary Button:**
```
Background: #4A7C2C (Leaf Green)
Text: #FFFFFF (White)
Height: 56px
Border Radius: 12px
Font: 16px / 600
Shadow: 0 2px 8px rgba(74, 124, 44, 0.2)

States:
- Hover: #3D6624
- Active: #2D5016
- Disabled: #E5E7EB (Gray)
```

**Secondary Button:**
```
Background: Transparent
Border: 2px solid #4A7C2C
Text: #4A7C2C
Height: 56px
Border Radius: 12px
Font: 16px / 600

States:
- Hover: Background #F0F9FF
- Active: Background #DBEAFE
```

**Text Button:**
```
Background: Transparent
Text: #3B82F6 (Sky Blue)
Font: 16px / 600
Underline on hover
```

---

### Cards

**Standard Card:**
```
Background: #FFFFFF
Border: 1px solid #E5E7EB
Border Radius: 16px
Padding: 16px
Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
```

**Elevated Card:**
```
Background: #FFFFFF
Border: none
Border Radius: 16px
Padding: 20px
Shadow: 0 4px 12px rgba(0, 0, 0, 0.08)
```

**Gradient Card (Stats):**
```
Background: linear-gradient(135deg, #2D5016 0%, #4A7C2C 100%)
Text: #FFFFFF
Border Radius: 20px
Padding: 24px
Shadow: 0 8px 24px rgba(45, 80, 22, 0.2)
```

---

### Badges

**Grade Badge:**
```
S: Background #8B5CF6, Text #FFFFFF
A: Background #10B981, Text #FFFFFF
B: Background #3B82F6, Text #FFFFFF
C: Background #F59E0B, Text #FFFFFF
D: Background #EF4444, Text #FFFFFF

Size: 24px × 24px
Border Radius: 6px
Font: 12px / 700
```

**Status Badge:**
```
Verified:   Background #DCFCE7, Text #166534
Pending:    Background #FEF3C7, Text #92400E
Failed:     Background #FEE2E2, Text #991B1B

Padding: 4px 8px
Border Radius: 12px
Font: 12px / 600
```

---

### Inputs

**Text Input:**
```
Background: #F9FAFB
Border: 1px solid #E5E7EB
Border Radius: 12px
Height: 56px
Padding: 16px
Font: 16px / 400

States:
- Focus: Border #3B82F6, Shadow 0 0 0 3px rgba(59, 130, 246, 0.1)
- Error: Border #EF4444, Shadow 0 0 0 3px rgba(239, 68, 68, 0.1)
- Disabled: Background #F3F4F6, Text #9CA3AF
```

**Number Input (Stepper):**
```
┌─────────────────────────┐
│ [−]  5.0  [+]           │
└─────────────────────────┘

Buttons: 40px × 40px, Border Radius 8px
Value: 20px / 600, Center-aligned
```

---

## Responsive Design

### Breakpoints
```
Mobile:  < 768px  (Primary target)
Tablet:  768-1024px
Desktop: > 1024px
```

### Mobile-First Rules
1. **Touch Targets:** Minimum 44px × 44px
2. **Font Size:** Minimum 16px (prevent zoom on iOS)
3. **Spacing:** Minimum 8px between interactive elements
4. **Scrolling:** Vertical only (no horizontal scroll)
5. **Images:** Lazy load, compress, WebP format

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Keyboard Navigation:**
- Tab order: logical, top-to-bottom
- Focus indicators: 2px solid #3B82F6
- Skip links: "Skip to main content"

**Screen Readers:**
- Alt text for all images
- ARIA labels for icons
- Semantic HTML (h1, h2, nav, main, etc.)
- Live regions for dynamic content

**Motion:**
- Respect `prefers-reduced-motion`
- Disable animations if requested
- Provide static alternatives

---

## Performance

### Optimization Targets
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Largest Contentful Paint:** < 2.5s
- **Cumulative Layout Shift:** < 0.1

### Techniques
- Image compression (WebP, 80% quality)
- Lazy loading (images, routes)
- Code splitting (React.lazy)
- Caching (AsyncStorage, React Query)
- Offline support (service worker)

---

## Design Tokens (Figma Variables)

```json
{
  "colors": {
    "primary": {
      "forest": "#2D5016",
      "leaf": "#4A7C2C",
      "sky": "#3B82F6"
    },
    "semantic": {
      "success": "#10B981",
      "warning": "#F59E0B",
      "error": "#EF4444",
      "info": "#3B82F6"
    },
    "grade": {
      "s": "#8B5CF6",
      "a": "#10B981",
      "b": "#3B82F6",
      "c": "#F59E0B",
      "d": "#EF4444"
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px"
  },
  "borderRadius": {
    "sm": "8px",
    "md": "12px",
    "lg": "16px",
    "xl": "20px",
    "full": "9999px"
  }
}
```

---

## Figma File Structure

```
📁 Atmos Design System
  ├── 📄 Cover (Brand overview)
  ├── 📄 Foundations (Colors, Typography, Spacing)
  ├── 📄 Components (Buttons, Cards, Inputs, Badges)
  ├── 📄 Icons (Lucide React library)
  ├── 📄 Mobile Screens
  │   ├── Authentication
  │   ├── Dashboard
  │   ├── Project Creation
  │   ├── Verification
  │   ├── Marketplace
  │   └── Payment
  └── 📄 Prototypes (Interactive flows)
```

---

**Design Resources:**
- Figma: [Link to Figma file]
- Icon Library: https://lucide.dev/
- Font: https://fonts.google.com/specimen/Inter

**Questions? Contact:** design@atmos.protocol
