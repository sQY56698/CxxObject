"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";

interface AuthCheckProps {
  children: React.ReactNode;
}

const publicRoutes = ['/auth', '/'];

export function AuthCheck({ children }: AuthCheckProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, fetchUser, isLoading } = useUserStore();
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // 初始检查当前用户
    const checkUser = async () => {
      await fetchUser();
      setInitialLoading(false);
    };
    checkUser();
  }, [fetchUser]);

  useEffect(() => {
    // 只有在初始加载完成后且用户未登录时才重定向
    if (!initialLoading && !isLoading && !isLoggedIn && 
        !publicRoutes.some(route => pathname.startsWith(route))) {
      router.push('/auth?mode=login');
    }
  }, [isLoggedIn, isLoading, initialLoading, pathname, router]);

  return <>{children}</>;
} 