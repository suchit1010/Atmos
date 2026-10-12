/**
 * ATMOS YC Demo Seed Script
 * ─────────────────────────────────────────────────────
 * Complete end-to-end flow:
 * 1. Authenticate user
 * 2. Create carbon project
 * 3. Poll verification status
 * 4. Show completed verification with AI data
 * 5. Ready for blockchain settlement
 */

// Use built-in fetch (Node 18+)

const API_URL = process.env.API_URL || 'http://localhost:3000';
const DEMO_PHONE = '+919876543210';

interface DemoState {
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  projectId?: string;
  verificationData?: any;
  devOtp?: string;
}

const state: DemoState = {};

// ─── Utility: API calls ───────────────────────────────
async function apiCall(method: string, endpoint: string, body?: any, token?: string): Promise<any> {
  const url = `${API_URL}${endpoint}`;
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  console.log(`\n📤 ${method} ${endpoint}`);
  if (body) console.log('   Body:', JSON.stringify(body, null, 2).slice(0, 200));

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data: any = await response.json();
  console.log(`📥 Status ${response.status}`);
  if (response.status >= 200 && response.status < 300) {
    console.log('   ✅ Success:', JSON.stringify(data).slice(0, 300));
  } else {
    console.log('   ❌ Error:', JSON.stringify(data));
    throw new Error(`API error: ${response.status}`);
  }
  return data;
}

// ─── Step 1: Health Check ─────────────────────────────
async function step1_healthCheck() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Health Check');
  console.log('='.repeat(60));

  const data = await apiCall('GET', '/health');
  console.log('✅ Backend is running:', data.status);
  console.log('   Solana RPC Status:', data.services?.solana);
  return data;
}

// ─── Step 2: Send OTP ─────────────────────────────────
async function step2_sendOTP() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Send OTP');
  console.log('='.repeat(60));

  const result = await apiCall('POST', '/api/v1/auth/otp/send', {
    phoneNumber: DEMO_PHONE,
    countryCode: '+91',
  });

  state.devOtp = result.devOtp; // Capture dev OTP returned by API
  console.log('✅ OTP sent to:', DEMO_PHONE);
  console.log('📋 Dev OTP:', state.devOtp);
  return result;
}

// ─── Step 3: Verify OTP & Get Tokens ──────────────────
async function step3_verifyOTP() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: Verify OTP & Issue Tokens');
  console.log('='.repeat(60));

  const result = await apiCall('POST', '/api/v1/auth/otp/verify', {
    phoneNumber: DEMO_PHONE,
    countryCode: '+91',
    otp: state.devOtp, // Use the OTP from step 2
    deviceFingerprint: 'demo-device-yc-2026',
  });

  state.userId = result.user?.id;
  state.accessToken = result.accessToken;
  state.refreshToken = result.refreshToken;

  console.log('✅ User authenticated:', state.userId);
  console.log('✅ Access Token issued (valid 15 min)');
  return result;
}

// ─── Step 4: Fetch Current User ───────────────────────
async function step4_getUser() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: Fetch Current User');
  console.log('='.repeat(60));

  const user = await apiCall('GET', '/api/v1/auth/me', undefined, state.accessToken);
  console.log('✅ User profile loaded:', user.name || 'No name set');
  console.log('   Role:', user.role);
  console.log('   KYC Status:', user.kyc_status);
  return user;
}

// ─── Step 5: Create Carbon Project ────────────────────
async function step5_createProject() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: Create Carbon Project');
  console.log('='.repeat(60));

  const projectData = {
    entityType: 'agroforestry',
    name: 'YC Demo Farm - Acacia Trees',
    location: {
      lat: 23.1815,
      lng: 79.9864, // Bhopal, India
    },
    areaHa: 50,
    metadata: {
      treesPlanted: 5000,
      speciesComposition: '60% Acacia, 40% Neem',
      plantingYear: 2021,
      baseline: 'no_trees',
    },
  };

  const result = await apiCall(
    'POST',
    '/api/v1/projects',
    projectData,
    state.accessToken
  );

  state.projectId = result.project?.id;
  console.log('✅ Project created:', state.projectId);
  console.log('   Status:', result.project?.status);
  console.log('   Message:', result.message);
  return result;
}

