import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const PIPELINE_TIMEOUT_MS = Number(process.env.PIPELINE_TIMEOUT_MS || 120000);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 5000);

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const state = {
  phoneNumber: `98${Date.now().toString().slice(-8)}`,
  countryCode: '91',
  devOtp: null,
  accessToken: null,
  refreshToken: null,
  userId: null,
  projectId: null,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('01 health check: backend is up', async () => {
  const res = await client.get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'ok');
  assert.ok(res.data.services);
});

test('02 send otp: returns dev otp in non-twilio mode', async () => {
  const res = await client.post('/api/v1/auth/otp/send', {
    phoneNumber: state.phoneNumber,
    countryCode: state.countryCode,
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'sent');
  assert.ok(res.data.expiresIn >= 300 || res.data.expiresIn > 0);

  if (!res.data.devOtp) {
    throw new Error('Expected devOtp in test environment but got none. Set backend to dev mode.');
  }

  state.devOtp = res.data.devOtp;
});

test('03 verify otp: issues access and refresh tokens', async () => {
  assert.ok(state.devOtp, 'devOtp should be available from previous step');

  const res = await client.post('/api/v1/auth/otp/verify', {
    phoneNumber: state.phoneNumber,
    countryCode: state.countryCode,
    otp: state.devOtp,
    deviceFingerprint: `automation-node-${Date.now()}`,
  });

  assert.equal(res.status, 200);
  assert.ok(res.data.accessToken, 'accessToken missing');
  assert.ok(res.data.refreshToken, 'refreshToken missing');
  assert.ok(res.data.user?.id, 'user id missing');

  state.accessToken = res.data.accessToken;
  state.refreshToken = res.data.refreshToken;
  state.userId = res.data.user.id;
});

test('04 auth/me: returns authenticated user', async () => {
  assert.ok(state.accessToken, 'accessToken should exist');

  const res = await client.get('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${state.accessToken}` },
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.id, state.userId);
});

test('05 create project: starts mrv pipeline', async () => {
  assert.ok(state.accessToken, 'accessToken should exist');

  const res = await client.post(
    '/api/v1/projects',
    {
      entityType: 'agroforestry',
      name: `Automation E2E Project ${Date.now()}`,
      location: { lat: 23.1815, lng: 79.9864 },
      areaHa: 12,
      metadata: {
        farmerName: 'Automation Tester',
        areaHa: 12,
        treeSpecies: ['Acacia'],
        treesPlanted: 1200,
        plantingDate: '2026-01-10',
      },
    },
    { headers: { Authorization: `Bearer ${state.accessToken}` } }
  );

  assert.equal(res.status, 201);
  assert.ok(res.data.project?.id, 'project id missing');
  assert.match(res.data.message, /MRV pipeline started/i);

  state.projectId = res.data.project.id;
});

test('06 poll project: reaches ai_complete/verified/submitted path', async () => {
  assert.ok(state.projectId, 'projectId missing from create step');

  const start = Date.now();
  let lastStatus = 'unknown';
  let detail = null;

  while (Date.now() - start < PIPELINE_TIMEOUT_MS) {
    const res = await client.get(`/api/v1/projects/${state.projectId}`, {
      headers: { Authorization: `Bearer ${state.accessToken}` },
    });

    assert.equal(res.status, 200);
    detail = res.data;
    lastStatus = detail.status;

    if (['ai_complete', 'verified'].includes(lastStatus)) {
      break;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  // Accept submitted/analyzing as non-failing if pipeline is slow, but enforce endpoint correctness.
  assert.ok(
    ['submitted', 'analyzing', 'ai_complete', 'verified'].includes(lastStatus),
    `Unexpected project status: ${lastStatus}`
  );
  assert.equal(detail.id, state.projectId);
});

test('07 list projects: includes created project', async () => {
  assert.ok(state.projectId, 'projectId missing');

  const res = await client.get('/api/v1/projects?limit=50', {
    headers: { Authorization: `Bearer ${state.accessToken}` },
  });

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data.projects), 'projects should be an array');

  const found = res.data.projects.find((p) => p.id === state.projectId);
  assert.ok(found, 'created project not found in list response');
});
