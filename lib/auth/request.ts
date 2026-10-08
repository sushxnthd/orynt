import { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken, type Session } from "./session";

export async function getRequestSession(request: NextRequest): Promise<Session | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
