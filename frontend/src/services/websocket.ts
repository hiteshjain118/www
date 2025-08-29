import { config } from '../config';

export interface WebSocketMessage {
  type: 'connection' | 'chat' | 'error' | 'system' | 'message_received';
  threadId?: string;
  userId?: string;
  message?: string;
  messageId?: string;
  timestamp?: string;
  data?: any;
}

export interface WebSocketCallbacks {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private callbacks: WebSocketCallbacks = {};

  constructor(private url: string) {}

  connect(threadId: string, userId: string, callbacks: WebSocketCallbacks = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.disconnect();
      }

      this.callbacks = callbacks;

      try {
        // Create WebSocket connection with thread and user info
        const wsUrl = `${this.url}?threadId=${threadId}&userId=${userId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log(`WebSocket connected to ${this.url} for thread ${threadId}`);
          this.reconnectAttempts = 0;
          this.callbacks.onConnect?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('WebSocket message received:', message);
            this.callbacks.onMessage?.(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
          this.callbacks.onDisconnect?.();
          
          // Attempt to reconnect if not a clean close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(threadId, userId);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.callbacks.onError?.(error);
          reject(new Error('WebSocket connection failed'));
        };

        // Set connection timeout
        setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private scheduleReconnect(threadId: string, userId: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.connect(threadId, userId, this.callbacks).catch(console.error);
      }
    }, delay);
  }

  sendMessage(message: string, threadId: string, messageId?: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'chat',
        message,
        threadId,
        messageId,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'closed';
      default: return 'unknown';
    }
  }
}

// Create and export a singleton instance
export const websocketService = new WebSocketService(config.chatWebSocketUrl);
export default websocketService; 