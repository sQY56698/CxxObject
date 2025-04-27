"use client";

import { useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { toast } from "sonner";
import { 
  getPendingReviewTasks, 
  reviewUserFileTask, 
  downloadTaskFile,
} from "@/lib/api/admin";
import { UserFileTaskDTO } from "@/types/file";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Download, 
  Clock, 
  User, 
  FileIcon,
  Info,
  BadgeCheck
} from "lucide-react";
import { formatDateTime, formatFileSize, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { downloadFile } from "@/lib/utils";

export default function FileReviewPage() {
  const [tasks, setTasks] = useState<UserFileTaskDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [reviewComments, setReviewComments] = useState<Record<number, string>>({});
  const [reviewingTaskId, setReviewingTaskId] = useState<number | null>(null);
  const [downloadingTaskId, setDownloadingTaskId] = useState<number | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [taskToReject, setTaskToReject] = useState<number | null>(null);

  const fetchTasks = async (pageNum: number) => {
    try {
      setIsLoading(true);
      const response = await getPendingReviewTasks(pageNum, 10);
      const newTasks = response.content || [];

      if (pageNum === 0) {
        setTasks(newTasks);
      } else {
        setTasks((prevTasks) => [...prevTasks, ...newTasks]);
      }

      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error("获取待审核任务失败", error);
      toast.error("获取待审核任务失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(0);
  }, []);

  const handleCommentChange = (taskId: number, value: string) => {
    setReviewComments((prev) => ({
      ...prev,
      [taskId]: value,
    }));
  };

  const handleReview = async (taskId: number, status: number) => {
    // 如果是驳回，需要确保有审核意见
    if (status === 3) {
      const comment = reviewComments[taskId] || "";
      if (!comment.trim()) {
        setTaskToReject(taskId);
        setShowRejectDialog(true);
        return;
      }
    }

    await submitReview(taskId, status);
  };

  const submitReview = async (taskId: number, status: number) => {
    const comment = reviewComments[taskId] || "";

    setReviewingTaskId(taskId);

    try {
      await reviewUserFileTask({
        taskId,
        status,
        comment,
      });

      // 从列表中移除已审核的任务
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));

      toast.success(status === 2 
        ? "已通过审核，用户将收到通知" 
        : "已驳回任务，用户将收到驳回原因");
    } catch (error) {
      console.error("审核任务失败", error);
      toast.error("审核任务失败");
    } finally {
      setReviewingTaskId(null);
      setShowRejectDialog(false);
      setTaskToReject(null);
    }
  };

  const handleDownload = async (taskId: number) => {
    setDownloadingTaskId(taskId);
    
    try {
      // 获取文件信息
      const fileInfo = await downloadTaskFile(taskId);
      
      // 下载文件
      downloadFile(fileInfo);
      
      toast.success("文件下载成功");
    } catch (error) {
      console.error("文件下载失败", error);
      toast.error("文件下载失败");
    } finally {
      setDownloadingTaskId(null);
    }
  };

  const loadMore = () => {
    fetchTasks(page + 1);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">文件审核</h1>
          <p className="text-muted-foreground mt-1">
            审核上传的资源文件，确保内容合规性
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-2 rounded-md">
          <Info className="h-5 w-5" />
          <span>待审核: {tasks.length}</span>
        </div>
      </div>

      {/* 没有待审核任务时的状态 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-xl border border-dashed">
          <div className="flex flex-col items-center text-muted-foreground">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <span className="text-lg">加载审核任务中...</span>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl border border-dashed">
          <div className="flex flex-col items-center text-muted-foreground">
            <BadgeCheck className="w-20 h-20 mb-4 text-green-500" />
            <p className="text-xl font-medium mb-2">
              太棒了！所有任务已审核完成
            </p>
            <p className="text-sm">当有新的审核任务时会出现在这里</p>
          </div>
        </div>
      ) : (
        <InfiniteScroll
          dataLength={tasks.length}
          next={loadMore}
          hasMore={hasMore}
          loader={
            <div className="flex justify-center my-6">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }
          endMessage={
            <p className="text-center text-gray-500 my-6 py-4 border-t">
              已加载全部待审核任务
            </p>
          }
        >
          <div className="grid grid-cols-1 gap-6">
            {tasks.map((task) => (
              <Card
                key={task.id}
                className="overflow-hidden bg-white border-l-4 border-l-amber-400 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-amber-500" />
                        {task.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDateTime(task.createdAt)}
                        </span>
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          {task.username}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={task.isFree ? "outline" : "secondary"}
                        className={cn(
                          "font-medium",
                          task.isFree
                            ? "text-green-600 border-green-200"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        )}
                      >
                        {task.isFree
                          ? "免费资源"
                          : `${task.requiredPoints} 积分`}
                      </Badge>
                      <Badge variant="outline" className="bg-gray-100">
                        ID: {task.id}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pb-3 pt-4">
                  <Accordion
                    type="single"
                    collapsible
                    className="w-full border rounded-md"
                  >
                    <AccordionItem value="description" className="border-none">
                      <AccordionTrigger className="py-3 px-4 hover:no-underline hover:bg-gray-50">
                        <span className="font-medium">资源描述</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-1">
                        <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                          {task.description}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <div className="mt-4 flex flex-col sm:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        上传者信息
                      </h3>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                            {task.username?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-medium">{task.username}</p>
                            <p className="text-xs text-gray-500">
                              用户ID: {task.userId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <FileIcon className="h-4 w-4 mr-1" />
                        文件信息
                      </h3>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="space-y-1">
                          <p className="text-sm flex items-center justify-between">
                            <span className="text-gray-600">文件名:</span>
                            <span
                              className="font-medium truncate ml-2 max-w-[200px]"
                              title={task.fileInfo?.originalFilename}
                            >
                              {task.fileInfo?.originalFilename || "未知"}
                            </span>
                          </p>
                          <p className="text-sm flex items-center justify-between">
                            <span className="text-gray-600">文件大小:</span>
                            <span className="font-medium">
                              {task.fileInfo
                                ? formatFileSize(task.fileInfo.fileSize)
                                : "未知"}
                            </span>
                          </p>
                          <p className="text-sm flex items-center justify-between">
                            <span className="text-gray-600">文件类型:</span>
                            <span className="font-medium">
                              {task.fileInfo?.fileType || "未知"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      审核意见
                    </h3>
                    <Textarea
                      placeholder="请输入审核意见，驳回时必填"
                      value={reviewComments[task.id] || ""}
                      onChange={(e) =>
                        handleCommentChange(task.id, e.target.value)
                      }
                      className="resize-none"
                    />
                  </div>
                </CardContent>

                <CardFooter className="pt-2 pb-4 flex flex-col sm:flex-row sm:justify-between gap-4">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto flex items-center gap-2"
                    onClick={() => handleDownload(task.id)}
                    disabled={downloadingTaskId === task.id}
                  >
                    {downloadingTaskId === task.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    下载文件查看
                  </Button>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      className="flex-1 sm:flex-none flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                      onClick={() => handleReview(task.id, 3)}
                      disabled={reviewingTaskId === task.id}
                    >
                      {reviewingTaskId === task.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      驳回任务
                    </Button>

                    <Button
                      className="flex-1 sm:flex-none flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => handleReview(task.id, 2)}
                      disabled={reviewingTaskId === task.id}
                    >
                      {reviewingTaskId === task.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      通过审核
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </InfiniteScroll>
      )}

      {/* 驳回确认对话框 */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>请提供驳回理由</AlertDialogTitle>
            <AlertDialogDescription>
              驳回资源时必须提供明确的理由，以便用户了解并可能重新提交修改后的资源。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-2">
            <Textarea
              placeholder="请输入驳回理由"
              value={taskToReject ? reviewComments[taskToReject] || "" : ""}
              onChange={(e) =>
                taskToReject &&
                handleCommentChange(taskToReject, e.target.value)
              }
              className="resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => taskToReject && submitReview(taskToReject, 3)}
              disabled={!taskToReject || !reviewComments[taskToReject]?.trim()}
            >
              确认驳回
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
