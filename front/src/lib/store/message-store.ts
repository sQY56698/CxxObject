import { create } from 'zustand';
import { Conversation, Message, SystemMessage } from '@/types/message';
import { messageApi } from '@/lib/api/message';

interface MessageState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  systemMessages: SystemMessage[];
  unreadMessageCount: number;
  unreadSystemCount: number;
  totalUnreadCount: number;
  hasMoreMessages: boolean;
  hasMoreConversations: boolean;
  hasMoreSystemMessages: boolean;
  currentMessagePage: number;
  currentConversationsPage: number;
  
  // 会话相关
  fetchConversations: (reset?: boolean) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  fetchMessages: (reset?: boolean) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<boolean>;
  addMessage: (message: Message) => void;
  
  // 系统消息相关
  fetchSystemMessages: (reset?: boolean) => Promise<void>;
  fetchUnreadCounts: () => Promise<void>;

  // 添加新的方法
  setCurrentConversationById: (userId: number) => Promise<void>;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  systemMessages: [],
  unreadMessageCount: 0,
  unreadSystemCount: 0,
  totalUnreadCount: 0,
  hasMoreMessages: true,
  hasMoreConversations: true,
  hasMoreSystemMessages: true,
  currentMessagePage: 0,
  currentConversationsPage: 0,
  
  // 获取会话列表
  fetchConversations: async (reset = false) => {
    const { conversations, hasMoreConversations, currentConversationsPage } = get();
    if (!hasMoreConversations && !reset) return;
    
    try {
      const page = reset ? 0 : currentConversationsPage + 1;
      
      const response = await messageApi.getConversations(page, 20);
      
      set({ 
        conversations: reset ? response.content : [...conversations, ...response.content],
        hasMoreConversations: !response.last,
        currentConversationsPage: page
      });
      
    } catch (error) {
      console.error('获取会话列表失败:', error);
    }
  },
  
  // 设置当前会话
  setCurrentConversation: (conversation) => {
    set({ 
      currentConversation: conversation, 
      messages: [],
      currentMessagePage: 0,
      hasMoreMessages: true
    });
  },
  
  // 获取会话消息
  fetchMessages: async (reset = false) => {
    const { currentConversation, messages, hasMoreMessages, currentMessagePage } = get();
    if (!currentConversation || (!hasMoreMessages && !reset)) return;
    
    try {
      const page = reset ? 0 : currentMessagePage + 1;
      
      const response = await messageApi.getConversationMessages(
        currentConversation.conversationId, 
        page, 
        6
      );
      
      set({ 
        messages: reset ? response.content : [...messages, ...response.content],
        hasMoreMessages: !response.last,
        currentMessagePage: page
      });
      
    } catch (error) {
      console.error('获取会话消息失败:', error);
    }
  },
  
  // 删除消息
  deleteMessage: async (messageId) => {
    try {
      const { success } = await messageApi.deleteMessage(messageId);
      set({ messages: get().messages.filter(m => m.id !== messageId) });
      return success;
    } catch (error) {
      console.error('删除消息失败:', error);
      return false;
    }
  },
  
  // 添加新消息
  addMessage: (message) => {
    const { messages, currentConversation } = get();
    
    // 只有在当前会话中才添加消息
    if (currentConversation?.conversationId === message.conversationId) {
      // 避免重复添加
      if (!messages.some(m => m.id === message.id)) {
        set({ messages: [...messages, message] });
      }
    }
    
    // 更新会话列表
    const { conversations } = get();
    const conversationIndex = conversations.findIndex(c => c.conversationId === message.conversationId);
    
    if (conversationIndex > -1) {
      // 更新现有会话
      const updatedConversations = [...conversations];
      updatedConversations[conversationIndex] = {
        ...updatedConversations[conversationIndex],
        lastMessage: message,
        unreadCount: currentConversation?.conversationId === message.conversationId
          ? 0 // 如果正在查看该会话，则未读数为0
          : updatedConversations[conversationIndex].unreadCount + 1
      };
      
      // 将该会话移到顶部
      const conversation = updatedConversations.splice(conversationIndex, 1)[0];
      updatedConversations.unshift(conversation);
      
      set({ conversations: updatedConversations });
    } else {
      // 获取新会话信息
      get().fetchConversations(true);
    }
  },
  
  // 获取系统消息
  fetchSystemMessages: async (reset = false) => {
    const { systemMessages, hasMoreSystemMessages } = get();
    if (!hasMoreSystemMessages && !reset) return;
    
    try {
      const page = reset ? 0 : Math.floor(systemMessages.length / 20);
      const response = await messageApi.getSystemMessages(page);
      
      set({ 
        systemMessages: reset ? response.content : [...systemMessages, ...response.content],
        hasMoreSystemMessages: !response.last,
      });
    } catch (error) {
      console.error('获取系统消息失败:', error);
    }
  },
  
  // 获取未读消息数量
  fetchUnreadCounts: async () => {
    try {
      const { privateMessageCount, systemMessageCount, totalCount } =
        await messageApi.getTotalUnreadMessagesCount();
      set({ 
        unreadMessageCount: privateMessageCount,
        unreadSystemCount: systemMessageCount,
        totalUnreadCount: totalCount
      });
    } catch (error) {
      console.error('获取未读消息数量失败:', error);
    }
  },

  // 根据用户 ID 设置当前会话
  setCurrentConversationById: async (userId: number) => {
    const { conversations } = get();
    
    try {
      // 1. 先查找现有会话
      let conversation = conversations.find(c => c.partnerId === userId);
      
      if (!conversation) {
        // 2. 如果不存在，创建新会话
        conversation = await messageApi.createOrGetConversation(userId);
        
        // 3. 将新会话添加到列表
        set(state => ({
          conversations: [conversation!, ...state.conversations]
        }));
      }
      
      // 4. 设置为当前会话并重置消息列表
      set({ 
        currentConversation: conversation,
        messages: [],
        currentMessagePage: 0,
        hasMoreMessages: true
      });
      
      // 5. 获取会话消息
      await get().fetchMessages(true);
      
    } catch (error) {
      console.error('设置当前会话失败:', error);
      // 如果失败了（比如用户不存在），可以返回到会话列表
      set({ currentConversation: null });
      throw error;
    }
  },
})); 