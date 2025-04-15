import apiClient from './axios';
import { Conversation, Message, PageResponse, SendMessageRequest, SystemMessage } from '@/types/message';

const messageApi = {
  // 获取系统消息
  getSystemMessages: async (
    page = 0,
    size = 20
  ): Promise<PageResponse<SystemMessage>> => {
    const response = await apiClient.get(
      `/messages/system?page=${page}&size=${size}`
    );
    return response.data;
  },

  // 标记系统消息为已读
  markSystemMessageAsRead: async (
    messageId: number
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post(`/messages/system/${messageId}/read`);
    return response.data;
  },

  // 获取未读系统消息数量
  getUnreadSystemMessageCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get("/messages/system/unread-count");
    return response.data;
  },

  // 获取会话列表
  getConversations: async (
    page = 0,
    size = 20
  ): Promise<PageResponse<Conversation>> => {
    const response = await apiClient.get(
      `/messages/conversations?page=${page}&size=${size}`
    );
    return response.data;
  },

  // 获取会话消息
  getConversationMessages: async (
    conversationId: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<Message>> => {
    const response = await apiClient.get(
      `/messages/conversations/${conversationId}/messages?page=${page}&size=${size}`
    );
    return response.data;
  },

  // 发送私信
  sendMessage: async (data: SendMessageRequest): Promise<Message> => {
    const response = await apiClient.post("/messages/send", data);
    return response.data;
  },

  // 标记会话为已读
  markConversationAsRead: async (
    conversationId: string
  ): Promise<{ success: boolean }> => {
    const response = await apiClient.post(
      `/messages/conversations/${conversationId}/read`
    );
    return response.data;
  },

  // 删除消息
  deleteMessage: async (messageId: number): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/messages/messages/${messageId}`);
    return response.data;
  },

  // 获取未读会话数量
  getUnreadConversationsCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get(
      "/messages/conversations/unread-count"
    );
    return response.data;
  },

  // 获取未读消息总数
  getTotalUnreadMessagesCount: async (): Promise<{
    privateMessageCount: number;
    systemMessageCount: number;
    totalCount: number;
  }> => {
    const response = await apiClient.get("/messages/unread");
    return response.data;
  },

  // 创建或获取与指定用户的会话
  createOrGetConversation: async (partnerId: number): Promise<Conversation> => {
    const response = await apiClient.post(
      `/messages/conversations/users/${partnerId}`
    );
    return response.data;
  },
};

export { messageApi }; 