import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "./_components/app-header";

export const metadata: Metadata = {
  title: "Echo",
  description: "Generated by create-t3-app",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <body className="bg-sidebar flex min-h-screen text-white">
        <TRPCReactProvider>
          <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
              {/* Main container with rounded border */}
              <div className="border-border bg-background flex h-full flex-col overflow-hidden rounded-xl border-l shadow-sm">
                <AppHeader />
                <main className="flex flex-1 flex-col overflow-hidden">
                  {children}
                </main>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
