export default function VideoChatHome() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center space-y-8 px-4 py-16">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome to Echo Video Chat</h1>
        <p className="text-muted-foreground">
          Start a new video lobby or join one with a code.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <a
          href="/video-chat/host"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-6 py-3 font-semibold transition"
        >
          Host a Lobby
        </a>

        <form
          action="/video-chat/join"
          method="GET"
          className="flex items-center gap-2"
        >
          <input
            type="text"
            name="id"
            placeholder="Enter Lobby Code"
            className="border-input bg-background text-foreground rounded-md border px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2 transition"
          >
            Join
          </button>
        </form>
      </div>

      <div className="text-muted-foreground max-w-md pt-8 text-center text-sm">
        <p>
          When you host a lobby, youll get a unique code to share. Anyone with
          the code can join your call.
        </p>
      </div>
    </div>
  );
}
