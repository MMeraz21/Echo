import { Search, Settings, HelpCircle } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const secondaryItems = [
  { title: "Settings", url: "#", icon: Settings },
  { title: "Get Help", url: "#", icon: HelpCircle },
  { title: "Search", url: "#", icon: Search },
];

export function NavSecondary() {
  return (
    <SidebarMenu>
      {secondaryItems.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <a href={item.url}>
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
