import { redirect } from "next/navigation";

export default function JoinPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  const id = searchParams.id;

  if (!id) {
    redirect("/video-chat"); //remember to implement error page
  }

  redirect(`/video-chat/${id}`);
}
