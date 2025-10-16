"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, X, Sparkles, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementNotificationProps {
  achievement: {
    id: string;
    title: string;
    description: string;
    rewards: {
      points: number;
      border?: string;
    };
  };
  onClose: () => void;
  onClaimReward?: () => void;
  show?: boolean;
}

export function AchievementNotification({
  achievement,
  onClose,
  onClaimReward,
  show = true
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (show) {
      // Trigger entrance animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [show]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleClaimReward = async () => {
    if (onClaimReward) {
      setIsClaiming(true);
      try {
        await onClaimReward();
      } finally {
        setIsClaiming(false);
      }
    }
    handleClose();
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card
        className={cn(
          "bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 border-yellow-300 shadow-2xl transform transition-all duration-300",
          isVisible
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-full opacity-0 scale-95"
        )}
      >
        <CardContent className="p-6 relative">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 h-8 w-8 p-0"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Achievement Icon with Sparkles */}
          <div className="flex items-center justify-center mb-4 relative">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-4 shadow-lg">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              {/* Sparkle Effects */}
              <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-yellow-500 animate-bounce" />
              <Sparkles className="absolute -bottom-2 -left-2 h-3 w-3 text-yellow-400 animate-bounce delay-100" />
              <Sparkles className="absolute top-0 -left-3 h-3 w-3 text-yellow-400 animate-bounce delay-200" />
            </div>
          </div>

          {/* Achievement Content */}
          <div className="text-center space-y-3">
            <div>
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 mb-2">
                Achievement Unlocked!
              </Badge>
              <h3 className="text-xl font-bold text-gray-800 mb-1">
                {achievement.title}
              </h3>
              <p className="text-sm text-gray-600">
                {achievement.description}
              </p>
            </div>

            {/* Rewards Display */}
            <div className="bg-white/50 rounded-lg p-3 space-y-2">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                Rewards Earned:
              </div>

              {achievement.rewards?.points && (
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="font-bold text-yellow-800">
                      +{achievement.rewards.points} Points
                    </span>
                  </div>
                </div>
              )}

              {achievement.rewards?.border && (
                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full">
                    <Gift className="h-4 w-4 text-purple-600" />
                    <span className="font-bold text-purple-800 text-sm">
                      {achievement.rewards.border} Border
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {onClaimReward && (
                <Button
                  onClick={handleClaimReward}
                  disabled={isClaiming}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
                >
                  {isClaiming ? "Claiming..." : "Claim Reward"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                {onClaimReward ? "Later" : "Awesome!"}
              </Button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse delay-100" />
        </CardContent>
      </Card>
    </div>
  );
}

// Multiple Achievement Notifications Queue
export function AchievementNotificationQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);

  const addNotification = (achievement: any) => {
    setQueue(prev => [...prev, achievement]);
  };

  const handleNext = () => {
    setQueue(prev => prev.slice(1));
    setCurrent(null);
  };

  useEffect(() => {
    if (queue.length > 0 && !current) {
      setCurrent(queue[0]);
    }
  }, [queue, current]);

  return (
    <>
      {current && (
        <AchievementNotification
          achievement={current}
          onClose={handleNext}
        />
      )}
    </>
  );
}

// Achievement Milestone Notification for Special Achievements
export function AchievementMilestoneNotification({
  milestone,
  onClose
}: {
  milestone: {
    title: string;
    description: string;
    milestoneNumber: number;
    totalAchievements: number;
  };
  onClose: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card
        className={cn(
          "bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600 text-white border-0 shadow-2xl transform transition-all duration-500 max-w-md mx-4",
          isVisible
            ? "scale-100 opacity-100"
            : "scale-50 opacity-0"
        )}
      >
        <CardContent className="p-8 text-center relative">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Milestone Display */}
          <div className="mb-6">
            <div className="relative inline-block">
              <div className="text-6xl font-bold text-white/20">
                {milestone.milestoneNumber}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className="h-12 w-12 text-yellow-300" />
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {milestone.title}
          </h2>
          <p className="text-white/90 mb-4">
            {milestone.description}
          </p>

          <div className="bg-white/20 rounded-lg p-4 mb-6">
            <div className="text-sm text-white/70 mb-1">
              Achievement Progress
            </div>
            <div className="text-lg font-semibold">
              {milestone.milestoneNumber} of {milestone.totalAchievements}
            </div>
          </div>

          <Button
            onClick={handleClose}
            className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold"
          >
            Continue Journey
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Mini Achievement Toast for Quick Notifications
export function AchievementToast({
  achievement,
  onClose
}: {
  achievement: {
    title: string;
    rewards: {
      points: number;
    };
  };
  onClose: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-3 transform transition-all duration-300 max-w-sm",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-full opacity-0"
      )}
    >
      <div className="bg-white/20 rounded-full p-2">
        <Trophy className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm">Achievement Unlocked!</div>
        <div className="text-xs text-white/90">{achievement.title}</div>
        <div className="flex items-center gap-1 mt-1">
          <Star className="h-3 w-3" />
          <span className="text-xs font-semibold">
            +{achievement.rewards.points} points
          </span>
        </div>
      </div>
    </div>
  );
}