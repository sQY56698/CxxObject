import apiClient from './axios';
import { UserFileTaskDTO } from "@/types/file";
import { FileInfo } from "@/types/file";

interface ResourceListResponse {
  content: UserFileTaskDTO[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;
}

// 创建用户文件任务的请求参数
interface CreateResourceParams {
  title: string;
  description: string;
  fileId: number;
  isFree: boolean;
  requiredPoints?: number;
}

// 用户资源共享API接口
export const resourceApi = {
  // 创建资源共享任务
  createResource: async (data: CreateResourceParams): Promise<UserFileTaskDTO> => {
    const response = await apiClient.post<UserFileTaskDTO>("/user-files/create", data);
    return response.data;
  },

  // 获取资源详情
  getResourceDetail: async (resourceId: number): Promise<UserFileTaskDTO> => {
    const response = await apiClient.get<UserFileTaskDTO>(`/user-files/${resourceId}`);
    return response.data;
  },
  
  // 下载资源文件
  downloadResource: async (resourceId: number): Promise<FileInfo> => {
    const response = await apiClient.get<FileInfo>(`/user-files/${resourceId}/download`);
    return response.data;
  },

  // 获取我的资源列表
  getMyResources: async (page = 0, size = 10): Promise<ResourceListResponse> => {
    const response = await apiClient.get<ResourceListResponse>(
      `/user-files/my?page=${page}&size=${size}`
    );
    return response.data;
  },

  // 获取公开的资源列表
  getPublicResources: async (page = 0, size = 10): Promise<ResourceListResponse> => {
    const response = await apiClient.get<ResourceListResponse>(
      `/user-files/public?page=${page}&size=${size}`
    );
    return response.data;
  },

  // 获取免费资源列表
  getFreeResources: async (page = 0, size = 10): Promise<ResourceListResponse> => {
    const response = await apiClient.get<ResourceListResponse>(
      `/user-files/free?page=${page}&size=${size}`
    );
    return response.data;
  },

  // 搜索资源
  searchResources: async (keyword: string, page = 0, size = 10): Promise<ResourceListResponse> => {
    const response = await apiClient.get<ResourceListResponse>(
      `/user-files/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`
    );
    return response.data;
  },

  // 更新资源
  updateResource: async (resourceId: number, data: CreateResourceParams): Promise<UserFileTaskDTO> => {
    const response = await apiClient.put<UserFileTaskDTO>(`/user-files/${resourceId}`, data);
    return response.data;
  },

  // 删除资源
  deleteResource: async (resourceId: number): Promise<boolean> => {
    const response = await apiClient.delete<boolean>(`/user-files/${resourceId}`);
    return response.data;
  },

  // 获取最新发布的资源
  getLatestResources: async (limit = 10): Promise<UserFileTaskDTO[]> => {
    const response = await apiClient.get<UserFileTaskDTO[]>(`/user-files/latest?limit=${limit}`);
    return response.data;
  },

  // 获取热门资源（按下载量排序）
  getHotResources: async (limit = 10): Promise<UserFileTaskDTO[]> => {
    const response = await apiClient.get<UserFileTaskDTO[]>(`/user-files/hot?limit=${limit}`);
    return response.data;
  },

  // 获取资源下载URL（用于直接下载链接的场景）
  getDownloadUrl: (resourceId: number): string => {
    return `/api/user-files/${resourceId}/download`;
  },

  // 获取资源状态统计（可用于管理后台或个人中心）
  getResourceStats: async (): Promise<{
    total: number;
    reviewing: number;
    published: number;
    rejected: number;
  }> => {
    const response = await apiClient.get<{
      total: number;
      reviewing: number;
      published: number;
      rejected: number;
    }>('/user-files/stats');
    return response.data;
  },

  // 资源评论点赞（如果后端支持的话）
  likeResource: async (resourceId: number): Promise<boolean> => {
    const response = await apiClient.post<boolean>(`/user-files/${resourceId}/like`);
    return response.data;
  },
  
  // 获取资源预览（如果支持）
  previewResource: async (resourceId: number): Promise<string> => {
    const response = await apiClient.get<{previewUrl: string}>(`/user-files/${resourceId}/preview`);
    return response.data.previewUrl;
  },

  queryResources: async (params: {
    userId?: number;
    isFree?: boolean;
    keyword?: string;
    status?: string[];
    page?: number;
    size?: number;
  }): Promise<ResourceListResponse> => {
    const response = await apiClient.get<ResourceListResponse>('/user-files/query', { params });
    return response.data;
  },

};