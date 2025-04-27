import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Toaster } from "sonner";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import AdminAuthCheck from "@/components/admin/admin-auth-check";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "后台管理页面",
  description: "后台管理页面",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US">
      <body className={inter.className}>
        <WebSocketProvider>
          <AdminAuthCheck>
            {children}
          </AdminAuthCheck>
        </WebSocketProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
