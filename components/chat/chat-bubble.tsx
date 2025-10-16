"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  X,
  Search,
  UserPlus,
  Circle,
  Users
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { FlexibleAvatar } from "@/components/ui/flexible-avatar";
import { useUserBorder } from "@/hooks/useUserBorder";
import { useChat } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import { FriendList } from "@/components/social/friend-system/FriendList";

interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP';
  name?: string;
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

interface ChatBubbleProps {
  className?: string;
}

export function ChatBubble({ className }: ChatBubbleProps) {
  const { data: session } = useSession();
  const { state, actions } = useChat();
  const [showConversations, setShowConversations] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"conversations" | "friends">("conversations");
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  // Fetch conversations when opening the dialog
  const fetchConversations = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/chat/conversations?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        const transformedConversations = data.data.map((conv: any) => ({
          id: conv.id,
          type: conv.type,
          name: conv.name,
          participants: conv.participants,
          lastMessage: conv.lastMessageContent ? {
            content: conv.lastMessageContent,
            senderId: conv.lastSenderId || '',
            senderName: conv.lastSenderName || '',
            timestamp: conv.lastMessageAt || conv.updated_at,
            type: 'TEXT'
          } : undefined,
          unreadCount: conv.unreadCount || 0,
          isPinned: false,
          isActive: Boolean(conv.is_active)
        }));
        setConversations(transformedConversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch friends when switching to friends tab
  const fetchFriends = async () => {
    if (!session?.user?.id) return;

    setFriendsLoading(true);
    try {
      const response = await fetch('/api/friends?type=friends');
      if (response.ok) {
        const data = await response.json();
        // Transform API response to match FriendList component interface
        const transformedFriends = (data.friends || []).map((friend: any) => ({
          id: friend.id,
          friend: {
            id: friend.id,
            name: friend.name,
            email: friend.email,
            image: friend.image,
            customStatus: friend.customStatus,
            userStatus: {
              status: friend.status || 'OFFLINE',
              lastSeen: friend.lastSeen
            }
          },
          createdAt: friend.createdAt
        }));
        setFriends(transformedFriends);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setFriendsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: "conversations" | "friends") => {
    setActiveTab(tab);
    if (tab === "friends" && friends.length === 0) {
      fetchFriends();
    }
  };

  // Filter friends based on search query
  const getFilteredFriends = () => {
    return friends.filter(friend =>
      searchQuery === '' ||
      friend.friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.friend.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.friend.customStatus?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleOpenConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      actions.openChat(conversationId, conversation);
      setShowConversations(false);
    }
  };

  const handleStartChatWithFriend = async (friendId: string) => {
    if (!session?.user?.id) return;

    // Check if conversation already exists
    const existingWindow = state.windows.find(w => w.conversationId === friendId);
    if (existingWindow) {
      actions.bringToFront(existingWindow.id);
      setShowConversations(false);
      return;
    }

    try {
      // Create new conversation via API
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'DIRECT',
          participantIds: [friendId],
          createdBy: session.user.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        const friend = friends.find(f => f.friend.id === friendId);

        if (friend) {
          // Create proper conversation object with real conversation ID
          const conversation = {
            id: data.data.conversationId,
            type: 'DIRECT' as const,
            name: friend.friend.name,
            participants: [
              { id: session?.user?.id || '', name: session?.user?.name || 'You' },
              { id: friend.friend.id, name: friend.friend.name, image: friend.friend.image }
            ]
          };

          // Use the real conversationId from API response
          actions.openChat(data.data.conversationId, conversation);
          setShowConversations(false);
        }
      } else {
        console.error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const formatLastMessage = (message?: Conversation['lastMessage']) => {
    if (!message) return 'No messages yet';
    if (message.type === 'IMAGE') return '📷 Photo';
    if (message.type === 'FILE') return '📎 File';
    const sender = message.senderId === session?.user?.id ? 'You' : message.senderName;
    return `${sender}: ${message.content}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-500';
      case 'AWAY': return 'bg-yellow-500';
      case 'BUSY': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getFilteredConversations = () => {
    return conversations.filter(conv =>
      searchQuery === '' ||
      conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participants.some(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    ).sort((a, b) => new Date(b.lastMessage?.timestamp || 0).getTime() -
                     new Date(a.lastMessage?.timestamp || 0).getTime());
  };

  if (!session?.user?.id) {
    return null;
  }

  const openWindows = state.windows.filter(w => !w.isMinimized);
  const totalUnread = state.windows.reduce((total, window) => total + window.unreadCount, 0);

  return (
    <div className={cn("fixed bottom-6 left-6 z-50", className)}>
  
      {/* Main Chat Bubble */}
      <div className="relative">
        <Button
          size="lg"
          onClick={() => {
            if (showConversations) {
              setShowConversations(false);
            } else {
              fetchConversations();
              setShowConversations(true);
            }
          }}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl",
            showConversations
              ? "bg-muted-foreground hover:bg-muted-foreground/90"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          )}
        >
          {showConversations ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <MessageSquare className="h-6 w-6" />
              {totalUnread > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs h-6 min-w-[24px] p-0 flex items-center justify-center shadow-md">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Badge>
              )}
            </>
          )}
        </Button>

        {/* Open Windows Indicators */}
        {openWindows.length > 0 && (
          <div className="absolute -top-2 -right-2 flex flex-col gap-1">
            {openWindows.slice(0, 3).map((window, index) => (
              <div
                key={window.id}
                className="w-2 h-2 bg-primary rounded-full shadow-sm"
                title={window.conversation.name || 'Chat'}
              />
            ))}
          </div>
        )}

        {/* Conversations Dialog */}
        <Dialog open={showConversations} onOpenChange={setShowConversations}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Messages & Friends
                {totalUnread > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="conversations" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="friends" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Friends
                </TabsTrigger>
              </TabsList>

              <TabsContent value="conversations" className="space-y-4 mt-4">
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

                {/* Open Windows */}
                {openWindows.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Open Chats</h4>
                    {openWindows.map((window) => (
                      <div
                        key={window.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-primary/20 bg-primary/5 cursor-pointer"
                        onClick={() => {
                          actions.bringToFront(window.id);
                          setShowConversations(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium truncate">
                            {window.conversation.name || 'Chat'}
                          </span>
                        </div>
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          Active
                        </Badge>
                      </div>
                    ))}
                    <Separator />
                  </div>
                )}

                {/* Conversation List */}
                <ScrollArea className="h-[300px]">
                  {loading ? (
                    <div className="space-y-3">
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
                  ) : getFilteredConversations().length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No conversations yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredConversations().map((conversation) => (
                        <div
                          key={conversation.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleOpenConversation(conversation.id)}
                        >
                          {/* Avatar */}
                          <div className="relative">
                            {conversation.type === 'DIRECT' ? (
                              <div className="relative">
                                <FlexibleAvatar
                                  src={conversation.participants[0]?.image}
                                  name={conversation.participants[0]?.name}
                                  size="sm"
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
                              <h3 className="font-medium text-sm truncate">
                                {conversation.type === 'DIRECT'
                                  ? conversation.participants[0]?.name
                                  : conversation.name
                                }
                              </h3>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-primary text-primary-foreground text-xs h-5 min-w-[20px]">
                                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 truncate">
                              {formatLastMessage(conversation.lastMessage)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="friends" className="space-y-4 mt-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Friend List */}
                <ScrollArea className="h-[300px]">
                  {friendsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-24" />
                              <div className="h-3 bg-gray-200 rounded w-16" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : getFilteredFriends().length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">
                        {searchQuery ? 'No friends found' : 'No friends yet'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredFriends().map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleStartChatWithFriend(friend.friend.id)}
                        >
                          {/* Avatar */}
                          <div className="relative">
                            <FlexibleAvatar
                              src={friend.friend.image}
                              name={friend.friend.name}
                              size="sm"
                            />
                            {friend.friend.userStatus && (
                              <div
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                                  friend.friend.userStatus.status
                                )}`}
                              />
                            )}
                          </div>

                          {/* Friend Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-sm truncate">
                                {friend.friend.name}
                              </h3>
                              {friend.friend.userStatus?.status === 'ONLINE' && (
                                <Badge variant="default" className="text-xs px-1.5 py-0.5">
                                  Online
                                </Badge>
                              )}
                            </div>

                            {friend.friend.customStatus && (
                              <p className="text-xs text-gray-600 truncate">
                                {friend.friend.customStatus}
                              </p>
                            )}

                            <p className="text-xs text-gray-500">
                              {friend.friend.userStatus
                                ? friend.friend.userStatus.status === 'ONLINE'
                                  ? 'Online'
                                  : `Last seen ${friend.friend.userStatus.lastSeen ? new Date(friend.friend.userStatus.lastSeen).toLocaleString() : 'Unknown'}`
                                : 'Offline'
                              }
                            </p>
                          </div>

                          {/* Chat Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// Hook for managing global chat bubble state
export function useChatBubble() {
  const { state, actions } = useChat();

  return {
    unreadCount: state.windows.reduce((total, window) => total + window.unreadCount, 0),
    activeChats: state.windows.filter(w => !w.isMinimized).length,
    minimizedChats: state.windows.filter(w => w.isMinimized).length,
    totalChats: state.windows.length,
    hasActiveChats: state.windows.length > 0,
  };
}

export default ChatBubble;