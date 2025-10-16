"use client";

import { LevelAchievement } from "./level-achievement";
import { useSession } from "next-auth/react";

export function AchievementSystem() {
  const { data: session } = useSession();
  return <LevelAchievement userId={session?.user?.id || ""} />;
}