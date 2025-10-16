import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Get friend list
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'friends';

    const userId = session.user.id;

    switch (type) {
      case 'friends':
        // Get user's friends
        const friends = await prisma.friendship.findMany({
          where: {
            OR: [
              { user1Id: userId },
              { user2Id: userId }
            ]
          },
          include: {
            user1: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                customStatus: true,
                userstatus: {
                  select: {
                    status: true,
                    lastSeen: true
                  }
                }
              }
            },
            user2: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                customStatus: true,
                userstatus: {
                  select: {
                    status: true,
                    lastSeen: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Transform to get friend info (excluding self)
        const friendList = friends.map(friendship => {
          const friend = friendship.user1Id === userId ? friendship.user2 : friendship.user1;
          return {
            id: friend.id,
            name: friend.name,
            email: friend.email,
            image: friend.image,
            customStatus: friend.customStatus,
            status: friend.userstatus?.status || 'OFFLINE',
            lastSeen: friend.userstatus?.lastSeen,
            createdAt: friendship.createdAt
          };
        });

        return NextResponse.json({ friends: friendList });

      case 'sent':
        // Get sent friend requests
        const sentRequests = await prisma.friendRequest.findMany({
          where: {
            senderId: userId,
            status: 'PENDING'
          },
          include: {
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                customStatus: true,
                userstatus: {
                  select: {
                    status: true,
                    lastSeen: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return NextResponse.json({ requests: sentRequests });

      case 'received':
        // Get received friend requests
        const receivedRequests = await prisma.friendRequest.findMany({
          where: {
            receiverId: userId,
            status: 'PENDING'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                customStatus: true,
                userstatus: {
                  select: {
                    status: true,
                    lastSeen: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return NextResponse.json({ requests: receivedRequests });

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Send friend request
const sendFriendRequestSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required')
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = sendFriendRequestSchema.parse(body);

    const { receiverId } = validatedData;
    const senderId = session.user.id;

    // Check if trying to send request to self
    if (senderId === receiverId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true }
    });

    if (!receiver) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId }
        ]
      }
    });

    if (existingFriendship) {
      return NextResponse.json(
        { error: 'Already friends with this user' },
        { status: 400 }
      );
    }

    // Check if request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return NextResponse.json(
          { error: 'Friend request already sent' },
          { status: 400 }
        );
      }

      if (existingRequest.status === 'ACCEPTED') {
        return NextResponse.json(
          { error: 'Already friends with this user' },
          { status: 400 }
        );
      }
    }

    // Create friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING'
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            customStatus: true,
            userstatus: {
              select: {
                status: true,
                lastSeen: true
              }
            }
          }
        }
      }
    });

    // Create activity notification
    await prisma.activity.create({
      data: {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: senderId,
        type: 'FRIEND_REQUEST_SENT',
        title: 'Friend Request Sent',
        description: `You sent a friend request to ${receiver.name}`,
        metadata: JSON.stringify({
          requestId: friendRequest.id,
          receiverId: receiverId,
          receiverName: receiver.name
        })
      }
    });

    // Create notification for receiver
    await prisma.activity.create({
      data: {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: receiverId,
        type: 'FRIEND_REQUEST_SENT',
        title: 'New Friend Request',
        description: `You received a friend request from ${session.user.name}`,
        metadata: JSON.stringify({
          requestId: friendRequest.id,
          senderId: senderId,
          senderName: session.user.name
        })
      }
    });

    return NextResponse.json({
      message: 'Friend request sent successfully',
      request: friendRequest
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error sending friend request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Remove friend
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friendId');

    if (!friendId) {
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Find and delete friendship
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: friendId },
          { user1Id: friendId, user2Id: userId }
        ]
      }
    });

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friendship not found' },
        { status: 404 }
      );
    }

    await prisma.friendship.delete({
      where: { id: friendship.id }
    });

    // Update friend counts
    await prisma.user.update({
      where: { id: userId },
      data: { friendCount: { decrement: 1 } }
    });

    await prisma.user.update({
      where: { id: friendId },
      data: { friendCount: { decrement: 1 } }
    });

    // Create activity
    await prisma.activity.create({
      data: {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type: 'PROFILE_UPDATE',
        title: 'Friend Removed',
        description: 'You removed a friend',
        metadata: JSON.stringify({
          removedFriendId: friendId
        })
      }
    });

    return NextResponse.json({
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}