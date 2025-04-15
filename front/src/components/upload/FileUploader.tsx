import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ChunkUploader from './ChunkUploader';

interface FileUploaderProps {
  children: React.ReactNode;
  onUploadComplete?: (fileId: number) => void;
  onUploadStart?: () => void;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FileUploader({
  children,
  onUploadComplete,
  onUploadStart,
  maxFileSize,
  allowedFileTypes,
  buttonText = "上传文件",
  buttonIcon,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: FileUploaderProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // 使用外部控制或内部状态
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const onOpenChange = externalOnOpenChange || setInternalOpen;

  const handleUploadSuccess = (result: any) => {
    if (result && result.id) {
      onUploadComplete?.(result.id);
      onOpenChange(false);
    }
  };

  const handleUploadError = (error: Error) => {
    // 错误处理已经在 ChunkUploader 中通过 toast 实现
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen) {
      onUploadStart?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{buttonText || '上传文件'}</DialogTitle>
          <DialogDescription>
            请选择要上传的文件，支持大文件上传
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 overflow-hidden">
          <ChunkUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            maxFileSize={maxFileSize}
            allowedFileTypes={allowedFileTypes}
            multiple={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 