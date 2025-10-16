import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  limit: z.number().min(1).max(50).default(10),
  offset: z.number().min(0).default(0)
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const validatedData = searchSchema.parse({
      q: query,
      limit,
      offset
    });

    const currentUserId = session.user.id;

    // Search for users by name or email
    const users = await prisma.user.findMany({
      where: {
        AND: [
          // Exclude current user
          { id: { not: currentUserId } },
          // Search by name or email
          {
            OR: [
              { name: { contains: validatedData.q } },
              { email: { contains: validatedData.q } }
            ]
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
        userStatus: {
          select: {
            status: true,
            lastSeen: true
          }
        }
      },
      orderBy: [
        // Prioritize exact name matches
        {
          name: {
            sort: 'asc'
          }
        }
      ],
      take: validatedData.limit,
      skip: validatedData.offset
    });

    // Get friendship status for each user
    const usersWithFriendshipStatus = await Promise.all(
      users.map(async (user) => {
        // Check if already friends
        const friendship = await prisma.friendship.findFirst({
          where: {
            OR: [
              { user1Id: currentUserId, user2Id: user.id },
              { user1Id: user.id, user2Id: currentUserId }
            ]
          }
        });

        // Check if there's a pending friend request
        const sentRequest = await prisma.friendRequest.findFirst({
          where: {
            senderId: currentUserId,
            receiverId: user.id,
            status: 'PENDING'
          }
        });

        const receivedRequest = await prisma.friendRequest.findFirst({
          where: {
            senderId: user.id,
            receiverId: currentUserId,
            status: 'PENDING'
          }
        });

        // Check if blocked
        const blocked = await prisma.userBlock.findFirst({
          where: {
            OR: [
              { blockerId: currentUserId, blockedId: user.id },
              { blockerId: user.id, blockedId: currentUserId }
            ]
          }
        });

        return {
          ...user,
          friendshipStatus: friendship ? 'FRIENDS' : (
            sentRequest ? 'REQUEST_SENT' : (
              receivedRequest ? 'REQUEST_RECEIVED' : 'NONE'
            )
          ),
          isBlocked: !!blocked
        };
      })
    );

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { name: { contains: validatedData.q } },
              { email: { contains: validatedData.q } }
            ]
          }
        ]
      }
    });

    return NextResponse.json({
      users: usersWithFriendshipStatus,
      pagination: {
        total: totalCount,
        limit: validatedData.limit,
        offset: validatedData.offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}