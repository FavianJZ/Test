"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, Zap, Plus, TestTube } from "lucide-react";
import { useSession } from "next-auth/react";

export default function AchievementTestPage() {
  const { data: session } = useSession();
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchTestStatus();
    }
  }, [session]);

  const fetchTestStatus = async () => {
    try {
      const response = await fetch("/api/achievements/test");
      if (response.ok) {
        const data = await response.json();
        setCurrentStats(data.currentStats);
        setAchievements(data.achievements);
      }
    } catch (error) {
      console.error("Error fetching test status:", error);
    }
  };

  const runTest = async (action: string, value: number) => {
    setLoading(true);
    try {
      const response = await fetch("/api/achievements/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, value }),
      });

      const result = await response.json();
      setTestResult(result);

      // Refresh stats after test
      await fetchTestStatus();
    } catch (error) {
      console.error("Error running test:", error);
      setTestResult({ success: false, error: "Test failed" });
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Sign In Required
            </h2>
            <p className="text-gray-600">
              You need to be signed in to test achievements.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0">
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
                    <TestTube className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">Achievement Test Lab</h1>
                    <p className="text-white/90 text-lg">
                      Test achievement system with simulated data
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white/80 mb-1">Testing as,</div>
                    <div className="text-xl font-semibold">{session.user.name}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Test Controls */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Test Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={() => runTest('add_posts', 5)}
                      disabled={loading}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      Add 5 Posts (POST_MASTER)
                    </Button>
                    <Button
                      onClick={() => runTest('add_comments', 10)}
                      disabled={loading}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      Add 10 Comments (COMMENTATOR)
                    </Button>
                    <Button
                      onClick={() => runTest('add_followers', 2)}
                      disabled={loading}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      Add 2 Followers (SOCIALITE)
                    </Button>
                    <Button
                      onClick={() => runTest('add_forum_posts', 3)}
                      disabled={loading}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      Add 3 Forum Posts (FORUM_EXPLORER)
                    </Button>
                    <Button
                      onClick={() => runTest('add_recipes', 2)}
                      disabled={loading}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      Add 2 Recipes (RECIPE_NOVICE)
                    </Button>
                    <Button
                      onClick={() => runTest('add_borders', 1)}
                      disabled={loading}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      Add 1 Border (BORDER_COLLECTOR)
                    </Button>
                    <Button
                      onClick={() => runTest('add_active_days', 2)}
                      disabled={loading}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      Add 2 Active Days (DAILY_VISITOR)
                    </Button>
                    <Button
                      onClick={() => runTest('add_active_hours', 3)}
                      disabled={loading}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      Add 3 Active Hours (ACTIVE_USER)
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Test Results */}
              {testResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Test Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`p-4 rounded-lg ${
                      testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className={`font-medium ${
                        testResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {testResult.success ? '✅ Test Passed' : '❌ Test Failed'}
                      </div>
                      <div className="text-sm mt-2 text-gray-600">
                        {testResult.message}
                      </div>
                      {testResult.result && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-sm font-medium">New Achievements:</div>
                          <div className="mt-1">
                            {testResult.result.newAchievements?.map((ach: any, i: number) => (
                              <Badge key={i} variant="secondary" className="mr-2 mb-1">
                                {ach.type} Lv.{ach.level}
                              </Badge>
                            ))}
                          </div>
                          {testResult.result.totalPointsAwarded > 0 && (
                            <div className="text-sm mt-2 text-green-600">
                              +{testResult.result.totalPointsAwarded} points awarded
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Current Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Current Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentStats ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Posts</span>
                          <Badge variant="secondary">{currentStats.posts}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Comments</span>
                          <Badge variant="secondary">{currentStats.comments}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Followers</span>
                          <Badge variant="secondary">{currentStats.followers}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Forum Posts</span>
                          <Badge variant="secondary">{currentStats.forumPosts}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Forum Comments</span>
                          <Badge variant="secondary">{currentStats.forumComments}</Badge>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Recipes</span>
                          <Badge variant="secondary">{currentStats.recipes}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Borders</span>
                          <Badge variant="secondary">{currentStats.borders}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Active Days</span>
                          <Badge variant="secondary">{currentStats.activeDays}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Active Hours</span>
                          <Badge variant="secondary">{currentStats.activeHours || 0}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Points</span>
                          <Badge variant="default">{currentStats.points}</Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Loading stats...
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Achievement Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Achievement Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {achievements.length > 0 ? (
                    <div className="space-y-3">
                      {achievements.map((ach) => (
                        <div key={ach.achievement_type} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{ach.achievement_type}</span>
                            <Badge variant="outline">Level {ach.current_level}</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Current: {ach.current_value} | Completed: {ach.completed_levels?.length || 0} levels
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No achievement progress yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}