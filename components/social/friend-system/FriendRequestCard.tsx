'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, User, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { FlexibleAvatar } from '@/components/ui/flexible-avatar';
import { useUserBorder } from '@/hooks/useUserBorder';

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

interface FriendRequest {
  id: string;
  sender?: User;
  receiver?: User;
  createdAt: string;
}

interface FriendRequestCardProps {
  request: FriendRequest;
  type: 'sent' | 'received';
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  isLoading?: boolean;
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

        if (diffInSeconds < 30) return 'Just now';
        if (diffInSeconds < 60) return '30s ago';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;

        return `${Math.floor(diffInHours / 24)}d ago`;
      } catch (error) {
        return 'Offline';
      }
  }
};

const formatRequestTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();

    // Check if date is invalid
    if (isNaN(date.getTime())) return 'Invalid date';

    const diffInMs = now.getTime() - date.getTime();

    // If date is in future
    if (diffInMs < 0) return 'Just now';

    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInSeconds < 30) return 'Just now';
    if (diffInSeconds < 60) return '30s ago';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Date error';
  }
};

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
  isLoading = false
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const user = type === 'received' ? request.sender : request.receiver;
  const { border: userBorder } = useUserBorder(user?.id);

  if (!user) {
    return null;
  }

  const handleAccept = async () => {
    if (!onAccept) return;

    setActionLoading('accept');
    try {
      await onAccept(request.id);
      toast.success('Friend request accepted!');
    } catch (error) {
      toast.error('Failed to accept friend request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!onDecline) return;

    setActionLoading('decline');
    try {
      await onDecline(request.id);
      toast.success('Friend request declined');
    } catch (error) {
      toast.error('Failed to decline friend request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;

    setActionLoading('cancel');
    try {
      await onCancel(request.id);
      toast.success('Friend request cancelled');
    } catch (error) {
      toast.error('Failed to cancel friend request');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* User Avatar */}
          <div className="relative">
            <FlexibleAvatar
              src={user.image}
              alt={user.name}
              fallback={user.name?.charAt(0)?.toUpperCase() || 'U'}
              size="md"
              userBorder={userBorder}
            />
            {/* Online Status Indicator */}
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

            {user.customStatus && (
              <p className="text-xs text-muted-foreground truncate">
                {user.customStatus}
              </p>
            )}

            <div className="flex items-center space-x-2 mt-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {type === 'received' ? 'Received' : 'Sent'}{' '}
                {formatRequestTime(request.createdAt)}
              </span>
              {user.userStatus && user.userStatus.status !== 'ONLINE' && (
                <span className="text-xs text-muted-foreground">
                  • {getStatusText(user.userStatus.status, user.userStatus.lastSeen)}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {type === 'received' ? (
              <>
                <Button
                  size="sm"
                  onClick={handleAccept}
                  disabled={actionLoading !== null}
                  className="h-8"
                >
                  {actionLoading === 'accept' ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-current" />
                  ) : (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Accept
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDecline}
                  disabled={actionLoading !== null}
                  className="h-8"
                >
                  {actionLoading === 'decline' ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-current" />
                  ) : (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Decline
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={actionLoading !== null}
                className="h-8"
              >
                {actionLoading === 'cancel' ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-current" />
                ) : (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};