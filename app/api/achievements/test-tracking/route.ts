import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🧪 Testing achievement tracking integration...")

    const body = await request.json()
    const { testType, userId } = body

    if (!userId) {
      return NextResponse.json({
        error: "User ID required for testing"
      }, { status: 400 })
    }

    const {
      onForumThreadCreated,
      onForumCommentCreated,
      onCommentLiked,
      trackActivity,
      getUserAchievements
    } = await import("@/lib/achievements")

    let result = {}
    let testName = ""

    switch (testType) {
      case "thread_created":
        testName = "Forum Thread Creation Tracking"
        console.log(`🧪 Testing: ${testName} for user ${userId}`)

        // Test thread creation tracking
        await onForumThreadCreated(userId)

        // Get updated achievements
        const threadAchievements = await getUserAchievements(userId)
        const discussionAchievement = threadAchievements.find(a => a.type === 'DISCUSSION_STARTER')

        result = {
          tracked: true,
          achievementType: "DISCUSSION_STARTER",
          currentValue: discussionAchievement?.currentValue || 0,
          targetValue: discussionAchievement?.targetValue || 10,
          progress: `${discussionAchievement?.currentValue || 0}/${discussionAchievement?.targetValue || 10}`
        }
        break

      case "comment_created":
        testName = "Forum Comment Creation Tracking"
        console.log(`🧪 Testing: ${testName} for user ${userId}`)

        // Test comment creation tracking
        await onForumCommentCreated(userId)

        // Get updated achievements
        const commentAchievements = await getUserAchievements(userId)
        const socialAchievement = commentAchievements.find(a => a.type === 'SOCIAL_BUTTERFLY')

        result = {
          tracked: true,
          achievementType: "SOCIAL_BUTTERFLY",
          currentValue: socialAchievement?.currentValue || 0,
          targetValue: socialAchievement?.targetValue || 20,
          progress: `${socialAchievement?.currentValue || 0}/${socialAchievement?.targetValue || 20}`
        }
        break

      case "comment_liked":
        testName = "Comment Like Tracking"
        console.log(`🧪 Testing: ${testName} for user ${userId}`)

        // Test comment like tracking
        await onCommentLiked(userId)

        // Get updated achievements
        const likeAchievements = await getUserAchievements(userId)
        const helpfulAchievement = likeAchievements.find(a => a.type === 'HELPFUL_MEMBER')

        result = {
          tracked: true,
          achievementType: "HELPFUL_MEMBER",
          currentValue: helpfulAchievement?.currentValue || 0,
          targetValue: helpfulAchievement?.targetValue || 50,
          progress: `${helpfulAchievement?.currentValue || 0}/${helpfulAchievement?.targetValue || 50}`
        }
        break

      case "all_activities":
        testName = "All Forum Activities Tracking"
        console.log(`🧪 Testing: ${testName} for user ${userId}`)

        // Test all forum activities
        await trackActivity(userId, 'FORUM_THREAD_CREATED', 1)
        await trackActivity(userId, 'FORUM_COMMENT', 1)
        await trackActivity(userId, 'COMMENT_LIKED', 1)

        // Get updated achievements
        const allAchievements = await getUserAchievements(userId)

        result = {
          tracked: true,
          activities: [
            {
              activity: 'FORUM_THREAD_CREATED',
              achievement: 'DISCUSSION_STARTER',
              progress: `${allAchievements.find(a => a.type === 'DISCUSSION_STARTER')?.currentValue || 0}/10`
            },
            {
              activity: 'FORUM_COMMENT',
              achievement: 'SOCIAL_BUTTERFLY',
              progress: `${allAchievements.find(a => a.type === 'SOCIAL_BUTTERFLY')?.currentValue || 0}/20`
            },
            {
              activity: 'COMMENT_LIKED',
              achievement: 'HELPFUL_MEMBER',
              progress: `${allAchievements.find(a => a.type === 'HELPFUL_MEMBER')?.currentValue || 0}/50`
            }
          ]
        }
        break

      default:
        return NextResponse.json({
          error: "Invalid test type. Use: thread_created, comment_created, comment_liked, or all_activities"
        }, { status: 400 })
    }

    console.log(`✅ ${testName} completed successfully`)

    return NextResponse.json({
      success: true,
      testName,
      userId,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("❌ Achievement tracking test failed:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}