"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, MessageSquare, Heart, Calendar, Trophy, Users, UserPlus, MapPin, Globe, Coffee, Bookmark, Lock } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { BorderDisplay } from "@/components/ui/border-display"
import { FriendList } from "@/components/social/friend-system"
import { FollowButton } from "@/components/social/follow-button"
import { User } from "lucide-react"
import { SocialFeed } from "@/components/social/social-feed/social-feed"
import { useChat } from "@/contexts/ChatContext"

interface User {
  id: string
  name: string
  email: string
  image?: string
  points: number
  role?: string
  bio?: string
  createdAt: string
  friendCount?: number
  followerCount?: number
  followingCount?: number
  postCount?: number
  customStatus?: string
  location?: string
  website?: string
  favoriteMatcha?: string
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT'
  userStatus?: {
    status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';
    lastSeen: string;
  }
  userProfile?: {
    bio?: string;
    location?: string;
    website?: string;
    favoriteMatcha?: string;
    experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  }
  friendshipStatus?: 'NONE' | 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED';
  isFollowing?: boolean;
}

interface Friend {
  id: string;
  friend: User;
  createdAt: string;
}

interface Achievement {
  id: string
  type: string
  title: string
  description?: string
  targetValue: number
  currentValue: number
  isCompleted: boolean
  completedAt?: string
  rewards?: string
}

