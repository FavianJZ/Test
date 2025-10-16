"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Crown, Star, TrendingUp, Users } from "lucide-react";
import { FlexibleAvatar } from "@/components/ui/flexible-avatar";
import { useUserBorder } from "@/hooks/useUserBorder";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  userId: string;
  name: string;
  image?: string;
  totalPoints: number;
  achievementsCompleted: number;
  rank: number;
  previousRank?: number;
  recentAchievement?: {
    title: string;
    completedAt: string;
  };
}

interface AchievementLeaderboardProps {
  showCurrentUser?: boolean;
  maxEntries?: number;
  compact?: boolean;
}

export function AchievementLeaderboard({
  showCurrentUser = true,
  maxEntries = 10,
  compact = false
}: AchievementLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<"all" | "monthly" | "weekly">("all");
  const [selectedCategory, setSelectedCategory] = useState<"points" | "achievements" | "streak">("points");

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedPeriod, selectedCategory]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/achievements/leaderboard?period=${selectedPeriod}&category=${selectedCategory}&limit=${maxEntries}`
      );
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white border-gray-400";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white border-amber-500";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getRankChange = (current: number, previous?: number) => {
    if (previous === undefined) return null;
    if (current < previous) {
      return { icon: <TrendingUp className="h-4 w-4 text-green-500" />, text: `+${previous - current}` };
    }
    if (current > previous) {
      return { icon: <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />, text: `-${current - previous}` };
    }
    return { icon: <div className="h-4 w-4 bg-gray-400 rounded-full" />, text: "-" };
  };

  const LeaderboardEntry = ({ entry, isCurrentUser = false }: { entry: LeaderboardEntry; isCurrentUser?: boolean }) => {
    const { border: userBorder } = useUserBorder(entry.userId);
    const rankChange = getRankChange(entry.rank, entry.previousRank);

    return (
      <div
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg transition-all duration-200",
          isCurrentUser
            ? "bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 shadow-md"
            : "bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm",
          compact && "p-3"
        )}
      >
        {/* Rank */}
        <div className="flex items-center justify-center w-12 shrink-0">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full border-2",
            getRankBadgeColor(entry.rank)
          )}>
            {getRankIcon(entry.rank)}
          </div>
        </div>

        {/* User Avatar and Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FlexibleAvatar
            src={entry.image}
            name={entry.name}
            userBorder={userBorder}
            size={compact ? "sm" : "md"}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-semibold text-gray-800 truncate",
                isCurrentUser && "text-blue-600"
              )}>
                {entry.name}
              </h3>
              {isCurrentUser && (
                <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                  You
                </Badge>
              )}
            </div>
            {entry.recentAchievement && !compact && (
              <div className="flex items-center gap-1 mt-1">
                <Trophy className="h-3 w-3 text-yellow-500" />
                <span className="text-xs text-gray-600 truncate">
                  {entry.recentAchievement.title}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-2">
            <div>
              <div className="font-bold text-lg text-gray-800">
                {selectedCategory === "points" ? entry.totalPoints : entry.achievementsCompleted}
              </div>
              <div className="text-xs text-gray-500">
                {selectedCategory === "points" ? "points" : "achievements"}
              </div>
            </div>
            {rankChange && !compact && (
              <div className="flex items-center gap-1">
                {rankChange.icon}
                <span className="text-xs text-gray-500">{rankChange.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            Achievement Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="w-12 h-8 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            Achievement Leaderboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              {leaderboard.length} users
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Time</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="points">Points</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="streak">Streak</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Top 3 Podium */}
          {!compact && leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {leaderboard.slice(0, 3).map((entry, index) => {
                const { border: userBorder } = useUserBorder(entry.userId);
                const podiumColors = [
                  "bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-500",
                  "bg-gradient-to-br from-gray-300 to-gray-500 border-gray-400",
                  "bg-gradient-to-br from-amber-400 to-amber-600 border-amber-500"
                ];

                return (
                  <div
                    key={entry.userId}
                    className={cn(
                      "text-center p-4 rounded-lg border-2 transform transition-all duration-200 hover:scale-105",
                      podiumColors[index],
                      index === 1 && "mt-2"
                    )}
                  >
                    <div className="mb-2">
                      {getRankIcon(index + 1)}
                    </div>
                    <FlexibleAvatar
                      src={entry.image}
                      name={entry.name}
                      userBorder={userBorder}
                      size="lg"
                      className="mx-auto mb-2"
                    />
                    <h3 className="font-bold text-white truncate">
                      {entry.name}
                    </h3>
                    <div className="text-white/90 text-sm">
                      {selectedCategory === "points" ? entry.totalPoints : entry.achievementsCompleted}
                      <span className="text-xs text-white/70 ml-1">
                        {selectedCategory === "points" ? "pts" : "achs"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaderboard List */}
          <div className="space-y-2">
            {(compact ? leaderboard : leaderboard.slice(compact ? 0 : 3)).map((entry) => {
              // In a real app, you'd get the current user ID from session
              const isCurrentUser = false; // entry.userId === currentUserId;
              return (
                <LeaderboardEntry
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={isCurrentUser}
                />
              );
            })}

            {leaderboard.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No leaderboard data available</p>
                <p className="text-sm">Start completing achievements to appear on the leaderboard!</p>
              </div>
            )}
          </div>

          {/* Load More Button */}
          {!compact && leaderboard.length >= maxEntries && (
            <div className="text-center pt-4">
              <Button variant="outline" onClick={fetchLeaderboard}>
                Load More
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact Leaderboard Widget for Sidebars
export function LeaderboardWidget({
  title = "Top Achievers",
  maxEntries = 5
}: {
  title?: string;
  maxEntries?: number;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <AchievementLeaderboard
          compact={true}
          maxEntries={maxEntries}
          showCurrentUser={false}
        />
      </CardContent>
    </Card>
  );
}