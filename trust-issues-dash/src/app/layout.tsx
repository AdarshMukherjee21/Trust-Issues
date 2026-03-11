import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // 1. Import the Script component
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trust Issues",
  description: "In Cybersecurity, having Trust Issues is a good thing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}

        {/* 2. Cloudflare Web Analytics */}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "389b1f02eb394d52a99a5b43d6725cc9"}'
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}