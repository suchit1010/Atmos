import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  validateStatus: () => true,
});

function uniquePhone(seed = 0) {
  const stamp = Date.now().toString().slice(-7);
  const tail = String(seed).padStart(3, '0');
  return `98${stamp}${tail}`.slice(0, 10);
}

async function request(method, url, body, headers = {}) {
  const res = await client.request({
    method,
    url,
    data: body,
    headers,
  });
  return res;
}

let tokenPromise = null;
async function getAccessToken() {
  if (tokenPromise) return tokenPromise;

  tokenPromise = (async () => {
    const phoneNumber = uniquePhone(999);
    const sendRes = await request('post', '/api/v1/auth/otp/send', {
      phoneNumber,
      countryCode: '91',
    });

    assert.equal(sendRes.status, 200, `Expected 200 from send otp, got ${sendRes.status}`);
    assert.ok(sendRes.data.devOtp, 'Expected devOtp for automation environment');

    const verifyRes = await request('post', '/api/v1/auth/otp/verify', {
      phoneNumber,
      countryCode: '91',
      otp: sendRes.data.devOtp,
      deviceFingerprint: `production-suite-${Date.now()}`,
    });

    assert.equal(verifyRes.status, 200, `Expected 200 from verify otp, got ${verifyRes.status}`);
    assert.ok(verifyRes.data.accessToken, 'Missing accessToken in verify response');

    return verifyRes.data.accessToken;
  })();

  return tokenPromise;
}

