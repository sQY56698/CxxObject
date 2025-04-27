import React, { useState, useImperativeHandle, forwardRef } from "react";
import { toast } from "sonner";
import { FileBid } from "@/types/bounty";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/upload/FileUploader";
import { formatDateTime, formatFileSize } from "@/lib/utils";
import { 
  Download,
  Trophy,
  Upload,
  Lock,
  FileText,
  Image, 
  Video,
  Music,
  Archive,
  Table,
  File as FileIcon,
  Presentation,
  PenLine,
  Users
} from "lucide-react";
import { bountyApi } from "@/lib/api/bounty";
import { FileType, FileTypeColors } from "@/types/file";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserInfoPanel } from "@/components/UserInfoPanel";
import { ALLOWED_FILE_TYPES } from "@/lib/constant";
import { downloadFile } from "@/lib/utils";

interface BidListProps {
  bids: FileBid[];
  bountyId: number;
  isBountyOwner: boolean;
  onSelectWinner: (bidId: number) => void;
  disabled?: boolean;
  onRefresh: () => void;
}

export const BidList = forwardRef<{openUploader: (bidId: number) => void}, BidListProps>(({
  bids,
  isBountyOwner,
  onSelectWinner,
  disabled,
  onRefresh
}, ref) => {
  const [uploadingBidId, setUploadingBidId] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    openUploader: (bidId: number) => {
      setUploadingBidId(bidId);
      setDialogOpen(true);
    }
  }));

  // 获取文件类型对应的图标
  const getFileIcon = (fileType: number) => {
    switch (fileType) {
      case FileType.IMAGE:
        return <Image className="h-5 w-5" />;
      case FileType.VIDEO:
        return <Video className="h-5 w-5" />;
      case FileType.AUDIO:
        return <Music className="h-5 w-5" />;
      case FileType.PDF:
        return <FileText className="h-5 w-5" />;
      case FileType.EXCEL:
        return <Table className="h-5 w-5" />;
      case FileType.WORD:
        return <FileText className="h-5 w-5" />;
      case FileType.PPT:
        return <Presentation className="h-5 w-5" />;
      case FileType.ARCHIVE:
        return <Archive className="h-5 w-5" />;
      default:
        return <FileIcon className="h-5 w-5" />;
    }
  };

  // 获取文件类型对应的CSS颜色类
  const getFileIconClass = (fileType: number) => {
    return FileTypeColors[fileType as keyof typeof FileTypeColors] || 'text-gray-500';
  };

  // 处理文件上传完成
  const handleUploadComplete = async (fileId: number) => {
    if (!uploadingBidId) return;
    
    try {
      await bountyApi.updateBidFile(uploadingBidId, fileId);
      onRefresh();
    } catch (error) {
      toast.error("更新竞标文件失败");
      console.error(error);
    } finally {
      setUploadingBidId(null);
      setDialogOpen(false);
    }
  };

  // 下载文件
  const handleDownload = async (bidId: number) => {
    try {
      setIsDownloading(true);
      const fileInfo = await bountyApi.downloadBidFile(bidId);
      
      if (fileInfo && fileInfo.fileUrl && fileInfo.hasAccess) {
        downloadFile(fileInfo);
        
        toast.success(`文件 ${fileInfo.originalFilename} 下载中`);
      } else {
        toast.error("您没有权限下载此文件");
      }
    } catch (error) {
      toast.error("文件下载失败");
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (bids.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-muted flex flex-col items-center justify-center">
        <Users className="h-12 w-12 text-muted-foreground opacity-20 mb-3" />
        <div className="text-muted-foreground">暂无竞标记录</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bids.map((bid) => (
        <div
          key={bid.id}
          className={`border rounded-lg ${
            bid.isWinner ? "border-blue-200 bg-blue-50/50" : ""
          } overflow-hidden transition-all hover:shadow-sm`}
        >
          {/* 竞标者信息头部 - 优化布局 */}
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserInfoPanel userId={bid.userId} className="cursor-pointer">
                <Avatar
                  className={`h-9 w-9 ${
                    bid.isWinner ? "ring-2 ring-blue-300" : ""
                  }`}
                >
                  {bid.avatar ? (
                    <AvatarImage src={bid.avatar} alt={bid.username} />
                  ) : (
                    <AvatarFallback>
                      {bid.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </UserInfoPanel>
              <div>
                <div className="flex items-center">
                  <span className="font-medium">{bid.username}</span>
                  {bid.isWinner && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      胜利者
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  参与时间：{formatDateTime(bid.createdAt)}
                </div>
              </div>
            </div>

            {/* 操作按钮 - 移至右侧 */}
            <div className="flex items-center gap-2">
              {/* 上传文件按钮 - 仅限竞标者自己 */}
              {bid.isMine && !disabled && (
                <FileUploader
                  onUploadComplete={handleUploadComplete}
                  onUploadStart={() => setUploadingBidId(bid.id)}
                  open={dialogOpen && uploadingBidId === bid.id}
                  onOpenChange={(open) => {
                    if (!open) setUploadingBidId(null);
                    setDialogOpen(open);
                  }}
                  maxFileSize={10 * 1024 * 1024 * 1024} // 10GB
                  allowedFileTypes={ALLOWED_FILE_TYPES}
                  buttonText={bid.hasFile ? "更新文件" : "上传文件"}
                >
                  <Button
                    variant={bid.hasFile ? "outline" : "default"}
                    size="sm"
                    className={bid.hasFile ? "" : "bg-primary/90"}
                  >
                    {bid.hasFile ? (
                      <>
                        <PenLine className="h-4 w-4 mr-2" />
                        更新文件
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        上传文件
                      </>
                    )}
                  </Button>
                </FileUploader>
              )}

              {/* 下载和选择胜利者按钮 - 仅限悬赏发布者 */}
              {isBountyOwner && bid.hasFile && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(bid.id)}
                    disabled={isDownloading || !bid.fileInfo?.hasAccess}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载文件
                  </Button>

                  {!disabled && !bid.isWinner && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => onSelectWinner(bid.id)}
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      选为胜利者
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 文件信息展示区域 - 优化布局 */}
          {bid.hasFile && bid.fileInfo && (
            <div
              className={`px-4 py-3 border-t ${
                bid.fileInfo.hasAccess
                  ? "bg-muted/30"
                  : "bg-muted/10 border-dashed"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-md ${getFileIconClass(
                    bid.fileInfo.fileType
                  )} bg-opacity-10`}
                >
                  {getFileIcon(bid.fileInfo.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {bid.fileInfo.hasAccess
                      ? bid.fileInfo.originalFilename
                      : "[受保护的文件]"}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <span>{formatFileSize(bid.fileInfo.fileSize)}</span>
                    <span>·</span>
                    <span>{formatDateTime(bid.fileInfo.createdAt || "")}</span>
                  </div>
                </div>
                {!bid.fileInfo.hasAccess && (
                  <div className="text-muted-foreground text-xs flex items-center bg-muted/20 px-2 py-1 rounded-full gap-1">
                    <Lock className="h-3 w-3" />
                    <span>无权访问</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});

BidList.displayName = "BidList"; 