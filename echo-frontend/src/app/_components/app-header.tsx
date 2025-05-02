import { SidebarTrigger } from "@/components/ui/sidebar";

interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className }: AppHeaderProps) {
  return (
    <header
      className={`flex h-8 items-center border-b border-zinc-800 bg-zinc-900 px-4 ${className}`}
    >
      <SidebarTrigger className="mr-2" />
      <div className="flex-1"></div>
    </header>
  );
}
