'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConversationList } from '@/components/message/ConversationList';
import { SystemMessages } from '@/components/message/SystemMessages';

export default function MessageTypePage() {
  const params = useParams();
  const router = useRouter();
  const { type } = params;

  // 验证类型参数
  useEffect(() => {
    if (type !== 'private' && type !== 'system') {
      router.replace('/messages/private');
    }
  }, [type, router]);

  if (type === 'system') {
    return <SystemMessages />;
  }

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r h-full">
        <ConversationList />
      </div>
      <div className="w-2/3 h-full flex items-center justify-center text-muted-foreground">
        快找人聊天吧！
      </div>
    </div>
  );
} 