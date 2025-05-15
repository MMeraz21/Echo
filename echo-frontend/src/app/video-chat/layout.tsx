"use client";

import "@/styles/globals.css";
import { Geist } from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function VideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${geist.variable} h-full w-full overflow-hidden bg-black text-white`}
    >
      {children}
    </div>
  );
}
