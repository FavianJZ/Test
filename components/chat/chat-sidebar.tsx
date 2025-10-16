"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Search,
  Users,
  Circle,
  Clock,
  Pin,
  MoreVertical,
  UserPlus
} from "lucide-react";
import { FlexibleAvatar } from "@/components/ui/flexible-avatar";
import { useUserBorder } from "@/hooks/useUserBorder";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
  participantIds: string[];
  participants: Array<{
    id: string;
    name: string;
    image?: string;
    status?: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
    lastSeen?: string;
  }>;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: string;
    type: 'TEXT' | 'IMAGE' | 'FILE';
  };
  unreadCount: number;
  isPinned: boolean;
  isActive: boolean;
}

interface ChatSidebarProps {
  selectedConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onStartNewChat: () => void;
  onCreateGroup: () => void;
}

export function ChatSidebar({
  selectedConversationId,
  onConversationSelect,
  onStartNewChat,
  onCreateGroup
}: ChatSidebarProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "groups">("all");

  useEffect(() => {
    if (session?.user?.id) {
      fetchConversations();
      // Set up polling for real-time updates
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchConversations = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/chat/conversations?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        // Transform API data to match our interface
        const transformedConversations = data.data.map((conv: any) => ({
          id: conv.id,
          type: conv.type,
          name: conv.name,
          participantIds: conv.participants.map((p: any) => p.id),
          participants: conv.participants,
          lastMessage: conv.lastMessageContent ? {
            content: conv.lastMessageContent,
            senderId: '', // Would need to fetch this separately
            senderName: '',
            timestamp: conv.lastMessageAt || conv.updated_at,
            type: 'TEXT'
          } : undefined,
          unreadCount: conv.unreadCount || 0,
          isPinned: false, // Would need to implement pinning
          isActive: conv.is_active
        }));
        setConversations(transformedConversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-500';
      case 'AWAY': return 'bg-yellow-500';
      case 'BUSY': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status?: string, lastSeen?: string) => {
    switch (status) {
      case 'ONLINE': return 'Online';
      case 'AWAY': return 'Away';
      case 'BUSY': return 'Busy';
      default:
        if (!lastSeen) return 'Offline';
        const lastSeenDate = new Date(lastSeen);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const formatLastMessage = (message?: Conversation['lastMessage']) => {
    if (!message) return 'No messages yet';

    if (message.type === 'IMAGE') return '📷 Photo';
    if (message.type === 'FILE') return '📎 File';

    const sender = message.senderId === session?.user?.id ? 'You' : message.senderName;
    return `${sender}: ${message.content}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getFilteredConversations = () => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(conv =>
        conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.participants.some(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Apply tab filter
    switch (activeTab) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unreadCount > 0);
        break;
      case 'groups':
        filtered = filtered.filter(conv => conv.type === 'GROUP');
        break;
    }

    // Sort: pinned first, then by last message timestamp
    return filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
      return new Date(b.lastMessage?.timestamp || 0).getTime() -
             new Date(a.lastMessage?.timestamp || 0).getTime();
    });
  };

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
    const isSelected = conversation.id === selectedConversationId;
    const borderUserId = conversation.type === 'DIRECT'
      ? conversation.participants[0]?.id || session?.user?.id
      : session?.user?.id;
    const { border: userBorder } = useUserBorder(borderUserId);

    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50",
          isSelected && "bg-blue-50 border border-blue-200"
        )}
        onClick={() => onConversationSelect(conversation.id)}
      >
        {/* Avatar */}
        <div className="relative">
          {conversation.type === 'DIRECT' ? (
            <div className="relative">
              <FlexibleAvatar
                src={conversation.participants[0]?.image}
                name={conversation.participants[0]?.name}
                userBorder={userBorder}
                size="md"
              />
              <div
                className={cn(
                  "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                  getStatusColor(conversation.participants[0]?.status)
                )}
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm truncate">
              {conversation.type === 'DIRECT'
                ? conversation.participants[0]?.name
                : conversation.name
              }
            </h3>
            <div className="flex items-center gap-1">
              {conversation.isPinned && (
                <Pin className="w-3 h-3 text-gray-400" />
              )}
              <span className="text-xs text-gray-500">
                {formatTimestamp(conversation.lastMessage?.timestamp || '')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600 truncate">
              {formatLastMessage(conversation.lastMessage)}
            </p>
            {conversation.unreadCount > 0 && (
              <Badge className="bg-blue-500 text-white text-xs h-5 min-w-[20px]">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Badge>
            )}
          </div>

          {/* Status for direct messages */}
          {conversation.type === 'DIRECT' && conversation.participants[0]?.status && (
            <div className="flex items-center gap-1 mt-1">
              <Circle className={cn("w-2 h-2 fill-current", getStatusColor(conversation.participants[0]?.status))} />
              <span className="text-xs text-gray-500">
                {getStatusText(conversation.participants[0]?.status, conversation.participants[0]?.lastSeen)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredConversations = getFilteredConversations();

  return (
    <Card className="h-full flex flex-col border-r">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Messages</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartNewChat}
              className="h-8 w-8 p-0"
            >
              <UserPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateGroup}
              className="h-8 w-8 p-0"
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('all')}
            className="flex-1"
          >
            All
          </Button>
          <Button
            variant={activeTab === 'unread' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('unread')}
            className="flex-1"
          >
            Unread
          </Button>
          <Button
            variant={activeTab === 'groups' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('groups')}
            className="flex-1"
          >
            Groups
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No conversations yet</p>
              <p className="text-sm mt-1">Start a new conversation to see it here</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button
                  size="sm"
                  onClick={onStartNewChat}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCreateGroup}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <ConversationItem key={conversation.id} conversation={conversation} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}