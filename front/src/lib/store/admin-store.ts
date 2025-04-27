import { create } from 'zustand';
import { AdminAuthUser, AdminLoginRequest } from '@/types/admin';
import { adminLogin, getCurrentAdmin, clearAdminToken, setAdminToken } from '@/lib/api/admin';

interface AdminState {
  admin: AdminAuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (credentials: AdminLoginRequest) => Promise<AdminAuthUser>;
  logout: () => void;
  fetchAdmin: () => Promise<AdminAuthUser | null>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  admin: null,
  isLoading: false,
  isLoggedIn: false,
  
  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await adminLogin(credentials);
      setAdminToken(response.token);
      const admin = await getCurrentAdmin();
      set({ admin, isLoggedIn: true, isLoading: false });
      return admin;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  logout: () => {
    clearAdminToken();
    set({ admin: null, isLoggedIn: false });
  },
  
  fetchAdmin: async () => {
    set({ isLoading: true });
    try {
      const admin = await getCurrentAdmin();
      set({ admin, isLoggedIn: true, isLoading: false });
      return admin;
    } catch (error) {
      set({ admin: null, isLoggedIn: false, isLoading: false });
      return null;
    }
  },
})); 