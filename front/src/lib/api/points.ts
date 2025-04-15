import apiClient from './axios';
import { UserPoints, PointsRecord } from '@/types/points';

interface PointsResponse {
  content: PointsRecord[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// 积分系统API接口
export const pointsApi = {
  // 获取当前用户的积分信息
  getMyPoints: async () => {
    const response = await apiClient.get<UserPoints>('/points/my');
    return response.data;
  },

  // 获取积分记录
  getPointsRecords: async (page = 0, size = 10) => {
    const response = await apiClient.get<PointsResponse>(`/points/records?page=${page}&size=${size}`);
    return response.data;
  },

  // 获取指定用户的积分信息（如果需要）
  getUserPoints: async (userId: number) => {
    const response = await apiClient.get<UserPoints>(`/points/user/${userId}`);
    return response.data;
  }
}; 