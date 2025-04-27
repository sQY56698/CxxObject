'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAdminStore } from '@/lib/store/admin-store';
import { 
  Home, 
  FileText, 
  Upload,
  LogOut,
  Bell,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAdminStore();

  const navItems = [
    {
      name: '控制台',
      href: '/admin',
      icon: <Home className="w-5 h-5 mr-2" />,
    },
    {
      name: '文件审核',
      href: '/admin/review',
      icon: <FileText className="w-5 h-5 mr-2" />,
    },
    {
      name: '文件管理',
      href: '/admin/files',
      icon: <Upload className="w-5 h-5 mr-2" />,
    },
    {
      name: '系统消息',
      href: '/admin/messages',
      icon: <Bell className="w-5 h-5 mr-2" />,
    },
    {
      name: '管理设置',
      href: '/admin/settings',
      icon: <Settings className="w-5 h-5 mr-2" />,
    },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/admin/login';
  };

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 shadow-sm">
      {/* 侧边栏头部 - 管理员信息 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg font-semibold text-gray-700">
            {admin?.username?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{admin?.username || '管理员'}</span>
            <span className="text-xs text-gray-500">管理员</span>
          </div>
        </div>
      </div>

      {/* 侧边栏导航菜单 */}
      <nav className="p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 侧边栏底部 - 退出登录 */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          退出登录
        </Button>
      </div>
    </div>
  );
} 