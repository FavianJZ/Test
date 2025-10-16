import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRequestSchema = z.object({
  action: z.enum(['accept', 'decline'])
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateRequestSchema.parse(body);

    const { requestId } = params;
    const { action } = validatedData;
    const userId = session.user.id;

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            friendCount: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            friendCount: true
          }
        }
      }
    });

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    // Check if user is the receiver of the request
    if (friendRequest.receiverId !== userId) {
      return NextResponse.json(
        { error: 'You can only respond to friend requests sent to you' },
        { status: 403 }
      );
    }

    // Check if request is still pending
    if (friendRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Friend request has already been processed' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // Check if already friends
      const existingFriendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: friendRequest.senderId, user2Id: friendRequest.receiverId },
            { user1Id: friendRequest.receiverId, user2Id: friendRequest.senderId }
          ]
        }
      });

      if (existingFriendship) {
        // Just update the request status to accepted
        await prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' }
        });

        return NextResponse.json({
          message: 'Already friends with this user',
          alreadyFriends: true
        });
      }

      // Create friendship
      const friendship = await prisma.friendship.create({
        data: {
          user1Id: friendRequest.senderId,
          user2Id: friendRequest.receiverId
        }
      });

      // Update friend request status
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' }
      });

      // Update friend counts for both users
      await prisma.user.update({
        where: { id: friendRequest.senderId },
        data: { friendCount: { increment: 1 } }
      });

      await prisma.user.update({
        where: { id: friendRequest.receiverId },
        data: { friendCount: { increment: 1 } }
      });

      // Create activity for sender
      await prisma.activity.create({
        data: {
          id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: friendRequest.senderId,
          type: 'FRIEND_REQUEST_ACCEPTED',
          title: 'Friend Request Accepted',
          description: `${friendRequest.receiver.name} accepted your friend request`,
          metadata: JSON.stringify({
            requestId: requestId,
            receiverId: friendRequest.receiverId,
            receiverName: friendRequest.receiver.name
          })
        }
      });

      // Create activity for receiver
      await prisma.activity.create({
        data: {
          id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: friendRequest.receiverId,
          type: 'FRIEND_ADDED',
          title: 'New Friend Added',
          description: `You are now friends with ${friendRequest.sender.name}`,
          metadata: JSON.stringify({
            requestId: requestId,
            senderId: friendRequest.senderId,
            senderName: friendRequest.sender.name
          })
        }
      });

      return NextResponse.json({
        message: 'Friend request accepted successfully',
        friendship
      });
    } else if (action === 'decline') {
      // Update friend request status
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'DECLINED' }
      });

      // Create activity for receiver
      await prisma.activity.create({
        data: {
          id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: friendRequest.receiverId,
          type: 'PROFILE_UPDATE',
          title: 'Friend Request Declined',
          description: `You declined a friend request from ${friendRequest.sender.name}`,
          metadata: JSON.stringify({
            requestId: requestId,
            senderId: friendRequest.senderId,
            senderName: friendRequest.sender.name
          })
        }
      });

      return NextResponse.json({
        message: 'Friend request declined successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating friend request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete friend request (for sent requests)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = params;
    const userId = session.user.id;

    // Find the friend request
    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    // Check if user is the sender of the request
    if (friendRequest.senderId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete friend requests you sent' },
        { status: 403 }
      );
    }

    // Check if request is still pending
    if (friendRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only delete pending friend requests' },
        { status: 400 }
      );
    }

    // Delete the friend request
    await prisma.friendRequest.delete({
      where: { id: requestId }
    });

    // Create activity
    await prisma.activity.create({
      data: {
        id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        type: 'PROFILE_UPDATE',
        title: 'Friend Request Cancelled',
        description: `You cancelled a friend request to ${friendRequest.receiver.name}`,
        metadata: JSON.stringify({
          requestId: requestId,
          receiverId: friendRequest.receiverId,
          receiverName: friendRequest.receiver.name
        })
      }
    });

    return NextResponse.json({
      message: 'Friend request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting friend request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}