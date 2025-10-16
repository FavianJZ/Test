"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AchievementRewards } from "@/components/achievements/achievement-rewards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export default function RewardsPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
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

            <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
                    <Gift className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Achievement Rewards</h1>
                    <p className="text-white/90 text-lg">
                      Redeem your achievement points for exclusive rewards
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rewards Content */}
          {session?.user?.id ? (
            <AchievementRewards userId={session.user.id} />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Gift className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Sign In Required
                </h2>
                <p className="text-gray-600 mb-6">
                  You need to be signed in to view and claim achievement rewards.
                </p>
                <Button asChild>
                  <Link href="/auth">
                    Sign In to View Rewards
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}