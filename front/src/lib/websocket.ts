import SockJS from 'sockjs-client';
import { Stomp, CompatClient, IMessage, StompHeaders } from '@stomp/stompjs';
import { Message, SystemMessage } from '@/types/message';

// 定义不同类型的消息
export interface MessageTypes {
  message: Message;       // 私信消息 
  system: SystemMessage;  // 系统消息
}

// 消息订阅配置
export interface MessageSubscription<K extends keyof MessageTypes> {
  type: K;                       // 消息类型
  needAuth: boolean;             // 是否需要认证
  formatter: (userId: number) => string; // 路径格式化函数
}

class WebSocketService {
  private client: CompatClient | null = null;
  private subscriptions: {
    [key: string]: { id: string; unsubscribe: () => void };
  } = {};
  private connected: boolean = false;
  private messageHandlers: {
    [K in keyof MessageTypes]?: ((message: MessageTypes[K]) => void)[];
  } = {};
  private systemMessageHandlers: {
    [key: string]: ((message: SystemMessage) => void)[];
  } = {};
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS: number = 5;
  private userId: number | null = null;

  // 可订阅的消息类型配置
  private readonly SUBSCRIPTIONS: {
    [K in keyof MessageTypes]: MessageSubscription<K>;
  } = {
    system: {
      type: "system",
      needAuth: false,
      formatter: (userId) => `/user/${userId}/system`,
    },
    message: {
      type: "message",
      needAuth: true,
      formatter: (userId) => `/user/${userId}/message`,
    },
  };

  // 连接WebSocket
  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.client && this.connected) {
        resolve(true);
        return;
      }

      try {
        // 使用相对路径
        const socket = new SockJS("/ws");
        this.client = Stomp.over(socket);

        // 禁用调试日志以减少控制台噪音
        this.client.debug = () => {};

        // 不需要认证信息就能连接
        this.client.connect(
          {}, // 空headers对象
          () => {
            console.log("WebSocket连接成功");
            this.connected = true;
            this.reconnectAttempts = 0;
            resolve(true);
          },
          (error) => {
            console.error("WebSocket连接错误:", error);
            this.connected = false;

            if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
              this.scheduleReconnect();
            } else {
              reject(new Error("WebSocket连接失败，已达到最大重试次数"));
            }
          }
        );
      } catch (error) {
        console.error("创建WebSocket连接时出错:", error);
        this.connected = false;
        reject(error);
      }
    });
  }

  // 断开连接
  disconnect(): void {
    if (this.client && this.connected) {
      // 取消所有订阅
      Object.values(this.subscriptions).forEach((sub) => {
        if (sub?.unsubscribe) {
          sub.unsubscribe();
        }
      });

      this.subscriptions = {};
      this.client.disconnect();
      this.connected = false;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 通用订阅方法
   * @param type 消息类型
   * @param userId 用户ID
   * @param token 认证令牌(可选)
   */
  subscribe<K extends keyof MessageTypes>(
    type: K,
    userId: number,
    token?: string
  ): boolean {
    if (!this.client || !this.connected) {
      console.warn(`WebSocket未连接，无法订阅${type}消息`);
      return false;
    }

    const config = this.SUBSCRIPTIONS[type];
    if (!config) {
      console.error(`未知的消息类型: ${type}`);
      return false;
    }

    // 需要认证但没有提供token
    if (config.needAuth && !token) {
      console.warn(`订阅${type}消息需要认证`);
      return false;
    }

    // 格式化订阅路径
    const destination = config.formatter(userId)

    // 如果已经订阅，先取消
    this.unsubscribe(destination);

    // 设置headers
    const headers =
      config.needAuth && token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const subscription = this.client.subscribe(
        destination,
        (message: IMessage) => {
          try {
            const payload = JSON.parse(message.body);
            this.notifyHandlers(type, payload);
          } catch (error) {
            console.error(`解析${type}消息失败:`, error);
          }
        },
        headers as StompHeaders
      );

      this.subscriptions[destination] = {
        id: subscription.id,
        unsubscribe: () => subscription.unsubscribe(),
      };

      return true;
    } catch (error) {
      console.error(`订阅${type}消息失败:`, error);
      return false;
    }
  }

  /**
   * 取消订阅
   * @param destination 订阅路径
   */
  unsubscribe(destination: string): void {
    if (this.subscriptions[destination]) {
      this.subscriptions[destination].unsubscribe();
      delete this.subscriptions[destination];
    }
  }

  /**
   * 添加消息处理器
   * @param type 消息类型
   * @param handler 处理函数
   */
  addMessageHandler<K extends keyof MessageTypes>(
    type: K,
    handler: (message: MessageTypes[K]) => void
  ): void {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
    }
    this.messageHandlers[type]?.push(handler as any);
  }

  /**
   * 移除消息处理器
   * @param type 消息类型
   * @param handler 处理函数
   */
  removeMessageHandler<K extends keyof MessageTypes>(
    type: K,
    handler: (message: MessageTypes[K]) => void
  ): void {
    if (this.messageHandlers[type]) {
      this.messageHandlers[type] = this.messageHandlers[type]?.filter(
        (h) => h !== handler
      ) as any[];
    }
  }

  /**
   * 发送私信消息
   */
  sendMessage(
    message: { senderId: number; receiverId: number; content: string },
    token: string
  ): boolean {
    if (!this.client || !this.connected) {
      console.warn("WebSocket未连接，无法发送消息");
      return false;
    }

    if (!token) {
      console.warn("发送消息需要认证");
      return false;
    }

    try {
      this.client.send(
        "/app/chat",
        { Authorization: `Bearer ${token}` },
        JSON.stringify(message)
      );
      return true;
    } catch (error) {
      console.error("发送消息失败:", error);
      return false;
    }
  }

  // 通知所有处理器
  private notifyHandlers<K extends keyof MessageTypes>(
    type: K,
    message: MessageTypes[K]
  ): void {
    const handlers = this.messageHandlers[type];
    if (handlers && handlers.length > 0) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`${type}消息处理器错误:`, error);
        }
      });
    }
  }

  // 计划重连
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectTimer = setTimeout(() => {
      console.log(
        `尝试重新连接WebSocket (${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})...`
      );
      this.connect().catch(() => {});
    }, delay);
  }

  // 检查连接状态
  isConnected(): boolean {
    return this.connected;
  }
}

// 创建单例
const webSocketService = new WebSocketService();
export default webSocketService; 