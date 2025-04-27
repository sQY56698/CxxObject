import type { Metadata } from "next";
import "@/app/globals.css";
import AdminSidebar from "@/components/admin/sidebar";

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
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
