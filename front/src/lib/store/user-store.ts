import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserProfile, UserProfileData } from '@/types/user';
import { userApi} from "@/lib/api/user";
import { profileApi } from "@/lib/api/profile";

interface UserState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (data: { username: string; password: string; email: string; captcha: string }) => Promise<User>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<User | null>;
  fetchProfile: () => Promise<UserProfile | null>;
  updateProfile: (data: UserProfileData) => Promise<UserProfile>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: false,
      isLoggedIn: false,

      // 登录
      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const user = await userApi.login({ username, password });
          set({ user, isLoggedIn: true, isLoading: false });
          return user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // 注册
      register: async (data) => {
        set({ isLoading: true });
        try {
          const user = await userApi.register(data);
          set({ isLoading: false });
          return user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // 登出
      logout: async () => {
        set({ isLoading: true });
        try {
          await userApi.logout();
          set({ user: null, profile: null, isLoggedIn: false, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // 获取当前用户信息
      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const user = await userApi.getCurrentUser();
          set({ 
            user, 
            isLoggedIn: !!user, 
            isLoading: false 
          });
          return user;
        } catch (error) {
          set({ isLoading: false });
          console.error('获取当前用户信息失败:', error);
          return null;
        }
      },

      // 获取当前用户资料
      fetchProfile: async () => {
        const { user } = get();
        if (!user) return null;

        set({ isLoading: true });
        try {
          const profile = await profileApi.getCurrentProfile();
          set({ profile, isLoading: false });
          return profile;
        } catch (error) {
          set({ isLoading: false });
          console.error('获取当前用户资料失败:', error);
          return null;
        }
      },

      // 更新用户资料
      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const profile = await profileApi.updateProfile(data);
          set({ profile, isLoading: false });
          return profile;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // 清除用户信息
      clearUser: () => {
        localStorage.removeItem('token');
        set({ user: null, profile: null, isLoggedIn: false });
      },
    }),
    {
      name: 'user-storage', // localStorage的键名
      partialize: (state) => ({ user: state.user, isLoggedIn: state.isLoggedIn }), // 只持久化这两个属性
    }
  )
); 