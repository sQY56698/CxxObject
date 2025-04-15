import apiClient from './axios';
import { FileBounty, FileBid, PublishBountyForm } from "@/types/bounty";
import { FileInfo } from "@/types/file";

interface BountyListResponse {
  content: FileBounty[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

interface BidListResponse {
  content: FileBid[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// 悬赏系统API接口
export const bountyApi = {
  // 发布悬赏
  publishBounty: async (data: PublishBountyForm) => {
    const response = await apiClient.post<FileBounty>("/bounty/publish", data);
    return response.data;
  },

  // 获取悬赏详情
  getBountyDetail: async (bountyId: number) => {
    const response = await apiClient.get<FileBounty>(`/bounty/${bountyId}`);
    return response.data;
  },

  // 获取悬赏列表
  getBountyList: async (page = 0, size = 10) => {
    const response = await apiClient.get<BountyListResponse>(
      `/bounty/list?page=${page}&size=${size}`
    );
    return response.data;
  },

  // 获取我发布的悬赏列表
  getMyBountyList: async (page = 0, size = 10) => {
    const response = await apiClient.get<BountyListResponse>(
      `/bounty/bounty?page=${page}&size=${size}`
    );
    return response.data;
  },

  // 关闭悬赏
  closeBounty: async (bountyId: number) => {
    const response = await apiClient.post<boolean>(`/bounty/${bountyId}/close`);
    return response.data;
  },

  // 参与竞标
  createBid: async (bountyId: number) => {
    const response = await apiClient.post<FileBid>(`/bounty/${bountyId}/bid`);
    return response.data;
  },

  // 更新竞标文件
  updateBidFile: async (bidId: number, fileId: number) => {
    const response = await apiClient.post<FileBid>(
      `/bounty/bid/${bidId}/file?fileId=${fileId}`
    );
    return response.data;
  },

  // 获取悬赏的竞标列表
  getBidList: async (bountyId: number, page = 0, size = 10) => {
    const response = await apiClient.get<BidListResponse>(
      `/bounty/${bountyId}/bids?page=${page}&size=${size}`
    );
    return response.data;
  },

  // 获取我参与的竞标列表
  getMyBidList: async (page = 0, size = 10) => {
    const response = await apiClient.get<BidListResponse>(
      `/bounty/bids?page=${page}&size=${size}`
    );
    return response.data;
  },

  // 下载竞标文件
  downloadBidFile: async (bidId: number) => {
    const response = await apiClient.get<FileInfo>(`/bounty/bid/${bidId}/file`);
    return response.data;
  },

  // 选择竞标胜利者
  selectWinner: async (bountyId: number, bidId: number) => {
    const response = await apiClient.post<boolean>(
      `/bounty/${bountyId}/winner/${bidId}`
    );
    return response.data;
  },

  // 添加获取下载URL的辅助方法
  getFileDownloadUrl: (fileId: number) => {
    return `/api/files/download/${fileId}`;
  },

  // 取消竞标
  cancelBid: async (bidId: number) => {
    const response = await apiClient.delete<boolean>(`/bounty/bid/${bidId}`);
    return response.data;
  },

  // 重新开启悬赏
  reopenBounty: async (bountyId: number) => {
    const response = await apiClient.post<boolean>(`/bounty/${bountyId}/reopen`);
    return response.data;
  },

  // 获取最新的N个悬赏（用于首页轮播）
  getLatestBounties: async () => {
    const response = await apiClient.get<FileBounty[]>(
      `/bounty/latest`
    );
    return response.data;
  },
}; 