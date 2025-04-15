import apiClient from "./axios";
import { SignResult, CalendarSign, UserSignCycle, SignReward } from "@/types/sign";

// 签到系统API接口
export const signApi = {
  // 用户签到
  signIn: async () => {
    const response = await apiClient.post<SignResult>("/sign/in");
    return response.data;
  },

  // 获取用户某月签到日历
  getMonthlySignCalendar: async (year?: number, month?: number) => {
    let url = "/sign/calendar";

    // 添加可选的年月参数
    if (year !== undefined && month !== undefined) {
      url += `?year=${year}&month=${month}`;
    }

    const response = await apiClient.get<CalendarSign>(url);
    return response.data;
  },

  // 检查今日是否已签到
  isTodaySigned: async () => {
    const response = await apiClient.get<boolean>("/sign/check");
    return response.data;
  },

  // 获取用户当前签到周期状态
  getCurrentCycleStatus: async () => {
    const response = await apiClient.get<UserSignCycle>("/sign/cycle");
    return response.data;
  },

  // 获取签到奖励规则
  getSignRewards: async () => {
    const response = await apiClient.get<SignReward[]>("/sign/rewards");
    return response.data;
  },
};
