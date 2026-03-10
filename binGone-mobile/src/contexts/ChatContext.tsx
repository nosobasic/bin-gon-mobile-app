import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { socketService, SocketMessage, TypingIndicator, UserStatus, MessagesRead } from '../services/socket';
import { apiClient, ChatThread, ChatMessage } from '../services/api';
import { useAuth } from './AuthContext';

interface ChatContextType {
  // Connection state
  isConnected: boolean;
  
  // Threads
  threads: ChatThread[];
  loadingThreads: boolean;
  
  // Current thread
  currentThread: ChatThread | null;
  messages: ChatMessage[];
  loadingMessages: boolean;
  
  // Typing indicators
  typingUsers: { [threadId: string]: string[] };
  
  // Online users
  onlineUsers: string[];
  
  // Actions
  connectSocket: () => Promise<void>;
  disconnectSocket: () => void;
  clearChatData: () => void;
  loadThreads: () => Promise<void>;
  refreshThreads: () => Promise<void>;
  joinThread: (threadId: string) => Promise<void>;
  leaveCurrentThread: () => void;
  sendMessage: (content: string, messageType?: 'text' | 'image', attachmentUrl?: string) => Promise<void>;
  loadMessages: (threadId: string, page?: number) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  markMessagesRead: () => void;
  createThread: (listingId: string) => Promise<ChatThread>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  
  // Threads
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [threadsLoaded, setThreadsLoaded] = useState(false);
  
  // Current thread and messages
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Typing indicators
  const [typingUsers, setTypingUsers] = useState<{ [threadId: string]: string[] }>({});
  
  // Online users
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Socket connection functions
  const connectSocket = useCallback(async (): Promise<void> => {
    try {
      await socketService.connect();
      setIsConnected(true);
      console.log('✅ Chat context: Socket connected');
    } catch (error) {
      console.error('❌ Chat context: Socket connection failed:', error);
      setIsConnected(false);
    }
  }, []);

  const disconnectSocket = useCallback((): void => {
    socketService.disconnect();
    setIsConnected(false);
    setCurrentThread(null);
    setMessages([]);
    setTypingUsers({});
    setOnlineUsers([]);
  }, []);

  const clearChatData = useCallback((): void => {
    console.log('🧹 Clearing all chat data...');
    setThreads([]);
    setThreadsLoaded(false);
    setCurrentThread(null);
    setMessages([]);
    setTypingUsers({});
    setOnlineUsers([]);
    setLoadingThreads(false);
    setLoadingMessages(false);
  }, []);

