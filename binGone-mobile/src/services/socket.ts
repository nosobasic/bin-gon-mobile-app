import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './api';

export interface SocketMessage {
  id: string;
  threadId: string;
  content: string;
  messageType: 'text' | 'image';
  sender: {
    id: string;
    name: string;
    profileImageUrl?: string;
  };
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  attachmentUrl?: string;
}

export interface TypingIndicator {
  userId: string;
  threadId: string;
  typing: boolean;
}

export interface UserStatus {
  userId: string;
  status: 'online' | 'offline';
}

export interface MessagesRead {
  userId: string;
  threadId: string;
  readAt: string;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('❌ No auth token found for socket connection');
        return;
      }

      console.log('🔌 Connecting to socket server...');
      this.socket = io(BASE_URL, {
        auth: {
          token: token,
        },
        transports: ['websocket'],
        timeout: 10000,
      });

      this.setupEventListeners();
      
      return new Promise((resolve, reject) => {
        this.socket!.on('connect', () => {
          console.log('✅ Socket connected successfully');
          this.isConnected = true;
          resolve();
        });

        this.socket!.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          this.isConnected = false;
          reject(error);
        });
      });
    } catch (error) {
      console.error('❌ Socket connection failed:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }

  // Thread management
  joinThread(threadId: string): void {
    if (this.socket?.connected) {
      console.log('🔌 Joining thread:', threadId);
      this.socket.emit('join_thread', { threadId });
    }
  }

  leaveThread(threadId: string): void {
    if (this.socket?.connected) {
      console.log('🔌 Leaving thread:', threadId);
      this.socket.emit('leave_thread', { threadId });
    }
  }

  // Message sending
  sendMessage(threadId: string, content: string, messageType: 'text' | 'image' = 'text', attachmentUrl?: string): void {
    if (this.socket?.connected) {
      console.log('📤 Sending message via socket:', { threadId, content, messageType });
      this.socket.emit('send_message', {
        threadId,
        content,
        messageType,
        attachmentUrl,
      });
    }
  }

  // Typing indicators
  startTyping(threadId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { threadId });
    }
  }

  stopTyping(threadId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { threadId });
    }
  }

  // Read receipts
  markMessagesRead(threadId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_messages_read', { threadId });
    }
  }

  // Event listeners
  onMessageReceived(callback: (message: SocketMessage) => void): void {
    this.socket?.on('message_received', callback);
  }

  onTyping(callback: (data: TypingIndicator) => void): void {
    this.socket?.on('user_typing', callback);
  }

  onUserStatus(callback: (data: UserStatus) => void): void {
    this.socket?.on('user_status', callback);
  }

  onMessagesRead(callback: (data: MessagesRead) => void): void {
    this.socket?.on('messages_read', callback);
  }

  onJoinedThread(callback: (data: { threadId: string }) => void): void {
    this.socket?.on('joined_thread', callback);
  }

  onLeftThread(callback: (data: { threadId: string }) => void): void {
    this.socket?.on('left_thread', callback);
  }

  // Remove event listeners
  offMessageReceived(): void {
    this.socket?.off('message_received');
  }

  offTyping(): void {
    this.socket?.off('user_typing');
  }

  offUserStatus(): void {
    this.socket?.off('user_status');
  }

  offMessagesRead(): void {
    this.socket?.off('messages_read');
  }

  offJoinedThread(): void {
    this.socket?.off('joined_thread');
  }

  offLeftThread(): void {
    this.socket?.off('left_thread');
  }

  // Connection status
  get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

// Export singleton instance
export const socketService = new SocketService();
