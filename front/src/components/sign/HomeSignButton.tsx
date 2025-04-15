"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Gift, Check } from "lucide-react";
import { signApi } from "@/lib/api/sign";
import { toast } from "sonner";
import SignDialog from "./SignDialog";
import { useUserStore } from "@/lib/store/user-store";
import { cn } from "@/lib/utils";
import { usePointsStore } from "@/lib/store/points-store";

export default function HomeSignButton() {
  const { user } = useUserStore();
  const { fetchPoints } = usePointsStore();
  const [signing, setSigning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [todayPoints, setTodayPoints] = useState<number | null>(null);
  const [todaySigned, setTodaySigned] = useState(false);
  const [loading, setLoading] = useState(true);

  // 加载签到状态和今日可获得的积分
  const loadSignData = async () => {
    try {
      setLoading(true);
      const [isSigned, cycleStatus] = await Promise.all([
        signApi.isTodaySigned(),
        signApi.getCurrentCycleStatus()
      ]);

      setTodaySigned(isSigned);
      
      // 如果未签到且有周期状态，计算今天的积分
      if (!isSigned && cycleStatus) {
        // 检查上次签到日期是否是昨天，如果不是则重置为第一天的积分
        const lastSignDate = new Date(cycleStatus.lastSignDate);
        const today = new Date();
        const isConsecutive = (
          lastSignDate.getFullYear() === today.getFullYear() &&
          lastSignDate.getMonth() === today.getMonth() &&
          lastSignDate.getDate() === today.getDate() - 1
        );
        
        // 如果不是连续签到，积分从第一天开始算
        const currentDay = isConsecutive ? cycleStatus.currentSignDay + 1 : 1;
        
        // 基础积分为当前天数（比如第1天1分，第2天2分）
        setTodayPoints(currentDay);
      } else {
        setTodayPoints(0);
      }
    } catch (error) {
      console.error("加载签到数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 处理签到
  const handleClick = async () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }

    if (todaySigned) {
      // 如果已经签到，直接打开面板
      setDialogOpen(true);
      return;
    }

    try {
      setSigning(true);
      const result = await signApi.signIn();
      
      // 更新签到状态
      setTodaySigned(true);
      
      // 显示签到成功消息
      toast.success(`签到成功，获得${result.earnedPoints}积分！`);
      
      // 打开签到面板展示详细信息
      setDialogOpen(true);
      fetchPoints();
    } catch (error) {
      if (error.response?.status === 400) {
        // 如果是已经签到的错误，更新状态并打开签到面板
        setTodaySigned(true);
        setDialogOpen(true);
      } else {
        console.error("签到失败:", error);
        toast.error("签到失败，请重试");
      }
    } finally {
      setSigning(false);
    }
  };

  // 在组件挂载时加载数据
  useEffect(() => {
    if (user) {
      loadSignData();
    }
  }, [user]);

  if (!user) return null;

  return (
    <>
      <Button
        variant={todaySigned ? "ghost" : "outline"}
        onClick={handleClick}
        disabled={signing || loading}
        className={cn(
          "h-9 gap-1.5 rounded-full px-3",
          todaySigned
            ? "bg-muted/40 hover:bg-muted/70 text-muted-foreground"
            : "bg-background hover:bg-muted/50"
        )}
        size="sm"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : signing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : todaySigned ? (
          <Check className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <Gift className="h-3.5 w-3.5" />
        )}
        <span className={cn("text-sm", todaySigned && "text-muted-foreground")}>
          {todaySigned ? "已签到" : "签到"}
        </span>
        {!todaySigned && todayPoints && (
          <span className="text-primary text-xs font-medium">
            +{todayPoints}
          </span>
        )}
      </Button>

      <SignDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
} 