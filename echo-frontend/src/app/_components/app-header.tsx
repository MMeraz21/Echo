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

  const pageTitle = useMemo(() => {
    if (pathname === "/") return "Home";
    if (pathname === "/video-chat") return "Video Chat";
    if (pathname === "/inbox") return "Inbox";
    if (pathname === "/calendar") return "Calendar";
    return "Documents"; // fallback
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
      </div>
    </header>
  );
}
