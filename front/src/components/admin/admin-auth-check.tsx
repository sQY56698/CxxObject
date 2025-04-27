'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminStore } from '@/lib/store/admin-store';
import { Loader2 } from 'lucide-react';

export default function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { admin, isLoggedIn, fetchAdmin } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    if (isInit) return;
    setIsInit(true);
  }, [isInit]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 如果当前路径是登录页，不需要检查认证
        if (pathname === '/admin/login') {
          setIsLoading(false);
          return;
        }

        // 尝试获取当前管理员信息
        const adminData = await fetchAdmin();
        
        // 如果获取失败且不在登录页，重定向到登录页
        if (!adminData && pathname !== '/admin/login') {
          router.push('/admin/login');
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('认证检查失败', error);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [pathname, router, fetchAdmin]);

  // 如果是登录页，直接显示子组件
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // 如果正在加载中，显示加载指示器
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">加载中...</span>
      </div>
    );
  }

  // 如果已登录，显示子组件
  if (isLoggedIn && admin) {
    return <>{children}</>;
  }

  // 默认返回 null，但理论上不会到达这里，因为已经重定向到登录页
  return null;
} 