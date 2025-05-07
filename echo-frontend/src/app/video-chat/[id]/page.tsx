"use client";

export default function VideoChatRoom({ params }: { params: { id: string } }) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-2xl font-bold">Lobby ID: {params.id}</h1>
      <p className="text-muted-foreground mb-8">
        You&apos;re in the lobby. Waiting for others to join...
      </p>
      <div className="bg-muted flex h-[400px] w-full items-center justify-center rounded-lg text-sm">
        Video chat component coming soon
      </div>
    </div>
  );
}