export default function UserProfilePage() {
  const { userId } = useParams()
  const { data: session } = useSession()
  const router = useRouter()
  const { actions: chatActions } = useChat()

  const [user, setUser] = useState<User | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [friendActionLoading, setFriendActionLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [userBorder, setUserBorder] = useState<any>(null)

  const isOwnProfile = session?.user?.id === userId

  useEffect(() => {
    if (userId) {
      fetchUserData()
    }
  }, [userId])

  const fetchUserData = async () => {
    try {
      const [achievementsResponse, friendsResponse, followResponse] = await Promise.all([
        fetch(`/api/achievements/${userId}`),
        fetch(`/api/friends?type=friends&userId=${userId}`),
        isOwnProfile ? Promise.resolve({ ok: true, json: () => ({ data: { isFollowing: false } }) }) :
                    fetch(`/api/social/follow?type=following&limit=100`)
      ])

      if (achievementsResponse.ok) {
        const data = await achievementsResponse.json()
        setUser(data.user)
        setAchievements(data.achievements)
      } else {
        toast.error("User not found")
        router.push("/")
        return
      }

      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json()
        setFriends(friendsData.friends || [])
      }

      // Check follow status
      if (followResponse.ok && !isOwnProfile) {
        const followData = await followResponse.json()
        const isUserFollowing = followData.data.some((followedUser: any) => followedUser.id === userId)
        setIsFollowing(isUserFollowing)
      }

      // Get additional user stats (posts, followers, following)
      try {
        const statsResponse = await fetch(`/api/users/${userId}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setUser(prev => prev ? {
            ...prev,
            friendCount: statsData.friendCount || 0,
            followerCount: statsData.followerCount || 0,
            followingCount: statsData.followingCount || 0,
            postCount: statsData.postCount || 0
          } : null);
        }
      } catch (error) {
        console.error("Error fetching user stats:", error);
      }

      
      // Get user border
      try {
        const borderResponse = await fetch(`/api/users/${userId}/border`);
        if (borderResponse.ok) {
          const borderData = await borderResponse.json();
          if (borderData.border) {
            const completeBorder = await getBorderFromDatabase(borderData.border.id);
            setUserBorder(completeBorder);
          }
        }
      } catch (error) {
        console.error("Error fetching user border:", error);
        // Set default border on error
        setUserBorder({
          id: 'default',
          name: 'Default',
          imageUrl: '/borders/default.png',
          unlocked: true,
          rarity: 'COMMON'
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  const handleSendFriendRequest = async () => {
    if (!session?.user?.id || !user || user.friendshipStatus !== 'NONE') return;

    setFriendActionLoading(true);
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: user.id
        }),
      });

      if (response.ok) {
        toast.success('Friend request sent!');
        setUser(prev => prev ? { ...prev, friendshipStatus: 'REQUEST_SENT' } : null);

        // Also update friend count to show immediate feedback
        setUser(prev => prev ? { ...prev, friendCount: (prev.friendCount || 0) + 1 } : null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Failed to send friend request');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!session?.user?.id || !user || user.friendshipStatus !== 'REQUEST_RECEIVED') return;

    setFriendActionLoading(true);
    try {
      // Find the request ID first
      const response = await fetch('/api/friends?type=received');
      if (response.ok) {
        const data = await response.json();
        const request = data.requests?.find((req: any) => req.sender.id === user.id);

        if (request) {
          const acceptResponse = await fetch(`/api/friends/requests/${request.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'accept' })
          });

          if (acceptResponse.ok) {
            toast.success('Friend request accepted!');
            setUser(prev => prev ? { ...prev, friendshipStatus: 'FRIENDS' } : null);
            // Refresh friends data
            fetchUserData();
          } else {
            const error = await acceptResponse.json();
            toast.error(error.error || 'Failed to accept request');
          }
        }
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept request');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!session?.user?.id || !user || user.friendshipStatus !== 'FRIENDS') return;

    setFriendActionLoading(true);
    try {
      const response = await fetch(`/api/friends?friendId=${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Friend removed');
        setUser(prev => prev ? { ...prev, friendshipStatus: 'NONE', friendCount: Math.max(0, (prev.friendCount || 0) - 1) } : null);
        // Refresh friends data
        fetchUserData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove friend');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Failed to remove friend');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!session?.user?.id || !user || user.friendshipStatus !== 'REQUEST_SENT') return;

    setFriendActionLoading(true);
    try {
      // Find the sent request ID first
      const response = await fetch('/api/friends?type=sent');
      if (response.ok) {
        const data = await response.json();
        const request = data.requests?.find((req: any) => req.receiver.id === user.id);

        if (request) {
          const cancelResponse = await fetch(`/api/friends/requests/${request.id}`, {
            method: 'DELETE'
          });

          if (cancelResponse.ok) {
            toast.success('Friend request cancelled');
            setUser(prev => prev ? { ...prev, friendshipStatus: 'NONE', friendCount: Math.max(0, (prev.friendCount || 0) - 1) } : null);
            // Refresh friends data
            fetchUserData();
          } else {
            const error = await cancelResponse.json();
            toast.error(error.error || 'Failed to cancel request');
          }
        }
      }
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      toast.error('Failed to cancel request');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleStartChat = async (friendId: string) => {
    if (!session?.user?.id) {
      toast.error('You need to be logged in to start a chat');
      return;
    }

    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'DIRECT',
          participantIds: [friendId],
          createdBy: session.user.id
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Chat started!');

        // Create conversation data for floating chat
        const conversation = {
          id: data.data.conversationId,
          type: 'DIRECT' as const,
          participants: [
            {
              id: session.user.id,
              name: session.user.name || 'You',
              image: session.user.image
            },
            {
              id: user?.id,
              name: user?.name || 'Unknown',
              image: user?.image
            }
          ].filter(p => p.id) // Filter out any undefined participants
        };

        // Open floating chat instead of navigating to chat page
        chatActions.openChat(data.data.conversationId, conversation);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to start chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const handleFollowChange = (following: boolean) => {
    setIsFollowing(following)
  };

  const getBorderFromDatabase = async (borderId: string) => {
    if (!borderId) {
      return {
        id: 'default',
        name: 'Default',
        imageUrl: '/borders/default.png',
        unlocked: true,
        rarity: 'COMMON'
      }
    }

    try {
      const response = await fetch('/api/borders-public')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const border = data.data.find((b: any) => b.id === borderId)
          if (border) {
            return {
              id: border.id,
              name: border.name,
              imageUrl: border.imageUrl,
              unlocked: true,
              rarity: border.rarity
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching border data:', error)
    }

    // Fallback to default border
    return {
      id: borderId,
      name: borderId.charAt(0).toUpperCase() + borderId.slice(1),
      imageUrl: '/borders/default.png',
      unlocked: true,
      rarity: 'COMMON'
    }
  }

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'FIRST_FORUM_POST':
        return <MessageSquare className="h-4 w-4" />
      case 'FORUM_REGULAR':
        return <MessageSquare className="h-4 w-4" />
      case 'RECIPE_CREATOR':
        return <Trophy className="h-4 w-4" />
      default:
        return <Trophy className="h-4 w-4" />
    }
  }

  // Get badge styling based on rarity (matching forum colors)
  const getBadgeStyling = (rarity?: string) => {
    const rarityLower = (rarity || 'common').toLowerCase()

    switch (rarityLower) {
      case 'bronze':
        return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
      case 'silver':
        return 'bg-zinc-100 text-zinc-800 border-zinc-200 hover:bg-zinc-200'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
      case 'common':
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
      case 'uncommon':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
      case 'rare':
        return 'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200'
      case 'epic':
        return 'bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200'
      case 'legendary':
        return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
      case 'mythic':
        return 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
    }
  }

  const getRarityColor = (isCompleted: boolean) => {
    return isCompleted
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-600 border-gray-200"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/")}>
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Link href="/" className="hidden lg:flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <h1 className="text-xl font-semibold">Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row items-start gap-6">
              {/* Avatar with Border */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <BorderDisplay
                    border={userBorder || { id: 'default', name: 'Default', imageUrl: '/borders/default.png', unlocked: true, rarity: 'COMMON' }}
                    userAvatar={user.image}
                    userName={user.name}
                    size="forum"
                    showUserInfo={false}
                    showBadge={false}
                    orientation="vertical"
                  />
                  {user.userStatus && (
                    <div
                      className={`absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 border-background ${getStatusColor(
                        user.userStatus.status
                      )}`}
                    />
                  )}
                </div>
                <div className="mt-2 text-center space-y-1">
                  {userBorder?.rarity && (
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${getBadgeStyling(userBorder.rarity)}`}
                    >
                      {userBorder.rarity.charAt(0).toUpperCase() + userBorder.rarity.slice(1).toLowerCase()} Member
                    </Badge>
                  )}
                  {!userBorder?.rarity && (
                    <Badge variant="outline" className="text-xs">
                      {user.role || 'Member'}
                    </Badge>
                  )}
                  {user.userStatus && (
                    <div className="text-xs text-muted-foreground">
                      {getStatusText(user.userStatus.status, user.userStatus.lastSeen)}
                    </div>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                  <h1
                    className={`text-2xl font-bold transition-colors duration-200 ${
                      isOwnProfile
                        ? 'text-gray-900'
                        : 'text-gray-900 hover:text-blue-600 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!isOwnProfile) {
                        router.push(`/profile/${userId}`)
                      }
                    }}
                  >
                    {user.name}
                  </h1>
                  {user.customStatus && (
                    <span className="text-sm text-muted-foreground">• {user.customStatus}</span>
                  )}
                </div>
                <p className="text-gray-600 mb-2">{user.email}</p>

                {/* Extended Bio */}
                {(user.bio || user.userProfile?.bio) && (
                  <p className="text-gray-700 mb-4 max-w-2xl">
                    {user.userProfile?.bio || user.bio}
                  </p>
                )}

                {/* Additional Info */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {formatDate(user.createdAt)}
                  </div>
                  {/* Show last active only for friends or own profile */}
                  {(user.friendshipStatus === 'FRIENDS' || isOwnProfile) && user.userStatus && (
                    <div className="flex items-center gap-1">
                      <div className={`h-3 w-3 rounded-full ${getStatusColor(user.userStatus.status)}`} />
                      <span className="text-xs">
                        {user.userStatus.status === 'ONLINE'
                          ? 'Active now'
                          : `Last seen ${getStatusText(user.userStatus.status, user.userStatus.lastSeen)}`
                        }
                      </span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {user.location}
                    </div>
                  )}
                  {user.userProfile?.experienceLevel && (
                    <div className="flex items-center gap-1">
                      <Coffee className="h-4 w-4" />
                      {user.userProfile.experienceLevel} Matcha Lover
                    </div>
                  )}
                </div>

                {/* Social Stats */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-600">{user.friendCount || 0}</span>
                    <span className="text-gray-500">Friends</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-500">{user.followerCount || 0}</span>
                    <span className="text-gray-500">Followers</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600">{user.followingCount || 0}</span>
                    <span className="text-gray-500">Following</span>
                  </div>
                  {user.postCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-purple-600">{user.postCount}</span>
                      <span className="text-gray-500">Posts</span>
                    </div>
                  )}
                </div>

                {/* Favorite Matcha */}
                {user.userProfile?.favoriteMatcha && (
                  <div className="mt-3 flex items-center justify-center lg:justify-start gap-2 text-sm">
                    <Coffee className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600">
                      Favorite: <span className="font-medium text-green-600">{user.userProfile.favoriteMatcha}</span>
                    </span>
                  </div>
                )}

                {/* Website */}
                {user.userProfile?.website && (
                  <div className="mt-2 flex items-center justify-center lg:justify-start gap-2 text-sm">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <a
                      href={user.userProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {user.userProfile.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 min-w-[160px]">
                {isOwnProfile ? (
                  <Button onClick={() => router.push("/profile")} className="w-full">
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      {/* Chat Button - Same size as follow button */}
                      <Button
                        onClick={() => handleStartChat(user.id)}
                        variant="outline"
                        className="flex items-center gap-1 justify-center w-full h-8"
                        size="sm"
                        title="Start a conversation"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span className="hidden sm:inline">Chat</span>
                      </Button>

                      {/* Friend Request Button */}
                      <Button
                          onClick={user.friendshipStatus === 'NONE' ? handleSendFriendRequest :
                                 user.friendshipStatus === 'FRIENDS' ? handleRemoveFriend :
                                 user.friendshipStatus === 'REQUEST_SENT' ? handleCancelRequest :
                                 handleAcceptRequest}
                          disabled={friendActionLoading}
                          className={`flex items-center gap-1 justify-center w-full h-8 ${
                            user.friendshipStatus === 'NONE' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                            user.friendshipStatus === 'FRIENDS' ? 'bg-green-600 hover:bg-green-700 text-white' :
                            user.friendshipStatus === 'REQUEST_SENT' ? 'bg-gray-500 hover:bg-gray-600 text-white' :
                            'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                          size="sm"
                          title={
                            user.friendshipStatus === 'NONE' ? 'Add Friend' :
                            user.friendshipStatus === 'FRIENDS' ? 'Remove Friend' :
                            user.friendshipStatus === 'REQUEST_SENT' ? 'Cancel Request' :
                            'Accept Friend Request'
                          }
                        >
                          {friendActionLoading ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-current" />
                          ) : (
                            <>
                              {user.friendshipStatus === 'NONE' && <UserPlus className="h-3 w-3" />}
                              {user.friendshipStatus === 'FRIENDS' && <Users className="h-3 w-3" />}
                              {user.friendshipStatus === 'REQUEST_SENT' && <Users className="h-3 w-3" />}
                              {user.friendshipStatus === 'REQUEST_RECEIVED' && <UserPlus className="h-3 w-3" />}
                              <span className="hidden sm:inline">
                                {user.friendshipStatus === 'NONE' && 'Add Friend'}
                                {user.friendshipStatus === 'FRIENDS' && 'Friends'}
                                {user.friendshipStatus === 'REQUEST_SENT' && 'Request Sent'}
                                {user.friendshipStatus === 'REQUEST_RECEIVED' && 'Accept'}
                              </span>
                            </>
                          )}
                        </Button>

                      {/* Follow Button */}
                      <FollowButton
                        targetUserId={user.id}
                        isFollowing={isFollowing}
                        onFollowChange={handleFollowChange}
                        className="flex items-center gap-1 justify-center w-full h-8"
                        size="sm"
                        showIcon={true}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Achievements */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="friends">
              Friends
              {friends.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {friends.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="achievements">
              Achievements
              {achievements.filter(a => a.isCompleted).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {achievements.filter(a => a.isCompleted).length}
                </Badge>
              )}
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved">
                <Bookmark className="h-4 w-4 mr-2" />
                Saved Posts
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats - Only show achievements and days active for other users, points only for own profile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Show points only for own profile */}
              {isOwnProfile && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {user.points}
                      </div>
                      <p className="text-sm text-gray-600">Points</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {achievements.filter(a => a.isCompleted).length}
                    </div>
                    <p className="text-sm text-gray-600">Achievements</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <p className="text-sm text-gray-600">Days Active</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Achievements */}
            {achievements.filter(a => a.isCompleted).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {achievements
                      .filter(a => a.isCompleted)
                      .slice(0, 5)
                      .map((achievement) => (
                        <div
                          key={achievement.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${getRarityColor(achievement.isCompleted)}`}
                        >
                          <div className="flex-shrink-0">
                            {getAchievementIcon(achievement.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm">
                              {achievement.title}
                            </h4>
                            {achievement.description && (
                              <p className="text-xs opacity-75 mt-1">
                                {achievement.description}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            <Trophy className="h-4 w-4" />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="friends" className="space-y-4">
            <FriendList
              friends={friends}
              onStartChat={handleStartChat}
              className="w-full"
            />
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <div className="grid gap-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className={`flex-shrink-0 p-2 rounded-full ${getRarityColor(achievement.isCompleted)}`}>
                        {getAchievementIcon(achievement.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        {achievement.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {achievement.description}
                          </p>
                        )}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              {achievement.currentValue}/{achievement.targetValue}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(achievement.currentValue / achievement.targetValue) * 100}%`
                              }}
                            />
                          </div>
                        </div>
                        {achievement.isCompleted && achievement.completedAt && (
                          <p className="text-xs text-green-600 mt-2">
                            Completed on {formatDate(achievement.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved" className="space-y-4">
              <SocialFeed mode="saved" />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}