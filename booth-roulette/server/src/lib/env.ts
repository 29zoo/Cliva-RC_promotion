import process from "node:process";

export const isProduction = process.env.NODE_ENV === "production";

export function trustProxyEnabled(): boolean {
  const v = process.env.TRUST_PROXY?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export type CorsOriginsConfig = { mode: "reflect" } | { mode: "list"; origins: string[] };

/** KOIHA-NTRH loadSecurityEnv 의 CORS 부분과 동일 (JWT 미사용) */
export function loadCorsConfig(): CorsOriginsConfig {
  const corsRaw = process.env.CORS_ORIGIN?.trim();

  if (isProduction) {
    if (!corsRaw) {
      throw new Error(
        "[security] NODE_ENV=production일 때 CORS_ORIGIN이 필요합니다. 예: https://promotion.cliva.net (콤마 구분)",
      );
    }
    const origins = corsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (origins.length === 0) {
      throw new Error("[security] CORS_ORIGIN에 유효한 URL이 없습니다.");
    }
    return { mode: "list", origins };
  }

  if (corsRaw) {
    const origins = corsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (origins.length > 0) {
      return { mode: "list", origins };
    }
  }
  return { mode: "reflect" };
}

export function logLevel(): string {
  return process.env.LOG_LEVEL?.trim() || (isProduction ? "info" : "debug");
}
