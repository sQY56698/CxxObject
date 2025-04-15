"use client";

import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, CalendarDays, Check, Gift } from "lucide-react";
import { toast } from "sonner";
import { signApi } from "@/lib/api/sign";
import { UserSignCycle, SignReward } from "@/types/sign";
import { useUserStore } from "@/lib/store/user-store";
import { cn } from "@/lib/utils";

interface DayStatusProps {
  day: number;
  isSigned: boolean;
  isToday: boolean;
  points: number;
}

// 单日签到状态组件
const DayStatus = ({ day, isSigned, isToday, points }: DayStatusProps) => {
  // 格式化积分显示
  const formatPoints = (points: number) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toString();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex flex-col items-center justify-center w-12 h-16 rounded-md border transition-all cursor-default",
              isToday && !isSigned && "border-primary/70 border-dashed",
              isSigned && "bg-primary/10 border-primary",
              !isSigned && !isToday && "bg-background/80 border-border/60"
            )}
          >
            <span
              className={cn("text-sm font-medium", isSigned && "text-primary")}
            >
              {day}
            </span>
            {isSigned ? (
              <div className="mt-1 bg-primary rounded-full w-5 h-5 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className="text-center mt-1">
                <span className="text-xs text-muted-foreground leading-none block">
                  {formatPoints(points)}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none block">
                  积分
                </span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isSigned ? "已签到" : isToday ? "今日待签到" : "未签到"}</p>
          <p className="text-xs text-muted-foreground">
            {isSigned ? `已获得${points}积分` : `签到可得${points}积分`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function SignCyclePanel() {
  const { user } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [todaySigned, setTodaySigned] = useState(false);
  const [currentCycle, setCurrentCycle] = useState<UserSignCycle | null>(null);
  const [rewards, setRewards] = useState<SignReward[]>([]);

  // 加载签到数据和奖励规则
  const loadSignData = async () => {
    try {
      setLoading(true);

      // 并行加载数据
      const [isSigned, cycle, rewardsData] = await Promise.all([
        signApi.isTodaySigned(),
        signApi.getCurrentCycleStatus().catch(() => null),
        signApi.getSignRewards()
      ]);

      setTodaySigned(isSigned);
      setCurrentCycle(cycle);
      setRewards(rewardsData);
    } catch (error) {
      console.error("加载签到数据失败:", error);
      toast.error("加载签到数据失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSignData();
    }
  }, [user]);

  // 处理签到
  const handleSignIn = async () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }

    if (todaySigned) {
      toast.info("今天已经签到过了");
      return;
    }

    try {
      setSigning(true);
      const result = await signApi.signIn();
      setTodaySigned(true);

      // 刷新签到数据
      await loadSignData();

      // 显示签到成功消息
      toast.success(`签到成功，获得${result.earnedPoints}积分！`);

      // 如果完成了一个签到周期，显示额外的提示
      if (result.cycleCompleted) {
        toast.success(
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            <span>恭喜您完成了一个完整的签到周期！</span>
          </div>,
          {
            duration: 5000,
          }
        );
      }
    } catch (error) {
      console.error("签到失败:", error);
      toast.error("签到失败，请重试");
    } finally {
      setSigning(false);
    }
  };

  // 计算周期日期和签到状态
  const renderCycleDays = () => {
    const today = new Date();
    const todayDayNumber = today.getDate();
    const cycleLength = currentCycle?.cycleLength || 7;
    const currentDay = currentCycle?.currentSignDay || 0;

    let startDate: Date;

    if (currentCycle) {
      // 如果有正在进行的周期，使用周期开始日期
      startDate = new Date(currentCycle.cycleStartDate);
    } else {
      // 否则使用今天作为潜在的开始日期
      startDate = today;
    }

    const days = [];

    for (let i = 0; i < cycleLength; i++) {
      const cycleDate = addDays(startDate, i);
      const cycleDay = i + 1;
      const isSigned = currentCycle ? i < currentDay : false;
      const isToday =
        cycleDate.getDate() === todayDayNumber &&
        cycleDate.getMonth() === today.getMonth() &&
        cycleDate.getFullYear() === today.getFullYear();

      // 对于今天特殊处理
      const isTodaySigned = isToday && todaySigned;

      days.push(
        <DayStatus
          key={i}
          day={cycleDay}
          isSigned={isSigned || isTodaySigned}
          isToday={isToday}
          points={rewards[i]?.totalPoints || 10}
        />
      );
    }

    return days;
  };

  if (!user) {
    return <div>登录后可以参与每日签到</div>;
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <div>
              <span className="text-sm font-medium">
                {currentCycle
                  ? `当前已连续签到 ${currentCycle.currentSignDay} 天`
                  : "开始您的签到之旅"}
              </span>
              {currentCycle?.currentSignDay === 6 && !todaySigned && (
                <p className="text-xs text-primary mt-1">
                  再签到1天即可获得额外奖励！
                </p>
              )}
            </div>
            <Button
              onClick={handleSignIn}
              disabled={todaySigned || signing}
              className="min-w-[100px]"
            >
              {signing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {todaySigned ? "已签到" : "立即签到"}
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center gap-2 mb-4">
              <h4 className="text-sm font-medium">签到周期</h4>
              {currentCycle && (
                <span className="text-xs text-muted-foreground">
                  开始日期:{" "}
                  {format(new Date(currentCycle.cycleStartDate), "yyyy-MM-dd")}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center gap-2">
              {renderCycleDays()}
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2">签到规则</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 每日签到可获得积分奖励，连续签到积分递增</li>
              <li>• 完成7天连续签到可获得额外奖励</li>
              <li>• 中断签到将重新计算连续签到天数</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
