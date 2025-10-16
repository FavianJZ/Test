"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Minus,
  Square,
  X,
  MessageSquare,
  MoreVertical,
  Pin
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatWindow } from "@/components/chat/chat-window";
import { FloatingChatContent } from "@/components/chat/floating-chat-content";
import { useChat } from "@/contexts/ChatContext";
import { useUserBorder } from "@/hooks/useUserBorder";
import { FlexibleAvatar } from "@/components/ui/flexible-avatar";
import { cn } from "@/lib/utils";

interface FloatingChatWindowProps {
  window: {
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
  };
}

export function FloatingChatWindow({ window }: FloatingChatWindowProps) {
  const { actions } = useChat();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Handle window dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === headerRef.current || headerRef.current?.contains(e.target as Node)) {
      e.preventDefault();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - window.position.x,
        y: e.clientY - window.position.y,
      });
      actions.bringToFront(window.id);
    }
  };

  // Handle window resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: window.size.width,
      height: window.size.height,
    });
  };

  
  // Global mouse move handler for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep window within viewport bounds
        const maxX = window.innerWidth - (window.isMaximized ? window.innerWidth : window.size.width);
        const maxY = window.innerHeight - (window.isMaximized ? window.innerHeight : window.size.height);

        const boundedX = Math.max(0, Math.min(newX, maxX));
        const boundedY = Math.max(0, Math.min(newY, maxY));

        actions.updateWindow(window.id, {
          position: { x: boundedX, y: boundedY }
        });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        const newWidth = Math.max(400, Math.min(900, resizeStart.width + deltaX));
        const newHeight = Math.max(400, Math.min(window.innerHeight - 100, resizeStart.height + deltaY));

        actions.updateWindow(window.id, {
          size: { width: newWidth, height: newHeight }
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeStart, window, actions]);

  // Get conversation display info
  const getConversationName = () => {
    if (window.conversation.type === 'GROUP') {
      return window.conversation.name || 'Group Chat';
    }
    const otherParticipant = window.conversation.participants.find(p => p.id !== window.conversationId);
    return otherParticipant?.name || 'Unknown';
  };

  const getConversationAvatar = () => {
    if (window.conversation.type === 'GROUP') {
      return {
        src: undefined,
        name: window.conversation.name || 'Group'
      };
    }
    const otherParticipant = window.conversation.participants.find(p => p.id !== window.conversationId);
    return {
      src: otherParticipant?.image,
      name: otherParticipant?.name || 'Unknown'
    };
  };

  const avatarData = getConversationAvatar();
  const borderUserId = window.conversation.type === 'DIRECT'
    ? window.conversation.participants.find(p => p.id !== window.conversationId)?.id
    : window.conversationId;
  const { border: userBorder } = useUserBorder(borderUserId || '');

  if (window.isMinimized) {
    return null; // Minimized windows are handled by the dock
  }

  const windowStyle = {
    position: 'fixed' as const,
    left: window.isMaximized ? 0 : window.position.x,
    top: window.isMaximized ? 0 : window.position.y,
    width: window.isMaximized ? '100vw' : window.size.width,
    height: window.isMaximized ? '100vh' : window.size.height,
    zIndex: window.zIndex,
    transition: isDragging ? 'none' : 'all 0.2s ease',
  };

  return (
    <div
      ref={windowRef}
      style={windowStyle}
      className={cn(
        "bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden",
        isDragging && "cursor-grabbing",
        window.isMaximized && "rounded-none"
      )}
    >
      {/* Window Header */}
      <div
        ref={headerRef}
        className={cn(
          "flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200 cursor-grab",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative">
            {window.conversation.type === 'DIRECT' ? (
              <FlexibleAvatar
                src={avatarData.src}
                name={avatarData.name}
                userBorder={userBorder}
                size="xs"
              />
            ) : (
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <MessageSquare className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          {/* Conversation name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">
                {getConversationName()}
              </h3>
              {window.unreadCount > 0 && (
                <Badge className="bg-blue-500 text-white text-xs h-5 min-w-[20px]">
                  {window.unreadCount > 99 ? '99+' : window.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-0">
          {/* Minimize button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              actions.minimizeChat(window.id);
            }}
            title="Minimize"
          >
            <Minus className="h-3 w-3" />
          </Button>

          {/* Maximize/Restore button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              if (window.isMaximized) {
                actions.restoreChat(window.id);
              } else {
                actions.maximizeChat(window.id);
              }
            }}
            title={window.isMaximized ? "Restore" : "Maximize"}
          >
            <Square className="h-3 w-3" />
          </Button>

          {/* Close button (last for easy access) */}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              actions.closeChat(window.id);
            }}
            title="Close"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Chat Content */}
      <div
        className="flex flex-col overflow-hidden"
        style={{ height: `calc(100% - 56px)` }}
      >
        <FloatingChatContent
          conversation={window.conversation}
          onClose={() => actions.closeChat(window.id)}
          onMinimize={() => actions.minimizeChat(window.id)}
          isMaximized={window.isMaximized}
        />
      </div>

      {/* Resize Handle */}
      {!window.isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400" />
        </div>
      )}
    </div>
  );
}

export default FloatingChatWindow;