'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, UserPlus, Users, Clock } from 'lucide-react';
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
  friendCount: number;
  userStatus?: {
    status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
    lastSeen: string;
  };
  friendshipStatus: 'NONE' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';
  isBlocked?: boolean;
}

interface FindFriendsProps {
  onSendFriendRequest?: (userId: string) => void;
  className?: string;
}

interface SearchResult {
  users: User[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
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

const getStatusText = (status: string, lastSeen: string) => {
  switch (status) {
    case 'ONLINE':
      return 'Online';
    case 'AWAY':
      return 'Away';
    case 'BUSY':
      return 'Busy';
    default:
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }
};

const UserSearchResult: React.FC<{
  user: User;
  onSendFriendRequest?: (userId: string) => void;
  userBorder?: any;
}> = ({ user, onSendFriendRequest, userBorder }) => {
  const [actionLoading, setActionLoading] = useState(false);

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

  const getActionButton = () => {
    if (user.isBlocked) {
      return (
        <Badge variant="destructive" className="text-xs">
          Blocked
        </Badge>
      );
    }

    switch (user.friendshipStatus) {
      case 'FRIENDS':
        return (
          <Badge variant="default" className="text-xs">
            Friends
          </Badge>
        );
      case 'REQUEST_SENT':
        return (
          <Badge variant="secondary" className="text-xs">
            Request Sent
          </Badge>
        );
      case 'REQUEST_RECEIVED':
        return (
          <Button size="sm" variant="outline" className="h-8">
            View Request
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            onClick={handleSendRequest}
            disabled={actionLoading}
            className="h-8"
          >
            {actionLoading ? (
              <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-current" />
            ) : (
              <>
                <UserPlus className="h-3 w-3 mr-1" />
                Add Friend
              </>
            )}
          </Button>
        );
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Avatar */}
      <div className="relative">
        <FlexibleAvatar
          src={user.image}
          alt={user.name}
          fallback={user.name?.charAt(0)?.toUpperCase() || 'U'}
          size="sm"
          userBorder={userBorder}
        />
        {user.userStatus && (
          <div
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${getStatusColor(
              user.userStatus.status
            )}`}
          />
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-sm truncate">{user.name}</h4>
          {user.userStatus?.status === 'ONLINE' && (
            <Badge variant="default" className="text-xs px-1.5 py-0.5">
              Online
            </Badge>
          )}
        </div>

        <p className="text-xs text-muted-foreground truncate">
          {user.email}
        </p>

        <div className="flex items-center space-x-3 mt-1">
          <span className="text-xs text-muted-foreground">
            {user.friendCount} friends
          </span>
          {user.userStatus && (
            <span className="text-xs text-muted-foreground">
              {getStatusText(user.userStatus.status, user.userStatus.lastSeen)}
            </span>
          )}
        </div>

        {user.customStatus && (
          <p className="text-xs text-muted-foreground truncate mt-1">
            {user.customStatus}
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className="flex items-center">
        {getActionButton()}
      </div>
    </div>
  );
};

export const FindFriends: React.FC<FindFriendsProps> = ({
  onSendFriendRequest,
  className
}) => {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Get user IDs for border fetching
  const userIds = useMemo(() =>
    searchResults?.users.map(user => user.id) || [],
    [searchResults]
  );
  const { borders } = useUserBorders(userIds);

  const searchUsers = useCallback(async (query: string, offset = 0) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}&limit=10&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();

      if (offset === 0) {
        setSearchResults(data);
      } else {
        // Append results for pagination
        setSearchResults(prev => ({
          ...data,
          users: [...(prev?.users || []), ...data.users]
        }));
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        setSearchResults(null);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  const handleSendFriendRequest = async (userId: string) => {
    if (!onSendFriendRequest) return;

    try {
      await onSendFriendRequest(userId);

      // Update local state to reflect the sent request
      setSearchResults(prev => ({
        ...prev!,
        users: prev!.users.map(user =>
          user.id === userId
            ? { ...user, friendshipStatus: 'REQUEST_SENT' as const }
            : user
        )
      }));
    } catch (error) {
      // Error is handled by the child component
      throw error;
    }
  };

  const loadMore = () => {
    if (searchResults?.pagination.hasMore && searchQuery) {
      searchUsers(searchQuery, searchResults.pagination.offset + searchResults.pagination.limit);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="h-5 w-5" />
          <span>Find Friends</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Search Input */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Search Results */}
        <ScrollArea className="h-[400px]">
          <div className="p-4 pt-2">
            {isSearching ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : hasSearched ? (
              <>
                {searchResults?.users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-muted-foreground mb-2">
                      No users found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Try different search terms or check the spelling
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      {searchResults?.users.map((user) => (
                        <UserSearchResult
                          key={user.id}
                          user={user}
                          onSendFriendRequest={handleSendFriendRequest}
                          userBorder={borders[user.id]}
                        />
                      ))}
                    </div>

                    {/* Load More Button */}
                    {searchResults?.pagination.hasMore && (
                      <div className="flex justify-center mt-4">
                        <Button
                          variant="outline"
                          onClick={loadMore}
                          disabled={isSearching}
                        >
                          {isSearching ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current mr-2" />
                          ) : null}
                          Load More
                        </Button>
                      </div>
                    )}

                    {/* Results Count */}
                    {searchResults && (
                      <div className="text-center text-xs text-muted-foreground mt-4">
                        Showing {Math.min(searchResults.pagination.offset + searchResults.pagination.limit, searchResults.pagination.total)} of {searchResults.pagination.total} results
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-muted-foreground mb-2">
                  Search for Friends
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enter a name or email to find people you know
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};