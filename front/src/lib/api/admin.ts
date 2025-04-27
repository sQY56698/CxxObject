import apiClient from "./axios";
import { AdminLoginRequest, JwtResponse, AdminAuthUser } from '@/types/admin';
import { UserFileTaskDTO } from '@/types/file';
import { Page } from '@/types/common';
import { FileInfo } from '@/types/file';

// 管理员 Token 的本地存储键名
const ADMIN_TOKEN_KEY = 'token';

// 设置管理员 Token
export const setAdminToken = (token: string) => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

// 获取管理员 Token
export const getAdminToken = (): string | null => {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

// 清除管理员 Token
export const clearAdminToken = () => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

// 管理员登录
export const adminLogin = async (loginRequest: AdminLoginRequest): Promise<JwtResponse> => {
  const response = await apiClient.post<JwtResponse>(
    "/admin/auth/login",
    loginRequest
  );
  return response.data;
};

// 获取当前管理员信息
export const getCurrentAdmin = async (): Promise<AdminAuthUser> => {
  const response = await apiClient.get<AdminAuthUser>(
    "/admin/auth/current"
  );
  return response.data;
};

// 获取待审核的用户文件任务
export const getPendingReviewTasks = async (page = 0, size = 10) => {
  const response = await apiClient.get<Page<UserFileTaskDTO>>(`/admin/user-files/pending?page=${page}&size=${size}`);
  return response.data;
};

// 获取所有用户文件任务
export const getAllUserFileTasks = async (page = 0, size = 10, status?: number) => {
  let url = `/admin/user-files/all?page=${page}&size=${size}`;
  if (status !== undefined) {
    url += `&status=${status}`;
  }
  const response = await apiClient.get<Page<UserFileTaskDTO>>(url);
  return response.data;
};

// 获取任务详情
export const getTaskDetail = async (taskId: number) => {
  const response = await apiClient.get<UserFileTaskDTO>(`/admin/user-files/${taskId}`);
  return response.data;
};

// 审核用户文件任务
export const reviewUserFileTask = async (reviewData: {
  taskId: number;
  status: number;
  comment: string;
}) => {
  const response = await apiClient.post<UserFileTaskDTO>(
    "/admin/user-files/review",
    reviewData
  );
  return response.data;
};

// 强制删除任务
export const forceDeleteTask = async (taskId: number) => {
  const response = await apiClient.delete<boolean>(`/admin/user-files/${taskId}`);
  return response.data;
};

// 管理员下载文件
export const downloadTaskFile = async (taskId: number) => {
  const response = await apiClient.get(`/admin/user-files/${taskId}/download`);
  return response.data;
};

// 系统消息类型定义
export interface SystemMessageCreateDTO {
  title: string;
  content: string;
}

export interface SystemMessageDTO {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

// 发送系统消息
export const sendSystemMessage = async (messageData: SystemMessageCreateDTO): Promise<SystemMessageDTO> => {
  const response = await apiClient.post<SystemMessageDTO>(
    "/admin/messages/send",
    messageData
  );
  return response.data;
};

// 获取系统消息历史
export const getSystemMessageHistory = async (page = 0, size = 20): Promise<Page<SystemMessageDTO>> => {
  const response = await apiClient.get<Page<SystemMessageDTO>>(
    `/admin/messages/history?page=${page}&size=${size}`
  );
  return response.data;
};
