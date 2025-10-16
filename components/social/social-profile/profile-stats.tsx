"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Heart,
  MessageSquare,
  Eye,
  Trophy,
  Calendar,
  TrendingUp,
  Award,
  Target,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileStats {
  userId: string;
  totalPoints: number;
  friendCount: number;
  followerCount: number;
  followingCount: number;
  postCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  achievementsCompleted: number;
  totalAchievements: number;
  joinDate: string;
  lastActive: string;
  currentStreak: number;
  longestStreak: number;
  rank: number;
  level: number;
  experience: number;
  experienceToNext: number;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
    earnedAt: string;
  }>;
}

interface ProfileStatsProps {
  userId: string;
  showDetailed?: boolean;
  compact?: boolean;
}

export function ProfileStats({ userId, showDetailed = true, compact = false }: ProfileStatsProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = userId === session?.user?.id;

  useEffect(() => {
    fetchProfileStats();
  }, [userId]);

  const fetchProfileStats = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (level >= 30) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    if (level >= 20) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (level >= 10) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    return 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  const getStreakColor = (days: number) => {
    if (days >= 100) return 'text-red-600';
    if (days >= 30) return 'text-orange-600';
    if (days >= 7) return 'text-yellow-600';
    if (days >= 3) return 'text-green-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-8 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">Stats not available</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{stats.friendCount}</div>
              <div className="text-xs text-gray-600">Friends</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{stats.totalPoints}</div>
              <div className="text-xs text-gray-600">Points</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.achievementsCompleted}</div>
              <div className="text-xs text-gray-600">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{stats.currentStreak}</div>
              <div className="text-xs text-gray-600">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const experienceProgress = stats.experienceToNext > 0
    ? (stats.experience / stats.experienceToNext) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Level and Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Level & Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white font-bold",
                getLevelColor(stats.level)
              )}>
                {stats.level}
              </div>
              <div>
                <h3 className="font-semibold text-lg">Level {stats.level}</h3>
                <p className="text-sm text-gray-600">
                  Rank #{stats.rank} • {formatNumber(stats.experience)} XP
                </p>
              </div>
            </div>
            <Badge variant="outline" className={cn(
              "text-sm",
              stats.level >= 50 ? "border-purple-300 text-purple-700" :
              stats.level >= 30 ? "border-blue-300 text-blue-700" :
              stats.level >= 20 ? "border-green-300 text-green-700" :
              stats.level >= 10 ? "border-yellow-300 text-yellow-700" :
              "border-gray-300 text-gray-700"
            )}>
              {stats.level >= 50 ? "Master" :
               stats.level >= 30 ? "Expert" :
               stats.level >= 20 ? "Advanced" :
               stats.level >= 10 ? "Intermediate" : "Beginner"}
            </Badge>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Experience Progress</span>
              <span>{stats.experience} / {stats.experienceToNext} XP</span>
            </div>
            <Progress value={experienceProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Social Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Social Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-xl font-bold text-blue-600">{formatNumber(stats.friendCount)}</div>
              <div className="text-sm text-gray-600">Friends</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Heart className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-xl font-bold text-red-600">{formatNumber(stats.followerCount)}</div>
              <div className="text-sm text-gray-600">Followers</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-xl font-bold text-green-600">{formatNumber(stats.followingCount)}</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-xl font-bold text-purple-600">{formatNumber(stats.postCount)}</div>
              <div className="text-sm text-gray-600">Posts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Stats */}
      {showDetailed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Activity Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Eye className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                <div className="text-xl font-bold text-yellow-600">{formatNumber(stats.totalViews)}</div>
                <div className="text-sm text-gray-600">Profile Views</div>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <Heart className="h-6 w-6 mx-auto mb-2 text-pink-600" />
                <div className="text-xl font-bold text-pink-600">{formatNumber(stats.totalLikes)}</div>
                <div className="text-sm text-gray-600">Total Likes</div>
              </div>
              <div className="text-center p-4 bg-cyan-50 rounded-lg">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-cyan-600" />
                <div className="text-xl font-bold text-cyan-600">{formatNumber(stats.totalComments)}</div>
                <div className="text-sm text-gray-600">Comments</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievement Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Achievement Progress</h3>
              <p className="text-sm text-gray-600">
                {stats.achievementsCompleted} of {stats.totalAchievements} completed
              </p>
            </div>
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              <Star className="h-3 w-3 mr-1" />
              {stats.totalPoints} Points
            </Badge>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Completion Rate</span>
              <span>
                {stats.totalAchievements > 0
                  ? Math.round((stats.achievementsCompleted / stats.totalAchievements) * 100)
                  : 0}%
              </span>
            </div>
            <Progress
              value={stats.totalAchievements > 0
                ? (stats.achievementsCompleted / stats.totalAchievements) * 100
                : 0}
              className="h-2"
            />
          </div>

          {/* Recent Badges */}
          {stats.badges.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Recent Badges</h4>
              <div className="flex flex-wrap gap-2">
                {stats.badges.slice(0, 6).map((badge) => (
                  <Badge
                    key={badge.id}
                    variant="outline"
                    className="text-xs border-amber-300 text-amber-700"
                    title={badge.description}
                  >
                    {badge.icon} {badge.name}
                  </Badge>
                ))}
                {stats.badges.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{stats.badges.length - 6} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streak Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Activity Streaks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
              <div className={cn(
                "text-2xl font-bold mb-1",
                getStreakColor(stats.currentStreak)
              )}>
                {stats.currentStreak}
              </div>
              <div className="text-sm text-gray-600">Current Streak</div>
              <div className="text-xs text-gray-500 mt-1">days in a row</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stats.longestStreak}
              </div>
              <div className="text-sm text-gray-600">Longest Streak</div>
              <div className="text-xs text-gray-500 mt-1">days in a row</div>
            </div>
          </div>

          {/* Membership Info */}
          <div className="mt-4 pt-4 border-t text-center">
            <div className="text-sm text-gray-600">
              Member since {formatDate(stats.joinDate)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last active {formatDate(stats.lastActive)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isOwnProfile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm">
                <Trophy className="h-4 w-4 mr-2" />
                View All Achievements
              </Button>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Find Friends
              </Button>
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Activity History
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}