// 悬赏状态枚举
export enum BountyStatus {
  IN_PROGRESS = 1,  // 进行中
  COMPLETED = 2,    // 已完成
  CLOSED = 3        // 已关闭
}

// 文件信息
export interface FileInfo {
  id: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: number;
  originalFilename: string;
  hasAccess: boolean;
  createdAt: string;
}

// 悬赏信息
export interface FileBounty {
  id: number;
  title: string;
  description: string;
  points: number;
  userId: number;
  username: string;
  avatar?: string;  // 添加发布者头像
  status: number;
  statusText: string;
  viewCount: number;
  bidCount: number;
  createdAt: string;
  endAt?: string;
  winnerId?: number;
  winnerName?: string;
  winnerAvatar?: string;  // 添加胜利者头像
  isMine: boolean;
}

// 竞标信息
export interface FileBid {
  id: number;
  bountyId: number;
  userId: number;
  username: string;
  avatar?: string;  // 添加竞标者头像
  fileId: number | null;
  fileInfo?: FileInfo | null;
  isWinner: boolean;
  createdAt: string;
  isMine: boolean;
  hasFile: boolean;
  canAccess: boolean;
}

// 悬赏详情页参数
export interface BountyDetailParams {
  bountyId: string;
}

// 发布悬赏表单类型
export interface PublishBountyForm {
  title: string;
  description: string;
  points: number;
} 