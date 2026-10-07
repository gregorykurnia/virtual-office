import type { DecodedIdToken, Auth } from "firebase-admin/auth";
import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";

export type OwnerIdentity = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

const verifiedOwnerContextKey: unique symbol = Symbol("verified-owner-context");
const systemOwnerContextKey: unique symbol = Symbol("system-owner-context");

/** A request identity that has passed token verification and the configured UID allowlist. */
export type VerifiedOwnerContext = Readonly<OwnerIdentity & {
  [verifiedOwnerContextKey]: true;
}>;

/** A configured server identity for background work; never construct this from request data. */
export type SystemOwnerContext = Readonly<{ uid: string; [systemOwnerContextKey]: true }>;
export type OwnerPathContext = VerifiedOwnerContext | SystemOwnerContext;

declare module "fastify" {
  interface FastifyRequest {
    ownerIdentity: VerifiedOwnerContext | null;
  }
}

function apiError(reply: FastifyReply, request: FastifyRequest, statusCode: number, code: string, message: string) {
  return reply.code(statusCode).send({
    error: { code, message, requestId: request.id }
  });
}

function authFailureCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string") {
    return error.code.slice(0, 96);
  }
  return "auth/verification-failed";
}

function getIdentity(claims: DecodedIdToken): VerifiedOwnerContext {
  const displayName = typeof claims.name === "string" ? claims.name : null;
  const email = typeof claims.email === "string" ? claims.email : null;
  return Object.freeze({ uid: claims.uid, email, displayName, [verifiedOwnerContextKey]: true as const });
}

export function createSystemOwnerContext(uid: string): SystemOwnerContext {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error("Invalid configured owner UID.");
  return Object.freeze({ uid, [systemOwnerContextKey]: true as const });
}

export function createRequireOwner(auth: Auth, allowlistedUid: string): preHandlerHookHandler {
  return async (request, reply) => {
    request.ownerIdentity = null;
    const authorization = request.headers.authorization;
    const match = typeof authorization === "string" ? /^Bearer ([^\s]+)$/.exec(authorization) : null;
    const token = match?.[1];
    if (!token || token.length > 8192) {
      return apiError(reply, request, 401, "unauthenticated", "Sign in to access this private API.");
    }

    let claims: DecodedIdToken;
    try {
      // Firebase Admin verifies the signature, issuer, audience and expiry. The second
      // argument also rejects revoked tokens and disabled accounts.
      claims = await auth.verifyIdToken(token, true);
    } catch (error) {
      request.log.warn({ authCode: authFailureCode(error) }, "Firebase ID token rejected");
      return apiError(reply, request, 401, "invalid_session", "Your sign-in has expired. Sign in again.");
    }

    if (claims.uid !== allowlistedUid) {
      return apiError(reply, request, 403, "owner_access_required", "This account is not allowed to access the private workspace.");
    }

    request.ownerIdentity = getIdentity(claims);
  };
}
