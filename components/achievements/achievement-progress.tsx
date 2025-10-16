"use client";

import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Star, TrendingUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementProgressProps {
  achievements: Array<{
    id: string;
    type: string;
    title: string;
    currentValue: number;
    targetValue: number;
    isCompleted: boolean;
    rewards: {
      points: number;
      border?: string;
    };
  }>;
  showStats?: boolean;
  compact?: boolean;
}

export function AchievementProgress({
  achievements,
  showStats = true,
  compact = false
}: AchievementProgressProps) {
  const completedCount = achievements.filter(a => a.isCompleted).length;
  const totalCount = achievements.length;
  const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const totalPoints = achievements
    .filter(a => a.isCompleted)
    .reduce((sum, a) => sum + (a.rewards?.points || 0), 0);

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    if (progress >= 75) return "bg-gradient-to-r from-green-400 to-green-600";
    if (progress >= 50) return "bg-gradient-to-r from-blue-400 to-blue-600";
    if (progress >= 25) return "bg-gradient-to-r from-orange-400 to-orange-600";
    return "bg-gradient-to-r from-gray-400 to-gray-600";
  };

  const getAchievementStats = () => {
    const categories = {
      forum: achievements.filter(a => a.type.includes("FORUM")),
      social: achievements.filter(a => a.type.includes("SOCIAL") || a.type.includes("FRIEND")),
      engagement: achievements.filter(a =>
        a.type.includes("COMMENT") ||
        a.type.includes("HELPFUL") ||
        a.type.includes("ACTIVE")
      ),
      collection: achievements.filter(a => a.type.includes("COLLECTOR") || a.type.includes("POINTS"))
    };

    return Object.entries(categories).map(([key, items]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      completed: items.filter(a => a.isCompleted).length,
      total: items.length,
      progress: items.length > 0 ? (items.filter(a => a.isCompleted).length / items.length) * 100 : 0,
      icon: getCategoryIcon(key)
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "forum": return <Trophy className="h-4 w-4" />;
      case "social": return <Star className="h-4 w-4" />;
      case "engagement": return <TrendingUp className="h-4 w-4" />;
      case "collection": return <Award className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  if (compact) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-800">Achievement Progress</span>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              {completedCount}/{totalCount}
            </Badge>
          </div>

          <Progress
            value={overallProgress}
            className="h-2 mb-2"
          />

          <div className="flex justify-between text-xs text-gray-600">
            <span>{overallProgress.toFixed(0)}% Complete</span>
            <span>{totalPoints} points earned</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = getAchievementStats();

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Achievements Completed</span>
                <span className="font-semibold text-gray-800">
                  {completedCount} of {totalCount}
                </span>
              </div>
              <Progress
                value={overallProgress}
                className="h-3"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{overallProgress.toFixed(0)}% Complete</span>
                <span>{totalCount - completedCount} remaining</span>
              </div>
            </div>

            {showStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{completedCount}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{totalPoints}</div>
                  <div className="text-sm text-gray-600">Points Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {overallProgress.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {achievements.filter(a => a.rewards?.border).length}
                  </div>
                  <div className="text-sm text-gray-600">Border Rewards</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Progress */}
      {showStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              Progress by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1.5 rounded-full text-white",
                        category.name === "Forum" && "bg-blue-500",
                        category.name === "Social" && "bg-green-500",
                        category.name === "Engagement" && "bg-purple-500",
                        category.name === "Collection" && "bg-orange-500"
                      )}>
                        {category.icon}
                      </div>
                      <span className="font-medium text-gray-800">{category.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {category.completed}/{category.total}
                    </Badge>
                  </div>
                  <Progress
                    value={category.progress}
                    className="h-2"
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {category.progress.toFixed(0)}% complete
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {achievements
              .filter(a => a.isCompleted)
              .slice(0, 5)
              .map((achievement) => {
                const progress = (achievement.currentValue / achievement.targetValue) * 100;
                return (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200"
                  >
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-800">
                          {achievement.title}
                        </h4>
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                          Completed
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-yellow-100 rounded-full h-1.5">
                          <div
                            className="bg-yellow-500 h-full rounded-full"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {achievement.currentValue}/{achievement.targetValue}
                        </span>
                      </div>
                      {achievement.rewards?.points && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs font-medium text-yellow-700">
                            +{achievement.rewards.points} points
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            {achievements.filter(a => a.isCompleted).length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No achievements completed yet</p>
                <p className="text-xs">Start participating in the forum to earn achievements!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Progress Ring Component for Circular Progress Display
export function AchievementProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            "transition-all duration-500 ease-out",
            progress >= 100 && "text-yellow-500",
            progress >= 75 && progress < 100 && "text-green-500",
            progress >= 50 && progress < 75 && "text-blue-500",
            progress >= 25 && progress < 50 && "text-orange-500",
            progress < 25 && "text-gray-400"
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-800">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}