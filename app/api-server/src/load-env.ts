import { loadEnvFiles } from "./env";

// Imported first by index.ts so .env files are applied before any module reads process.env.
loadEnvFiles();
