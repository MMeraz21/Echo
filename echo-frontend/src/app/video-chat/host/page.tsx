import { redirect } from "next/navigation";
import { nanoid } from "nanoid";

export default function HostPage() {
  const lobbyId = nanoid(10);
  redirect(`/video-chat/${lobbyId}`);
}
