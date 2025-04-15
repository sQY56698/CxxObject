import apiClient from './axios';
import { UserProfile, UserProfileData } from '@/types/user';

// 用户资料API接口
export const profileApi = {
  // 获取当前用户的资料
  getCurrentProfile: async () => {
    const response = await apiClient.get<UserProfile>('/profile/current');
    return response.data;
  },

  // 更新用户资料
  updateProfile: async (data: UserProfileData) => {
    const response = await apiClient.put<UserProfile>('/profile/update', data);
    return response.data;
  },

  // 获取用户资料
  getUserProfile: async (userId: number) => {
    const response = await apiClient.get<UserProfile>(`/profile/${userId}`);
    return response.data;
  }
}; 