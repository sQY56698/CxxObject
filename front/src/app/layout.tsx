import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthCheck } from "@/components/auth/auth-check";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { WebSocketProvider } from "@/providers/WebSocketProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "File Bounty",
  description: "Your file sharing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthCheck>
          <WebSocketProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1 pt-16">
                {children}
              </main>
            </div>
          </WebSocketProvider>
        </AuthCheck>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
