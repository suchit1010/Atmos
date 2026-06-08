import { mkdirSync, writeFileSync, createWriteStream } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const reportsDir = path.join(root, 'reports');
mkdirSync(reportsDir, { recursive: true });

const tapPath = path.join(reportsDir, 'production.tap');
const junitPath = path.join(reportsDir, 'junit.xml');
const htmlPath = path.join(reportsDir, 'junit.html');

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'pipe', shell: true, ...options });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed (${command} ${args.join(' ')}):\n${stderr || stdout}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function runAndWriteToFile(command, args, outPath, options = {}) {
  return new Promise((resolve, reject) => {
    const outStream = createWriteStream(outPath, { encoding: 'utf8' });
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: true, ...options });
    let stderr = '';

    child.stdout.pipe(outStream);
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      outStream.end();
      if (code !== 0) {
        reject(new Error(`Command failed (${command} ${args.join(' ')}):\n${stderr}`));
        return;
      }
      resolve({ stdout: null, stderr });
    });
  });
}

try {
  // Stream test runner output directly to TAP file to avoid buffering large stdout
  await runAndWriteToFile('node', ['--test', '--test-concurrency=1', '--test-reporter=tap', 'tests/production-level.test.mjs'], tapPath);

  // Convert TAP file to JUnit
  const toJunit = await run('npx', ['tap-junit', tapPath]);
  writeFileSync(junitPath, toJunit.stdout, 'utf8');

  // Generate HTML report (requires junit-viewer installed)
  await run('npx', ['junit-viewer', `--results=${junitPath}`, `--save=${htmlPath}`]);

  console.log('Production reports generated successfully');
  console.log(`TAP:   ${tapPath}`);
  console.log(`JUnit: ${junitPath}`);
  console.log(`HTML:  ${htmlPath}`);
} catch (error) {
  console.error(String(error));
  process.exit(1);
}
