import Link from "next/link";
import { VideoIcon, Inbox, Calendar, ArrowRight } from "lucide-react";

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
  {
    title: "Calendar",
    description: "View upcoming events and schedule new ones.",
    href: "#",
    icon: Calendar,
  },
];

export default async function Home() {
  const session = await auth();
  const userName = session?.user?.name;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Hero section */}
      <section className="flex flex-col items-center justify-center gap-4 px-6 pt-16 pb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {userName ? `Welcome back, ${userName}` : "Welcome to Echo"}
        </h1>
        <p className="text-muted-foreground max-w-lg text-lg">
          Your all-in-one space for video calls, messaging, and scheduling.
          Pick up where you left off.
        </p>
      </section>

      {/* Quick actions */}
      <section className="mx-auto grid w-full max-w-3xl gap-4 px-6 pb-16 sm:grid-cols-3">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="border-border bg-card hover:bg-accent group flex flex-col gap-3 rounded-xl border p-5 transition-colors"
          >
            <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-lg">
              <action.icon className="text-muted-foreground h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="font-semibold">{action.title}</h2>
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
    </div>
  );
}
