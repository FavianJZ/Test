"use client";

import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

// Types
export interface ChatWindow {
  id: string;
  conversationId: string;
  conversation: {
    id: string;
    type: 'DIRECT' | 'GROUP';
    name?: string;
    participants: Array<{
      id: string;
      name: string;
      image?: string;
    }>;
  };
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  unreadCount: number;
  isActive: boolean;
}

interface ChatWindowState {
  windows: ChatWindow[];
  dockOpen: boolean;
  highestZIndex: number;
  activeWindowId: string | null;
  windowCounter: number;
}

type ChatWindowAction =
  | { type: "ADD_WINDOW"; payload: Omit<ChatWindow, "zIndex" | "windowCounter"> }
  | { type: "REMOVE_WINDOW"; payload: string }
  | { type: "UPDATE_WINDOW"; payload: { id: string; updates: Partial<ChatWindow> } }
  | { type: "MINIMIZE_WINDOW"; payload: string }
  | { type: "MAXIMIZE_WINDOW"; payload: string }
  | { type: "RESTORE_WINDOW"; payload: string }
  | { type: "SET_ACTIVE_WINDOW"; payload: string }
  | { type: "BRING_TO_FRONT"; payload: string }
  | { type: "TOGGLE_DOCK" }
  | { type: "UPDATE_UNREAD_COUNT"; payload: { conversationId: string; count: number } }
  | { type: "CLEAR_UNREAD"; payload: string }
  | { type: "LOAD_WINDOWS"; payload: ChatWindow[] };

// Initial state
const initialState: ChatWindowState = {
  windows: [],
  dockOpen: false,
  highestZIndex: 1000,
  activeWindowId: null,
  windowCounter: 0,
};

// Reducer
function chatWindowReducer(state: ChatWindowState, action: ChatWindowAction): ChatWindowState {
  switch (action.type) {
    case "ADD_WINDOW": {
      const newWindow: ChatWindow = {
        ...action.payload,
        zIndex: state.highestZIndex + 1,
      };

      // Ensure position is not null, use default if needed
      if (!newWindow.position || newWindow.position.x === null || newWindow.position.y === null) {
        const basePosition = { x: 100, y: 100 };
        const offset = 30;
        const windowIndex = state.windows.length;

        newWindow.position = {
          x: basePosition.x + (windowIndex * offset),
          y: basePosition.y + (windowIndex * offset)
        };
      } else {
        // Calculate position to avoid overlap
        const existingWindows = state.windows;
        const basePosition = { x: 100, y: 100 };
        const offset = 30;

        let position = { ...newWindow.position };
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          const hasOverlap = existingWindows.some(window =>
            Math.abs(window.position.x - position.x) < 50 &&
            Math.abs(window.position.y - position.y) < 50
          );

          if (!hasOverlap) break;

          position.x += offset;
          position.y += offset;
          attempts++;
        }

        newWindow.position = position;
      }

      return {
        ...state,
        windows: [...state.windows, newWindow],
        highestZIndex: state.highestZIndex + 1,
        activeWindowId: newWindow.id,
      };
    }

    case "REMOVE_WINDOW":
      return {
        ...state,
        windows: state.windows.filter(w => w.id !== action.payload),
        activeWindowId: state.activeWindowId === action.payload ? null : state.activeWindowId,
      };

    case "UPDATE_WINDOW":
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload.id
            ? { ...w, ...action.payload.updates }
            : w
        ),
      };

    case "MINIMIZE_WINDOW":
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload
            ? { ...w, isMinimized: true, isMaximized: false }
            : w
        ),
      };

    case "MAXIMIZE_WINDOW":
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload
            ? { ...w, isMinimized: false, isMaximized: true }
            : w
        ),
      };

    case "RESTORE_WINDOW":
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload
            ? { ...w, isMinimized: false, isMaximized: false }
            : w
        ),
      };

    case "SET_ACTIVE_WINDOW":
      return {
        ...state,
        activeWindowId: action.payload,
      };

    case "BRING_TO_FRONT": {
      const newZIndex = state.highestZIndex + 1;
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload
            ? { ...w, zIndex: newZIndex }
            : w
        ),
        highestZIndex: newZIndex,
        activeWindowId: action.payload,
      };
    }

    case "TOGGLE_DOCK":
      return {
        ...state,
        dockOpen: !state.dockOpen,
      };

    case "UPDATE_UNREAD_COUNT":
      return {
        ...state,
        windows: state.windows.map(w =>
          w.conversationId === action.payload.conversationId
            ? { ...w, unreadCount: action.payload.count }
            : w
        ),
      };

    case "CLEAR_UNREAD":
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.payload
            ? { ...w, unreadCount: 0 }
            : w
        ),
      };

    case "LOAD_WINDOWS":
      return {
        ...state,
        windows: action.payload,
        highestZIndex: Math.max(...action.payload.map(w => w.zIndex), 1000),
      };

    default:
      return state;
  }
}

