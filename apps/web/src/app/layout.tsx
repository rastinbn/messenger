import type { Metadata } from "next";
import "./globals.css";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { ServiceProvider } from "@/components/providers/ServiceProvider";
import { ThemeInitializer } from "@/components/providers/ThemeInitializer";
import { ChatPrefsInitializer } from "@/components/providers/ChatPrefsInitializer";

// NOTE: next/font/google requires network access to fonts.googleapis.com at
// build time, which this dev sandbox's egress allowlist blocks. In any real
// deployment environment, replace the stacks below with:
//   import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
// and apply their `.variable` classNames on <html> as usual. Token names
// (--font-inter, --font-space-grotesk, --font-jbmono) are already wired in
// globals.css so no other change is needed.

export const metadata: Metadata = {
  title: "Messenger",
  description: "A fast, calm place for conversations that never stop."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col bg-bg-base text-text-primary"
        suppressHydrationWarning
      >
        <ThemeInitializer />
        <ChatPrefsInitializer />
        <QueryProvider>
          <ServiceProvider>{children}</ServiceProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
