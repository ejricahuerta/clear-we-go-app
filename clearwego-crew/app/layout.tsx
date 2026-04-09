import type { Metadata } from "next";
import { DM_Sans, Lora, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { PWARegister } from "@/components/pwa-register";

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontBody = Lora({
  subsets: ["latin"],
  variable: "--font-body",
});

const fontSerif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Clear We Go - Crew",
  description: "Crew app for Clear We Go",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", fontSans.variable, fontBody.variable, fontSerif.variable, fontMono.variable)}
    >
      <body className="antialiased">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
