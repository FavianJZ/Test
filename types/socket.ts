import { NextApiResponse } from 'next';

export interface NextApiResponseWithSocket extends NextApiResponse {
  socket: any & {
    server: any & {
      io?: any;
    };
  };
}

export interface SocketUser {
  socketId: string;
  userId: string;
  name: string;
  avatar?: string;
  joinedAt: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  replyTo?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    image?: string;
    border?: string;
  };
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}