  // Connect socket when user is authenticated
  useEffect(() => {
    console.log('🔄 ChatContext user effect triggered:', {
      isAuthenticated,
      userId: user?.id,
      userName: user?.name,
      userEmail: user?.email,
      userAccountType: user?.accountType
    });
    
    if (isAuthenticated && user) {
      console.log('✅ User authenticated, connecting to chat...');
      connectSocket();
    } else {
      console.log('❌ User not authenticated, disconnecting...');
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user, connectSocket, disconnectSocket]);

  // Setup socket event listeners
  useEffect(() => {
    const setupSocketListeners = (): void => {
      // Message received
      socketService.onMessageReceived((message: SocketMessage) => {
        console.log('📨 New message received');
        
        // Add to messages if it's for current thread
        if (currentThread && message.threadId === currentThread.id) {
          setMessages(prev => [...prev, {
            id: message.id,
            content: message.content,
            messageType: message.messageType,
            sender: message.sender,
            status: message.status,
            createdAt: message.createdAt,
          }]);
        }
        
        // Update thread last message
        setThreads(prev => prev.map(thread => {
          if (thread.id === message.threadId) {
            const isOwnMessage = message.sender.id === user?.id;
            const isCurrentThread = thread.id === currentThread?.id;
            
            // Calculate new unread count
            let newUnreadCount;
            if (isCurrentThread) {
              newUnreadCount = 0; // Viewing thread
            } else if (isOwnMessage) {
              newUnreadCount = thread.unreadCount; // Own message, no change
            } else {
              newUnreadCount = thread.unreadCount + 1; // Other's message, increment
            }
            
            return {
              ...thread,
              lastMessage: {
                content: message.content,
                sender: message.sender,
                createdAt: message.createdAt,
              },
              lastMessageAt: message.createdAt,
              unreadCount: newUnreadCount,
            };
          }
          return thread;
        }));
      });

      // Typing indicators
      socketService.onTyping((data: TypingIndicator) => {
        setTypingUsers(prev => {
          const threadTyping = prev[data.threadId] || [];
          if (data.typing) {
            // Add user to typing list if not already there
            if (!threadTyping.includes(data.userId)) {
              return {
                ...prev,
                [data.threadId]: [...threadTyping, data.userId],
              };
            }
          } else {
            // Remove user from typing list
            return {
              ...prev,
              [data.threadId]: threadTyping.filter(id => id !== data.userId),
            };
          }
          return prev;
        });
      });

      // User status
      socketService.onUserStatus((data: UserStatus) => {
        setOnlineUsers(prev => {
          if (data.status === 'online') {
            return prev.includes(data.userId) ? prev : [...prev, data.userId];
          } else {
            return prev.filter(id => id !== data.userId);
          }
        });
      });

      // Messages read
      socketService.onMessagesRead((data: MessagesRead) => {
        if (currentThread && data.threadId === currentThread.id) {
          setMessages(prev => prev.map(msg => ({
            ...msg,
            status: msg.status === 'delivered' ? 'read' : msg.status,
            readAt: data.readAt,
          })));
        }
      });
    };

    const cleanupSocketListeners = (): void => {
      socketService.offMessageReceived();
      socketService.offTyping();
      socketService.offUserStatus();
      socketService.offMessagesRead();
    };

    if (isConnected) {
      setupSocketListeners();
    }

    return () => {
      cleanupSocketListeners();
    };
  }, [isConnected, currentThread, user]);

  const loadThreads = useCallback(async (): Promise<void> => {
    // Simple loading - no automatic checks
    if (!user) {
      console.log('❌ No user found, cannot load threads');
      return;
    }

    try {
      setLoadingThreads(true);
      console.log('🔄 Loading chat threads for user:', user.name);
      const allThreads = await apiClient.getChatThreads();
      
      // Filter threads to only show threads where the current user is either donor or receiver
      const userThreads = allThreads.filter(thread => {
        const isDonor = thread.donor?.name === user.name;
        const isReceiver = thread.receiver?.name === user.name;
        return isDonor || isReceiver;
      });
      
      setThreads(userThreads);
      setThreadsLoaded(true);
      console.log('✅ Loaded user-specific threads:', userThreads.length);
    } catch (error) {
      console.error('❌ Failed to load threads:', error);
    } finally {
      setLoadingThreads(false);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshThreads = useCallback(async (): Promise<void> => {
    if (!user) {
      console.log('❌ No user found, cannot refresh threads');
      return;
    }
    
    try {
      setLoadingThreads(true);
      console.log('🔄 Refreshing chat threads for user:', user.name);
      const allThreads = await apiClient.getChatThreads();
      
      // Filter threads to only show threads where the current user is either donor or receiver
      const userThreads = allThreads.filter(thread => {
        const isDonor = thread.donor?.name === user.name;
        const isReceiver = thread.receiver?.name === user.name;
        return isDonor || isReceiver;
      });
      
      setThreads(userThreads);
      setThreadsLoaded(true);
      console.log('✅ Refreshed user-specific threads:', userThreads.length);
    } catch (error) {
      console.error('❌ Failed to refresh threads:', error);
    } finally {
      setLoadingThreads(false);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMessages = useCallback(async (threadId: string, page = 1): Promise<void> => {
    try {
      setLoadingMessages(true);
      console.log('🔄 Loading messages for thread:', threadId);
      
      const { messages: messagesData } = await apiClient.getChatMessages(threadId, page);
      
      if (page === 1) {
        setMessages(messagesData);
      } else {
        setMessages(prev => [...messagesData, ...prev]);
      }
      
      console.log('✅ Loaded messages:', messagesData.length);
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const markMessagesRead = useCallback((): void => {
    if (currentThread && isConnected) {
      socketService.markMessagesRead(currentThread.id);
      
      // Update local thread unread count
      setThreads(prev => prev.map(thread => 
        thread.id === currentThread.id 
          ? { ...thread, unreadCount: 0 }
          : thread
      ));
    }
  }, [currentThread, isConnected]);

  const sendMessage = useCallback(async (content: string, messageType: 'text' | 'image' = 'text', attachmentUrl?: string): Promise<void> => {
    if (!currentThread || !content.trim()) {
      return;
    }

    try {
      console.log('📤 Sending message:', { content, messageType });
      
      // Send via socket for real-time delivery
      if (isConnected) {
        socketService.sendMessage(currentThread.id, content, messageType, attachmentUrl);
      } else {
        // Fallback to REST API
        console.log('📤 Socket not connected, using REST API fallback');
        const message = await apiClient.sendMessage(currentThread.id, {
          content,
          messageType,
          attachmentUrl,
        });
        
        // Add to local messages
        setMessages(prev => [...prev, message]);
      }
      
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    }
  }, [currentThread, isConnected]);

  const startTyping = useCallback((): void => {
    if (currentThread && isConnected) {
      socketService.startTyping(currentThread.id);
    }
  }, [currentThread, isConnected]);

  const stopTyping = useCallback((): void => {
    if (currentThread && isConnected) {
      socketService.stopTyping(currentThread.id);
    }
  }, [currentThread, isConnected]);

  const joinThread = useCallback(async (threadId: string): Promise<void> => {
    try {
      console.log('🔄 Joining thread:', threadId);
      
      // Find thread in loaded threads (get fresh reference each time)
      setThreads(currentThreads => {
        const thread = currentThreads.find(t => t.id === threadId);
        if (!thread) {
          console.error('❌ Thread not found:', threadId);
          return currentThreads;
        }
        
        // Leave current thread if any
        if (currentThread) {
          socketService.leaveThread(currentThread.id);
        }
        
        // Set current thread
        setCurrentThread(thread);
        
        // Join via socket
        if (isConnected) {
          socketService.joinThread(threadId);
        }
        
        return currentThreads;
      });
      
      // Load messages
      await loadMessages(threadId);
      
      // Mark messages as read
      markMessagesRead();
      
    } catch (error) {
      console.error('❌ Failed to join thread:', error);
    }
  }, [currentThread, isConnected, loadMessages, markMessagesRead]);

  const leaveCurrentThread = useCallback((): void => {
    if (currentThread && isConnected) {
      socketService.leaveThread(currentThread.id);
    }
    setCurrentThread(null);
    setMessages([]);
  }, [currentThread, isConnected]);

  const createThread = useCallback(async (listingId: string): Promise<ChatThread> => {
    try {
      console.log('🔄 Creating thread for listing:', listingId);
      const thread = await apiClient.createChatThread(listingId);
      
      // Add to threads list
      setThreads(prev => [thread, ...prev]);
      
      console.log('✅ Thread created:', thread.id);
      return thread;
    } catch (error) {
      console.error('❌ Failed to create thread:', error);
      throw error;
    }
  }, []);

  const value: ChatContextType = {
    isConnected,
    threads,
    loadingThreads,
    currentThread,
    messages,
    loadingMessages,
    typingUsers,
    onlineUsers,
    connectSocket,
    disconnectSocket,
    loadThreads,
    refreshThreads,
    joinThread,
    leaveCurrentThread,
    sendMessage,
    loadMessages,
    startTyping,
    stopTyping,
    markMessagesRead,
    createThread,
    clearChatData,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
