"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Circle,
  Users,
  UserCheck,
  UserX,
  Clock,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { FlexibleAvatar } from "@/components/ui/flexible-avatar";
import { useUserBorder } from "@/hooks/useUserBorder";
import { cn } from "@/lib/utils";

interface UserStatus {
  id: string;
  name: string;
  image?: string;
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
  lastSeen?: string;
  isFriend?: boolean;
  friendStatus?: 'NONE' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';
}

interface OnlineStatusProps {
  maxVisible?: number;
  showOffline?: boolean;
  compact?: boolean;
  onStartChat?: (userId: string) => void;
  onAddFriend?: (userId: string) => void;
}

export function OnlineStatus({
  maxVisible = 10,
  showOffline = false,
  compact = false,
  onStartChat,
  onAddFriend
}: OnlineStatusProps) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'online' | 'friends'>('online');

  useEffect(() => {
    if (session?.user?.id) {
      fetchOnlineUsers();
      // Set up WebSocket for real-time status updates
      const interval = setInterval(fetchOnlineUsers, 10000); // Update every 10 seconds
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch('/api/users/online');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-500';
      case 'AWAY': return 'bg-yellow-500';
      case 'BUSY': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string, lastSeen?: string) => {
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

  const getFilteredUsers = () => {
    let filtered = users.filter(user => user.id !== session?.user?.id);

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (activeFilter) {
      case 'online':
        filtered = filtered.filter(user => user.status !== 'OFFLINE');
        break;
      case 'friends':
        filtered = filtered.filter(user => user.isFriend);
        break;
    }

    // Apply offline filter
    if (!showOffline) {
      filtered = filtered.filter(user => user.status !== 'OFFLINE');
    }

    return filtered.slice(0, maxVisible);
  };

  const getStatusCounts = () => {
    const online = users.filter(u => u.status === 'ONLINE' && u.id !== session?.user?.id).length;
    const away = users.filter(u => u.status === 'AWAY' && u.id !== session?.user?.id).length;
    const busy = users.filter(u => u.status === 'BUSY' && u.id !== session?.user?.id).length;
    const total = online + away + busy;

    return { online, away, busy, total };
  };

  const counts = getStatusCounts();
  const filteredUsers = getFilteredUsers();

  if (compact) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Online Users
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                <span className="text-sm font-medium">{counts.online}</span>
              </div>
              <div className="flex items-center gap-1">
                <Circle className="h-2 w-2 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-medium">{counts.away}</span>
              </div>
              <div className="flex items-center gap-1">
                <Circle className="h-2 w-2 fill-red-500 text-red-500" />
                <span className="text-sm font-medium">{counts.busy}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-200">
              {counts.total} online
            </Badge>
          </div>

          <div className="space-y-2">
            {filteredUsers.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onStartChat?.(user.id)}
              >
                <div className="relative">
                  <FlexibleAvatar
                    src={user.image}
                    name={user.name}
                    size="sm"
                  />
                  <div
                    className={cn(
                      "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
                      getStatusColor(user.status)
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.name}</div>
                  <div className="text-xs text-gray-500">
                    {getStatusText(user.status, user.lastSeen)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length > 5 && (
            <div className="text-center pt-2">
              <Button variant="ghost" size="sm" className="text-xs">
                View all {filteredUsers.length} users
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Online Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
              <span className="text-sm font-medium">{counts.online}</span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="h-2 w-2 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-medium">{counts.away}</span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="h-2 w-2 fill-red-500 text-red-500" />
              <span className="text-sm font-medium">{counts.busy}</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeFilter === 'online' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('online')}
            className="flex-1"
          >
            Online
          </Button>
          <Button
            variant={activeFilter === 'friends' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('friends')}
            className="flex-1"
          >
            Friends
          </Button>
          <Button
            variant={activeFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="flex-1"
          >
            All
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
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">No users found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {filteredUsers.map((user) => (
                <UserStatusItem
                  key={user.id}
                  user={user}
                  onStartChat={onStartChat}
                  onAddFriend={onAddFriend}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function UserStatusItem({
  user,
  onStartChat,
  onAddFriend
}: {
  user: UserStatus;
  onStartChat?: (userId: string) => void;
  onAddFriend?: (userId: string) => void;
}) {
  const { border: userBorder } = useUserBorder(user.id);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
      {/* Avatar with status */}
      <div className="relative">
        <FlexibleAvatar
          src={user.image}
          name={user.name}
          userBorder={userBorder}
          size="md"
        />
        <div
          className={cn(
            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white",
            user.status === 'ONLINE' ? 'bg-green-500' :
            user.status === 'AWAY' ? 'bg-yellow-500' :
            user.status === 'BUSY' ? 'bg-red-500' :
            'bg-gray-400'
          )}
        />
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">{user.name}</h3>
          {user.isFriend && (
            <Badge variant="outline" className="text-xs border-green-200 text-green-700">
              <UserCheck className="h-3 w-3 mr-1" />
              Friend
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Circle className={cn(
            "h-2 w-2 fill-current",
            user.status === 'ONLINE' ? 'text-green-500' :
            user.status === 'AWAY' ? 'text-yellow-500' :
            user.status === 'BUSY' ? 'text-red-500' :
            'text-gray-400'
          )} />
          <span className="text-xs text-gray-500">
            {user.status === 'ONLINE' ? 'Online' :
             user.status === 'AWAY' ? 'Away' :
             user.status === 'BUSY' ? 'Busy' :
             user.lastSeen ? `Last seen ${getTimeAgo(user.lastSeen)}` : 'Offline'
            }
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStartChat?.(user.id)}
          className="h-8 w-8 p-0"
        >
          <Users className="h-4 w-4" />
        </Button>
        {!user.isFriend && onAddFriend && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddFriend(user.id)}
            className="h-8 w-8 p-0"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(lastSeen: string) {
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}