import { z } from "zod";

const originList = z.string().optional().default("").transform((value, context) => {
  if (!value.trim()) return [] as string[];
  const origins: string[] = [];
  for (const candidate of value.split(",").map((item) => item.trim()).filter(Boolean)) {
    try {
      const url = new URL(candidate);
      if (url.origin !== candidate.replace(/\/$/, "")) {
        context.addIssue({ code: "custom", message: "CORS origins must be exact origins without a path." });
        return z.NEVER;
      }
      origins.push(url.origin);
    } catch {
      context.addIssue({ code: "custom", message: "CORS_ORIGINS must contain valid exact origins." });
      return z.NEVER;
    }
  }
  return [...new Set(origins)];
});

const trustedProxyList = z.string().optional().default("").transform((value) =>
  [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))]
);

const BackendConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().trim().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  FIREBASE_PROJECT_ID: z.string().trim().min(1),
  OWNER_UID: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),
  CORS_ORIGINS: originList,
  TRUST_PROXY_CIDRS: trustedProxyList,
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10_000).default(120),
  FIRESTORE_PROBE_DOCUMENT: z.string().trim().regex(/^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/).default("system/health")
});

export type BackendConfig = {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  firebaseProjectId: string;
  ownerUid: string;
  corsOrigins: string[];
  trustProxyCidrs: string[];
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  rateLimitMax: number;
  firestoreProbeDocument: string;
};

export function loadBackendConfig(environment: NodeJS.ProcessEnv = process.env): BackendConfig {
  const parsed = BackendConfigSchema.safeParse(environment);
  if (!parsed.success) {
    const invalidKeys = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "configuration")))];
    throw new Error(`Backend configuration is invalid: ${invalidKeys.join(", ")}`);
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    host: parsed.data.HOST,
    port: parsed.data.PORT,
    firebaseProjectId: parsed.data.FIREBASE_PROJECT_ID,
    ownerUid: parsed.data.OWNER_UID,
    corsOrigins: parsed.data.CORS_ORIGINS,
    trustProxyCidrs: parsed.data.TRUST_PROXY_CIDRS,
    logLevel: parsed.data.LOG_LEVEL,
    rateLimitMax: parsed.data.RATE_LIMIT_MAX,
    firestoreProbeDocument: parsed.data.FIRESTORE_PROBE_DOCUMENT
  };
}
