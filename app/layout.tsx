import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";

import { Header } from "@/app/_components/Header";
import { StoreProviders } from "@/app/_components/StoreProviders";
import { WhatsAppButton } from "@/app/_components/WhatsAppButton";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Coloured Gemstones",
  description: "A private atelier for coloured gemstones.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <StoreProviders>
          <Header />
          <div className="flex flex-1 flex-col">{children}</div>
          <WhatsAppButton />
        </StoreProviders>
      </body>
    </html>
  );
}
