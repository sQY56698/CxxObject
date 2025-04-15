import React, { useCallback, useEffect, useRef, useState } from "react";
import Uppy from "@uppy/core";
import Tus from "@uppy/tus";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import {
  Upload,
  X,
  Pause,
  Play,
  RotateCcw,
  Check,
  AlertCircle,
  File as FileIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fileApi } from "@/lib/api/file";

interface FileStatus {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "waiting" | "uploading" | "paused" | "complete" | "error";
  error?: string;
}

interface ChunkUploaderProps {
  onUploadSuccess?: (result: any) => void;
  onUploadError?: (error: Error) => void;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  multiple?: boolean;
}

export default function ChunkUploader({
  onUploadSuccess,
  onUploadError,
  allowedFileTypes = ["image/*", "video/*", "application/*"],
  maxFileSize = 10 * 1024 * 1024 * 1024,
  multiple = true,
}: ChunkUploaderProps) {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const uppyRef = useRef<Uppy | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化 Uppy
  useEffect(() => {
    uppyRef.current = new Uppy({
      id: "chunk-uploader",
      autoProceed: false,
      allowMultipleUploadBatches: true,
      restrictions: {
        maxFileSize,
        allowedFileTypes,
      },
    }).use(Tus, {
      endpoint: "/api/files/upload",
      chunkSize: 5 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 5000],
      headers: () => {
        return {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        };
      },
      onAfterResponse: (req, res) => {
        // 如果上传完成，检查是否有文件ID
        const fileId = res.getHeader && res.getHeader("X-File-Id");
        if (fileId) {
          // 只记录日志，不返回值
          console.log("上传成功，文件ID:", fileId);

          // 也可以存储 fileId 到 Uppy 文件对象的元数据中
          const fileIdNum = parseInt(fileId);
          const file = req.getFile && req.getFile();
          if (file && file.id && !isNaN(fileIdNum)) {
            uppyRef.current?.setFileMeta(file.id, {
              fileId: fileIdNum,
            });
          }
        }
        // 不返回任何内容
      },
    });

    const uppy = uppyRef.current;

    uppy.on("file-added", (file) => {
      setFiles((prev) => [
        ...prev,
        {
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: "waiting",
        },
      ]);
    });

    uppy.on("upload-progress", (file, progress) => {
      const percentage = (progress.bytesUploaded / progress.bytesTotal) * 100;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, progress: percentage, status: "uploading" }
            : f
        )
      );
    });

    uppy.on("upload-success", async (file, response) => {
      try {
        // 获取上传URL（通常包含uploadId）
        const uploadUrl = response.uploadURL || "";
        const uploadId = uploadUrl.split("/").pop() || "";

        if (!uploadId) {
          throw new Error("无法获取上传ID");
        }

        // 通知后端处理文件
        const fileInfo = await fileApi.processUploadedFile({
          uploadId,
        });

        // 更新文件状态
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  progress: 100,
                  status: "complete",
                  fileId: fileInfo.id,
                }
              : f
          )
        );

        // 调用外部成功回调，直接传递fileInfo对象
        onUploadSuccess?.(fileInfo);
        toast.success(`文件 ${file.name} 上传成功`);
      } catch (error) {
        console.error("文件处理失败:", error);

        // 更新文件状态为错误
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "文件处理失败",
                }
              : f
          )
        );

        // 调用外部错误回调
        onUploadError?.(
          error instanceof Error ? error : new Error("文件处理失败")
        );
        toast.error(`文件 ${file.name} 处理失败`);
      } finally {
        fileInputRef.current!.value = "";
      }
    });

    uppy.on("upload-error", (file, error) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "error", error: error.message } : f
        )
      );
      onUploadError?.(error);
      toast.error(`文件 ${file.name} 上传失败`);
    });

  }, [maxFileSize, allowedFileTypes, onUploadSuccess, onUploadError]);

  // 处理拖放
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (uppyRef.current) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      droppedFiles.forEach((file) => {
        uppyRef.current?.addFile({
          name: file.name,
          type: file.type,
          data: file,
        });
      });
    }
  }, []);

  // 文件操作函数
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    selectedFiles.forEach((file) => {
      uppyRef.current?.addFile({
        name: file.name,
        type: file.type,
        data: file,
      });
    });
  };

  const handleRemoveFile = (fileId: string) => {
    uppyRef.current?.removeFile(fileId);
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    fileInputRef.current!.value = "";
  };

  const handlePauseResume = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (file?.status === "uploading") {
      uppyRef.current?.pauseResume(fileId);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "paused" } : f))
      );
    } else if (file?.status === "paused") {
      uppyRef.current?.pauseResume(fileId);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "uploading" } : f))
      );
    }
  };

  const handleRetry = (fileId: string) => {
    uppyRef.current?.retryUpload(fileId);
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "waiting", progress: 0 } : f
      )
    );
  };

  const startUpload = () => {
    uppyRef.current?.upload();
  };

  const clearList = () => {
    uppyRef.current?.cancelAll();
    setFiles([]);
    fileInputRef.current!.value = "";
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-4">
      {/* 拖放区域 */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-gray-200 hover:border-primary"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          accept={allowedFileTypes.join(",")}
          onChange={handleFileInputChange}
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4 text-sm text-gray-600">
          <span className="font-semibold text-primary">点击上传</span>{" "}
          或拖放文件到这里
        </div>
        <p className="mt-2 text-xs text-gray-500">
          支持上传大文件，单个文件最大 {formatFileSize(maxFileSize)}
        </p>
      </div>

      {/* 文件列表 */}
      {files.length > 0 && (
        <ScrollArea className="h-[300px] rounded-md border p-4">
          <div className="space-y-4">
            {files.map((file) => (
              <Card key={file.id} className="p-4">
                <div className="flex items-center gap-4">
                  <FileIcon className="h-8 w-8 flex-shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0 w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2">
                        {file.status === "uploading" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePauseResume(file.id)}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                        )}
                        {file.status === "paused" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePauseResume(file.id)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {file.status === "error" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRetry(file.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={file.progress} className="flex-1" />
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    {file.status === "error" && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {file.error}
                      </p>
                    )}
                    {file.status === "complete" && (
                      <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        上传完成
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* 操作按钮 */}
      {files.length > 0 && (
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={clearList}
          >
            清空列表
          </Button>
          <Button onClick={startUpload}>开始上传</Button>
        </div>
      )}
    </div>
  );
}
