'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import { FlexibleAvatar } from '@/components/ui/flexible-avatar';
import { useUserBorder, useUserBorders } from '@/hooks/useUserBorder';

interface MutualFriend {
  id: string;
  name: string;
  image?: string;
}

interface SuggestedUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  customStatus?: string;
  friendCount: number;
  userStatus?: {
    status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
    lastSeen: string;
  };
  mutualFriendsCount: number;
  mutualFriends: MutualFriend[];
  friendshipStatus: 'NONE' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';
}

interface FriendSuggestionsProps {
  onSendFriendRequest?: (userId: string) => void;
  onRefresh?: () => void;
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

// Component for mutual friends avatars with borders
const MutualFriendsAvatars: React.FC<{ friends: MutualFriend[] }> = ({ friends }) => {
  const friendIds = useMemo(() =>
    friends && friends.length > 0 ? friends.map(f => f.id) : [],
    [friends]
  );
  const { borders } = useUserBorders(friendIds);

  return (
    <>
      {friends && friends.map((friend) => (
        <FlexibleAvatar
          key={friend.id}
          src={friend.image}
          alt={friend.name}
          fallback={friend.name?.charAt(0)?.toUpperCase() || 'U'}
          size="xs"
          userBorder={borders[friend.id]}
          className="ring-2 ring-background"
        />
      ))}
    </>
  );
};

const SuggestionCard: React.FC<{
  user: SuggestedUser;
  onSendFriendRequest?: (userId: string) => void;
}> = ({ user, onSendFriendRequest }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const { border: userBorder } = useUserBorder(user.id);

  const handleSendRequest = async () => {
    if (!onSendFriendRequest || user.friendshipStatus !== 'NONE') return;

    setActionLoading(true);
    try {
      await onSendFriendRequest(user.id);
      toast.success('Friend request sent!');
    } catch (error) {
      toast.error('Failed to send friend request');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="relative">
            <FlexibleAvatar
              src={user.image}
              alt={user.name}
              fallback={user.name?.charAt(0)?.toUpperCase() || 'U'}
              size="md"
              userBorder={userBorder}
            />
            {user.userStatus && (
              <div
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(
                  user.userStatus.status
                )}`}
              />
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm truncate">{user.name}</h3>
              {user.userStatus?.status === 'ONLINE' && (
                <Badge variant="default" className="text-xs">
                  Online
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground truncate mb-2">
              {user.email}
            </p>

            {user.customStatus && (
              <p className="text-xs text-muted-foreground truncate mb-2">
                {user.customStatus}
              </p>
            )}

            {/* Mutual Friends */}
            {user.mutualFriendsCount > 0 && (
              <div className="mb-3">
                <div className="flex items-center space-x-1 mb-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {user.mutualFriendsCount} mutual friend{user.mutualFriendsCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {user.mutualFriends.length > 0 && (
                  <div className="flex -space-x-2">
                    <MutualFriendsAvatars friends={user.mutualFriends.slice(0, 3)} />
                    {user.mutualFriendsCount > 3 && (
                      <div className="h-6 w-6 rounded-full bg-muted border-2 ring-2 ring-background flex items-center justify-center">
                        <span className="text-xs font-medium">
                          +{user.mutualFriendsCount - 3}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center space-x-3 text-xs text-muted-foreground mb-3">
              <span>{user.friendCount} friends</span>
            </div>

            {/* Action Button */}
            <Button
              size="sm"
              onClick={handleSendRequest}
              disabled={actionLoading || user.friendshipStatus !== 'NONE'}
              className="w-full h-8"
            >
              {actionLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-current" />
              ) : user.friendshipStatus === 'FRIENDS' ? (
                'Already Friends'
              ) : user.friendshipStatus === 'REQUEST_SENT' ? (
                'Request Sent'
              ) : user.friendshipStatus === 'REQUEST_RECEIVED' ? (
                'Request Received'
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Add Friend
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const FriendSuggestions: React.FC<FriendSuggestionsProps> = ({
  onSendFriendRequest,
  onRefresh,
  className
}) => {
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSuggestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/suggestions?limit=6', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to load friend suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await fetchSuggestions();
      }
      toast.success('Suggestions refreshed');
    } catch (error) {
      toast.error('Failed to refresh suggestions');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!onSendFriendRequest) return;

    try {
      await onSendFriendRequest(userId);

      // Update local state to reflect the sent request
      setSuggestions(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, friendshipStatus: 'REQUEST_SENT' as const }
            : user
        )
      );
    } catch (error) {
      // Error is handled by the child component
      throw error;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Suggested Friends</span>
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium text-muted-foreground mb-2">
              No suggestions available
            </h3>
            <p className="text-sm text-muted-foreground">
              Check back later for new friend suggestions
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestions.map((user) => (
                <SuggestionCard
                  key={user.id}
                  user={user}
                  onSendFriendRequest={handleSendFriendRequest}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};