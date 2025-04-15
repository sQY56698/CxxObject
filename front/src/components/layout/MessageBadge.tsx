import React, { useEffect } from 'react';
import { useMessageStore } from '@/lib/store/message-store';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function MessageBadge() {
  const { unreadMessageCount, unreadSystemCount, fetchUnreadCounts } = useMessageStore();
  
  useEffect(() => {
    fetchUnreadCounts();
    
    // 定时刷新未读消息数量
    const interval = setInterval(() => {
      fetchUnreadCounts();
    }, 60000); // 每分钟刷新一次
    
    return () => clearInterval(interval);
  }, [fetchUnreadCounts]);
  
  const totalUnreadCount = unreadMessageCount + unreadSystemCount;
  
  return (
    <Link href="/messages" className="relative">
      <Button variant="ghost" size="icon">
        <MessageSquare />
        {totalUnreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-xs">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
} 