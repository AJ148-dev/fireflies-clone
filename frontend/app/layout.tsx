import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { Shell } from "@/components/Shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fireflies",
  description: "Meeting notes, transcripts, and action items",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
