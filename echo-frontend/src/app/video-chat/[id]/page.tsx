interface Props {
  params: {
    id: string;
  };
}

export default function VideoChatRoom({ params }: Props) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-8">
      <p className="text-muted-foreground mb-8">
        You&apos;re in the lobby. Waiting for others to join...
      </p>

      {/* Placeholder: add video/chat components here */}
      <div className="bg-muted flex h-[400px] w-full items-center justify-center rounded-lg text-sm">
        Video chat component coming soon
      </div>
    </div>
  );
}
