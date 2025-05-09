import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

interface RequestBody {
  roomName: string;
  participantName: string;
}

export async function POST(req: NextRequest) {
  try {
    const { roomName, participantName } = (await req.json()) as RequestBody;

    if (!roomName || !participantName) {
      return NextResponse.json(
        { error: "Missing roomName or participantName" },
        { status: 400 },
      );
    }

    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: participantName,
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Token generation error:", error);
    console.error(
      "Type of error caught:",
      typeof error,
      error instanceof Error ? error.message : "",
    );

    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 },
    );
  }
}
