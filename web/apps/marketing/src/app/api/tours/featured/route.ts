import { NextResponse } from "next/server";
import { getFeaturedTours } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const { tours, error } = await getFeaturedTours();
  return NextResponse.json({ tours }, {
    status: error ? 503 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
