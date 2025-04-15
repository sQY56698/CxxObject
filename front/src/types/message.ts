// 消息类型
export interface Message {
  id: number;
  conversationId: string;
  senderId: number;
  senderUsername: string;
  senderAvatar?: string;
  receiverId: number;
  receiverUsername: string;
  receiverAvatar?: string;
  content: string;
  createdAt: string;
  type: string;
}

// 会话类型
export interface Conversation {
  conversationId: string;
  partnerId: number;
  partnerUsername: string;
  partnerAvatar?: string;
  lastMessage?: Message;
  unreadCount: number;
}

// 系统消息类型
export interface SystemMessage {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// 发送消息请求
export interface SendMessageRequest {
  receiverId: number;
  content: string;
}

// 分页响应
export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  empty: boolean;
} 