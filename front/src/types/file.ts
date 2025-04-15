// 文件信息
export interface FileInfo {
  id: number;
  originalFilename: string;
  fileName: string;
  fileSize: number;
  fileType: number;
  fileUrl: string | null;
  hasAccess: boolean;
  uploaderId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 文件上传结果
export interface FileUploadResult {
  fileId: number;
  fileInfo: FileInfo;
}

// 处理已上传文件的参数
export interface ProcessFileParams {
  uploadId: string;
}

// 文件类型枚举
export enum FileType {
  OTHER = 0,
  IMAGE = 1,
  VIDEO = 2,
  AUDIO = 3,
  PDF = 4,
  EXCEL = 5,
  WORD = 6,
  PPT = 7,
  ARCHIVE = 8
}

// 文件类型图标映射
export const FileTypeIcons = {
  [FileType.IMAGE]: 'image',
  [FileType.VIDEO]: 'video',
  [FileType.AUDIO]: 'music',
  [FileType.PDF]: 'file-text',
  [FileType.EXCEL]: 'table',
  [FileType.WORD]: 'file-text',
  [FileType.PPT]: 'presentation',
  [FileType.ARCHIVE]: 'archive',
  [FileType.OTHER]: 'file'
};

// 文件类型颜色映射
export const FileTypeColors = {
  [FileType.IMAGE]: 'text-rose-500',
  [FileType.VIDEO]: 'text-purple-500',
  [FileType.AUDIO]: 'text-amber-500',
  [FileType.PDF]: 'text-red-500',
  [FileType.EXCEL]: 'text-emerald-500',
  [FileType.WORD]: 'text-blue-500',
  [FileType.PPT]: 'text-orange-500',
  [FileType.ARCHIVE]: 'text-slate-500',
};

// 添加背景色
export const FileTypeBgColors = {
  [FileType.IMAGE]: 'bg-rose-50',
  [FileType.VIDEO]: 'bg-purple-50',
  [FileType.AUDIO]: 'bg-amber-50',
  [FileType.PDF]: 'bg-red-50',
  [FileType.EXCEL]: 'bg-emerald-50',
  [FileType.WORD]: 'bg-blue-50',
  [FileType.PPT]: 'bg-orange-50',
  [FileType.ARCHIVE]: 'bg-slate-50',
};

// 文件状态
export interface FileStatus {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: "waiting" | "uploading" | "paused" | "complete" | "error";
  error?: string;
  fileId?: number; // 上传成功后的文件ID
} 