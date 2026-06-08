import autocannon from 'autocannon';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const reportsDir = path.join(process.cwd(), 'reports');
mkdirSync(reportsDir, { recursive: true });

function runScenario(options, label) {
  return new Promise((resolve) => {
    const instance = autocannon(options, (err, result) => {
      if (err) {
        resolve({ label, error: String(err) });
        return;
      }
      resolve({
        label,
        requests: result.requests,
        latency: result.latency,
        throughput: result.throughput,
        errors: result.errors,
        timeouts: result.timeouts,
      });
    });

    autocannon.track(instance, { renderProgressBar: false, renderResultsTable: true });
  });
}

const healthResult = await runScenario(
  {
    url: `${API_BASE_URL}/health`,
    method: 'GET',
    connections: 10,
    duration: 10,
    pipelining: 1,
  },
  'health-endpoint-smoke'
);

const otpResult = await runScenario(
  {
    url: `${API_BASE_URL}/api/v1/auth/otp/send`,
    method: 'POST',
    connections: 5,
    duration: 10,
    pipelining: 1,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: `98${Date.now().toString().slice(-8)}`,
      countryCode: '91',
    }),
  },
  'otp-send-smoke'
);

const report = {
  generatedAt: new Date().toISOString(),
  apiBaseUrl: API_BASE_URL,
  scenarios: [healthResult, otpResult],
};

const outPath = path.join(reportsDir, 'perf-smoke.json');
writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

console.log(`Performance smoke report saved: ${outPath}`);
