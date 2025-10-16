"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Gift, Crown, Zap, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AchievementReward {
  points: number;
  title: string;
  badgeColor: string;
  icon: string;
}

interface ClaimableAchievement {
  id: string;
  type: string;
  title: string;
  description: string;
  level: number;
  rewards: AchievementReward;
  completedAt: string;
  isClaimed: boolean;
}

interface AchievementClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: ClaimableAchievement[];
  onClaimReward: (achievementId: string) => Promise<void>;
  userId: string;
}

export function AchievementClaimModal({
  isOpen,
  onClose,
  achievements,
  onClaimReward,
  userId
}: AchievementClaimModalProps) {
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  const getBadgeColor = (badgeColor: string): string => {
    switch (badgeColor) {
      case 'bronze': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'diamond': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelIcon = (level: number) => {
    if (level >= 10) return <Crown className="h-8 w-8 text-purple-500" />;
    if (level >= 7) return <Star className="h-8 w-8 text-yellow-500" />;
    if (level >= 4) return <Trophy className="h-8 w-8 text-blue-500" />;
    return <Zap className="h-8 w-8 text-green-500" />;
  };

  const handleClaimReward = async (achievement: ClaimableAchievement) => {
    setClaimingIds(prev => new Set(prev).add(achievement.id));

    try {
      await onClaimReward(achievement.id);
      setClaimedIds(prev => new Set(prev).add(achievement.id));

      // Show success notification
      toast.success(`🎉 Reward claimed! +${achievement.rewards.points} points - ${achievement.rewards.title}`, {
        duration: 5000,
        icon: '🏆'
      });

    } catch (error) {
      console.error("Error claiming reward:", error);
      toast.error("Failed to claim reward. Please try again.");
    } finally {
      setClaimingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(achievement.id);
        return newSet;
      });
    }
  };

  const unclaimedAchievements = achievements.filter(a => !a.isClaimed && !claimedIds.has(a.id));
  const hasUnclaimed = unclaimedAchievements.length > 0;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <div>Achievement Rewards Ready!</div>
              <div className="text-sm font-normal text-gray-600">
                Claim your rewards for completed achievements
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {unclaimedAchievements.length} Achievement{unclaimedAchievements.length !== 1 ? 's' : ''} Completed
                  </h3>
                  <p className="text-gray-600">
                    Total rewards: {unclaimedAchievements.reduce((sum, a) => sum + a.rewards.points, 0)} points
                  </p>
                </div>
                <div className="text-right">
                  {hasUnclaimed && (
                    <Button
                      onClick={() => unclaimedAchievements.forEach(a => handleClaimReward(a))}
                      disabled={claimingIds.size > 0}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      Claim All Rewards
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievement Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const isClaimed = achievement.isClaimed || claimedIds.has(achievement.id);
              const isClaiming = claimingIds.has(achievement.id);

              return (
                <Card
                  key={achievement.id}
                  className={`relative overflow-hidden transition-all duration-300 ${
                    isClaimed
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                      : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 hover:shadow-lg'
                  }`}
                >
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          isClaimed
                            ? 'bg-green-100 text-green-600'
                            : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          {getLevelIcon(achievement.level)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {achievement.title}
                          </h4>
                          <p className="text-xs text-gray-600">
                            Level {achievement.level}
                          </p>
                        </div>
                      </div>
                      {isClaimed && (
                        <div className="p-1 bg-green-500 rounded-full">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4">
                      {achievement.description}
                    </p>

                    {/* Rewards */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium text-yellow-700">
                          +{achievement.rewards.points} points
                        </span>
                      </div>
                      <Badge className={getBadgeColor(achievement.rewards.badgeColor)}>
                        {achievement.rewards.title}
                      </Badge>
                    </div>

                    {/* Claim Button */}
                    {!isClaimed && (
                      <Button
                        onClick={() => handleClaimReward(achievement)}
                        disabled={isClaiming}
                        className="w-full mt-4 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      >
                        {isClaiming ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Claiming...
                          </>
                        ) : (
                          <>
                            <Gift className="h-4 w-4 mr-2" />
                            Claim Reward
                          </>
                        )}
                      </Button>
                    )}

                    {/* Completed Date */}
                    {achievement.completedAt && (
                      <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
                        Completed: {new Date(achievement.completedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                  </CardContent>

                  {/* Sparkle Effects for Unclaimed */}
                  {!isClaimed && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      <div className="absolute bottom-3 left-3 w-1 h-1 bg-yellow-300 rounded-full animate-pulse delay-100" />
                      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse delay-200" />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* No Unclaimed Achievements */}
          {!hasUnclaimed && (
            <Card className="text-center">
              <CardContent className="p-12">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  All Rewards Claimed!
                </h3>
                <p className="text-gray-600 mb-6">
                  You've claimed all available achievement rewards. Complete more achievements to earn new rewards!
                </p>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}