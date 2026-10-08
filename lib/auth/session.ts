import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./policy";

export const SESSION_COOKIE = "orynt_session";

export type Session = {
  userId: string;
  tenantId: string;
  role: Role;
  name: string;
  email: string;
};

function key() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 24) throw new Error("SESSION_SECRET must be at least 24 characters");
  return new TextEncoder().encode(value);
}

export async function createSessionToken(session: Session) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .setIssuer("orynt")
    .setAudience("orynt-web")
    .sign(key());
}

export async function verifySessionToken(token: string): Promise<Session> {
  const { payload } = await jwtVerify(token, key(), { issuer: "orynt", audience: "orynt-web" });
  return payload as unknown as Session;
}
