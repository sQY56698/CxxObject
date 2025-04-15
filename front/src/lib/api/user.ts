import apiClient from './axios';
import { UserLoginData, UserRegisterData, User, UserProfile, UserProfileData } from '@/types/user';

// 用户API接口
export const userApi = {
  // 用户注册
  register: async (data: UserRegisterData) => {
    const response = await apiClient.post<User>('/user/register', data);
    return response.data;
  },

  // 用户登录
  login: async (data: UserLoginData) => {
    const response = await apiClient.post<{user: User, token: string}>('/user/login', data);
    // 保存token
    localStorage.setItem('token', response.data.token);
    return response.data.user;
  },

  // 用户登出
  logout: async () => {
    localStorage.removeItem('token');
    const response = await apiClient.post('/user/logout');
    return response.data;
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get<User>('/user/current');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // 修改密码
  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await apiClient.post('/user/change-password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },
};