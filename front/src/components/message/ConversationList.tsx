import React, { useEffect, useState } from 'react';
import { useMessageStore } from '@/lib/store/message-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Conversation } from '@/types/message';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ConversationList() {
  const { 
    conversations, 
    fetchConversations, 
    fetchUnreadCounts,
    hasMoreConversations, 
    currentConversation,
    setCurrentConversation
  } = useMessageStore();
  
  const router = useRouter();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // 初始加载会话
  useEffect(() => {
    fetchConversations(true);
  }, [fetchConversations]);
  
  // 加载更多会话的处理函数
  const loadMoreConversations = () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    fetchConversations(false).finally(() => {
      setIsLoadingMore(false);
    });
  };
  
  // 处理会话选择逻辑
  const handleSelectConversation = (conversation: Conversation) => {
    // 如果当前已选择的会话与点击的会话相同，不需要任何操作
    if (currentConversation?.conversationId === conversation.conversationId) {
      return;
    }

    // 清除之前的会话状态和消息
    setCurrentConversation(conversation);

    // 添加以下代码进行路由跳转
    router.push(`/messages/private/${conversation.partnerId}`);
  };
  
  function getInitials(name: string): string {
    return name.charAt(0).toUpperCase();
  }
  
  function formatLastMessageTime(createdAt: string): string {
    return formatDistanceToNow(new Date(createdAt), { 
      addSuffix: true,
      locale: zhCN
    });
  }

  return (
    <ScrollArea className="h-full" id="conversationListScroll">
      <InfiniteScroll
        dataLength={conversations.length}
        next={loadMoreConversations}
        hasMore={hasMoreConversations}
        loader={
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
        scrollableTarget="conversationListScroll"
        scrollThreshold={0.8}
        endMessage={
          <div className="p-4 text-center text-sm text-muted-foreground">
            没有更多了
          </div>
        }
      >
        <div className="space-y-1 p-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.conversationId}
              className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                currentConversation?.conversationId === conversation.conversationId ? 'bg-muted' : ''
              }`}
              onClick={() => handleSelectConversation(conversation)}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={conversation.partnerAvatar} />
                  <AvatarFallback>{getInitials(conversation.partnerUsername)}</AvatarFallback>
                </Avatar>
                {conversation.unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-xs">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </Badge>
                )}
              </div>
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">{conversation.partnerUsername}</span>
                  {conversation.lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatLastMessageTime(conversation.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage ? conversation.lastMessage.content : '暂无消息'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </ScrollArea>
  );
} 