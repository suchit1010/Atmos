import type { IncomingMessage, ServerResponse } from 'http';
import { buildApp } from '../src/server.production';

let appPromise: ReturnType<typeof buildApp> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = buildApp();
  }
  return appPromise;
}

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
    maxDuration: 30,
  },
};

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const app = await getApp();
  await app.ready();

  app.server.emit('request', req, res);
}