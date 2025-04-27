"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Clock, 
  Download,
  Coins, 
  Shield,
  Eye,
  Tag,
  MessageSquare,
  AlertCircle,
  Info
} from "lucide-react";
import Link from "next/link";
import { formatDateTime, formatFileSize, cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserInfoPanel } from "@/components/UserInfoPanel";
import { usePointsStore } from "@/lib/store/points-store";
import { 
  FileTypeColors,
  FileTypeBgColors,
  UserFileTaskDTO,
  UserFileTaskStatusEnum
} from "@/types/file";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { resourceApi } from "@/lib/api/resource"; // 修改导入
import FileIcon from "@/components/FileIcon";
import { downloadFile } from "@/lib/utils";
import { getStatusStyle } from "@/components/UserFileTaskStatus";

export default function ResourceDetail() {
  const params = useParams();
  const router = useRouter();
  const resourceId = parseInt(params.resourceId as string);

  const [resource, setResource] = useState<UserFileTaskDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const { points, fetchPoints } = usePointsStore();

  // 加载资源详情
  useEffect(() => {
    const loadResourceDetail = async () => {
      try {
        setIsLoading(true);
        const data = await resourceApi.getResourceDetail(resourceId);
        setResource(data);
      } catch (error: any) {
        console.error("加载资源详情失败:", error);
        if (error.status === 404) {
          toast.error("资源不存在");
          router.push("/resources");
        } else {
          toast.error(error.response.data.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadResourceDetail();
  }, [resourceId]);

  // 处理资源下载
  const handleDownload = async () => {
    if (!resource) return;

    // 如果需要积分但用户积分不足
    if (!resource.isFree && points && points.points < resource.requiredPoints) {
      toast.error(`积分不足，下载此资源需要 ${resource.requiredPoints} 积分`);
      return;
    }

    try {
      setIsDownloading(true);
      const fileInfo = await resourceApi.downloadResource(resourceId);

      if (fileInfo && fileInfo.fileUrl) {
        downloadFile(fileInfo);

        toast.success(`文件 ${fileInfo.originalFilename} 下载中`);

        // 刷新资源详情和积分
        const updatedResource = await resourceApi.getResourceDetail(resourceId);
        setResource(updatedResource);
        fetchPoints();
      } else {
        toast.error("您没有权限下载此文件");
      }
    } catch (error: any) {
      toast.error(error.response.data.message);
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading || !resource) {
    return (
      <div className="container max-w-4xl m-auto py-8">
        <div className="mb-6">
          <div className="h-6 w-24 bg-muted/50 animate-pulse rounded"></div>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex gap-4">
            <div className="h-12 w-12 bg-muted/50 animate-pulse rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-7 bg-muted/50 animate-pulse rounded w-2/3"></div>
              <div className="h-4 bg-muted/50 animate-pulse rounded w-1/3"></div>
            </div>
            <div className="h-16 w-24 bg-muted/50 animate-pulse rounded"></div>
          </div>

          <div className="h-32 bg-muted/50 animate-pulse rounded mt-4"></div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-muted/50 animate-pulse rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(resource.status);
  const fileType = resource.fileInfo?.fileType || 0;
  const fileColorClass =
    FileTypeColors[fileType as keyof typeof FileTypeColors] || "text-gray-500";
  const fileBgClass =
    FileTypeBgColors[fileType as keyof typeof FileTypeBgColors] || "bg-gray-50";

  return (
    <div className="container max-w-4xl m-auto py-8">
      <div className="mb-6 flex justify-between items-center">
        <Link
          href="/resources"
          className="flex items-center text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回资源列表
        </Link>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <UserInfoPanel
                userId={resource.userId}
                className="cursor-pointer"
              >
                <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                  {resource.avatar ? (
                    <AvatarImage
                      src={resource.avatar}
                      alt={resource.username}
                    />
                  ) : (
                    <AvatarFallback>
                      {resource.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </UserInfoPanel>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl flex items-center gap-2 mt-1">
                    <div className="relative">
                      <div
                        className={`absolute inset-0 ${fileColorClass} rounded-full blur-sm opacity-30`}
                      ></div>
                      <div
                        className={`relative ${fileBgClass} p-1.5 rounded-full`}
                      >
                        <FileIcon fileType={fileType} />
                      </div>
                    </div>
                    {resource.title}
                  </CardTitle>
                  <div
                    className={`px-2.5 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    {statusStyle.icon}
                    {statusStyle.label}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <span>分享者：{resource.username}</span>
                  <span className="mx-1">·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDateTime(resource.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {!resource.isFree && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-lg p-3 border border-amber-200/50 shadow-sm">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full p-2">
                  <Coins className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                    {resource.requiredPoints}
                  </div>
                  <div className="text-sm font-medium text-amber-700/70">
                    所需积分
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 文件信息 */}
          <div className="bg-muted/20 rounded-lg p-5 flex items-center gap-4 border">
            {resource.fileInfo && (
              <>
                <div
                  className={`p-3 rounded-md ${fileColorClass} ${fileBgClass}`}
                >
                  <FileIcon fileType={fileType} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">
                    {resource.fileInfo.originalFilename}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {formatFileSize(resource.fileInfo.fileSize)} ·
                    {resource.fileInfo.createdAt &&
                      formatDateTime(resource.fileInfo.createdAt || "")}
                  </div>
                </div>

                <div>
                  {resource.isFree ? (
                    <Button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloading ? "下载中..." : "免费下载"}
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                          <Download className="h-4 w-4 mr-2" />
                          下载 ({resource.requiredPoints} 积分)
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认下载此资源？</AlertDialogTitle>
                          <AlertDialogDescription>
                            下载此资源将消耗 {resource.requiredPoints}{" "}
                            积分。您当前拥有 {points?.points || 0} 积分。
                            {points &&
                              points.points < resource.requiredPoints && (
                                <div className="mt-2 text-red-500">
                                  您的积分不足，请先获取更多积分
                                </div>
                              )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDownload}
                            disabled={
                              (points &&
                                points.points <
                                  resource.requiredPoints) as boolean
                            }
                            className={cn(
                              "bg-primary hover:bg-primary/90",
                              points &&
                                points.points < resource.requiredPoints &&
                                "opacity-50 cursor-not-allowed"
                            )}
                          >
                            确认下载
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 资源描述 */}
          <div className="bg-muted/30 rounded-lg p-5 border border-muted relative">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-violet-500" />
                资源描述
              </h3>
            </div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {resource.description}
            </div>
          </div>

          {/* 资源统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50/50 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Tag className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-sm text-blue-600/70">资源类型</div>
                <div className="text-lg font-medium text-blue-700">
                  {resource.isFree ? "免费资源" : "积分资源"}
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/50 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-full">
                <Eye className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-sm text-emerald-600/70">浏览数</div>
                <div className="text-lg font-medium text-emerald-700">
                  {resource.viewCount}
                </div>
              </div>
            </div>

            <div className="bg-violet-50/50 rounded-lg p-4 flex items-center gap-3">
              <div className="bg-violet-100 p-2 rounded-full">
                <Download className="h-5 w-5 text-violet-500" />
              </div>
              <div>
                <div className="text-sm text-violet-600/70">下载数</div>
                <div className="text-lg font-medium text-violet-700">
                  {resource.downloadCount}
                </div>
              </div>
            </div>
          </div>

          {/* 特殊状态显示 */}
          {resource.status === UserFileTaskStatusEnum.REJECTED && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium text-red-700">资源审核未通过</div>
                <div className="text-sm text-red-600/80 mt-1">
                  请修改资源信息或重新上传符合规则的资源。如有疑问，请联系管理员。
                </div>
              </div>
            </div>
          )}

          {resource.status === UserFileTaskStatusEnum.REVIEWING && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <div className="font-medium text-amber-700">资源正在审核中</div>
                <div className="text-sm text-amber-600/80 mt-1">
                  审核通过后即可供其他用户下载。请耐心等待。
                </div>
              </div>
            </div>
          )}

          <div className="bg-muted/30 p-4 rounded-md flex items-start gap-2">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">下载说明：</p>
              <ul className="list-disc list-inside space-y-1">
                {resource.isFree ? (
                  <>
                    <li>此资源为免费资源，任何用户均可下载</li>
                    <li>下载过程中如遇问题，可刷新页面重试</li>
                  </>
                ) : (
                  <>
                    <li>
                      此资源需要消耗 {resource.requiredPoints} 积分才能下载
                    </li>
                    <li>积分消耗后无法退回，请确认后再下载</li>
                    <li>下载成功后，您可以无限制使用该资源</li>
                  </>
                )}
                <li>如果资源存在问题，可通过站内消息联系资源发布者</li>
              </ul>
            </div>
          </div>

          {/* 如果是自己的资源，显示额外功能按钮 */}
          {resource.isMine && (
            <div className="flex flex-wrap justify-end gap-3 mt-6">
              {resource.status === UserFileTaskStatusEnum.REJECTED && (
                <Button
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  onClick={() => router.push(`/resources/share?resourceId=${resource.id}`)}
                >
                  修改资源信息
                </Button>
              )}

              {/* 增加删除资源选项 */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    删除资源
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除此资源？</AlertDialogTitle>
                    <AlertDialogDescription>
                      删除后无法恢复，已下载的用户将无法再次下载。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await resourceApi.deleteResource(resource.id);
                          toast.success("资源已删除");
                          router.push("/resources");
                        } catch (error: any) {
                          toast.error(error.response.data.message);
                          console.error(error);
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      确认删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* 联系上传者 (如果不是自己的资源且已发布) */}
          {!resource.isMine &&
            (resource.status === UserFileTaskStatusEnum.PUBLISHED ||
              resource.status === UserFileTaskStatusEnum.SUCCESS) && (
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    // 假设有一个消息系统可以直接联系上传者
                    router.push(`/messages/private?userId=${resource.userId}`);
                  }}
                >
                  联系上传者
                </Button>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}