"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Gift, Star, Lock, Unlock, Crown, Sparkles, Package } from "lucide-react";
import { FlexibleAvatar } from "@/components/ui/flexible-avatar";
import { useUserBorder } from "@/hooks/useUserBorder";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Reward {
  id: string;
  type: "points" | "border" | "title" | "badge";
  name: string;
  description: string;
  value: number | string;
  imageUrl?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  isUnlocked: boolean;
  unlockedAt?: string;
  requiredPoints: number;
  currentPoints: number;
}

interface AchievementRewardProps {
  userId: string;
  showLocked?: boolean;
  compact?: boolean;
}

export function AchievementRewards({
  userId,
  showLocked = true,
  compact = false
}: AchievementRewardProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPoints, setUserPoints] = useState(0);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const { border: userBorder } = useUserBorder(userId);

  useEffect(() => {
    fetchRewards();
  }, [userId]);

  const fetchRewards = async () => {
    try {
      const response = await fetch(`/api/achievements/rewards?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRewards(data.rewards || []);
        setUserPoints(data.userPoints || 0);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
      toast.error("Gagal memuat rewards");
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (rewardId: string) => {
    try {
      const response = await fetch(`/api/achievements/rewards/${rewardId}/claim`, {
        method: "POST"
      });
      if (response.ok) {
        toast.success("Reward berhasil diklaim!");
        fetchRewards(); // Refresh rewards
      } else {
        const error = await response.json();
        toast.error(error.message || "Gagal mengklaim reward");
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast.error("Terjadi kesalahan saat mengklaim reward");
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white";
      case "epic": return "bg-gradient-to-r from-purple-400 to-pink-500 text-white";
      case "rare": return "bg-gradient-to-r from-blue-400 to-cyan-500 text-white";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case "legendary": return "border-yellow-400 shadow-yellow-200";
      case "epic": return "border-purple-400 shadow-purple-200";
      case "rare": return "border-blue-400 shadow-blue-200";
      default: return "border-gray-300";
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "points": return <Star className="h-6 w-6" />;
      case "border": return <Package className="h-6 w-6" />;
      case "title": return <Crown className="h-6 w-6" />;
      case "badge": return <Gift className="h-6 w-6" />;
      default: return <Gift className="h-6 w-6" />;
    }
  };

  const canUnlockReward = (reward: Reward) => {
    return userPoints >= reward.requiredPoints;
  };

  const RewardCard = ({ reward }: { reward: Reward }) => {
    const canUnlock = canUnlockReward(reward);
    const progress = Math.min((userPoints / reward.requiredPoints) * 100, 100);

    return (
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer",
          getRarityBorder(reward.rarity),
          reward.isUnlocked
            ? "bg-gradient-to-br from-green-50 to-emerald-50"
            : canUnlock
            ? "bg-gradient-to-br from-blue-50 to-indigo-50"
            : "bg-gray-50 opacity-75"
        )}
        onClick={() => setSelectedReward(reward)}
      >
        {reward.rarity !== "common" && (
          <div className="absolute top-2 right-2">
            <Badge className={cn("text-xs", getRarityColor(reward.rarity))}>
              {reward.rarity.toUpperCase()}
            </Badge>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-full",
              reward.isUnlocked
                ? "bg-green-100 text-green-600"
                : canUnlock
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-400"
            )}>
              {getRewardIcon(reward.type)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-800">
                {reward.name}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {reward.description}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Progress to Unlock */}
            {!reward.isUnlocked && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">
                    {userPoints} / {reward.requiredPoints} points
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-gray-500 mt-1">
                  {progress.toFixed(0)}% Complete
                </div>
              </div>
            )}

            {/* Reward Value Display */}
            <div className="flex items-center gap-2 pt-2 border-t">
              {reward.type === "points" && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-yellow-700">
                    +{reward.value} points
                  </span>
                </div>
              )}
              {reward.type === "border" && (
                <Badge variant="outline" className="text-purple-700 border-purple-300">
                  <Package className="h-3 w-3 mr-1" />
                  {reward.value} Border
                </Badge>
              )}
              {reward.type === "title" && (
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  <Crown className="h-3 w-3 mr-1" />
                  {reward.value}
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {reward.isUnlocked ? (
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    // View reward details
                  }}
                >
                  <Unlock className="h-3 w-3 mr-1" />
                  Unlocked
                </Button>
              ) : canUnlock ? (
                <Button
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    claimReward(reward.id);
                  }}
                >
                  <Gift className="h-3 w-3 mr-1" />
                  Claim Reward
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Locked
                </Button>
              )}
            </div>

            {/* Unlock Date */}
            {reward.unlockedAt && (
              <div className="text-xs text-gray-500 pt-2 border-t">
                Unlocked: {new Date(reward.unlockedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </div>
            )}
          </div>
        </CardContent>

        {/* Special Effects for Legendary Rewards */}
        {reward.rarity === "legendary" && !reward.isUnlocked && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-yellow-300 rounded-full animate-pulse delay-100" />
            <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse delay-200" />
          </div>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const unlockedRewards = rewards.filter(r => r.isUnlocked);
  const availableRewards = rewards.filter(r => !r.isUnlocked && canUnlockReward(r));
  const lockedRewards = rewards.filter(r => !r.isUnlocked && !canUnlockReward(r));

  if (compact) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            Achievement Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">Your Points</div>
            <div className="font-bold text-lg text-purple-600">{userPoints}</div>
          </div>
          <div className="space-y-2">
            {rewards.slice(0, 3).map((reward) => (
              <div
                key={reward.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className={cn(
                  "p-2 rounded-full",
                  reward.isUnlocked
                    ? "bg-green-100 text-green-600"
                    : canUnlockReward(reward)
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-400"
                )}>
                  {getRewardIcon(reward.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {reward.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {reward.isUnlocked ? "Unlocked" : `${reward.requiredPoints} points`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Points Summary */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <FlexibleAvatar
              src="" // User image would go here
              name="You"
              userBorder={userBorder}
              size="xl"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Achievement Rewards
              </h2>
              <p className="text-gray-600 mb-4">
                Use your achievement points to unlock exclusive rewards
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{userPoints}</div>
                  <div className="text-sm text-gray-600">Available Points</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{unlockedRewards.length}</div>
                  <div className="text-sm text-gray-600">Rewards Unlocked</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{availableRewards.length}</div>
                  <div className="text-sm text-gray-600">Available Now</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Rewards */}
      {unlockedRewards.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Unlock className="h-5 w-5 text-green-600" />
            Unlocked Rewards ({unlockedRewards.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unlockedRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </div>
      )}

      {/* Available Rewards */}
      {availableRewards.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-600" />
            Available to Claim ({availableRewards.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </div>
      )}

      {/* Locked Rewards */}
      {showLocked && lockedRewards.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-gray-600" />
            Locked Rewards ({lockedRewards.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lockedRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        </div>
      )}

      {/* Reward Detail Modal */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedReward && getRewardIcon(selectedReward.type)}
              {selectedReward?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="text-center">
                {selectedReward.imageUrl && (
                  <img
                    src={selectedReward.imageUrl}
                    alt={selectedReward.name}
                    className="w-32 h-32 mx-auto rounded-lg object-cover mb-4"
                  />
                )}
                <p className="text-gray-600">{selectedReward.description}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedReward.requiredPoints}
                    </div>
                    <div className="text-sm text-gray-600">Points Required</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {selectedReward.value}
                    </div>
                    <div className="text-sm text-gray-600">Reward Value</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {selectedReward.isUnlocked ? (
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    <Unlock className="h-4 w-4 mr-2" />
                    Already Unlocked
                  </Button>
                ) : canUnlockReward(selectedReward) ? (
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      claimReward(selectedReward.id);
                      setSelectedReward(null);
                    }}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Claim Reward
                  </Button>
                ) : (
                  <Button className="flex-1" disabled>
                    <Lock className="h-4 w-4 mr-2" />
                    Need {selectedReward.requiredPoints - userPoints} more points
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}