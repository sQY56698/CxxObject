'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useFloating, offset, flip, shift, arrow, autoUpdate } from '@floating-ui/react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, Cake, Globe, HelpCircle, Mars, Venus } from 'lucide-react';
import { useUserStore } from '@/lib/store/user-store';
import { profileApi } from '@/lib/api/profile';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

// 合并用户资料信息
interface UserInfoPanelData {
  userId: number;
  username: string;
  email?: string;
  avatar?: string;
  gender?: number;
  birthDate?: string;
  bio?: string;
  website?: string;
}

interface UserInfoPanelProps {
  userId: number;
  children: React.ReactNode;
  className?: string;
}

export function UserInfoPanel({ userId, children, className }: UserInfoPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfoPanelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);
  const { user } = useUserStore();
  
  const arrowRef = useRef(null);
  
  const {
    refs,
    floatingStyles,
    middlewareData: { arrow: { x: arrowX, y: arrowY } = {} },
  } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'right-start',
    middleware: [
      offset(12),
      flip(),
      shift(),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!userId || !isOpen) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const profile = await profileApi.getUserProfile(userId);
        setUserInfo({
          userId: profile.userId,
          username: profile.username,
          gender: profile.gender,
          birthDate: profile.birthDate,
          bio: profile.bio,
          website: profile.website,
          avatar: profile.avatar,
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('获取用户资料失败');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchUserInfo();
    }
  }, [userId, isOpen]);

  const handleMouseEnter = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => {
      setIsOpen(false);
    }, 300); // 300ms延迟关闭
  };

  const isCurrentUser = user?.userId === userId;
  
  // 获取性别图标和颜色
  const getGenderIcon = (gender?: number) => {
    if (gender === undefined) return null;
    
    switch (gender) {
      case 1: // 男
        return <Mars className="h-4 w-4 text-blue-500" />;
      case 2: // 女
        return <Venus className="h-4 w-4 text-pink-500" />;
      default: // 未知
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // 获取性别文本
  const getGenderText = (gender?: number) => {
    if (gender === undefined) return '';
    return gender === 1 ? '男' : gender === 2 ? '女' : '未知';
  };

  return (
    <>
      <div
        ref={refs.setReference}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={className}
      >
        {children}
      </div>
      {isOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "z-50 w-80 rounded-lg border bg-card p-4 shadow-lg",
          )}
        >
          <div
            ref={arrowRef}
            className="absolute h-4 w-4 rotate-45 bg-border"
            style={{
              left: arrowX != null ? `${arrowX}px` : '',
              top: arrowY != null ? `${arrowY}px` : '',
            }}
          />
          
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {error}
            </div>
          ) : userInfo ? (
            <div className="relative">
              {/* 用户基本信息 */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/10">
                  {userInfo.avatar ? (
                    <AvatarImage src={userInfo.avatar} alt={userInfo.username} />
                  ) : (
                    <AvatarFallback>
                      {userInfo.username ? userInfo.username[0].toUpperCase() : 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 space-y-1">
                  <h4 className="font-semibold text-lg leading-none">
                    {userInfo.username}
                  </h4>
                  {userInfo.email && (
                    <p className="text-sm text-muted-foreground">
                      {userInfo.email}
                    </p>
                  )}
                  {userInfo.gender !== undefined && (
                    <p className="text-xs flex items-center gap-1">
                      {getGenderIcon(userInfo.gender)}
                      <span className={`
                        ${userInfo.gender === 1 ? 'text-blue-500' : ''} 
                        ${userInfo.gender === 2 ? 'text-pink-500' : ''} 
                        ${userInfo.gender !== 1 && userInfo.gender !== 2 ? 'text-gray-500' : ''}
                      `}>
                        {getGenderText(userInfo.gender)}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* 用户详细信息 */}
              <div className="mt-4 space-y-2">
                {userInfo.birthDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Cake className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">出生日期:</span>
                    <span>{formatDate(userInfo.birthDate)}</span>
                  </div>
                )}
                
                {userInfo.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={userInfo.website.startsWith('http') ? userInfo.website : `https://${userInfo.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {userInfo.website}
                    </a>
                  </div>
                )}
              </div>

              {/* 用户简介 */}
              {userInfo.bio && (
                <div className="mt-4 p-3 bg-muted/30 rounded-md">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {userInfo.bio}
                  </p>
                </div>
              )}

              {/* 操作按钮 - 移除关注功能 */}
              {!isCurrentUser && (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {/* 发送消息逻辑 */}}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    发消息
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              用户信息加载失败
            </div>
          )}
        </div>
      )}
    </>
  );
} 