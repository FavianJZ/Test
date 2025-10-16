"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChatProvider, useChat } from "@/contexts/ChatContext";
import { FloatingChatWindow } from "./floating-chat-window";
import { ChatBubble } from "./chat-bubble";
import { useSocket } from "@/hooks/useSocket";

// Component that handles real-time updates and window management
function ChatManager({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { state, actions } = useChat();
  const { socket, isConnected, onNewMessage, onTypingIndicator, joinUser, joinConversation, leaveConversation } = useSocket({
    autoConnect: true
  });

  // Handle Socket.io connection and real-time updates
  useEffect(() => {
    if (isConnected && socket && session?.user?.id) {
      // Join user to socket
      joinUser({
        userId: session.user.id,
        name: session.user.name || 'User',
        avatar: session.user.image
      });

      // Join all active conversation rooms
      state.windows.forEach(window => {
        if (!window.isMinimized) {
          joinConversation(window.conversationId);
        }
      });
    }
  }, [isConnected, socket, session, state.windows, joinUser, joinConversation]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    const unsubscribeNewMessage = onNewMessage((data) => {
      const window = state.windows.find(w => w.conversationId === data.conversationId);

      if (window) {
        // Update unread count if message is not from current user and window is not active
        if (data.senderId !== session?.user?.id) {
          const isActiveWindow = state.activeWindowId === window.id && !window.isMinimized;
          if (!isActiveWindow) {
            // Increment unread count for this conversation
            const currentUnread = window.unreadCount;
            actions.updateUnreadCount(data.conversationId, currentUnread + 1);
          }
        }
      } else {
        // Auto-open chat for new message if user wants this behavior
        // This could be a user preference in the future
        console.log('New message for conversation not in windows:', data.conversationId);
      }
    });

    return () => {
      unsubscribeNewMessage?.();
    };
  }, [socket, isConnected, session, state.windows, state.activeWindowId, onNewMessage, actions]);

  // Listen for typing indicators
  useEffect(() => {
    if (!socket || !isConnected) return;

    const unsubscribeTypingIndicator = onTypingIndicator((data) => {
      const window = state.windows.find(w => w.conversationId === data.conversationId);
      if (window && data.user.id !== session?.user?.id) {
        // Could show typing indicator in window header or dock
        // This would require extending the window state
      }
    });

    return () => {
      unsubscribeTypingIndicator?.();
    };
  }, [socket, isConnected, session, state.windows, onTypingIndicator]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        state.windows.forEach(window => {
          leaveConversation(window.conversationId);
        });
      }
    };
  }, [socket, state.windows, leaveConversation]);

  return <>{children}</>;
}

// Main provider component that renders all chat UI elements
export function FloatingChatProvider({ children }: { children: React.ReactNode }) {
  const { state, actions } = useChat();
  const { data: session } = useSession();
  const openWindows = state.windows.filter(w => !w.isMinimized);

  console.log('=== PROVIDER RENDER ===');
  console.log('Total windows:', state.windows.length);
  console.log('Open windows:', openWindows.length);
  console.log('Open window IDs:', openWindows.map(w => w.id));

  state.windows.forEach((window, index) => {
    console.log(`Window ${index}:`, {
      id: window.id,
      conversationId: window.conversationId,
      isMinimized: window.isMinimized,
      isMaximized: window.isMaximized,
      position: window.position,
      size: window.size,
      zIndex: window.zIndex
    });
  });

  return (
    <ChatManager>
      {children}


      {/* Open Chat Windows */}
      {openWindows.map((window) => {
        console.log('Rendering window:', window.id);
        return <FloatingChatWindow key={window.id} window={window} />;
      })}

      {/* Chat Bubble - always rendered when user is logged in */}
      <ChatBubble />
    </ChatManager>
  );
}

// Hook for external components to interact with chat system
export function useFloatingChat() {
  const { state, actions } = useChat();

  return {
    // Window management
    openChat: actions.openChat,
    closeChat: actions.closeChat,
    minimizeChat: actions.minimizeChat,
    maximizeChat: actions.maximizeChat,
    restoreChat: actions.restoreChat,

    // State
    openWindows: state.windows.filter(w => !w.isMinimized),
    minimizedWindows: state.windows.filter(w => w.isMinimized),
    totalWindows: state.windows.length,
    dockOpen: state.dockOpen,

    // Unread counts
    totalUnreadCount: state.windows.reduce((total, window) => total + window.unreadCount, 0),

    // Utilities
    isChatOpen: actions.isChatOpen,
    getChatWindow: actions.getChatWindow,
    toggleDock: actions.toggleDock,
  };
}

// HOC to wrap pages with chat functionality
export function withChat<P extends object>(Component: React.ComponentType<P>) {
  return function WithChatComponent(props: P) {
    return (
      <ChatProvider>
        <FloatingChatProvider>
          <Component {...props} />
        </FloatingChatProvider>
      </ChatProvider>
    );
  };
}

export default FloatingChatProvider;