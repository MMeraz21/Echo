"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  const pathname = usePathname();

  const { pageTitle, lobbyId } = useMemo(() => {
    if (pathname === "/") return { pageTitle: "Home", lobbyId: null };
    if (pathname.startsWith("/video-chat")) {
      const segments = pathname.split("/");
      const maybeId = segments[2]; // e.g. /video-chat/abc123
      const isLobby = maybeId && maybeId.length > 0;
      return {
        pageTitle: "Video Chat",
        lobbyId: isLobby ? maybeId : null,
      };
    }
    if (pathname === "/inbox") return { pageTitle: "Inbox", lobbyId: null };
    if (pathname === "/calendar")
      return { pageTitle: "Calendar", lobbyId: null };
    return { pageTitle: "Documents", lobbyId: null };
  }, [pathname]);

  return (
    <header
      className={`flex h-12 shrink-0 items-center gap-2 border-b border-zinc-800 bg-black transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 ${className}`}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        {lobbyId && (
          <>
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
            <span className="text-muted-foreground text-sm">
              Lobby: {lobbyId}
            </span>
          </>
        )}
      </div>
    </header>
  );
}
