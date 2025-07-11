import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const vehicle = searchParams.get("vehicle") || "car";
  const apiKey = process.env.NEXT_PUBLIC_GOONG_DIRECTIONS_API_KEY;

  if (!origin || !destination) {
    return NextResponse.json(
      { error: "Thiếu origin hoặc destination." },
      { status: 400 }
    );
  }

  const url = `https://rsapi.goong.io/Direction?origin=${origin}&destination=${destination}&vehicle=${vehicle}&api_key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  return NextResponse.json(data);
}
