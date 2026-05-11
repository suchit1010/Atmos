import { pool as sharedPool } from '@workspace/db';

export async function query(text: string, params?: any[]) {
  // @workspace/db exports a node-postgres Pool compatible object
  return sharedPool.query(text, params);
}
