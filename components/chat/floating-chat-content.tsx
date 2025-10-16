"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Circle,
  Minus,
  Square,
  User,
  Info
} from "lucide-react";
import { MessageBubble, TypingIndicator } from "./message-bubble";
import { FlexibleAvatar } from "@/components/ui/flexible-avatar";
import { useUserBorder } from "@/hooks/useUserBorder";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  isEdited: boolean;
  reactions: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  createdAt: string;
  updatedAt?: string;
  readBy: string[];
}

interface Participant {
  id: string;
  name: string;
  image?: string;
  status?: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  lastSeen?: string;
  role?: 'ADMIN' | 'MEMBER';
}

interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  participants: Participant[];
}

interface FloatingChatContentProps {
  conversation: Conversation;
  onClose: () => void;
  onMinimize: () => void;
  isMaximized: boolean;
}

export function FloatingChatContent({
  conversation,
  onClose,
  onMinimize,
  isMaximized
}: FloatingChatContentProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Participant[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Socket.io integration
  const { socket, isConnected, onNewMessage, onTypingIndicator, joinUser, joinConversation, leaveConversation, sendMessage, startTyping, stopTyping } = useSocket({
    autoConnect: true
  });

  const isOwnMessage = (senderId: string) => senderId === session?.user?.id;
  const isGroup = conversation.type === 'GROUP';

  useEffect(() => {
    if (conversation.id) {
      fetchMessages();
      markAsRead();
    }
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.io effects
  useEffect(() => {
    if (isConnected && socket && session?.user?.id) {
      // Join user to socket
      joinUser({
        userId: session.user.id,
        name: session.user.name || 'User',
        avatar: session.user.image
      });

      // Join conversation room
      joinConversation(conversation.id);
    }
  }, [isConnected, socket, conversation.id, session, joinUser, joinConversation]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages
    const unsubscribeNewMessage = onNewMessage((data) => {
      if (data.conversationId === conversation.id && data.senderId !== session?.user?.id) {
        const newMessage = {
          id: data.message.id,
          conversationId: data.message.conversationId,
          senderId: data.message.senderId,
          content: data.message.content,
          type: data.message.type,
          replyToId: data.message.replyTo,
          replyTo: data.message.replyTo,
          isEdited: data.message.isEdited,
          reactions: data.message.reactions || [],
          createdAt: data.message.createdAt,
          updatedAt: data.message.updatedAt,
          readBy: []
        };
        setMessages(prev => [...prev, newMessage]);
        markAsRead();
      }
    });

    // Listen for typing indicators
    const unsubscribeTypingIndicator = onTypingIndicator((data) => {
      if (data.conversationId === conversation.id && data.user.id !== session?.user?.id) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            const existing = prev.find(u => u.id === data.user.id);
            if (!existing) {
              return [...prev, {
                id: data.user.id,
                name: data.user.name,
                image: data.user.image,
                status: 'ONLINE',
                role: 'MEMBER'
              }];
            }
            return prev;
          } else {
            return prev.filter(u => u.id !== data.user.id);
          }
        });
      }
    });

    return () => {
      unsubscribeNewMessage?.();
      unsubscribeTypingIndicator?.();
    };
  }, [socket, isConnected, conversation.id, session, onNewMessage, onTypingIndicator]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket && conversation.id) {
        leaveConversation(conversation.id);
      }
    };
  }, [socket, conversation.id, leaveConversation]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversation.id}`);
      if (response.ok) {
        const data = await response.json();
        // Transform API data to match our interface
        const transformedMessages = data.data.map((msg: any) => ({
          id: msg.id,
          conversationId: msg.conversation_id,
          senderId: msg.sender_id,
          content: msg.content,
          type: msg.type,
          replyToId: msg.reply_to,
          replyTo: msg.replyToUser ? {
            id: msg.replyToUser.id,
            content: '',
            senderName: msg.replyToUser.name
          } : undefined,
          isEdited: msg.is_edited,
          reactions: msg.reactions || [],
          createdAt: msg.created_at,
          updatedAt: msg.updated_at,
          readBy: []
        }));
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!session?.user?.id) return;

    try {
      await fetch(`/api/chat/conversations/${conversation.id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: session.user.id
        })
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const scrollToBottom = () => {
    if (!isScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setIsScrolling(!isAtBottom);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !session?.user?.id) return;

    const messageData = {
      conversationId: conversation.id,
      senderId: session.user.id,
      content: messageInput.trim(),
      type: 'TEXT' as const,
      replyTo: replyingTo?.id
    };

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const data = await response.json();
        const newMessage = {
          id: data.data.id,
          conversationId: data.data.conversationId,
          senderId: data.data.senderId,
          content: data.data.content,
          type: data.data.type,
          replyToId: data.data.replyTo,
          replyTo: replyingTo ? {
            id: replyingTo.id,
            content: replyingTo.content,
            senderName: replyingTo.senderId === session.user.id ? 'You' : 'Other'
          } : undefined,
          isEdited: data.data.isEdited,
          reactions: [],
          createdAt: data.data.createdAt,
          updatedAt: data.data.updatedAt,
          readBy: []
        };
        setMessages(prev => [...prev, newMessage]);

        // Send real-time message via Socket.io
        if (socket && isConnected) {
          sendMessage({
            conversationId: conversation.id,
            message: newMessage,
            senderId: session.user.id
          });
        }

        setMessageInput("");
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTypingStart = () => {
    if (!session?.user?.id) return;

    // Send via Socket.io for real-time
    if (socket && isConnected) {
      startTyping({
        conversationId: conversation.id,
        user: {
          id: session.user.id,
          name: session.user.name || 'User',
          image: session.user.image
        }
      });
    }
  };

  const handleTypingStop = () => {
    if (!session?.user?.id) return;

    // Send via Socket.io for real-time
    if (socket && isConnected) {
      stopTyping({
        conversationId: conversation.id,
        user: {
          id: session.user.id,
          name: session.user.name || 'User',
          image: session.user.image
        }
      });
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: session?.user?.id,
          emoji
        })
      });

      if (response.ok) {
        const updatedMessage = await response.json();
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: updatedMessage.data.reactions } : m));
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConversationName = () => {
    if (conversation.type === 'GROUP') {
      return conversation.name;
    }
    const otherParticipant = conversation.participants.find(p => p.id !== session?.user?.id);
    return otherParticipant?.name || 'Unknown';
  };

  const getConversationAvatar = () => {
    if (conversation.type === 'GROUP') {
      return {
        src: undefined,
        name: conversation.name || 'Group'
      };
    }
    const otherParticipant = conversation.participants.find(p => p.id !== session?.user?.id);
    return {
      src: otherParticipant?.image,
      name: otherParticipant?.name || 'Unknown'
    };
  };

  const getStatusText = () => {
    if (conversation.type === 'GROUP') {
      return `${conversation.participants.length} members`;
    }
    const otherParticipant = conversation.participants.find(p => p.id !== session?.user?.id);
    if (!otherParticipant) return '';

    switch (otherParticipant.status) {
      case 'ONLINE': return 'Online';
      case 'AWAY': return 'Away';
      case 'BUSY': return 'Busy';
      default:
        if (!otherParticipant.lastSeen) return 'Offline';
        const lastSeenDate = new Date(otherParticipant.lastSeen);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const avatarData = getConversationAvatar();
  const borderUserId = conversation.type === 'DIRECT'
    ? conversation.participants.find(p => p.id !== session?.user?.id)?.id || session?.user?.id
    : session?.user?.id;
  const { border: userBorder } = useUserBorder(borderUserId);

  // Get other participant for direct messages
  const getOtherParticipant = () => {
    if (conversation.type === 'DIRECT') {
      return conversation.participants.find(p => p.id !== session?.user?.id);
    }
    return null;
  };

  const otherParticipant = getOtherParticipant();

  return (
    <div className="flex flex-col h-full">
      {/* Compact Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Avatar */}
          <div className="relative">
            {conversation.type === 'DIRECT' ? (
              <FlexibleAvatar
                src={avatarData.src}
                name={avatarData.name}
                userBorder={userBorder}
                size="sm"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {conversation.name?.charAt(0) || 'G'}
                </span>
              </div>
            )}
            {/* Status indicator for direct messages */}
            {conversation.type === 'DIRECT' && (() => {
              const otherParticipant = conversation.participants.find(p => p.id !== session?.user?.id);
              const isOnline = otherParticipant?.status === 'ONLINE';
              return (
                <div
                  className={cn(
                    "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                    isOnline ? "bg-green-500" : "bg-gray-400"
                  )}
                />
              );
            })()}
          </div>

          {/* Conversation info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">
              {getConversationName()}
            </h3>
            <p className="text-xs text-gray-600 truncate">
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1 relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
          >
            <MoreVertical className="h-3 w-3" />
          </Button>

          {/* Custom Dropdown */}
          {showDropdown && (
            <div
              className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg w-64 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-white rounded-md">
                {/* View Profile */}
                {conversation.type === 'DIRECT' && (
                  <a
                    href={`/profile/${otherParticipant?.id}`}
                    className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer rounded-t-md"
                    onClick={() => setShowDropdown(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </a>
                )}

                {/* Contact Info */}
                <button
                  className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left"
                  onClick={() => {
                    setShowDropdown(false);
                    // TODO: Show contact info modal
                  }}
                >
                  <Info className="h-4 w-4 mr-2" />
                  Contact Info
                </button>

                {/* Separator */}
                <div className="border-t border-gray-200" />

                {/* Minimize */}
                <button
                  className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left"
                  onClick={() => {
                    setShowDropdown(false);
                    onMinimize();
                  }}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Minimize
                </button>

                {/* Mute Notifications */}
                <button
                  className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left rounded-b-md"
                  onClick={() => {
                    setShowDropdown(false);
                    // TODO: Toggle mute notifications
                  }}
                >
                  <Circle className="h-4 w-4 mr-2" />
                  Mute Notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea
          ref={scrollAreaRef}
          className="h-full"
          onScroll={handleScroll}
        >
          <div className="p-3 space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const sender = conversation.participants.find(p => p.id === message.senderId);
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      sender={sender}
                      isOwn={isOwnMessage(message.senderId)}
                      isGroup={isGroup}
                      onReply={handleReply}
                      onReaction={handleReaction}
                    />
                  );
                })}

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <TypingIndicator users={typingUsers} />
                )}

                {/* Scroll to bottom ref */}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Chat Input */}
      <div className="p-3 border-t bg-white">
        {/* Reply preview */}
        {replyingTo && (
          <div className="mb-2 p-2 bg-blue-50 border-l-2 border-blue-300 rounded text-xs">
            <div className="flex items-center justify-between">
              <div className="text-blue-600 font-medium">
                Replying to {replyingTo.senderId === session?.user?.id ? 'yourself' : 'other person'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => setReplyingTo(null)}
              >
                ×
              </Button>
            </div>
            <div className="text-gray-700 truncate mt-1">
              {replyingTo.content}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={handleTypingStart}
              onBlur={handleTypingStop}
              placeholder="Type a message..."
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              title="Add emoji"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            size="sm"
            className="h-8 px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Simple Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 right-3 z-50 bg-white border rounded-lg shadow-lg p-2">
            <div className="grid grid-cols-6 gap-1">
              {['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '❤️', '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏'].map((emoji) => (
                <button
                  key={emoji}
                  className="w-8 h-8 rounded hover:bg-gray-100 text-sm flex items-center justify-center"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FloatingChatContent;