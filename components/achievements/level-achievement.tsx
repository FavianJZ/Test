"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Lock, Unlock, Award, Target, Crown, Zap, Gift } from "lucide-react";
import { toast } from "sonner";
import { AchievementClaimModal } from "./achievement-claim-modal";

interface AchievementLevel {
  level: number;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
  isCurrentLevel: boolean;
  progressPercentage: number;
  rewards: {
    points: number;
    title: string;
    badgeColor: string;
    icon: string;
  };
}

interface AchievementCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  levels: AchievementLevel[];
  totalCompleted: number;
  currentLevel: number;
}

interface LevelAchievementProps {
  userId: string;
}

export function LevelAchievement({ userId }: LevelAchievementProps) {
  const [achievements, setAchievements] = useState<AchievementCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [claimableAchievements, setClaimableAchievements] = useState<any[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);

  useEffect(() => {
    fetchAchievements();
    fetchClaimableAchievements();
  }, [userId]);

  const fetchAchievements = async () => {
    try {
      const response = await fetch("/api/achievements/social");
      if (response.ok) {
        const data = await response.json();
        setAchievements(processAchievements(data.achievements));

        // Trigger achievement check to update any completed but not recorded achievements
        await fetch("/api/achievements/check", {
          method: "POST"
        });
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
      toast.error("Gagal memuat achievements");
    }
  };

  const fetchClaimableAchievements = async () => {
    try {
      const response = await fetch("/api/achievements/claim");
      if (response.ok) {
        const data = await response.json();
        setClaimableAchievements(data.achievements || []);
      }
    } catch (error) {
      console.error("Error fetching claimable achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const processAchievements = (rawAchievements: any[]): AchievementCategory[] => {
    const categories = new Map<string, AchievementCategory>();

    rawAchievements.forEach((achievement) => {
      const baseId = achievement.type; // POST_MASTER, COMMENTATOR, SOCIALITE

      if (!categories.has(baseId)) {
        categories.set(baseId, {
          id: baseId,
          name: getAchievementName(baseId),
          description: getAchievementDescription(baseId),
          icon: getAchievementIcon(baseId),
          color: getAchievementColor(baseId),
          levels: [],
          totalCompleted: 0,
          currentLevel: 0
        });
      }

      const category = categories.get(baseId)!;
      category.levels.push({
        level: achievement.level,
        targetValue: achievement.targetValue,
        currentValue: achievement.currentValue,
        isCompleted: achievement.isCompleted,
        isCurrentLevel: achievement.isCurrentLevel,
        progressPercentage: achievement.progressPercentage,
        rewards: achievement.rewards
      });

      // Sort levels by level number
      category.levels.sort((a, b) => a.level - b.level);

      // Calculate completed and current level
      category.totalCompleted = category.levels.filter(l => l.isCompleted).length;
      category.currentLevel = category.totalCompleted;
    });

    return Array.from(categories.values());
  };

  const getAchievementName = (type: string): string => {
    switch (type) {
      // Social
      case 'POST_MASTER': return 'Post Master';
      case 'COMMENTATOR': return 'Commentator';
      case 'SOCIALITE': return 'Socialite';
      case 'FRIEND_COLLECTOR': return 'Friend Collector';
      // Forum
      case 'FORUM_EXPLORER': return 'Forum Explorer';
      case 'DISCUSSION_MASTER': return 'Discussion Master';
      case 'FORUM_LEGEND': return 'Forum Legend';
      // Recipe
      case 'RECIPE_NOVICE': return 'Recipe Novice';
      case 'CULINARY_ARTIST': return 'Culinary Artist';
      case 'MATCHA_MASTER': return 'Matcha Master';
      // Engagement
      case 'DAILY_VISITOR': return 'Daily Visitor';
      case 'ACTIVE_USER': return 'Active User';
      case 'COMMUNITY_HELPER': return 'Community Helper';
      case 'TREND_SETTER': return 'Trend Setter';
      // Collection
      case 'BORDER_COLLECTOR': return 'Border Collector';
      case 'POINTS_HUNTER': return 'Points Hunter';
      case 'ACHIEVEMENT_HUNTER': return 'Achievement Hunter';
      default: return type;
    }
  };

  const getAchievementDescription = (type: string): string => {
    switch (type) {
      // Social
      case 'POST_MASTER': return 'Create social posts and engage with the community';
      case 'COMMENTATOR': return 'Leave thoughtful comments on social posts';
      case 'SOCIALITE': return 'Build your follower network and expand your influence';
      case 'FRIEND_COLLECTOR': return 'Build meaningful friendships in the community';
      // Forum
      case 'FORUM_EXPLORER': return 'Explore and participate in forum discussions';
      case 'DISCUSSION_MASTER': return 'Create engaging forum discussions';
      case 'FORUM_LEGEND': return 'Become a respected member of the forum community';
      // Recipe
      case 'RECIPE_NOVICE': return 'Start your culinary journey by sharing recipes';
      case 'CULINARY_ARTIST': return 'Create popular and loved recipes';
      case 'MATCHA_MASTER': return 'Master the art of matcha preparation';
      // Engagement
      case 'DAILY_VISITOR': return 'Visit the platform regularly';
      case 'ACTIVE_USER': return 'Spend time actively on the platform';
      case 'COMMUNITY_HELPER': return 'Help other community members';
      case 'TREND_SETTER': return 'Start popular trends and discussions';
      // Collection
      case 'BORDER_COLLECTOR': return 'Collect unique profile borders';
      case 'POINTS_HUNTER': return 'Accumulate points through activities';
      case 'ACHIEVEMENT_HUNTER': return 'Complete various achievements';
      default: return 'Complete achievements to earn rewards';
    }
  };

  const getAchievementIcon = (type: string): string => {
    const icons = {
      // Social
      POST_MASTER: '📝',
      COMMENTATOR: '💬',
      SOCIALITE: '👥',
      FRIEND_COLLECTOR: '🤝',
      // Forum
      FORUM_EXPLORER: '🗺️',
      DISCUSSION_MASTER: '💭',
      FORUM_LEGEND: '👑',
      // Recipe
      RECIPE_NOVICE: '👨‍🍳',
      CULINARY_ARTIST: '🎨',
      MATCHA_MASTER: '🍵',
      // Engagement
      DAILY_VISITOR: '📅',
      ACTIVE_USER: '⏰',
      COMMUNITY_HELPER: '🤝',
      TREND_SETTER: '🔥',
      // Collection
      BORDER_COLLECTOR: '🖼️',
      POINTS_HUNTER: '💰',
      ACHIEVEMENT_HUNTER: '🏆'
    };
    return icons[type as keyof typeof icons] || '🏆';
  };

  const getAchievementColor = (type: string): string => {
    const colors = {
      // Social
      POST_MASTER: 'bg-blue-500',
      COMMENTATOR: 'bg-green-500',
      SOCIALITE: 'bg-purple-500',
      FRIEND_COLLECTOR: 'bg-pink-500',
      // Forum
      FORUM_EXPLORER: 'bg-orange-500',
      DISCUSSION_MASTER: 'bg-pink-500',
      FORUM_LEGEND: 'bg-red-500',
      // Recipe
      RECIPE_NOVICE: 'bg-yellow-500',
      CULINARY_ARTIST: 'bg-indigo-500',
      MATCHA_MASTER: 'bg-green-600',
      // Engagement
      DAILY_VISITOR: 'bg-cyan-500',
      ACTIVE_USER: 'bg-blue-600',
      COMMUNITY_HELPER: 'bg-teal-500',
      TREND_SETTER: 'bg-orange-600',
      // Collection
      BORDER_COLLECTOR: 'bg-purple-600',
      POINTS_HUNTER: 'bg-yellow-600',
      ACHIEVEMENT_HUNTER: 'bg-pink-600'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const getAchievementCategory = (category: string): string => {
    switch (category) {
      case 'social': return 'Social';
      case 'forum': return 'Forum';
      case 'recipe': return 'Recipe';
      case 'engagement': return 'Engagement';
      case 'collection': return 'Collection';
      default: return 'General';
    }
  };

  const getBadgeColor = (badgeColor: string): string => {
    switch (badgeColor) {
      case 'bronze': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'diamond': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelIcon = (level: number, isCompleted: boolean, isCurrentLevel: boolean) => {
    if (isCompleted) {
      return <Crown className="h-6 w-6 text-yellow-500" />;
    } else if (isCurrentLevel) {
      return <Zap className="h-6 w-6 text-blue-500" />;
    } else {
      return <Lock className="h-6 w-6 text-gray-400" />;
    }
  };

  const handleClaimReward = async (achievementId: string) => {
    try {
      const response = await fetch("/api/achievements/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievementId })
      });

      if (response.ok) {
        const data = await response.json();

        // Remove claimed achievement from list
        setClaimableAchievements(prev => prev.filter(a => a.id !== achievementId));

        // Refresh achievements to update display
        fetchAchievements();

        return data;
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to claim reward");
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      throw error;
    }
  };

  const AchievementCategoryCard = ({ category }: { category: AchievementCategory }) => {
    const progressPercentage = (category.totalCompleted / 10) * 100;
    const nextLevel = category.levels.find(l => !l.isCompleted);
    const isFullyCompleted = category.totalCompleted === 10;

    return (
      <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg text-white ${category.color}`}>
                <span className="text-2xl">{category.icon}</span>
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  {category.name}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {category.description}
                </p>
              </div>
            </div>

            {isFullyCompleted ? (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Mastered
              </Badge>
            ) : (
              <Badge variant="outline" className="text-sm">
                Level {category.currentLevel}/10
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Overall Progress</span>
              <span className="text-gray-600">
                {category.totalCompleted}/10 Levels
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="text-xs text-gray-500 mt-1">
              {progressPercentage.toFixed(0)}% Complete
            </div>
          </div>

          {/* Current Level Progress */}
          {nextLevel && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                {getLevelIcon(nextLevel.level, nextLevel.isCompleted, nextLevel.isCurrentLevel)}
                <div>
                  <div className="font-medium">Level {nextLevel.level} Progress</div>
                  <div className="text-sm text-gray-600">
                    {nextLevel.currentValue} / {nextLevel.targetValue}
                  </div>
                </div>
              </div>
              <Progress
                value={nextLevel.progressPercentage}
                className={`h-2 ${
                  nextLevel.isCompleted
                    ? 'bg-green-100'
                    : nextLevel.isCurrentLevel
                    ? 'bg-blue-100'
                    : 'bg-gray-100'
                }`}
              />
              <div className="text-xs text-gray-500 mt-1">
                {nextLevel.progressPercentage.toFixed(0)}% to Level {nextLevel.level + 1}
              </div>
            </div>
          )}

          {/* Level Progression Display */}
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-3">Level Progression</div>
            <div className="grid grid-cols-5 gap-2">
              {category.levels.map((level) => (
                <div
                  key={level.level}
                  className={`p-2 rounded-lg text-center border-2 transition-all ${
                    level.isCompleted
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : level.isCurrentLevel
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  <div className="text-xs font-bold">Lv{level.level}</div>
                  <div className="text-xs">
                    {getLevelIcon(level.level, level.isCompleted, level.isCurrentLevel)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Rewards */}
          {nextLevel && (
            <div className="border-t pt-4">
              <div className="text-sm font-medium mb-2">Next Level Rewards</div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-yellow-700">
                    +{nextLevel.rewards.points} points
                  </span>
                </div>
                <Badge className={getBadgeColor(nextLevel.rewards.badgeColor)}>
                  {nextLevel.rewards.title}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {achievements.map((category) => (
          <AchievementCategoryCard
            key={category.id}
            category={category}
          />
        ))}
      </div>

      {/* Floating Claim Button */}
      {claimableAchievements.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            onClick={() => setShowClaimModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg rounded-full px-6 py-4 flex items-center gap-3 animate-pulse"
            size="lg"
          >
            <Gift className="h-6 w-6" />
            <div className="text-left">
              <div className="font-bold">{claimableAchievements.length} Reward{claimableAchievements.length !== 1 ? 's' : ''} Ready!</div>
              <div className="text-xs opacity-90">Click to claim</div>
            </div>
            <div className="bg-white/20 rounded-full px-2 py-1">
              <span className="text-sm font-bold">
                +{claimableAchievements.reduce((sum, a) => sum + a.rewards.points, 0)} pts
              </span>
            </div>
          </Button>
        </div>
      )}

      {/* Achievement Claim Modal */}
      <AchievementClaimModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        achievements={claimableAchievements}
        onClaimReward={handleClaimReward}
        userId={userId}
      />
    </div>
  );
}