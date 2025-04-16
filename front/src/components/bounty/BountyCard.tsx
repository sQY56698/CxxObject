import Link from "next/link";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Clock, Coins, Eye, Users, CircleDot, CheckCircle2, XCircle } from "lucide-react";
import { FileBounty, BountyStatus } from "@/types/bounty";
import { formatDateTime, cn } from "@/lib/utils";

interface BountyCardProps {
  bounty: FileBounty;
  className?: string;
  size?: "sm" | "lg";
}

export function BountyCard({ bounty, className, size = "lg" }: BountyCardProps) {
  // 获取状态样式
  const getStatusStyle = (status: number) => {
    switch (status) {
      case BountyStatus.IN_PROGRESS:
        return {
          bg: "bg-emerald-50",
          text: "text-emerald-600",
          label: "进行中",
          icon: <CircleDot className="h-3.5 w-3.5" />,
        };
      case BountyStatus.COMPLETED:
        return {
          bg: "bg-blue-50",
          text: "text-blue-600",
          label: "已完成",
          icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        };
      case BountyStatus.CLOSED:
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          label: "已关闭",
          icon: <XCircle className="h-3.5 w-3.5" />,
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          label: "未知",
          icon: <CircleDot className="h-3.5 w-3.5" />,
        };
    }
  };

  const statusStyle = getStatusStyle(bounty.status);

  return (
    <Link href={`/bounty/${bounty.id}`} className="block h-full">
      <Card className={cn(
        "overflow-hidden border shadow-sm hover:shadow-lg transition-all hover:border-primary/20",
        "group bg-gradient-to-b from-white to-muted/5",
        className
      )}>
        <div className="relative p-5 pb-3 flex flex-col h-full">
          {/* 顶部信息：状态标签、积分和用户信息 */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              {/* 用户头像和名称 */}
              <div className="flex items-center gap-2">
                <UserAvatar
                  userId={bounty.userId}
                  username={bounty.username}
                  avatar={bounty.avatar}
                  size="sm"
                />
                <span className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {bounty.username}
                </span>
              </div>
            </div>

            {/* 积分显示 */}
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-amber-100/50 
              px-3 py-1 rounded-full border border-amber-200/30 shadow-sm
              transition-transform group-hover:scale-105">
              <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full p-1">
                <Coins className="h-3 w-3 text-white" />
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                {bounty.points}
              </span>
            </div>
          </div>

          {/* 标题和描述 */}
          <div className="space-y-2 mb-auto">
            <h3 className={cn(
              "font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2",
              size === "lg" ? "text-lg" : "text-base"
            )}>
              {bounty.title}
            </h3>
            <p className="text-sm text-muted-foreground/90 line-clamp-3 min-h-[3em]">
              {bounty.description}
            </p>
          </div>

          {/* 底部信息：状态、统计和时间 */}
          <div className="mt-4 pt-3 border-t flex flex-wrap gap-y-2">
            {/* 左侧：状态和统计 */}
            <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0 h-[30px]">
              {/* 状态标签 */}
              <div className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
                "shadow-sm border border-opacity-10",
                "transition-transform group-hover:scale-105",
                statusStyle.bg,
                statusStyle.text
              )}>
                {statusStyle.icon}
                {statusStyle.label}
              </div>
              {/* 查看数 */}
              <div className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5
                shadow-sm border border-opacity-10 bg-blue-50 text-blue-600
                transition-transform group-hover:scale-105">
                <Eye className="h-3.5 w-3.5" />
                <span>{bounty.viewCount}</span>
              </div>
              {/* 竞标数 */}
              <div className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5
                shadow-sm border border-opacity-10 bg-purple-50 text-purple-600
                transition-transform group-hover:scale-105">
                <Users className="h-3.5 w-3.5" />
                <span>{bounty.bidCount}</span>
              </div>
            </div>

            {/* 右侧：时间信息 */}
            <div className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5
              shadow-sm border border-opacity-10 bg-gray-50 text-gray-600
              transition-transform group-hover:scale-105 shrink-0 h-[30px]">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDateTime(bounty.createdAt)}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
} 