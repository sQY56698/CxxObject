'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Send, 
  Clock, 
  MessageSquare,
  ChevronRight,
  RefreshCcw
} from 'lucide-react';
import { sendSystemMessage, getSystemMessageHistory, SystemMessageDTO } from '@/lib/api/admin';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function AdminMessagesPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [tab, setTab] = useState('create');
  
  // 历史消息状态
  const [messages, setMessages] = useState<SystemMessageDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 获取历史消息
  const fetchMessageHistory = async (pageNum = 0, refresh = false) => {
    try {
      setIsLoading(true);
      const response = await getSystemMessageHistory(pageNum);
      
      if (refresh || pageNum === 0) {
        setMessages(response.content);
      } else {
        setMessages(prev => [...prev, ...response.content]);
      }
      
      setPage(pageNum);
      setHasMore(!response.last);
    } catch (error) {
      console.error('获取系统消息历史失败', error);
      toast.error('获取系统消息历史失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 切换到历史消息标签时加载数据
  useEffect(() => {
    if (tab === 'history') {
      fetchMessageHistory();
    }
  }, [tab]);

  // 发送系统消息
  const handleSendMessage = async () => {
    if (!title.trim()) {
      toast.error('请输入消息标题');
      return;
    }

    if (!content.trim()) {
      toast.error('请输入消息内容');
      return;
    }

    setIsSending(true);
    try {
      await sendSystemMessage({
        title: title.trim(),
        content: content.trim()
      });
      
      toast.success('系统消息发送成功');
      setTitle('');
      setContent('');
      
      // 如果已经加载过历史消息，刷新列表
      if (messages.length > 0) {
        fetchMessageHistory(0, true);
      }
      
    } catch (error) {
      console.error('发送系统消息失败', error);
      toast.error('发送系统消息失败，请重试');
    } finally {
      setIsSending(false);
    }
  };

  // 加载更多历史消息
  const loadMoreMessages = () => {
    if (!isLoading && hasMore) {
      fetchMessageHistory(page + 1);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">系统消息管理</h1>
      
      <Tabs 
        defaultValue="create" 
        value={tab} 
        onValueChange={setTab}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="create">发送消息</TabsTrigger>
          <TabsTrigger value="history">历史消息</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                发送系统消息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">消息标题</label>
                <Input
                  placeholder="请输入消息标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">消息内容</label>
                <Textarea
                  placeholder="请输入消息内容"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleSendMessage}
                disabled={isSending}
                className="flex items-center"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    发送中...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    发送消息
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                历史消息
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchMessageHistory(0, true)}
                disabled={isLoading}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                刷新
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading && page === 0 ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <MessageSquare className="w-12 h-12 mb-4 text-gray-300" />
                  <p>暂无系统消息记录</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div key={message.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">{message.title}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              ID: {message.id}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDateTime(message.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                          {message.content}
                        </div>
                        <Separator className="my-4" />
                      </div>
                    ))}
                    
                    {hasMore && (
                      <div className="flex justify-center py-4">
                        <Button 
                          variant="outline" 
                          onClick={loadMoreMessages}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              加载中...
                            </>
                          ) : (
                            <>
                              加载更多
                              <ChevronRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 