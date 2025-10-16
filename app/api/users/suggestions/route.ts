import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const currentUserId = session.user.id;

    // Get users that current user is not friends with and hasn't sent/received requests
    const suggestions = await prisma.user.findMany({
      where: {
        AND: [
          // Exclude current user
          { id: { not: currentUserId } },
          // Exclude existing friends
          {
            NOT: {
              friendships1: {
                some: { user2Id: currentUserId }
              }
            }
          },
          {
            NOT: {
              friendships2: {
                some: { user1Id: currentUserId }
              }
            }
          },
          // Exclude users with pending requests
          {
            NOT: {
              sentFriendRequests: {
                some: {
                  receiverId: currentUserId,
                  status: 'PENDING'
                }
              }
            }
          },
          {
            NOT: {
              receivedFriendRequests: {
                some: {
                  senderId: currentUserId,
                  status: 'PENDING'
                }
              }
            }
          },
          // Exclude blocked users
          {
            NOT: {
              blockers: {
                some: { blockedId: currentUserId }
              }
            }
          },
          {
            NOT: {
              blocked: {
                some: { blockerId: currentUserId }
              }
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        customStatus: true,
        createdAt: true,
        friendCount: true,
        userstatus: {
          select: {
            status: true,
            lastSeen: true
          }
        }
      },
      orderBy: [
        // Prioritize users with more friends (social proof)
        { friendCount: 'desc' },
        // Then by recent registration
        { createdAt: 'desc' }
      ],
      take: limit
    });

    // Get mutual friends count for each suggestion
    const suggestionsWithMutualFriends = await Promise.all(
      suggestions.map(async (user) => {
        // Get current user's friends
        const currentUserFriends = await prisma.friendship.findMany({
          where: {
            OR: [
              { user1Id: currentUserId },
              { user2Id: currentUserId }
            ]
          },
          select: {
            user1Id: true,
            user2Id: true
          }
        });

        const currentUserFriendIds = currentUserFriends.map(f =>
          f.user1Id === currentUserId ? f.user2Id : f.user1Id
        );

        // Get suggested user's friends
        const suggestedUserFriends = await prisma.friendship.findMany({
          where: {
            OR: [
              { user1Id: user.id },
              { user2Id: user.id }
            ]
          },
          select: {
            user1Id: true,
            user2Id: true
          }
        });

        const suggestedUserFriendIds = suggestedUserFriends.map(f =>
          f.user1Id === user.id ? f.user2Id : f.user1Id
        );

        // Find mutual friends
        const mutualFriendIds = currentUserFriendIds.filter(id =>
          suggestedUserFriendIds.includes(id)
        );

        // Get mutual friends details
        const mutualFriends = await prisma.user.findMany({
          where: {
            id: { in: mutualFriendIds }
          },
          select: {
            id: true,
            name: true,
            image: true
          }
        });

        return {
          ...user,
          mutualFriendsCount: mutualFriends.length,
          mutualFriends: mutualFriends.slice(0, 3), // Limit to 3 for display
          friendshipStatus: 'NONE'
        };
      })
    );

    // Sort by mutual friends count, then by friend count
    suggestionsWithMutualFriends.sort((a, b) => {
      if (a.mutualFriendsCount !== b.mutualFriendsCount) {
        return b.mutualFriendsCount - a.mutualFriendsCount;
      }
      return b.friendCount - a.friendCount;
    });

    return NextResponse.json({
      suggestions: suggestionsWithMutualFriends
    });
  } catch (error) {
    console.error('Error getting user suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}