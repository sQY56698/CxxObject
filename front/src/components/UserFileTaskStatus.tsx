import { UserFileTaskStatusEnum } from "@/types/file";
import { Shield, FileText, Ban, AlertCircle } from "lucide-react";

export function getStatusStyle(status: number) {
  console.log(status);

  switch (status) {
    case UserFileTaskStatusEnum.REVIEWING:
      return {
        bg: "bg-amber-50",
        text: "text-amber-600",
        label: "审核中",
        icon: <Shield className="h-4 w-4" />,
      };
    case UserFileTaskStatusEnum.PUBLISHED:
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        label: "已发布",
        icon: <FileText className="h-4 w-4" />,
      };
    case UserFileTaskStatusEnum.REJECTED:
      return {
        bg: "bg-red-50",
        text: "text-red-600",
        label: "已驳回",
        icon: <Ban className="h-4 w-4" />,
      };
    case UserFileTaskStatusEnum.SUCCESS:
      return {
        bg: "bg-blue-50",
        text: "text-blue-600",
        label: "发布成功",
        icon: <FileText className="h-4 w-4" />,
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-600",
        label: "未知状态",
        icon: <AlertCircle className="h-4 w-4" />,
      };
  }
}
