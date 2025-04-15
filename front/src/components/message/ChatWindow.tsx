import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMessageStore } from '@/lib/store/message-store';
import { useUserStore } from '@/lib/store/user-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Message } from '@/types/message';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Loader2, Send, Trash2, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { useWebSocket } from '@/providers/WebSocketProvider';

export function ChatWindow() {
  const {
    currentConversation,
    messages,
    fetchMessages,
    deleteMessage,
    fetchUnreadCounts,
    hasMoreMessages,
    addMessage,
  } = useMessageStore();
  
  const { user } = useUserStore();
  const { sendMessage: sendWebSocketMessage, addMessageHandler, removeMessageHandler } = useWebSocket();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(false);

  // 检查是否在底部
  const checkIfAtBottom = useCallback(() => {
    const scrollDiv = scrollContainerRef.current;
    if (scrollDiv) {
      const { scrollTop } = scrollDiv;
      const bottom = -scrollTop < 400;
      setShowScrollButton(!bottom);
    }
  }, []);
  
  // 滚动到底部函数
  const scrollToBottom = useCallback(() => {
    const scrollDiv = scrollContainerRef.current;
    if (scrollDiv) {
      scrollDiv.scrollTo({
        top: scrollDiv.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  const loadMore = useCallback(
    (reset: boolean) => {
      if (loadingMessage) return;
      setLoadingMessage(true);
      fetchMessages(reset).finally(() => {
        setLoadingMessage(false);
      });
    },
    []
  );
  
  // 监听滚动事件
  useEffect(() => {
    const scrollDiv = scrollContainerRef.current;
    if (!scrollDiv) return;
    
    const handleScroll = () => {
      checkIfAtBottom();
    };
    
    scrollDiv.addEventListener('scroll', handleScroll);
    return () => scrollDiv.removeEventListener('scroll', handleScroll);
  }, [checkIfAtBottom]);
  
  // 初始加载消息
  useEffect(() => {
    if (currentConversation) {
      loadMore(true);
      fetchUnreadCounts();
    }
  }, [currentConversation]);
  
  // 添加消息处理器
  useEffect(() => {
    if (!currentConversation) return;

    const handleMessage = (message: Message) => {
      // 只处理当前会话的消息
      if (message.conversationId === currentConversation.conversationId) {
        addMessage(message);
      }
    };

    addMessageHandler('message', handleMessage);

    return () => {
      removeMessageHandler('message', handleMessage);
    };
  }, [currentConversation, addMessage, addMessageHandler, removeMessageHandler]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollTop;
    }
  }, [messages.length]);
  
  function getInitials(name: string): string {
    return name.charAt(0).toUpperCase();
  }
  
  function formatMessageTime(createdAt: string): string {
    return format(new Date(createdAt), 'HH:mm');
  }
  
  function formatMessageDate(createdAt: string): string {
    return format(new Date(createdAt), 'yyyy-MM-dd', { locale: zhCN });
  }
  
  async function handleSendMessage() {
    if (!currentConversation || !messageText.trim() || !user) return;
    
    const message = {
      senderId: user.userId,
      receiverId: currentConversation.partnerId,
      content: messageText.trim(),
    };

    try {
      const success = sendWebSocketMessage(message);
      if (success) {
        // 清空输入框
        setMessageText('');
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
        
        // 发送消息后滚动到底部
        setTimeout(scrollToBottom, 100);
      } else {
        throw new Error('发送失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      toast.error('发送消息失败，请重试');
    }
  }
  
  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }
  
  function handleDeleteMessage(messageId: number) {
    deleteMessage(messageId)
      .then((success) => {
        if (success) {
          toast.success('消息已删除');
        } else {
          toast.error('删除消息失败');
        }
      })
      .catch(() => {
        toast.error('删除消息失败');
      });
  }
  
  // 消息分组：按照日期分组显示并确保正确的顺序
  const messageGroups: { [date: string]: Message[] } = {};

  // 1. 先对消息按时间排序（从早到晚）
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // 2. 然后按日期分组
  sortedMessages.forEach(message => {
    const date = formatMessageDate(message.createdAt);
    if (!messageGroups[date]) {
      messageGroups[date] = [];
    }
    messageGroups[date].push(message);
  });

  const loadMoreMessages = () => {
    loadMore(false);

    if (scrollContainerRef.current) {
      const { scrollTop } = scrollContainerRef.current;
      setScrollTop(scrollTop);
    }
  };
  
  if (!currentConversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
        <p>选择一个会话开始聊天</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* 会话头部 */}
      <div className="flex items-center p-4 border-b shrink-0">
        <Avatar>
          <AvatarImage src={currentConversation.partnerAvatar} />
          <AvatarFallback>
            {getInitials(currentConversation.partnerUsername)}
          </AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <h2 className="font-semibold">
            {currentConversation.partnerUsername}
          </h2>
        </div>
      </div>

      {/* 消息区域 */}
      <div
        id="scrollableDiv"
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-gray-50 flex flex-col-reverse"
        style={{ height: "calc(100% - 140px)" }}
      >
        <InfiniteScroll
          dataLength={sortedMessages.length}
          next={loadMoreMessages}
          hasMore={hasMoreMessages}
          loader={
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
          scrollableTarget="scrollableDiv"
          inverse={true}
          style={{ display: "flex", flexDirection: "column-reverse" }}
          endMessage={
            <div className="p-4 text-center text-sm text-muted-foreground">
              没有更多历史消息
            </div>
          }
          scrollThreshold={0.95}
        >
          <div className="p-4">
            {/* 日期顺序也要确保正确 */}
            {Object.entries(messageGroups)
              .sort(
                ([dateA], [dateB]) =>
                  new Date(dateA).getTime() - new Date(dateB).getTime()
              )
              .map(([date, msgs]) => (
                <div key={date} className="mb-6">
                  <div className="flex justify-center mb-4">
                    <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {date}
                    </span>
                  </div>

                  {/* 每个日期内的消息也要按照时间顺序 */}
                  {msgs.map((message) => {
                    const isSelf = message.senderId === user?.userId;

                    return (
                      <div
                        key={message.id}
                        className={`flex items-start mb-4 ${
                          isSelf ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isSelf && (
                          <Avatar className="mr-2">
                            <AvatarImage src={message.senderAvatar} />
                            <AvatarFallback>
                              {getInitials(message.senderUsername)}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className="group relative max-w-[70%]">
                          <div
                            className={`p-3 rounded-lg ${
                              isSelf
                                ? "bg-primary text-primary-foreground"
                                : "bg-white border border-gray-100 shadow-sm"
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                            <div
                              className={`text-xs mt-1 text-right ${
                                isSelf
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {formatMessageTime(message.createdAt)}
                            </div>
                          </div>

                          {isSelf && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -right-10 top-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        {isSelf && (
                          <Avatar className="ml-2">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback>
                              {getInitials(user?.username || "")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

            <div ref={messagesEndRef} />
          </div>
        </InfiniteScroll>
      </div>

      {/* 滚动到底部按钮 */}
      {showScrollButton && (
        <Button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-6 h-10 w-10 rounded-full shadow-md z-10"
          size="icon"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}

      {/* 输入区域 */}
      <div className="p-4 border-t bg-white shrink-0">
        <div className="flex space-x-2">
          <Textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="输入消息..."
            className="resize-none min-h-[60px] max-h-[120px]"
            maxLength={1000}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="self-end"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
} 