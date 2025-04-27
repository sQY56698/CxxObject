'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getTaskDetail, reviewUserFileTask, forceDeleteTask } from '@/lib/api/admin';
import { UserFileTaskDTO } from '@/types/file';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Trash2, Download } from 'lucide-react';
import { formatDateTime, formatFileSize } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { FILE_STATUS_MAP } from '@/lib/utils';

export default function FileDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const taskId = parseInt(params.id);

  const [task, setTask] = useState<UserFileTaskDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchTaskDetail = async () => {
      if (isNaN(taskId)) {
        router.push("/admin/files");
        return;
      }

      try {
        const data = await getTaskDetail(taskId);
        setTask(data);
      } catch (error) {
        console.error("获取任务详情失败", error);
        toast.error("获取任务详情失败");
        router.push("/admin/files");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskDetail();
  }, [taskId, router]);

  const handleReview = async (status: number) => {
    if (!task) return;

    if (status === 3 && !reviewComment) {
      toast.error("驳回任务时必须提供审核意见");
      return;
    }

    setIsReviewing(true);
    try {
      const updatedTask = await reviewUserFileTask({
        taskId: task.id,
        status,
        comment: reviewComment,
      });

      setTask(updatedTask);
      toast.success(status === 2 ? "已通过审核" : "已驳回任务");
    } catch (error) {
      console.error("审核任务失败", error);
      toast.error("审核任务失败");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setIsDeleting(true);
    try {
      await forceDeleteTask(task.id);
      toast.success("文件任务已删除");
      router.push("/admin/files");
    } catch (error) {
      console.error("删除文件任务失败", error);
      toast.error("删除文件任务失败");
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">加载中...</span>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6">
        <Link
          href="/admin/files"
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回文件列表
        </Link>

        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <p className="text-xl">未找到文件任务</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/admin/files")}
          >
            返回文件列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Link
        href="/admin/files"
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        返回文件列表
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{task.title}</CardTitle>
                <Badge
                  className={
                    FILE_STATUS_MAP[task.status]?.color ||
                    "bg-gray-100 text-gray-800"
                  }
                >
                  {FILE_STATUS_MAP[task.status]?.label || "未知状态"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p>{task.description}</p>
              </div>

              <div className="mt-8 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">
                    任务细节
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
                    <div>
                      <p>
                        <span className="font-medium">任务ID:</span> {task.id}
                      </p>
                      <p>
                        <span className="font-medium">创建时间:</span>{" "}
                        {formatDateTime(task.createdAt)}
                      </p>
                      <p>
                        <span className="font-medium">最后更新:</span>{" "}
                        {formatDateTime(task.updatedAt)}
                      </p>
                    </div>
                    <div>
                      <p>
                        <span className="font-medium">下载次数:</span>{" "}
                        {task.downloadCount}
                      </p>
                      <p>
                        <span className="font-medium">查看次数:</span>{" "}
                        {task.viewCount}
                      </p>
                      <p>
                        <span className="font-medium">文件类型:</span>
                        {task.isFree
                          ? "免费文件"
                          : `收费文件 (${task.requiredPoints} 积分)`}
                      </p>
                    </div>
                  </div>
                </div>

                {task.status === 1 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 mb-2">
                      审核操作
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <Textarea
                        placeholder="请输入审核意见，驳回时必填"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="mb-4"
                      />

                      <div className="flex justify-end space-x-4">
                        <Button
                          variant="outline"
                          className="flex items-center"
                          onClick={() => handleReview(3)}
                          disabled={isReviewing}
                        >
                          {isReviewing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2 text-red-500" />
                          )}
                          驳回
                        </Button>

                        <Button
                          className="flex items-center"
                          onClick={() => handleReview(2)}
                          disabled={isReviewing}
                        >
                          {isReviewing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                          )}
                          通过审核
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {task.fileInfo && (
            <Card>
              <CardHeader>
                <CardTitle>文件信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex flex-col space-y-2">
                    <p>
                      <span className="font-medium">文件名:</span>{" "}
                      {task.fileInfo.originalFilename}
                    </p>
                    <p>
                      <span className="font-medium">文件大小:</span>{" "}
                      {formatFileSize(task.fileInfo.fileSize)}
                    </p>
                    <p>
                      <span className="font-medium">文件ID:</span>{" "}
                      {task.fileInfo.id}
                    </p>
                    <p>
                      <span className="font-medium">上传时间:</span>{" "}
                      {formatDateTime(task.fileInfo.createdAt || "")}
                    </p>
                  </div>

                  {task.fileInfo.fileUrl && (
                    <div className="mt-4">
                      <Button className="flex items-center" asChild>
                        <a
                          href={task.fileInfo.fileUrl}
                          rel="noopener noreferrer"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          下载文件
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>上传者信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-lg font-semibold text-gray-700 mr-3">
                  {task.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="font-medium">{task.username}</h3>
                  <p className="text-sm text-gray-500">
                    用户ID: {task.userId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  variant="destructive"
                  className="w-full flex items-center justify-center"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  强制删除
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除文件任务 &quot;{task.title}&quot; 吗？此操作无法撤销。
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
              ) : (
                "确认删除"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}