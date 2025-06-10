import { NextResponse } from "next/server";

interface GladiaResponse {
  url: string;
  id: string;
}

export async function POST() {
  try {
    const apiKey = process.env.GLADIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gladia API key not configured" },
        { status: 500 },
      );
    }

    const response = await fetch("https://api.gladia.io/v2/live", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gladia-Key": apiKey,
      },
      body: JSON.stringify({
        encoding: "wav/pcm",
        sample_rate: 16000,
        bit_depth: 16,
        channels: 1,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Gladia error: ${response.status}` },
        { status: response.status },
      );
    }

    const data = (await response.json()) as GladiaResponse;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error initializing Gladia session:", error);
    return NextResponse.json(
      { error: "Failed to initialize Gladia session" },
      { status: 500 },
    );
  }
}
