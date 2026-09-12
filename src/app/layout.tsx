import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { AppLayoutShell } from "@/components/layout/app-layout-shell";
import { AuthProvider } from "@/context/auth-context";
import "./globals.css";
import "./portal.css";
import "./motion.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Utopians Core - Learn anything. Instantly.",
  description:
    "Connect with expert teachers for live, on-demand micro-sessions. No courses, just help when you need it.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col antialiased font-sans">
        <AuthProvider>
          <AppLayoutShell>{children}</AppLayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
