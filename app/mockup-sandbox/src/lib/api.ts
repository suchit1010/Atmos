export interface ApiHealthResult {
  ok: boolean;
  status: number;
  url: string;
  message: string;
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return trimmed.includes("localhost") || trimmed.includes("127.0.0.1")
    ? `http://${trimmed}`
    : `https://${trimmed}`;
}

export function getApiBase(): string {
  const envApiBase = import.meta.env["VITE_API_BASE_URL"] as string | undefined;
  if (envApiBase) {
    return normalizeBaseUrl(envApiBase);
  }

  return "http://localhost:9001";
}

export const API_BASE = getApiBase();

export async function checkApiHealth(signal?: AbortSignal): Promise<ApiHealthResult> {
  const url = `${API_BASE}/api/healthz`;
  const response = await fetch(url, { method: "GET", signal });

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      url,
      message: `API responded with ${response.status}`,
    };
  }

  return {
    ok: true,
    status: response.status,
    url,
    message: "Connected",
  };
}
