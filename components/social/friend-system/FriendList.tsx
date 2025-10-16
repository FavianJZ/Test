'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, User, Search, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { FlexibleAvatar } from '@/components/ui/flexible-avatar';
import { useSession } from 'next-auth/react';
import { useUserBorders } from '@/hooks/useUserBorder';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  customStatus?: string;
  userStatus?: {
    status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
    lastSeen: string;
  };
}

interface Friend {
  id: string;
  friend: User;
  createdAt: string;
}

interface FriendListProps {
  friends?: Friend[];
  onRemoveFriend?: (friendId: string) => void;
  onStartChat?: (friendId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ONLINE':
      return 'bg-green-500';
    case 'AWAY':
      return 'bg-yellow-500';
    case 'BUSY':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

const getStatusText = (status: string, lastSeen?: string) => {
  switch (status) {
    case 'ONLINE':
      return 'Online';
    case 'AWAY':
      return 'Away';
    case 'BUSY':
      return 'Busy';
    default:
      // Handle missing or invalid lastSeen
      if (!lastSeen) return 'Offline';

      try {
        const lastSeenDate = new Date(lastSeen);
        const now = new Date();

        // Check if date is invalid
        if (isNaN(lastSeenDate.getTime())) return 'Offline';

        const diffInMs = now.getTime() - lastSeenDate.getTime();

        // If date is in future, show as offline
        if (diffInMs < 0) return 'Offline';

        const diffInSeconds = Math.floor(diffInMs / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInSeconds < 30) return 'Just now';
        if (diffInSeconds < 60) return '30s ago';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInDays < 7) return `${diffInDays}d ago`;

        // For longer periods, show actual date
        return lastSeenDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      } catch (error) {
        return 'Offline';
      }
  }
};

const FriendListItem: React.FC<{
  friend: Friend;
  onStartChat?: (friendId: string) => void;
  onRemoveFriend?: (friendId: string) => void;
  userBorder?: any;
}> = ({ friend, onStartChat, onRemoveFriend, userBorder }) => {
  const [actionLoading, setActionLoading] = useState(false);

  // Safety check - if friend data is invalid, don't render
  if (!friend?.friend?.id) {
    return null;
  }

  const handleRemoveFriend = async () => {
    if (!onRemoveFriend || !friend?.friend?.id) return;

    setActionLoading(true);
    try {
      await onRemoveFriend(friend.friend.id);
      toast.success('Friend removed successfully');
    } catch (error) {
      toast.error('Failed to remove friend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = () => {
    if (onStartChat && friend?.friend?.id) {
      onStartChat(friend.friend.id);
    }
  };

  return (
    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Avatar with status indicator */}
      <div className="relative">
        <FlexibleAvatar
          src={friend.friend.image}
          alt={friend.friend.name}
          fallback={friend.friend.name?.charAt(0)?.toUpperCase() || 'U'}
          size="sm"
          userBorder={userBorder}
        />
        {friend.friend.userStatus && (
          <div
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${getStatusColor(
              friend.friend.userStatus.status
            )}`}
          />
        )}
      </div>

      {/* Friend Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-sm truncate">{friend.friend.name || 'Unknown User'}</h4>
          {friend.friend.userStatus?.status === 'ONLINE' && (
            <Badge variant="default" className="text-xs px-1.5 py-0.5">
              Online
            </Badge>
          )}
        </div>

        {friend.friend.customStatus && (
          <p className="text-xs text-muted-foreground truncate">
            {friend.friend.customStatus}
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          {friend.friend.userStatus
            ? getStatusText(friend.friend.userStatus.status, friend.friend.userStatus.lastSeen)
            : 'Offline'
          }
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStartChat}
          className="h-8 w-8 p-0"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleStartChat}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Message
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleRemoveFriend}
              className="text-destructive"
              disabled={actionLoading}
            >
              <User className="h-4 w-4 mr-2" />
              Remove Friend
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const FriendList: React.FC<FriendListProps> = ({
  friends,
  onRemoveFriend,
  onStartChat,
  isLoading = false,
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session } = useSession();

  // Get user IDs for border fetching with safety checks
  const userIds = useMemo(() =>
    friends
      ?.filter(friend => friend?.friend?.id)
      .map(friend => friend.friend.id) || [],
    [friends]
  );
  const { borders, loading: bordersLoading } = useUserBorders(userIds);

  // Filter friends based on search query with safety checks
  const filteredFriends = friends?.filter(friend =>
    friend?.friend && (
      friend.friend.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.friend.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.friend.customStatus?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  // Separate online and offline friends
  const onlineFriends = filteredFriends.filter(friend =>
    friend.friend.userStatus?.status === 'ONLINE'
  );

  const offlineFriends = filteredFriends.filter(friend =>
    friend.friend.userStatus?.status !== 'ONLINE'
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Friends ({friends?.length || 0})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Search */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Friends List */}
        <ScrollArea className="h-[400px]">
          <div className="p-4 pt-2">
            {filteredFriends.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-muted-foreground mb-2">
                  {searchQuery ? 'No friends found' : 'No friends yet'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Start connecting with other users to build your friend list'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Online Friends */}
                {onlineFriends.length > 0 && (
                  <>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4 first:mt-0">
                      Online ({onlineFriends.length})
                    </div>
                    {onlineFriends.map((friend) => (
                      <FriendListItem
                        key={friend.id}
                        friend={friend}
                        onStartChat={onStartChat}
                        onRemoveFriend={onRemoveFriend}
                        userBorder={borders[friend.friend.id]}
                      />
                    ))}
                  </>
                )}

                {/* Offline Friends */}
                {offlineFriends.length > 0 && (
                  <>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                      Offline ({offlineFriends.length})
                    </div>
                    {offlineFriends.map((friend) => (
                      <FriendListItem
                        key={friend.id}
                        friend={friend}
                        onStartChat={onStartChat}
                        onRemoveFriend={onRemoveFriend}
                        userBorder={borders[friend.friend.id]}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};