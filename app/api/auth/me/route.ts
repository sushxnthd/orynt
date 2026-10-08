import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/auth/request";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ session });
}
