import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { buildTokenMetadata, persistTokenMetadata } from '../lib/metadata';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// GET /api/assets/:projectId/metadata
// Returns the Metaplex-ready metadata JSON for the project
router.get('/:projectId/metadata', async (req, res) => {
  const { projectId } = req.params;
  try {
    const meta = await buildTokenMetadata(projectId);
    res.json({ success: true, metadata: meta });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// POST /api/assets/:projectId/metadata
// Protected: Persist provided metadata to project's metadata JSON
router.post('/:projectId/metadata', requireAuth, async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  const meta = req.body;

  if (!meta || typeof meta !== 'object') {
    return res.status(400).json({ error: 'Invalid metadata payload' });
  }

  try {
    const saved = await persistTokenMetadata(projectId, meta);
    res.json({ success: true, metadata: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets/:projectId/metadata/export
// Simple export endpoint to write the metadata JSON to a file for later IPFS/Metaplex upload
router.get('/:projectId/metadata/export', requireAuth, async (req: AuthRequest, res) => {
  const { projectId } = req.params;
  try {
    const meta = await buildTokenMetadata(projectId);
    const outDir = process.env.METADATA_EXPORT_DIR || path.join(process.cwd(), 'tmp', 'metadata');
    await fs.mkdir(outDir, { recursive: true });
    const filename = path.join(outDir, `${projectId}.metadata.json`);
    await fs.writeFile(filename, JSON.stringify(meta, null, 2), 'utf8');
    res.json({ success: true, path: filename });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
