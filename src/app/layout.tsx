import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

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
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} h-full antialiased`}>
        {/*
         * No shell here. It belongs to the `(app)` group, so routes outside it —
         * `/sign-in` — render without navigation. See `src/app/(app)/layout.tsx`.
         */}
        <body className={`${inter.className} flex min-h-full flex-col`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
