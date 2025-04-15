'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConversationList } from '@/components/message/ConversationList';
import { ChatWindow } from '@/components/message/ChatWindow';
import { useMessageStore } from '@/lib/store/message-store';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { Message } from '@/types/message';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UserChatPage() {
  const params = useParams();
  const router = useRouter();
  const { type, userId } = params;
  const { setCurrentConversationById, currentConversation, addMessage } = useMessageStore();
  const { addMessageHandler, removeMessageHandler } = useWebSocket();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (type !== 'private') {
      router.replace('/messages/private');
      return;
    }

    const userIdNum = parseInt(userId as string);
    if (isNaN(userIdNum)) {
      router.replace('/messages/private');
      return;
    }

    const initializeConversation = async () => {
      setIsLoading(true);
      try {
        await setCurrentConversationById(userIdNum);
      } catch (error) {
        console.error('初始化会话失败:', error);
        toast.error('无法找到该用户或创建会话');
        router.replace('/messages/private');
      } finally {
        setIsLoading(false);
      }
    };

    initializeConversation();
  }, [type, userId, router, setCurrentConversationById]);

  useEffect(() => {
    const handleMessage = (message: Message) => {
      if (currentConversation?.conversationId === message.conversationId) {
        addMessage(message);
      }
    };

    addMessageHandler('message', handleMessage);

    return () => {
      removeMessageHandler('message', handleMessage);
    };
  }, [currentConversation, addMessage, addMessageHandler, removeMessageHandler]);

  if (isLoading) {
    return (
      <div className="flex h-full">
        <div className="w-1/3 border-r h-full">
          <ConversationList />
        </div>
        <div className="w-2/3 h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r h-full">
        <ConversationList />
      </div>
      <div className="w-2/3 h-full">
        {currentConversation ? (
          <ChatWindow />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            快找人聊天吧！
          </div>
        )}
      </div>
    </div>
  );
} 