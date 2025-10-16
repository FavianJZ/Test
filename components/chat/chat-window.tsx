"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MoreVertical,
  Search,
  Info,
  Pin,
  Users,
  Settings,
  User,
  Circle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MessageBubble, TypingIndicator } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { FlexibleAvatar } from "@/components/ui/flexible-avatar";
import { useUserBorder } from "@/hooks/useUserBorder";
import { useSocket } from "@/hooks/useSocket";
import { useChatNotifications } from "@/hooks/useChatNotifications";
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
  description?: string;
  participantIds: string[];
  participants: Participant[];
  isPinned: boolean;
  isMuted: boolean;
  createdAt: string;
}

interface ChatWindowProps {
  conversation: Conversation;
  onBack?: () => void;
  onConversationInfo?: () => void;
}

export function ChatWindow({
  conversation,
  onBack,
  onConversationInfo
}: ChatWindowProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Participant[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Socket.io integration
  const { socket, isConnected, onNewMessage, onTypingIndicator, joinUser, joinConversation, leaveConversation, sendMessage, startTyping, stopTyping } = useSocket({
    autoConnect: true
  });

  // Chat notifications
  useChatNotifications({
    enabled: true,
    showOnlyWhenInactive: true
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket && conversation.id) {
        leaveConversation(conversation.id);
      }
    };
  }, [socket, conversation.id, leaveConversation]);

  useEffect(() => {
    // Set up WebSocket connection for real-time updates
    const handleNewMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      if (message.conversationId === conversation.id) {
        setMessages(prev => [...prev, message]);
        if (message.senderId !== session?.user?.id) {
          markAsRead();
        }
      }
    };

    const handleTypingIndicator = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.conversationId === conversation.id && data.isTyping) {
        setTypingUsers(prev => {
          const existing = prev.find(u => u.id === data.userId);
          if (!existing) {
            const user = conversation.participants.find(p => p.id === data.userId);
            if (user) {
              return [...prev, user];
            }
          }
          return prev;
        });
      } else {
        setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
      }
    };

    // In a real implementation, you'd set up WebSocket listeners here
    // For now, we'll simulate with polling
    const interval = setInterval(() => {
      // Simulate real-time updates
    }, 5000);

    return () => clearInterval(interval);
  }, [conversation.id, session?.user?.id]);

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
            content: '', // Would need to fetch the original message
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

  const handleSendMessage = async (content: string, type: 'TEXT' | 'IMAGE' | 'FILE', file?: File) => {
    if (!session?.user?.id) return;

    try {
      const messageData = {
        conversationId: conversation.id,
        senderId: session.user.id,
        content,
        type,
        replyTo: replyingTo?.id
      };

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
      }

      setReplyingTo(null);
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

    // Also send via API for persistence
    try {
      fetch('/api/chat/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: conversation.id,
          userId: session.user.id,
          isTyping: true
        })
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
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

    // Also send via API for persistence
    try {
      fetch('/api/chat/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: conversation.id,
          userId: session.user.id,
          isTyping: false
        })
      });
    } catch (error) {
      console.error('Error stopping typing indicator:', error);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleEdit = (messageId: string) => {
    // Implement message editing
  };

  const handleDelete = async (messageId: string) => {
    try {
      await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ emoji })
      });

      if (response.ok) {
        const updatedMessage = await response.json();
        setMessages(prev => prev.map(m => m.id === messageId ? updatedMessage : m));
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
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

  return (
    <Card className="h-full flex flex-col">
      {/* Chat Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button for mobile */}
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="md:hidden"
              >
                ←
              </Button>
            )}

            {/* Avatar */}
            <div className="relative">
              {conversation.type === 'DIRECT' ? (
                <FlexibleAvatar
                  src={avatarData.src}
                  name={avatarData.name}
                  userBorder={userBorder}
                  size="md"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Conversation info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg truncate">
                  {getConversationName()}
                </CardTitle>
                {conversation.isPinned && (
                  <Pin className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">
                {getStatusText()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Search className="h-4 w-4" />
            </Button>
            {conversation.type === 'DIRECT' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {/* User Profile Section */}
                  <DropdownMenuLabel className="flex items-center gap-3 p-4">
                    <FlexibleAvatar
                      src={avatarData.src}
                      name={avatarData.name}
                      userBorder={userBorder}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{getConversationName()}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Circle className="h-2 w-2 fill-current text-green-500" />
                          <span className="text-xs text-gray-500">{getStatusText()}</span>
                        </div>
                      </div>
                      {userBorder && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {userBorder}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={`/profile/${conversation.participants.find(p => p.id !== session?.user?.id)?.id}`} className="flex items-center cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onConversationInfo}>
                    <Info className="h-4 w-4 mr-2" />
                    Contact Info
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {conversation.isPinned ? (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Unpin Chat
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Pin Chat
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {conversation.isMuted ? (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Unmute Notifications
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Mute Notifications
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {conversation.type === 'GROUP' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onConversationInfo}>
                    <Info className="h-4 w-4 mr-2" />
                    Group Info
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {conversation.isPinned ? (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Unpin Chat
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Pin Chat
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {conversation.isMuted ? (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Unmute Notifications
                      </>
                    ) : (
                      <>
                        <Settings className="h-4 w-4 mr-2" />
                        Mute Notifications
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea
          ref={scrollAreaRef}
          className="h-full"
          onScroll={handleScroll}
        >
          <div className="p-3 space-y-1">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                      onEdit={handleEdit}
                      onDelete={handleDelete}
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
      <div className="p-2 border-t">
        <ChatInput
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          replyTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          disabled={loading}
        />
      </div>
    </Card>
  );
}