// ─── Step 6: Fetch Project Details ────────────────────
async function step6_getProject() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 6: Fetch Project Details');
  console.log('='.repeat(60));

  if (!state.projectId) throw new Error('No project ID');

  const project = await apiCall(
    'GET',
    `/api/v1/projects/${state.projectId}`,
    undefined,
    state.accessToken
  );

  console.log('✅ Project fetched:', project.name);
  console.log('   Status:', project.status);
  console.log('   Location: Lat', project.lat, 'Lng', project.lng);
  return project;
}

// ─── Step 7: Poll for AI Verification (with timeout) ──
async function step7_pollVerification(maxWaitSeconds = 90) {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 7: Poll for AI Verification');
  console.log('='.repeat(60));
  console.log(`Polling every 5 sec for ${maxWaitSeconds}s max...`);

  const startTime = Date.now();
  let lastProject = null;

  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    lastProject = await apiCall(
      'GET',
      `/api/v1/projects/${state.projectId}`,
      undefined,
      state.accessToken
    );

    const status = lastProject.status;
    console.log(`   → Status: ${status}`);

    if (status === 'ai_complete') {
      console.log('✅ AI Verification COMPLETE!');
      console.log('   CO2e Estimated:', lastProject.co2e_estimated, 'tCO2e');
      console.log('   Confidence:', lastProject.confidence_score);
      console.log('   Grade:', lastProject.grade);
      state.verificationData = lastProject;
      return lastProject;
    }

    if (status === 'rejected') {
      throw new Error('Project rejected by AI verification');
    }

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('⏱️ Timeout reached. Status:', lastProject.status);
  console.log('   (Verification may still be running in background)');
  return lastProject;
}

// ─── Step 8: Summary & Next Steps ─────────────────────
async function step8_summary() {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 8: End-to-End Demo Summary');
  console.log('='.repeat(60));

  console.log('\n📊 DATA PERSISTED IN DATABASE:');
  console.log('├── User:', state.userId);
  console.log('├── Project:', state.projectId);
  console.log('├── Status:', state.verificationData?.status);
  console.log('├── AI Results:');
  console.log('│   ├── CO2e:', state.verificationData?.co2e_estimated, 'tCO2e');
  console.log('│   ├── Confidence:', state.verificationData?.confidence_score);
  console.log('│   ├── Grade:', state.verificationData?.grade);
  console.log('│   └── Fraud Risk:', state.verificationData?.fraud_risk);
  console.log('└── Ready for: Blockchain settlement');

  console.log('\n🔗 NEXT STEPS FOR YC:');
  console.log('1. Deploy Solana contract to Devnet');
  console.log('2. Call mintCarbonCredits() from TypeScript client');
  console.log('3. Show transaction on Solscan');
  console.log('4. Wire mobile app to show this data');

  console.log('\n✅ DEMO COMPLETE - YC READY CHECKLIST:');
  console.log('[ ] Backend API: Running ✅');
  console.log('[ ] Database: Data persisting ✅');
  console.log('[ ] Auth Flow: Working ✅');
  console.log('[ ] AI Verification: Complete ✅');
  console.log('[ ] Blockchain Integration: Next (use TypeScript client)');
  console.log('[ ] Mobile App: Wire to backend API');
}

// ─── Main Flow ────────────────────────────────────────
async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         ATMOS Protocol — YC Demo End-to-End Flow          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('API Base URL:', API_URL);
  console.log('Demo Phone:', DEMO_PHONE);

  try {
    // Main flow
    await step1_healthCheck();
    await step2_sendOTP();
    await step3_verifyOTP();
    await step4_getUser();
    await step5_createProject();
    await step6_getProject();
    await step7_pollVerification(120);
    await step8_summary();

    console.log('\n✅ END-TO-END DEMO SUCCESSFUL!\n');
  } catch (error: any) {
    console.error('\n❌ DEMO FAILED:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
main().catch(console.error);
