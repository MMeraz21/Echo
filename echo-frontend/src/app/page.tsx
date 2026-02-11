import Image from "next/image";
import Link from "next/link";
import {
  VideoIcon,
  Inbox,
  ArrowRight,
  Zap,
  MessageSquare,
  Users,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-1 flex-col overflow-y-auto p-6 lg:p-10">
      {/* Hero — logo left, text + actions right */}
      <section className="flex flex-col items-center gap-8 pb-10 lg:flex-row lg:items-center lg:gap-12">
        <div className="shrink-0 overflow-hidden rounded-2xl lg:w-1/2">
          <Image
            src="/echo-logo.png"
            alt="Echo"
            width={2816}
            height={1536}
            className="w-full object-cover"
            priority
          />
        </div>
        <div className="flex flex-col gap-4 text-center lg:text-left">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            {userName ? `Welcome back, ${userName}` : "Welcome to Echo"}
          </h1>
          <p className="text-muted-foreground text-lg">
            Your space for video calls and real-time messaging. Jump right in.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2 lg:justify-start">
            {quickActions.map((action) => (
              <Button key={action.title} asChild>
                <Link href={action.href}>
                  <action.icon className="h-4 w-4" />
                  {action.title}
                </Link>
              </Button>
            ))}
            {!userName && (
              <Button variant="outline" asChild>
                <Link href="/sign-in">
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Bottom grid — recent activity + tips side by side */}
      <section className="grid gap-6 lg:grid-cols-5">
        {/* Recent activity — wider */}
        <div className="lg:col-span-3">
          <h3 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">
            Recent Activity
          </h3>
          <div className="border-border bg-card/50 flex flex-col items-center justify-center rounded-xl border py-16">
            <div className="bg-secondary mb-3 flex h-10 w-10 items-center justify-center rounded-full">
              <Zap className="text-muted-foreground h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-sm">
              Nothing here yet. Start a video call or send a message to get
              going.
            </p>
          </div>
        </div>

        {/* Tips — narrower sidebar */}
        <div className="lg:col-span-2">
          <h3 className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wider">
            Quick Tips
          </h3>
          <div className="flex flex-col gap-3">
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
        </div>
      </section>
    </div>
  );
}
