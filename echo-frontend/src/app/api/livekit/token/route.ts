import { NextRequest, NextResponse } from "next/server";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;

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

    if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
      console.error("Missing required LiveKit environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const roomService = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);

    try {
      const participants = await roomService.listParticipants(roomName);

      if (participants.length >= 2) {
        return NextResponse.json(
          { error: "Room is full. Only 2 participants allowed." },
          { status: 403 },
        );
      }
    } catch (roomError) {
      // Room might not exist yet, which is fine
      // We'll allow the token to be created to join a new room
      console.log("Room check error (possibly new room):", roomError);
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
