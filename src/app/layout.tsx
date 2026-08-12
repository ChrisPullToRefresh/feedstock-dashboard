import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import "./globals.css";

// `variable` feeds Tailwind's --font-sans token; `className` is applied to
// the body so the whole document renders in Inter.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Feedstock Dashboard",
  description: "Record feedstock movements in and out of the facility.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className={`${inter.className} flex min-h-full flex-col`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
