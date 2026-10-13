interface ProjectMetadata {
  [key: string]: string | number | undefined;
}

interface BoundaryPoint {
  lat: number;
  lng: number;
}

export interface SatelliteSignals {
  source: "mock" | "google-static-maps";
  imageryAvailable: boolean;
  provider: string;
  boundaryPoints: number;
  landAreaHectares: number | null;
  evidenceSummary: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function parseBoundaryPolygon(metadata: ProjectMetadata): BoundaryPoint[] {
  const raw = metadata.landBoundaryPolygon;
  if (!raw || typeof raw !== "string") return [];

  try {
    const parsed = JSON.parse(raw) as Array<{ lat?: unknown; lng?: unknown }>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((p) => ({ lat: toNumber(p.lat), lng: toNumber(p.lng) }))
      .filter((p): p is { lat: number; lng: number } => p.lat !== null && p.lng !== null)
      .map((p) => ({
        lat: clamp(p.lat, -90, 90),
        lng: clamp(p.lng, -180, 180),
      }));
  } catch {
    return [];
  }
}

function approximateAreaHectares(points: BoundaryPoint[]): number | null {
  if (points.length < 3) return null;

  const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const metersPerDegLat = 111_320;
  const metersPerDegLng = 111_320 * Math.cos((avgLat * Math.PI) / 180);

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const ax = a.lng * metersPerDegLng;
    const ay = a.lat * metersPerDegLat;
    const bx = b.lng * metersPerDegLng;
    const by = b.lat * metersPerDegLat;
    area += ax * by - bx * ay;
  }

  const squareMeters = Math.abs(area) / 2;
  return Number((squareMeters / 10_000).toFixed(2));
}

async function checkGoogleStaticMapsImagery(boundary: BoundaryPoint[]): Promise<boolean> {
  const apiKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!apiKey || boundary.length === 0) return false;

  const points = boundary.length >= 3 ? boundary : boundary.slice(0, 1);
  const path = points.map((p) => `${p.lat},${p.lng}`).join("|");
  const url =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?size=640x320` +
    `&maptype=satellite` +
    `&path=color:0x00ff00ff|weight:3|${encodeURIComponent(path)}` +
    `&key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getSatelliteSignals(metadata: ProjectMetadata): Promise<SatelliteSignals> {
  const boundary = parseBoundaryPolygon(metadata);
  const landAreaHectares = approximateAreaHectares(boundary);
  const imageryAvailable = await checkGoogleStaticMapsImagery(boundary);

  if (imageryAvailable) {
    return {
      source: "google-static-maps",
      imageryAvailable: true,
      provider: "Google Static Maps (satellite)",
      boundaryPoints: boundary.length,
      landAreaHectares,
      evidenceSummary: "Satellite basemap imagery is reachable for supplied boundary coordinates.",
    };
  }

  return {
    source: "mock",
    imageryAvailable: false,
    provider: "Mock satellite adapter",
    boundaryPoints: boundary.length,
    landAreaHectares,
    evidenceSummary:
      "Falling back to mock satellite signals. Set GOOGLE_MAPS_API_KEY and provide landBoundaryPolygon coordinates to enable live imagery checks.",
  };
}
