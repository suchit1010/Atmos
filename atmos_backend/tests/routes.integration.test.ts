import Fastify, { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { registerRoutes } from '../src/routes/api';
import { query } from '../src/db/pool';
import * as AuthSvc from '../src/services/auth';
import * as MRVSvc from '../src/services/mrv';
import { authMiddleware } from '../src/middleware/auth';

jest.mock('../src/db/pool', () => ({
  query: jest.fn(),
}));

jest.mock('../src/middleware/auth', () => ({
  authMiddleware: jest.fn(async (req: any) => {
    req.user = { sub: 'user-123', phone: '+919876543210', role: 'producer' };
  }),
}));

jest.mock('../src/services/auth', () => ({
  sendOTP: jest.fn(),
  verifyOTPAndIssueTokens: jest.fn(),
  refreshAccessToken: jest.fn(),
  getUserById: jest.fn(),
}));

jest.mock('../src/services/mrv', () => ({
  runMRVPipeline: jest.fn().mockResolvedValue(undefined),
  mintProjectCredit: jest.fn(),
}));

jest.mock('../src/services/payments', () => ({}));

jest.mock('../src/services/zk', () => ({
  generateZKProof: jest.fn(),
  verifyExistingProof: jest.fn(),
}));

jest.mock('../src/services/solana', () => ({
  retireCredits: jest.fn(),
  solanaHealthCheck: jest.fn().mockResolvedValue({ ok: true, slot: 12345 }),
}));

describe('API integration tests (route-level)', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify({ logger: false });

    app.setErrorHandler(async (err, _req, reply) => {
      if ((err as any).name === 'ZodError') {
        return reply.status(400).send({
          error: 'Validation Error',
          issues: (err as z.ZodError).issues,
        });
      }
      return reply.status(500).send({ error: (err as Error).message });
    });

    await registerRoutes(app);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/otp/send returns 200 with mocked service response', async () => {
    (AuthSvc.sendOTP as jest.Mock).mockResolvedValue({
      status: 'sent',
      expiresIn: 300,
      devOtp: '123456',
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/send',
      payload: { phoneNumber: '9876543210', countryCode: '91' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('sent');
    expect(body.expiresIn).toBe(300);
    expect(AuthSvc.sendOTP).toHaveBeenCalledWith('9876543210', '91');
  });

  it('POST /api/v1/auth/otp/send returns 400 for invalid payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/send',
      payload: { phoneNumber: '123', countryCode: '91' },
    });

    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('Validation Error');
  });

  it('POST /api/v1/auth/otp/verify returns tokens and user', async () => {
    (AuthSvc.verifyOTPAndIssueTokens as jest.Mock).mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-123', phone: '+919876543210', role: 'producer', name: null },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/verify',
      payload: {
        phoneNumber: '9876543210',
        countryCode: '91',
        otp: '123456',
        deviceFingerprint: 'mobile-web-1234567890',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.accessToken).toBe('access-token');
    expect(body.refreshToken).toBe('refresh-token');
    expect(body.user.id).toBe('user-123');
  });

  it('POST /api/v1/projects creates project and triggers MRV pipeline', async () => {
    (query as jest.Mock).mockResolvedValue({
      rows: [
        {
          id: 'project-123',
          entity_type: 'agroforestry',
          name: 'YC Demo Farm',
          status: 'submitted',
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/projects',
      headers: { authorization: 'Bearer test-token' },
      payload: {
        entityType: 'agroforestry',
        name: 'YC Demo Farm',
        location: { lat: 23.1815, lng: 79.9864 },
        areaHa: 50,
        metadata: {
          farmerName: 'Ravi Sharma',
          areaHa: 50,
          treeSpecies: ['Acacia'],
          treesPlanted: 5000,
          plantingDate: '2026-01-10',
        },
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.project.id).toBe('project-123');
    expect(body.message).toContain('MRV pipeline started');
    expect(query).toHaveBeenCalled();
    expect(MRVSvc.runMRVPipeline).toHaveBeenCalledWith('project-123');
    expect(authMiddleware).toHaveBeenCalled();
  });

  it('GET /api/v1/projects returns project list for authenticated user', async () => {
    (query as jest.Mock).mockResolvedValue({
      rows: [
        {
          id: 'project-123',
          entity_type: 'agroforestry',
          name: 'YC Demo Farm',
          status: 'verified',
          area_ha: 50,
          created_at: '2026-01-01T00:00:00.000Z',
          lat: 23.1815,
          lng: 79.9864,
          co2e_estimated: 3.84,
          confidence_score: 86,
          grade: 'B',
          proof_hash: 'zk_hash_123',
        },
      ],
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/projects?page=1&limit=20',
      headers: { authorization: 'Bearer test-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.projects).toHaveLength(1);
    expect(body.projects[0].id).toBe('project-123');
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });
});