// Context
interface ChatContextType {
  state: ChatWindowState;
  actions: {
    openChat: (conversationId: string, conversation: ChatWindow['conversation']) => void;
    closeChat: (windowId: string) => void;
    minimizeChat: (windowId: string) => void;
    maximizeChat: (windowId: string) => void;
    restoreChat: (windowId: string) => void;
    setActiveChat: (windowId: string) => void;
    bringToFront: (windowId: string) => void;
    updateWindow: (windowId: string, updates: Partial<ChatWindow>) => void;
    toggleDock: () => void;
    updateUnreadCount: (conversationId: string, count: number) => void;
    clearUnread: (windowId: string) => void;
    isChatOpen: (conversationId: string) => boolean;
    getChatWindow: (conversationId: string) => ChatWindow | undefined;
  };
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider
interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatWindowReducer, initialState);
  const { data: session } = useSession();

  // Load saved windows from localStorage on mount
  useEffect(() => {
    if (session?.user?.id) {
      try {
        const savedWindows = localStorage.getItem(`chat_windows_${session.user.id}`);
        if (savedWindows) {
          const windows = JSON.parse(savedWindows);
          dispatch({ type: "LOAD_WINDOWS", payload: windows });
        }
      } catch (error) {
        console.error('Error loading saved chat windows:', error);
      }
    }
  }, [session]);

  // Save windows to localStorage whenever they change
  useEffect(() => {
    if (session?.user?.id) {
      try {
        localStorage.setItem(
          `chat_windows_${session.user.id}`,
          JSON.stringify(state.windows)
        );
      } catch (error) {
        console.error('Error saving chat windows:', error);
      }
    }
  }, [state.windows, session]);

  const actions: ChatContextType['actions'] = {
    openChat: (conversationId: string, conversation: ChatWindow['conversation']) => {
      // Check if chat is already open
      const existingWindow = state.windows.find(w => w.conversationId === conversationId);
      if (existingWindow) {
        // If window exists but has invalid position, fix it
        if (!existingWindow.position || existingWindow.position.x === null || existingWindow.position.y === null || existingWindow.isMinimized) {
          console.log('Fixing existing window position and state:', existingWindow.id);
          dispatch({
            type: "UPDATE_WINDOW",
            payload: {
              id: existingWindow.id,
              updates: {
                position: { x: 100 + (state.windows.length * 30), y: 100 + (state.windows.length * 30) },
                isMinimized: false
              }
            }
          });
        }
        // Bring existing window to front
        dispatch({ type: "BRING_TO_FRONT", payload: existingWindow.id });
        return;
      }

      const newWindow: Omit<ChatWindow, "zIndex"> = {
        id: `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversationId,
        conversation,
        position: { x: 0, y: 0 }, // Will be calculated in reducer
        size: { width: 450, height: 500 },
        isMinimized: false,
        isMaximized: false,
        unreadCount: 0,
        isActive: true,
      };

      dispatch({ type: "ADD_WINDOW", payload: newWindow });
    },

    closeChat: (windowId: string) => {
      dispatch({ type: "REMOVE_WINDOW", payload: windowId });
    },

    minimizeChat: (windowId: string) => {
      dispatch({ type: "MINIMIZE_WINDOW", payload: windowId });
    },

    maximizeChat: (windowId: string) => {
      dispatch({ type: "MAXIMIZE_WINDOW", payload: windowId });
    },

    restoreChat: (windowId: string) => {
      dispatch({ type: "RESTORE_WINDOW", payload: windowId });
    },

    setActiveChat: (windowId: string) => {
      dispatch({ type: "SET_ACTIVE_WINDOW", payload: windowId });
    },

    bringToFront: (windowId: string) => {
      dispatch({ type: "BRING_TO_FRONT", payload: windowId });
    },

    updateWindow: (windowId: string, updates: Partial<ChatWindow>) => {
      dispatch({ type: "UPDATE_WINDOW", payload: { id: windowId, updates } });
    },

    toggleDock: () => {
      dispatch({ type: "TOGGLE_DOCK" });
    },

    updateUnreadCount: (conversationId: string, count: number) => {
      dispatch({ type: "UPDATE_UNREAD_COUNT", payload: { conversationId, count } });
    },

    clearUnread: (windowId: string) => {
      dispatch({ type: "CLEAR_UNREAD", payload: windowId });
    },

    isChatOpen: (conversationId: string) => {
      return state.windows.some(w => w.conversationId === conversationId && !w.isMinimized);
    },

    getChatWindow: (conversationId: string) => {
      return state.windows.find(w => w.conversationId === conversationId);
    },
  };

  return (
    <ChatContext.Provider value={{ state, actions }}>
      {children}
    </ChatContext.Provider>
  );
}

// Hook
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

export default ChatContext;