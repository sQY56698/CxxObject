import React, { useEffect } from 'react';
import { useMessageStore } from '@/lib/store/message-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Loader2, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SystemMessages() {
  const { 
    systemMessages, 
    fetchSystemMessages, 
    hasMoreSystemMessages, 
    isLoading 
  } = useMessageStore();
  
  useEffect(() => {
    fetchSystemMessages(true);
  }, [fetchSystemMessages]);
  
  function formatMessageTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      // 如果是今天，显示具体时间
      return format(date, 'HH:mm', { locale: zhCN });
    } else if (now.getFullYear() === date.getFullYear()) {
      // 如果是今年，显示月日和时间
      return format(date, 'MM月dd日 HH:mm', { locale: zhCN });
    } else {
      // 其他情况显示完整日期
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
    }
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center px-6 py-4 border-b">
        <Bell className="w-5 h-5 mr-2 text-primary" />
        <h2 className="text-lg font-medium">系统消息</h2>
      </div>

      {/* 消息列表 */}
      <ScrollArea className="flex-1" id="systemMessagesScroll">
        <div className="px-6 py-4">
          <InfiniteScroll
            dataLength={systemMessages.length}
            next={() => fetchSystemMessages()}
            hasMore={hasMoreSystemMessages}
            loader={
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
            scrollableTarget="systemMessagesScroll"
          >
            <div className="space-y-4">
              {systemMessages.map((message) => (
                <Card 
                  key={message.id} 
                  className={cn(
                    "transition-all duration-200 hover:shadow-md",
                    message.isRead 
                      ? 'bg-background border-border/50' 
                      : 'bg-primary/5 border-primary/30'
                  )}
                >
                  <CardHeader className="pb-2 space-y-0">
                    <div className="flex justify-between items-center gap-4">
                      <CardTitle className="text-base font-medium line-clamp-1">
                        {message.title}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {message.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
              
              {systemMessages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Bell className="w-12 h-12 mb-4 text-muted-foreground/50" />
                  <p>暂无系统消息</p>
                </div>
              )}
            </div>
          </InfiniteScroll>
        </div>
      </ScrollArea>
    </div>
  );
} 