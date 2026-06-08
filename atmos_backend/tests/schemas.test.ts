import {
  SendOTPSchema,
  VerifyOTPSchema,
  CreateProjectSchema,
} from '../src/types/schemas';

describe('Auth schema validation', () => {
  it('accepts valid send OTP payload', () => {
    const payload = { phoneNumber: '9876543210', countryCode: '91' };
    const parsed = SendOTPSchema.parse(payload);

    expect(parsed.phoneNumber).toBe('9876543210');
    expect(parsed.countryCode).toBe('91');
  });

  it('rejects short phone number in send OTP payload', () => {
    const payload = { phoneNumber: '123', countryCode: '91' };

    expect(() => SendOTPSchema.parse(payload)).toThrow();
  });

  it('accepts valid verify OTP payload', () => {
    const payload = {
      phoneNumber: '9876543210',
      countryCode: '91',
      otp: '123456',
      deviceFingerprint: 'mobile-web-1234567890',
    };

    const parsed = VerifyOTPSchema.parse(payload);
    expect(parsed.otp).toBe('123456');
  });

  it('rejects invalid OTP length', () => {
    const payload = {
      phoneNumber: '9876543210',
      countryCode: '91',
      otp: '12345',
      deviceFingerprint: 'mobile-web-1234567890',
    };

    expect(() => VerifyOTPSchema.parse(payload)).toThrow();
  });
});

describe('Project schema validation', () => {
  it('accepts valid agroforestry project payload', () => {
    const payload = {
      entityType: 'agroforestry',
      name: 'YC Demo Farm - Acacia Trees',
      location: { lat: 23.1815, lng: 79.9864 },
      areaHa: 50,
      metadata: {
        farmerName: 'Ravi Sharma',
        areaHa: 50,
        treeSpecies: ['Acacia'],
        treesPlanted: 5000,
        plantingDate: '2026-01-10',
      },
    };

    const parsed = CreateProjectSchema.parse(payload);
    expect(parsed.entityType).toBe('agroforestry');
    expect(parsed.location.lat).toBeCloseTo(23.1815);
  });

  it('rejects invalid geo coordinates', () => {
    const payload = {
      entityType: 'agroforestry',
      name: 'Invalid Coordinates Project',
      location: { lat: 123.1815, lng: 79.9864 },
      areaHa: 50,
      metadata: {
        farmerName: 'Ravi Sharma',
        areaHa: 50,
        treeSpecies: ['Acacia'],
        treesPlanted: 5000,
        plantingDate: '2026-01-10',
      },
    };

    expect(() => CreateProjectSchema.parse(payload)).toThrow();
  });

  it('rejects unsupported entity type', () => {
    const payload = {
      entityType: 'unknown_type',
      name: 'Bad Entity',
      location: { lat: 23.1815, lng: 79.9864 },
      metadata: {},
    };

    expect(() => CreateProjectSchema.parse(payload)).toThrow();
  });
});
