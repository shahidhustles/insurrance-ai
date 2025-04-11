import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { NavigationProvider } from "@/lib/navigation-context";
import { PageTransitionLoader } from "@/components/ui/page-loading";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Insurance AI",
  description: "AI-powered insurance management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ConvexClientProvider>
        <NavigationProvider>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <PageTransitionLoader />
            {children}
          </body>
        </NavigationProvider>
      </ConvexClientProvider>
    </html>
  );
}