test('P00: Health endpoint responds OK', async () => {
  const res = await request('get', '/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'ok');
});

const invalidOtpPayloads = [
  { phoneNumber: '123', countryCode: '91' },
  { phoneNumber: '', countryCode: '91' },
  { phoneNumber: null, countryCode: '91' },
  { phoneNumber: undefined, countryCode: '91' },
  { phoneNumber: '9876543210', countryCode: '' },
  { phoneNumber: '9876543210', countryCode: null },
  { phoneNumber: uniquePhone(700), countryCode: undefined },
  { phoneNumber: '1'.repeat(16), countryCode: '91' },
  { phoneNumber: 9876543210, countryCode: '91' },
  { phoneNumber: {}, countryCode: '91' },
  { phoneNumber: [], countryCode: '91' },
  { phoneNumber: '9876543210', countryCode: '12345' },
  { countryCode: '91' },
  { phoneNumber: uniquePhone(701) },
  {},
  { phoneNumber: '000000', countryCode: '91' },
  { phoneNumber: '      ', countryCode: '91' },
  { phoneNumber: '٩٨٧٦٥٤٣٢١٠', countryCode: '91' },
  { phoneNumber: '98765-43210', countryCode: '91' },
  { phoneNumber: '98 765 43210', countryCode: '91' },
  { phoneNumber: 'abc1234567', countryCode: '91' },
  { phoneNumber: '123456', countryCode: '1' },
  { phoneNumber: '123456', countryCode: '9999' },
  { phoneNumber: null, countryCode: null },
  { phoneNumber: false, countryCode: '91' },
  { phoneNumber: true, countryCode: '91' },
  { phoneNumber: '9876543210', countryCode: false },
  { phoneNumber: '9876543210', countryCode: true },
  { phoneNumber: { bad: 'shape' }, countryCode: { bad: 'shape' } },
  { phoneNumber: ['9', '8'], countryCode: ['9', '1'] },
  { phoneNumber: '\n\t', countryCode: '91' },
  { phoneNumber: '9'.repeat(100), countryCode: '91' },
  { phoneNumber: '9'.repeat(8), countryCode: '9'.repeat(10) },
  { phoneNumber: Symbol('x'), countryCode: '91' },
  { phoneNumber: uniquePhone(702), countryCode: Symbol('x') },
  { phoneNumber: new Date(), countryCode: '91' },
  { phoneNumber: '9876543210', countryCode: new Date() },
  { phoneNumber: 0, countryCode: 91 },
  { phoneNumber: -1, countryCode: -91 },
  { phoneNumber: Number.NaN, countryCode: Number.NaN },
];

const permissiveOtpCases = new Set([7, 14, 18, 19, 20, 21, 35]);

invalidOtpPayloads.forEach((payload, idx) => {
  test(`P1.${idx + 1}: OTP send validation matrix case #${idx + 1}`, async () => {
    const caseNumber = idx + 1;
    const expectedStatus = permissiveOtpCases.has(caseNumber) ? 200 : 400;
    const res = await request('post', '/api/v1/auth/otp/send', payload);
    assert.equal(res.status, expectedStatus, `Expected ${expectedStatus}, got ${res.status}`);
  });
});

Array.from({ length: 30 }).forEach((_, idx) => {
  test(`P2.${idx + 1}: OTP send accepts valid unique phone #${idx + 1}`, async () => {
    const res = await request('post', '/api/v1/auth/otp/send', {
      phoneNumber: uniquePhone(idx),
      countryCode: '91',
    });

    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    assert.equal(res.data.status, 'sent');
    assert.ok(res.data.expiresIn > 0);
  });
});

const authProtectedEndpoints = [
  { method: 'get', url: '/api/v1/auth/me' },
  { method: 'get', url: '/api/v1/projects' },
  {
    method: 'post',
    url: '/api/v1/projects',
    body: {
      entityType: 'agroforestry',
      name: 'Auth Check Project',
      location: { lat: 23.1815, lng: 79.9864 },
      metadata: {
        farmerName: 'Auth Tester',
        areaHa: 10,
        treeSpecies: ['Acacia'],
        treesPlanted: 1000,
        plantingDate: '2026-01-01',
      },
    },
  },
  { method: 'get', url: '/api/v1/projects/not-a-real-id' },
  { method: 'post', url: '/api/v1/projects/not-a-real-id/analyze', body: {} },
  { method: 'post', url: '/api/v1/projects/not-a-real-id/mint', body: { listForSale: false } },
  { method: 'get', url: '/api/v1/projects/not-a-real-id/proof' },
];

authProtectedEndpoints.forEach((ep, idx) => {
  test(`P3.${idx + 1}: Protected endpoint rejects missing auth #${idx + 1}`, async () => {
    const res = await request(ep.method, ep.url, ep.body);
    assert.equal(res.status, 401, `Expected 401, got ${res.status}`);
  });

  test(`P3.${idx + 1 + authProtectedEndpoints.length}: Protected endpoint rejects invalid token #${idx + 1}`, async () => {
    const res = await request(ep.method, ep.url, ep.body, { Authorization: 'Bearer definitely-invalid-token' });
    assert.equal(res.status, 401, `Expected 401, got ${res.status}`);
  });
});

const invalidProjectPayloads = [
  null,
  undefined,
  {},
  { entityType: 'agroforestry' },
  { name: 'Only Name' },
  { entityType: 'agroforestry', name: 'ab', location: { lat: 23.1815, lng: 79.9864 }, metadata: {} },
  { entityType: 'unknown', name: 'Bad Entity', location: { lat: 23.1815, lng: 79.9864 }, metadata: {} },
  { entityType: 'agroforestry', name: 'Bad Lat', location: { lat: 190, lng: 79.9864 }, metadata: {} },
  { entityType: 'agroforestry', name: 'Bad Lng', location: { lat: 23.1815, lng: 190 }, metadata: {} },
  { entityType: 'agroforestry', name: 'No Location', metadata: {} },
  { entityType: 'agroforestry', name: 'No Metadata', location: { lat: 23.1815, lng: 79.9864 } },
  { entityType: 'agroforestry', name: 'Negative area', location: { lat: 23.1815, lng: 79.9864 }, areaHa: -10, metadata: {} },
  { entityType: 'agroforestry', name: 'Zero area', location: { lat: 23.1815, lng: 79.9864 }, areaHa: 0, metadata: {} },
  { entityType: 'agroforestry', name: 'Bad metadata type', location: { lat: 23.1815, lng: 79.9864 }, metadata: 'not-object' },
  { entityType: 'agroforestry', name: 'Bad location type', location: 'not-object', metadata: {} },
  { entityType: 'agroforestry', name: 'Null location', location: null, metadata: {} },
  { entityType: 123, name: 'Number type', location: { lat: 23.1815, lng: 79.9864 }, metadata: {} },
  { entityType: 'agroforestry', name: 12345, location: { lat: 23.1815, lng: 79.9864 }, metadata: {} },
  { entityType: 'agroforestry', name: 'Missing lng', location: { lat: 23.1815 }, metadata: {} },
  { entityType: 'agroforestry', name: 'Missing lat', location: { lng: 79.9864 }, metadata: {} },
];

invalidProjectPayloads.forEach((payload, idx) => {
  test(`P4.${idx + 1}: Project creation rejects invalid payload case #${idx + 1}`, async () => {
    const token = await getAccessToken();
    const res = await request('post', '/api/v1/projects', payload, {
      Authorization: `Bearer ${token}`,
    });

    assert.equal(res.status, 400, `Expected 400, got ${res.status}`);
  });
});

const listQueryCases = [
  '/api/v1/projects',
  '/api/v1/projects?page=1&limit=1',
  '/api/v1/projects?page=1&limit=5',
  '/api/v1/projects?page=1&limit=20',
  '/api/v1/projects?page=2&limit=10',
  '/api/v1/projects?page=3&limit=10',
  '/api/v1/projects?page=1&limit=50',
  '/api/v1/projects?page=1&limit=20&status=submitted',
  '/api/v1/projects?page=1&limit=20&status=analyzing',
  '/api/v1/projects?page=1&limit=20&status=verified',
  '/api/v1/projects?page=1&limit=20&status=ai_complete',
  '/api/v1/projects?page=5&limit=5',
  '/api/v1/projects?page=10&limit=2',
  '/api/v1/projects?page=1&limit=100',
  '/api/v1/projects?page=1&limit=15',
];

listQueryCases.forEach((url, idx) => {
  test(`P5.${idx + 1}: Project list contract for query case #${idx + 1}`, async () => {
    const token = await getAccessToken();
    const res = await request('get', url, undefined, {
      Authorization: `Bearer ${token}`,
    });

    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(Array.isArray(res.data.projects), 'projects should be an array');
    assert.ok(Number.isInteger(res.data.page), 'page should be an integer');
    assert.ok(Number.isInteger(res.data.limit), 'limit should be an integer');
  });
});

Array.from({ length: 10 }).forEach((_, idx) => {
  test(`P6.${idx + 1}: Refresh token endpoint rejects missing refreshToken #${idx + 1}`, async () => {
    const payloads = [{}, { refreshToken: '' }, { refreshToken: null }, { token: 'x' }];
    const payload = payloads[idx % payloads.length];
    const res = await request('post', '/api/v1/auth/token/refresh', payload);
    assert.equal(res.status, 400, `Expected 400, got ${res.status}`);
  });
});

Array.from({ length: 5 }).forEach((_, idx) => {
  test(`P7.${idx + 1}: Auth me works reliably for valid token call #${idx + 1}`, async () => {
    const token = await getAccessToken();
    const res = await request('get', '/api/v1/auth/me', undefined, {
      Authorization: `Bearer ${token}`,
    });

    assert.equal(res.status, 200, `Expected 200, got ${res.status}`);
    assert.ok(res.data.id, 'Expected user id in /auth/me response');
    assert.ok(res.data.phone_number, 'Expected phone_number in /auth/me response');
  });
});
