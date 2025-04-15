'use client';

import React, { useEffect } from 'react';
import { useMessageStore } from '@/lib/store/message-store';
import { useUserStore } from '@/lib/store/user-store';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { Message, SystemMessage } from '@/types/message';
import { MessageCircle, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';

export function MessageNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUserStore();
  const { 
    addMessage, 
    unreadMessageCount,
    unreadSystemCount,
    fetchUnreadCounts,
  } = useMessageStore();
  
  const { addMessageHandler, removeMessageHandler } = useWebSocket();

  const type = pathname.split('/')[2] || 'private';

  useEffect(() => {
    if (!user) return;

    const handlePrivateMessage = (message: Message) => {
      addMessage(message);
      if (message.senderId !== user.userId) {
        fetchUnreadCounts();
      }
    };

    const handleSystemMessage = () => {
      fetchUnreadCounts();
    };

    addMessageHandler('message', handlePrivateMessage);
    addMessageHandler('system', handleSystemMessage);

    return () => {
      removeMessageHandler('message', handlePrivateMessage);
      removeMessageHandler('system', handleSystemMessage);
    };
  }, [user, addMessage, fetchUnreadCounts, addMessageHandler, removeMessageHandler]);

  const handleNavigation = (path: string) => {
    router.push(`/messages/${path}`);
  };

  return (
    <div className="absolute left-0 top-0 h-full w-16 border-r bg-background flex flex-col items-center py-4 space-y-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleNavigation('private')}
              className={cn(
                "relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-accent",
                type === 'private' && "bg-accent"
              )}
            >
              <MessageCircle className="w-5 h-5" />
              {unreadMessageCount > 0 && (
                <Badge 
                  variant="destructive"
                  className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-xs"
                >
                  {unreadMessageCount}
                </Badge>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>私信</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleNavigation('system')}
              className={cn(
                "relative w-10 h-10 flex items-center justify-center rounded-md hover:bg-accent",
                type === 'system' && "bg-accent"
              )}
            >
              <Bell className="w-5 h-5" />
              {unreadSystemCount > 0 && (
                <Badge 
                  variant="destructive"
                  className="absolute -top-2 -right-2 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-xs"
                >
                  {unreadSystemCount}
                </Badge>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>系统消息</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
} 