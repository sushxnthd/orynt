import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { memberships, users } from "@/lib/db/schema";
import type { Role, Scope } from "@/lib/auth/policy";

const bodySchema = z.object({ email: z.string().email(), password: z.string().min(8) });

function homeForRole(role: Role) {
  if (role === "student") return "/me";
  if (role === "parent") return "/family";
  if (role === "teacher") return "/academics";
  if (role === "counselor") return "/students";
  if (role === "it_admin") return "/connect";
  return "/";
}

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid credentials payload" }, { status: 400 });

  const db = getDb();
  const rows = await db
    .select({ user: users, membership: memberships })
    .from(users)
    .innerJoin(memberships, eq(memberships.userId, users.id))
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);
  const row = rows[0];
  if (!row?.user.passwordHash || row.user.disabled || !(await compare(parsed.data.password, row.user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createSessionToken({
    userId: row.user.id,
    tenantId: row.membership.tenantId,
    role: row.membership.role,
    name: row.user.name,
    email: row.user.email,
    scope: (row.membership.scope ?? {}) as Scope,
  });
  const response = NextResponse.json({ ok: true, role: row.membership.role, name: row.user.name, home: homeForRole(row.membership.role) });
  response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
  return response;
}
