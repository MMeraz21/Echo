import Link from "next/link";
import {
  VideoIcon,
  Inbox,
  ArrowRight,
  Zap,
  MessageSquare,
  Users,
} from "lucide-react";

import { auth } from "@/server/auth";

const quickActions = [
  {
    title: "Video Chat",
    description: "Start or join a video call with friends and teammates.",
    href: "/video-chat",
    icon: VideoIcon,
  },
  {
    title: "Inbox",
    description: "Check your latest messages and notifications.",
    href: "#",
    icon: Inbox,
  },
];

const tips = [
  {
    icon: Zap,
    text: "Use the sidebar to quickly jump between features.",
  },
  {
    icon: MessageSquare,
    text: "Video lobbies generate a shareable code for instant invites.",
  },
  {
    icon: Users,
    text: "Sign in to save your preferences and chat history.",
  },
];

export default async function Home() {
  const session = await auth();
  const userName = session?.user?.name;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Hero section */}
      <section className="flex flex-col items-center justify-center gap-4 px-6 pt-16 pb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {userName ? `Welcome back, ${userName}` : "Welcome to Echo"}
        </h1>
        <p className="text-muted-foreground max-w-lg text-lg">
          Your space for video calls and real-time messaging. Jump right in.
        </p>
      </section>

      {/* Quick actions */}
      <section className="mx-auto grid w-full max-w-2xl gap-4 px-6 pb-10 sm:grid-cols-2">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="border-border bg-card hover:bg-accent group flex flex-col gap-3 rounded-xl border p-6 transition-colors"
          >
            <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-lg">
              <action.icon className="text-muted-foreground h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{action.title}</h2>
              <p className="text-muted-foreground text-sm leading-snug">
                {action.description}
              </p>
            </div>
            <span className="text-muted-foreground group-hover:text-foreground mt-auto inline-flex items-center gap-1 text-sm transition-colors">
              Open <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </section>

      {/* Recent activity placeholder */}
      <section className="mx-auto w-full max-w-2xl px-6 pb-10">
        <h3 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">
          Recent Activity
        </h3>
        <div className="border-border bg-card/50 flex flex-col items-center justify-center rounded-xl border py-12">
          <div className="bg-secondary mb-3 flex h-10 w-10 items-center justify-center rounded-full">
            <Zap className="text-muted-foreground h-5 w-5" />
          </div>
          <p className="text-muted-foreground text-sm">
            Nothing here yet. Start a video call or send a message to get going.
          </p>
        </div>
      </section>

      {/* Tips */}
      <section className="mx-auto w-full max-w-2xl px-6 pb-16">
        <h3 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">
          Quick Tips
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {tips.map((tip) => (
            <div
              key={tip.text}
              className="border-border bg-card/30 flex items-start gap-3 rounded-lg border p-4"
            >
              <tip.icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-muted-foreground text-sm leading-snug">
                {tip.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
