import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { FileInfo } from "@/types/file";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期时间
 * @param dateString ISO格式的日期字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

// 格式化日期
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * 格式化文件大小
 * @param bytes 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function downloadFile(fileInfo: FileInfo) {
  const a = document.createElement('a');
  a.href = fileInfo.fileUrl as string;
  a.download = fileInfo.originalFilename || '未命名文件';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export const FILE_STATUS_MAP: Record<number, { label: string; color: string }> =
{
  0: { label: "审核中", color: "bg-blue-100 text-blue-800" },
  1: { label: "已发布", color: "bg-green-100 text-green-800" },
  2: { label: "发布成功", color: "bg-purple-100 text-purple-800" },
  3: { label: "已驳回", color: "bg-red-100 text-red-800" },
};