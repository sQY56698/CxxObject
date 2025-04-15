export interface UserPoints {
  userId: number;
  points: number;
  totalPoints: number;
  username: string;
}

export interface PointsRecord {
  id: number;
  points: number;
  type: number;
  description: string;
  createdAt: string;
}

export enum PointsType {
  UPLOAD = 1,
  DOWNLOAD = 2,
  POST_BOUNTY = 3,
  COMPLETE_BOUNTY = 4,
  ADMIN_ADJUST = 5
}

// 积分类型描述映射
export const PointsTypeMap = {
  [PointsType.UPLOAD]: '上传文件',
  [PointsType.DOWNLOAD]: '下载文件',
  [PointsType.POST_BOUNTY]: '发布悬赏',
  [PointsType.COMPLETE_BOUNTY]: '完成悬赏',
  [PointsType.ADMIN_ADJUST]: '管理员调整'
} as const;
