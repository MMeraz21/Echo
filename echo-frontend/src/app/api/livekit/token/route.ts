import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

interface RequestBody {
  roomName: string;
  participantName: string;
}

export async function POST(req: Request) {
  const { roomName, participantName } = (await req.json()) as RequestBody;

  const at = new AccessToken(API_KEY, API_SECRET, {
    identity: participantName,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
  });

  const token = at.toJwt();

  return NextResponse.json({ token });
}
