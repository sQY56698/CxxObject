// 签到结果响应
export interface SignResult {
  userId: number;
  signDate: string;
  continuousDays: number;
  earnedPoints: number;
  cycleCompleted: boolean;
}

// 日历签到数据
export interface CalendarSign {
  userId: number;
  year: number;
  month: number;
  signDays: Record<number, boolean>; // 日期 -> 是否签到
}

// 签到周期状态
export interface UserSignCycle {
  id: number;
  userId: number;
  cycleStartDate: string;
  cycleLength: number;
  currentSignDay: number;
  lastSignDate: string;
}

// 签到状态
export interface SignStatus {
  isSigned: boolean;
  currentCycle?: UserSignCycle;
}

// 签到奖励信息
export interface SignReward {
  day: number;
  basePoints: number;
  extraPoints: number;
  totalPoints: number;
}
