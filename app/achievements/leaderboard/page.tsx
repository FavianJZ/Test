"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AchievementLeaderboard } from "@/components/achievements/achievement-leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft, Users, Crown } from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/achievements">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Achievements
              </Button>
            </Link>

            <Card className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Achievement Leaderboard</h1>
                    <p className="text-white/90 text-lg">
                      See who's leading the pack in achievements and points
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard Content */}
          <AchievementLeaderboard
            showCurrentUser={true}
            maxEntries={50}
            compact={false}
          />

          {/* Additional Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  The most dedicated users who have completed the most achievements and earned the highest points.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Track your progress against other community members and climb the ranks through consistent participation.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-green-600" />
                  Recognition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Earn recognition for your contributions and showcase your achievements to the entire community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}