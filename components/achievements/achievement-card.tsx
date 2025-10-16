"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Lock, Unlock, Award, Target, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  achievement: {
    id: string;
    type: string;
    title: string;
    description: string;
    targetValue: number;
    currentValue: number;
    isCompleted: boolean;
    completedAt?: string;
    rewards: {
      points: number;
      border?: string;
    };
  };
  size?: "sm" | "md" | "lg";
  showRewards?: boolean;
  onClaimReward?: (achievementId: string) => void;
  isClaiming?: boolean;
}

export function AchievementCard({
  achievement,
  size = "md",
  showRewards = true,
  onClaimReward,
  isClaiming = false
}: AchievementCardProps) {
  const progress = (achievement.currentValue / achievement.targetValue) * 100;

  const sizeClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };

  const titleSizes = {
    sm: "text-sm font-semibold",
    md: "text-lg font-semibold",
    lg: "text-xl font-bold"
  };

  const getAchievementIcon = () => {
    const iconClass = cn(
      iconSizes[size],
      achievement.isCompleted ? "text-yellow-600" : "text-gray-400"
    );

    if (achievement.type.includes("FORUM")) return <Trophy className={iconClass} />;
    if (achievement.type.includes("SOCIAL")) return <Star className={iconClass} />;
    if (achievement.type.includes("COLLECTOR")) return <Award className={iconClass} />;
    return <Target className={iconClass} />;
  };

  const getCompletionColor = () => {
    if (achievement.isCompleted) {
      return "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200";
    }
    return "bg-white border-gray-200";
  };

  const getProgressColor = () => {
    if (achievement.isCompleted) return "bg-yellow-100";
    if (progress >= 75) return "bg-green-100";
    if (progress >= 50) return "bg-blue-100";
    if (progress >= 25) return "bg-orange-100";
    return "bg-gray-100";
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        getCompletionColor(),
        size === "sm" ? "hover:scale-105" : ""
      )}
    >
      <CardHeader className={cn("pb-3", sizeClasses[size])}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full transition-all duration-300",
              achievement.isCompleted
                ? "bg-yellow-100 shadow-lg shadow-yellow-100/50"
                : "bg-gray-100"
            )}>
              {getAchievementIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className={cn(titleSizes[size], "text-gray-800 truncate")}>
                {achievement.title}
              </CardTitle>
              {size !== "sm" && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {achievement.description}
                </p>
              )}
            </div>
          </div>

          {achievement.isCompleted && (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 shrink-0">
              <Unlock className="h-3 w-3 mr-1" />
              Selesai
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn("pt-0 space-y-3", size === "sm" ? "pb-3" : "pb-6")}>
        {/* Progress Section */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium text-gray-800">
              {achievement.currentValue} / {achievement.targetValue}
            </span>
          </div>
          <Progress
            value={progress}
            className={cn("h-2", getProgressColor())}
          />
          <div className="text-xs text-gray-500 mt-1">
            {progress.toFixed(0)}% Complete
          </div>
        </div>

        {/* Rewards Section */}
        {showRewards && (achievement.rewards?.points || achievement.rewards?.border) && (
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              {achievement.rewards?.points && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-yellow-700">
                    +{achievement.rewards.points} poin
                  </span>
                </div>
              )}
              {achievement.rewards?.border && (
                <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                  <Gift className="h-3 w-3 mr-1" />
                  {achievement.rewards.border}
                </Badge>
              )}
            </div>

            {onClaimReward && achievement.isCompleted && !achievement.completedAt && (
              <Button
                size="sm"
                onClick={() => onClaimReward(achievement.id)}
                disabled={isClaiming}
                className="shrink-0"
              >
                {isClaiming ? "Mengklaim..." : "Klaim Reward"}
              </Button>
            )}
          </div>
        )}

        {/* Completion Date */}
        {achievement.completedAt && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Diselesaikan: {new Date(achievement.completedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </div>
          </div>
        )}

        {/* Special Effects for Completed Achievements */}
        {achievement.isCompleted && (
          <div className="absolute -top-2 -right-2 w-6 h-6">
            <div className="w-full h-full bg-yellow-400 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Star className="h-3 w-3 text-white fill-white" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Special Achievement Card for Featured/Spotlight Achievements
export function FeaturedAchievementCard({
  achievement,
  onClick
}: {
  achievement: AchievementCardProps["achievement"];
  onClick?: () => void;
}) {
  return (
    <Card
      className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600 text-white border-0 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div>
            <Badge className="bg-white/20 text-white border-white/30 mb-2">
              <Star className="h-3 w-3 mr-1" />
              Featured Achievement
            </Badge>
            <h3 className="text-2xl font-bold">{achievement.title}</h3>
          </div>
        </div>

        <p className="text-white/90 mb-6 text-lg">
          {achievement.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {achievement.rewards?.points && (
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-300" />
                <span className="font-bold text-yellow-300">
                  +{achievement.rewards.points} poin
                </span>
              </div>
            )}
            {achievement.rewards?.border && (
              <Badge className="bg-white/20 text-white border-white/30">
                <Gift className="h-3 w-3 mr-1" />
                {achievement.rewards.border}
              </Badge>
            )}
          </div>

          <div className="text-right">
            <div className="text-sm text-white/70">Progress</div>
            <div className="text-lg font-bold">
              {achievement.currentValue} / {achievement.targetValue}
            </div>
          </div>
        </div>

        {achievement.isCompleted && (
          <div className="absolute top-4 right-4">
            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
              COMPLETED
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// Mini Achievement Card for Sidebars or Compact Displays
export function MiniAchievementCard({
  achievement,
  onClick
}: {
  achievement: AchievementCardProps["achievement"];
  onClick?: () => void;
}) {
  const progress = (achievement.currentValue / achievement.targetValue) * 100;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer hover:shadow-sm"
      onClick={onClick}
    >
      <div className={cn(
        "p-2 rounded-full shrink-0",
        achievement.isCompleted
          ? "bg-yellow-100 text-yellow-600"
          : "bg-gray-100 text-gray-400"
      )}>
        <Trophy className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-gray-800 truncate">
            {achievement.title}
          </h4>
          {achievement.isCompleted && (
            <Star className="h-3 w-3 text-yellow-500" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                achievement.isCompleted
                  ? "bg-yellow-500"
                  : "bg-blue-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">
            {achievement.currentValue}/{achievement.targetValue}
          </span>
        </div>
      </div>
    </div>
  );
}