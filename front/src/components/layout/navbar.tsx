"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LogOut, User as UserIcon, Coins, MessageSquare, Target } from "lucide-react";
import { useUserStore } from "@/lib/store/user-store";
import { usePointsStore } from '@/lib/store/points-store';
import { useMessageStore } from '@/lib/store/message-store';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import HomeSignButton from "@/components/sign/HomeSignButton";

export function Navbar() {
  const router = useRouter();
  const { user, isLoggedIn, logout, isLoading } = useUserStore();
  const { points, fetchPoints } = usePointsStore();
  const { totalUnreadCount, fetchUnreadCounts } = useMessageStore();
  const { addMessageHandler, removeMessageHandler } = useWebSocket();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");

  // 处理客户端渲染
  useEffect(() => {
    setMounted(true);
    
    // 根据当前路径设置活动标签
    const path = window.location.pathname;
    if (path.includes("/tasks")) setActiveTab("tasks");
    else if (path.includes("/upload")) setActiveTab("upload");
    else if (path.includes("/downloads")) setActiveTab("downloads");
    else if (path === "/") setActiveTab("home");
  }, []);

  // 监听用户登录状态变化，更新积分信息
  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  // 初始获取未读消息数量
  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadCounts();
    }
  }, [isLoggedIn, fetchUnreadCounts]);

  // 使用WebSocket监听新消息，并更新未读消息数量
  useEffect(() => {
    if (!isLoggedIn) return;

    // 处理私信消息
    const handlePrivateMessage = () => {
      fetchUnreadCounts();
    };

    // 处理系统消息
    const handleSystemMessage = () => {
      fetchUnreadCounts();
    };

    // 添加消息处理器
    addMessageHandler('message', handlePrivateMessage);
    addMessageHandler('system', handleSystemMessage);

    // 清理函数
    return () => {
      removeMessageHandler('message', handlePrivateMessage);
      removeMessageHandler('system', handleSystemMessage);
    };
  }, [isLoggedIn, addMessageHandler, removeMessageHandler, fetchUnreadCounts]);

  // 处理登出
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("已退出登录");
      router.push("/auth?mode=login");

      // 刷新当前页，确保状态完全重置
      setTimeout(() => {
        router.refresh();
      }, 100);
    } catch (error) {
      console.error("登出时发生错误:", error);
    }
  };

  // 获取用户名首字母作为头像备用
  const getUserInitial = (username?: string) => {
    if (!username) return "?";
    return username.charAt(0).toUpperCase();
  };

  // 客户端渲染前的返回
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 border-b bg-background z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo 区域 */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="文件悬赏"
                width={36}
                height={36}
                className="rounded-lg"
                priority
              />
              <span className="text-lg font-bold">文件悬赏</span>
            </Link>
          </div>
          
          {/* 右侧占位 */}
          <div className="flex items-center space-x-4">
            <div className="w-[300px] h-10"></div>
            <div className="w-[100px]"></div>
          </div>
        </div>
      </nav>
    );
  }

  // 主要渲染
  return (
    <nav className="fixed top-0 left-0 right-0 border-b bg-background z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Logo 区域 */}
          <Link
            href="/"
            className="flex items-center space-x-2"
            onClick={() => setActiveTab("home")}
          >
            <Image
              src="/logo.png"
              alt="文件悬赏"
              width={36}
              height={36}
              className="rounded-lg"
              priority
            />
            <span className="text-lg font-bold">资兑</span>
          </Link>
        </div>

        <div className="flex items-center space-x-3">
          {/* 搜索框 */}
          <div className="relative hidden md:flex items-center">
            <Input
              type="search"
              placeholder="搜索文件或悬赏..."
              className="w-[280px] h-9 rounded-full pl-9 pr-4 border-muted bg-muted/40 focus-visible:bg-background focus-visible:ring-offset-0"
            />
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          </div>

          {isLoggedIn ? (
            <div className="flex items-center space-x-3">
              {/* 签到按钮 - 新增 */}
              <div className="hidden md:block">
                <HomeSignButton />
              </div>

              {/* 消息图标 */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full bg-muted/40 hover:bg-muted/70"
                onClick={() => router.push("/messages/private")}
              >
                <MessageSquare className="h-[18px] w-[18px] text-foreground/70" />
                {totalUnreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-medium"
                  >
                    {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                  </Badge>
                )}
              </Button>

              {/* 积分显示 */}
              {points && (
                <div className="hidden md:flex items-center space-x-1 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-full shadow-sm">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-800">
                    {points.points}
                  </span>
                </div>
              )}

              {/* 用户头像和下拉菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-9 w-9 border border-border/50 shadow-sm">
                      {user?.avatar ? (
                        <AvatarImage
                          src={user.avatar}
                          alt={user?.username}
                          width={36}
                          height={36}
                        />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getUserInitial(user?.username)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="p-0">
                    <div className="flex items-center gap-4 p-2">
                      <Avatar className="h-12 w-12">
                        {user?.avatar ? (
                          <AvatarImage
                            src={user.avatar}
                            alt={user?.username}
                            width={48}
                            height={48}
                          />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {getUserInitial(user?.username)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold leading-none">
                          {user?.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                          {user?.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full w-fit shadow-sm">
                          <Coins className="h-3.5 w-3.5 text-amber-500" />
                          <p className="text-xs font-medium text-amber-800">
                            {points?.points || 0} 积分
                          </p>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <DropdownMenuItem
                      className="cursor-pointer h-9"
                      onClick={() => router.push("/profile")}
                    >
                      <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      个人资料
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/bounty" className="cursor-pointer w-full">
                        <Target className="mr-2 h-4 w-4" />
                        我的悬赏
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator />

                  <div className="p-2">
                    <DropdownMenuItem
                      className="cursor-pointer h-9 text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={handleLogout}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin border-2 border-red-600 border-t-transparent rounded-full" />
                          <span>退出中...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2 h-4 w-4 text-red-600 focus:text-red-600 focus:bg-red-50" />
                          退出登录
                        </>
                      )}
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link href="/auth">
              <Button className="rounded-full px-4 shadow-sm">
                登录 / 注册
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}