import { randomUUID } from "node:crypto";
import Fastify, { LogController, type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { createRequireOwner } from "./auth/ownerAuth.js";
import type { BackendConfig } from "./config.js";

type AppDependencies = {
  config: BackendConfig;
  auth: Auth;
  firestore: Firestore;
};

function safeErrorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code.slice(0, 96);
  }
  if (error instanceof Error) return error.name.slice(0, 96);
  return "dependency_unavailable";
}

async function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(Object.assign(new Error("Readiness probe timed out."), { code: "probe_timeout" })), 2500);
        timeoutId.unref();
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

type DependencyHealth = { status: "ready" } | { status: "unavailable"; code: string };
type Readiness = { ready: boolean; dependencies: { firebaseAuth: DependencyHealth; firestore: DependencyHealth } };

function dependencyHealth(result: PromiseSettledResult<unknown>): DependencyHealth {
  return result.status === "fulfilled"
    ? { status: "ready" }
    : { status: "unavailable", code: safeErrorCode(result.reason) };
}

function createReadinessProbe(dependencies: AppDependencies): () => Promise<Readiness> {
  let cached: { expiresAt: number; value: Readiness } | undefined;
  return async () => {
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const [firebaseAuth, firestore] = await Promise.allSettled([
      withTimeout(dependencies.auth.getUser(dependencies.config.ownerUid)),
      withTimeout(dependencies.firestore.doc(dependencies.config.firestoreProbeDocument).get())
    ]);
    const dependenciesHealth = {
      firebaseAuth: dependencyHealth(firebaseAuth),
      firestore: dependencyHealth(firestore)
    };
    const value = {
      ready: Object.values(dependenciesHealth).every((dependency) => dependency.status === "ready"),
      dependencies: dependenciesHealth
    } satisfies Readiness;
    cached = { expiresAt: Date.now() + 5000, value };
    return value;
  };
}

function isRequestId(value: unknown): value is string {
  return typeof value === "string" && value.length <= 128 && /^[A-Za-z0-9._:-]+$/.test(value);
}

export async function buildApp(dependencies: AppDependencies): Promise<FastifyInstance> {
  const { config } = dependencies;
  const getReadiness = createReadinessProbe(dependencies);
  const app = Fastify({
    bodyLimit: 1_048_576,
    routerOptions: { maxParamLength: 128 },
    trustProxy: config.trustProxyCidrs,
    logController: new LogController({ requestIdLogLabel: "requestId" }),
    logger: {
      level: config.logLevel,
      redact: {
        paths: ["req.headers.authorization", "req.headers.cookie", "headers.authorization", "headers.cookie"],
        censor: "[REDACTED]"
      }
    },
    requestIdHeader: false,
    genReqId: (request) => isRequestId(request.headers["x-request-id"])
      ? request.headers["x-request-id"]
      : randomUUID()
  });

  await app.register(helmet, { global: true });
  if (config.corsOrigins.length > 0) {
    await app.register(cors, {
      origin: config.corsOrigins,
      credentials: false,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID"],
      exposedHeaders: ["X-Request-ID"]
    });
  }
  await app.register(rateLimit, {
    global: true,
    max: config.rateLimitMax,
    timeWindow: "1 minute",
    hook: "onRequest"
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-request-id", request.id);
    reply.header("cache-control", "no-store");
    return payload;
  });

  app.setErrorHandler((error, request, reply) => {
    const candidateStatus = typeof error === "object" && error !== null && "statusCode" in error
      && typeof error.statusCode === "number"
      ? error.statusCode
      : 500;
    const statusCode = candidateStatus >= 400 && candidateStatus < 500 ? candidateStatus : 500;
    if (statusCode >= 500) {
      request.log.error({ errorName: error instanceof Error ? error.name : "Error", errorCode: safeErrorCode(error) }, "API request failed");
    }
    const code = statusCode === 429 ? "rate_limited" : statusCode >= 500 ? "internal_error" : "invalid_request";
    const message = statusCode === 429
      ? "Too many requests. Try again shortly."
      : statusCode >= 500
        ? "The request could not be completed."
        : "The request is invalid.";
    return reply.code(statusCode).send({ error: { code, message, requestId: request.id } });
  });

  app.setNotFoundHandler((request, reply) => reply.code(404).send({
    error: { code: "not_found", message: "The requested API route was not found.", requestId: request.id }
  }));

  app.get("/health/live", async (_request, reply) => reply.code(200).send({ status: "alive" }));

  app.get("/health/ready", async (_request, reply) => {
    const readiness = await getReadiness();
    return readiness.ready
      ? reply.code(200).send({ status: "ready" })
      : reply.code(503).send({ status: "not_ready" });
  });

  const requireOwner = createRequireOwner(dependencies.auth, config.ownerUid);
  await app.register(async (privateApi) => {
    privateApi.addHook("onRequest", requireOwner);

    privateApi.get("/auth/session", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (request) => ({
      data: {
        uid: request.ownerIdentity!.uid,
        email: request.ownerIdentity!.email,
        displayName: request.ownerIdentity!.displayName
      }
    }));

    privateApi.get("/health/ready", async (request, reply) => {
      const readiness = await getReadiness();
      if (!readiness.ready) request.log.error({ dependencies: readiness.dependencies }, "Readiness probe failed");
      return reply.code(readiness.ready ? 200 : 503).send({
        status: readiness.ready ? "ready" : "not_ready",
        dependencies: readiness.dependencies
      });
    });
  }, { prefix: "/api" });

  return app;
}
