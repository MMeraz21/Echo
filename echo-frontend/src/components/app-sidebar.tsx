import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { ArrowUpCircleIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";

type SidebarProps = ComponentProps<typeof Sidebar>;

export function AppSidebar(props: SidebarProps) {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="bg-sidebar text-sidebar-foreground"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Echo</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain />
        <div className="mt-auto">
          <NavSecondary />
        </div>
      </SidebarContent>

      <SidebarFooter>{/* <NavUser /> */}</SidebarFooter>
    </Sidebar>
  );
}
