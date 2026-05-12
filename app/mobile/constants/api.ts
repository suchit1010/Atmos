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
  const envApiUrl = typeof process !== "undefined" ? process.env["EXPO_PUBLIC_API_URL"] : undefined;
  if (envApiUrl) {
    return normalizeBaseUrl(envApiUrl);
  }

  const envDomain = typeof process !== "undefined" ? process.env["EXPO_PUBLIC_DOMAIN"] : undefined;
  if (envDomain) {
    return normalizeBaseUrl(envDomain);
  }

  return "http://localhost:9001";
}

export const API_BASE = getApiBase();
