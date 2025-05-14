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

export default function VideoChatRoom({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomName } = use(params);
  const [token, setToken] = useState<string | null>(null);

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
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {token ? (
        <LiveKitRoom
          token={token}
          serverUrl={ROOM_URL}
          connect={true}
          video={true}
          audio={true}
          className="h-full w-full"
        >
          <CustomVideoConference />
        </LiveKitRoom>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-lg">
          Connecting to video chat...
        </div>
      )}
    </div>
  );
}
