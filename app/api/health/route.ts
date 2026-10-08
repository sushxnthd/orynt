import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ service: "orynt", status: "ok", time: new Date().toISOString() });
}
