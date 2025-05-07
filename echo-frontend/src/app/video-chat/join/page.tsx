import { use } from "react";
import { redirect } from "next/navigation";

export default function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedSearchParams = use(searchParams);
  const id = resolvedSearchParams.id;

  if (!id) {
    redirect("/video-chat"); //remember to implement error page
  }

  redirect(`/video-chat/${id}`);
}
