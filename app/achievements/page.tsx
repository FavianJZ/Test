"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target } from "lucide-react";
import { LevelAchievement } from "@/components/achievements/level-achievement";

export default function AchievementsPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-green-500 to-green-700 text-white border-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">Achievement System</h1>
                    <p className="text-white/90 text-lg">
                      Track your progress, unlock rewards, and master your social journey
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/80 mb-1">Welcome back,</div>
                    <div className="text-xl font-semibold">{session?.user?.name || 'Guest'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Level Progression System */}
          <div className="space-y-6">
        

            {session?.user?.id ? (
              <LevelAchievement userId={session.user.id} />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Sign In Required
                  </h2>
                  <p className="text-gray-600 mb-6">
                    You need to be signed in to view your achievement progress.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}