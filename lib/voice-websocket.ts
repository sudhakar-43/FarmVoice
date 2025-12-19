/**
 * WebSocket client for real-time voice communication
 * Handles connection, messaging, and auto-reconnection
 */

export type MessageType =
  | "audio"
  | "text"
  | "canvas"
  | "status"
  | "error"
  | "connect"
  | "disconnect"
  | "action";

export interface VoiceMessage {
  type: MessageType;
  data: any;
  timestamp?: number;
}

export type MessageHandler = (message: VoiceMessage) => void;
export type ErrorHandler = (error: Error) => void;
export type ConnectionHandler = (connected: boolean) => void;

export class VoiceWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private isManualClose = false;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isManualClose = false;
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log("WebSocket connected");
          this.reconnectAttempts = 0;
          this.connectionHandlers.forEach((handler) => handler(true));
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: VoiceMessage = JSON.parse(event.data);
            this.messageHandlers.forEach((handler) => handler(message));
          } catch (error) {
            console.error("Failed to parse message:", error);
          }
        };

        this.ws.onerror = (event) => {
          const error = new Error("WebSocket error");
          console.error("WebSocket error:", event);
          this.errorHandlers.forEach((handler) => handler(error));
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket closed:", event.code, event.reason);
          this.connectionHandlers.forEach((handler) => handler(false));

          if (
            !this.isManualClose &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.attemptReconnect();
          }
        };

        // Timeout for connection
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error("Connection timeout"));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect to the server
   */
  private attemptReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("Reconnection failed:", error);
      });
    }, delay);
  }

  /**
   * Send a message to the server
   */
  send(message: VoiceMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected");
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  }

  /**
   * Send audio data
   */
  sendAudio(audioData: ArrayBuffer | Blob): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected");
      return false;
    }

    try {
      this.ws.send(audioData);
      return true;
    } catch (error) {
      console.error("Failed to send audio:", error);
      return false;
    }
  }

  /**
   * Send text query
   */
  sendText(text: string): boolean {
    return this.send({
      type: "text",
      data: { text },
      timestamp: Date.now(),
    });
  }

  /**
   * Close the connection
   */
  disconnect() {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Register an error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Register a connection status handler
   */
  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

/**
 * Create a voice WebSocket client
 */
export function createVoiceWebSocket(baseUrl?: string): VoiceWebSocket {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = baseUrl || window.location.host.replace(":3000", ":8000");
  const url = `${protocol}//${host}/ws/voice`;

  return new VoiceWebSocket(url);
}
