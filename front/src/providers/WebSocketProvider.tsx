'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUserStore } from '@/lib/store/user-store';
import webSocketService, { MessageTypes } from '@/lib/websocket';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: { senderId: number; receiverId: number; content: string }) => boolean;
  addMessageHandler: <K extends keyof MessageTypes>(
    type: K,
    handler: (message: MessageTypes[K]) => void
  ) => void;
  removeMessageHandler: <K extends keyof MessageTypes>(
    type: K,
    handler: (message: MessageTypes[K]) => void
  ) => void;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const { user, isLoggedIn } = useUserStore();
  const [token, setToken] = useState<string | null>(null);

  // 在客户端获取token
  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  // 初始化连接
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const connected = await webSocketService.connect();
        setIsConnected(connected);
      } catch (error) {
        console.error('WebSocket连接失败:', error);
        setIsConnected(false);
      }
    };

    initializeConnection();

    return () => {
      webSocketService.disconnect();
      setIsConnected(false);
    };
  }, []);

  // 监听连接状态变化
  useEffect(() => {
    const checkConnectionInterval = setInterval(() => {
      const connected = webSocketService.isConnected();
      if (connected !== isConnected) {
        setIsConnected(connected);
      }
    }, 3000);

    return () => clearInterval(checkConnectionInterval);
  }, [isConnected]);

  // 处理用户登录变化，订阅消息
  useEffect(() => {
    if (!isConnected) return;

    if (isLoggedIn && user) {
      // 订阅系统消息，不需要认证
      webSocketService.subscribe('system', user.userId);
      
      // 订阅私信消息，需要认证
      if (token) {
        webSocketService.subscribe('message', user.userId, token);
      }
    }
  }, [isLoggedIn, user, token, isConnected]);

  const contextValue: WebSocketContextType = {
    isConnected,
    sendMessage: (message) => webSocketService.sendMessage(message, token || ''),
    addMessageHandler: webSocketService.addMessageHandler.bind(webSocketService),
    removeMessageHandler: webSocketService.removeMessageHandler.bind(webSocketService),
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

// 自定义 Hook 用于在组件中使用 WebSocket
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket 必须在 WebSocketProvider 内使用');
  }
  return context;
}; 