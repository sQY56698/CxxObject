import apiClient from './axios';
import { FileInfo, ProcessFileParams } from '@/types/file';

// 文件系统API接口
export const fileApi = {
  // 处理已上传文件
  processUploadedFile: async (params: ProcessFileParams): Promise<FileInfo> => {
    const response = await apiClient.post<FileInfo>(`/files/process/${params.uploadId}`);
    return response.data;
  },

  // 获取文件信息
  getFileInfo: async (fileId: number): Promise<FileInfo> => {
    const response = await apiClient.get<FileInfo>(`/files/${fileId}`);
    return response.data;
  },

  // 删除文件
  deleteFile: async (fileId: number): Promise<boolean> => {
    const response = await apiClient.delete<boolean>(`/files/${fileId}`);
    return response.data;
  },

  // 检查文件访问权限
  checkFileAccess: async (fileId: number): Promise<boolean> => {
    const response = await apiClient.get<{hasAccess: boolean}>(`/files/${fileId}/access`);
    return response.data.hasAccess;
  },

  // 获取文件下载URL
  getDownloadUrl: (fileId: number): string => {
    return `/api/files/download/${fileId}`;
  },

  // 文件预览URL
  getPreviewUrl: (fileId: number): string => {
    return `/api/files/view/${fileId}`;
  },
  
  // 文件关联
  saveFileRelation: async (fileId: number, relationType: string, relationId: number): Promise<boolean> => {
    const response = await apiClient.post<boolean>(`/files/${fileId}/relation`, {
      relationType,
      relationId
    });
    return response.data;
  },
  
};
