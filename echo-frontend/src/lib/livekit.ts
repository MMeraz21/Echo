import { AccessToken } from "livekit-server-sdk";

export function createToken(room: string, identity?: string) {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: identity ?? crypto.randomUUID(), // unique per user
    },
  );

  token.addGrant({ room, roomJoin: true });

  return token.toJwt();
}
