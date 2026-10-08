import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { can, type Action } from "./policy";
import { SESSION_COOKIE, verifySessionToken, type Session } from "./session";

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try { return await verifySessionToken(token); } catch { return null; }
}

export async function requireServerSession(): Promise<Session> {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireServerAction(action: Action): Promise<Session> {
  const session = await requireServerSession();
  if (!can(session.role, action)) redirect(`/forbidden?action=${encodeURIComponent(action)}`);
  return session;
}
