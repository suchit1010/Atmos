import { db, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image?: string; // URL
  external_url?: string;
  attributes?: Record<string, any>[];
  properties?: {
    files?: { uri: string; type?: string }[];
    category?: string;
    creators?: { address: string; share: number }[];
  };
  // Metaplex-compatible fields
  seller_fee_basis_points?: number;
  collection?: { name: string; family?: string };
}

export async function buildTokenMetadata(projectId: string) {
  if (!db) throw new Error("Database not available");

  const rows = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  const project = rows?.[0];
  if (!project) throw new Error("Project not found");

  // Base metadata
  const meta: TokenMetadata = {
    name: `${project.name} Carbon Credit`,
    symbol: `ATMOS-${(project.name || 'PRJ').slice(0,3).toUpperCase()}`,
    description: project.description || `Verified carbon reductions from ${project.name}`,
    image: project.satImage || undefined,
    external_url: process.env.PROJECT_FRONTEND_URL ? `${process.env.PROJECT_FRONTEND_URL}/projects/${project.id}` : undefined,
    attributes: [
      { trait_type: 'Type', value: project.type },
      { trait_type: 'Verification Grade', value: project.verificationGrade || 'N/A' },
      { trait_type: 'CO2 Reduction (t)', value: project.co2Reduction ? String(project.co2Reduction) : '0' },
      { trait_type: 'Verification Confidence', value: project.verificationConfidence || 0 },
    ],
    properties: {
      files: project.satImage ? [{ uri: project.satImage, type: 'image/png' }] : [],
      category: 'image',
      creators: [],
    },
    seller_fee_basis_points: 0,
  };

  // Merge any existing token metadata stored in project's metadata JSON
  try {
    const existing = project.metadata ? JSON.parse(project.metadata) : {};
    if (existing?.token && typeof existing.token === 'object') {
      Object.assign(meta, existing.token);
    }
  } catch {
    // ignore parse errors
  }

  return meta;
}

export async function persistTokenMetadata(projectId: string, meta: TokenMetadata) {
  if (!db) throw new Error("Database not available");
  const rows = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId));
  const project = rows?.[0];
  if (!project) throw new Error("Project not found");

  let metadataObj: any = {};
  try {
    metadataObj = project.metadata ? JSON.parse(project.metadata) : {};
  } catch {
    metadataObj = {};
  }

  metadataObj.token = meta;

  await db.update(projectsTable).set({ metadata: JSON.stringify(metadataObj), updatedAt: new Date() }).where(eq(projectsTable.id, projectId));

  return meta;
}
