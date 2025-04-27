'use client';

import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { toast } from 'sonner';
import { getAllUserFileTasks, forceDeleteTask } from '@/lib/api/admin';
import { UserFileTaskDTO } from '@/types/file';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, FileText, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { FILE_STATUS_MAP } from '@/lib/utils';

export default function FileManagementPage() {
  const [tasks, setTasks] = useState<UserFileTaskDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<UserFileTaskDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTasks = async (pageNum: number, resetList = false) => {
    try {
      const status = statusFilter !== 'all' ? parseInt(statusFilter) : undefined;
      const response = await getAllUserFileTasks(pageNum, 10, status);
      const newTasks = response.content || [];
      
      if (resetList || pageNum === 0) {
        setTasks(newTasks);
      } else {
        setTasks(prevTasks => [...prevTasks, ...newTasks]);
      }
      
      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error('获取文件任务失败', error);
      toast.error('获取文件任务失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(0, true);
  }, [statusFilter]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  const confirmDelete = (task: UserFileTaskDTO) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    
    setIsDeleting(true);
    try {
      await forceDeleteTask(taskToDelete.id);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskToDelete.id));
      toast.success('文件任务已删除');
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('删除文件任务失败', error);
      toast.error('删除文件任务失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const loadMore = () => {
    fetchTasks(page + 1);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">文件管理</h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-500">状态过滤:</span>
            <Select
              value={statusFilter}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="1">审核中</SelectItem>
                <SelectItem value="2">已发布</SelectItem>
                <SelectItem value="3">已驳回</SelectItem>
                <SelectItem value="4">发布成功</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">加载中...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <FileText className="w-16 h-16 mb-4" />
          <p className="text-xl">没有找到文件任务</p>
        </div>
      ) : (
        <InfiniteScroll
          dataLength={tasks.length}
          next={loadMore}
          hasMore={hasMore}
          loader={
            <div className="flex justify-center my-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }
          endMessage={
            <p className="text-center text-gray-500 my-4">已加载全部内容</p>
          }
        >
          <div className="space-y-4">
            {tasks.map(task => (
              <Card key={task.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-100 p-3 rounded-md">
                        <FileText className="w-6 h-6 text-gray-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate">{task.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="truncate">
                            上传者: {task.username} | 文件: {task.fileInfo?.originalFilename}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${FILE_STATUS_MAP[task.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {FILE_STATUS_MAP[task.status]?.label || '未知状态'}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <Link href={`/admin/files/${task.id}`} passHref>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => confirmDelete(task)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </InfiniteScroll>
      )}
      
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除文件任务 &quot;{taskToDelete?.title}&quot; 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 