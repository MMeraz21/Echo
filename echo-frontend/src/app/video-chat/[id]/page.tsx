import { use, useEffect, useState } from "react";
import "@livekit/components-styles";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";

interface TokenResponse {
  token: string;
}

export default function VideoChatRoom({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [token, setToken] = useState<string | null>(null);
  const roomName = resolvedParams.id;

  useEffect(() => {
    const fetchToken = async () => {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
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
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            connect
            video
            audio
            className="h-[400px] w-full"
          />
        ) : (
          <div className="bg-muted flex h-[400px] w-full items-center justify-center rounded-lg text-sm">
            Connecting to video chat...
          </div>
        )}
      </div>
    </div>
  );
}
