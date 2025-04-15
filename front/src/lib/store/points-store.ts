import { create } from 'zustand';
import { pointsApi } from '@/lib/api/points';
import { UserPoints, PointsRecord } from '@/types/points';

interface PointsState {
  points: UserPoints | null;
  records: PointsRecord[];
  isLoading: boolean;
  fetchPoints: () => Promise<void>;
  fetchPointsRecords: (page?: number, size?: number) => Promise<void>;
}

export const usePointsStore = create<PointsState>((set) => ({
  points: null,
  records: [],
  isLoading: false,

  fetchPoints: async () => {
    try {
      set({ isLoading: true });
      const points = await pointsApi.getMyPoints();
      set({ points });
    } catch (error) {
      console.error('获取积分信息失败:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPointsRecords: async (page = 0, size = 10) => {
    try {
      set({ isLoading: true });
      const response = await pointsApi.getPointsRecords(page, size);
      set({ records: response.content });
    } catch (error) {
      console.error('获取积分记录失败:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
