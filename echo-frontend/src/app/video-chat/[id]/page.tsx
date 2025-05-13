"use client";

import { use, useEffect, useState } from "react";
import "@livekit/components-styles";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
// import { createToken } from "@/lib/livekit";
import { CustomVideoConference } from "@/components/video-conference/CustomVideoConference";

interface TokenResponse {
  token: string;
}

const ROOM_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL;
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

export default function VideoChatRoom({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomName } = use(params);
  const [token, setToken] = useState<string | null>(null);
  //   const roomName = resolvedParams.id;

  useEffect(() => {
    const fetchToken = async () => {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomName,
          participantName: "Guest" + Math.floor(Math.random() * 1000000),
        }),
      });

      const data = (await res.json()) as TokenResponse;
      setToken(data.token);
    };

    void fetchToken();
  }, [roomName]);

  if (!token) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen w-full flex-col items-center justify-center p-8">
      <p className="text-muted-foreground mb-8">
        You&apos;re in the lobby. Waiting for others to join...
      </p>

      <div className="w-full max-w-4xl overflow-hidden rounded-lg">
        {token ? (
          <LiveKitRoom
            token={token}
            serverUrl={ROOM_URL}
            connect={true}
            video={true}
            audio={true}
            className="h-[400px] w-full"
          >
            <CustomVideoConference />
          </LiveKitRoom>
        ) : (
          <div className="bg-muted flex h-[400px] w-full items-center justify-center rounded-lg text-sm">
            Connecting to video chat...
          </div>
        )}
      </div>
    </div>
  );
}
