"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  CheckCheck,
  Reply,
  MoreVertical,
  Heart,
  ThumbsUp,
  Trash2,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlexibleAvatar } from "@/components/ui/flexible-avatar";
import { useUserBorder } from "@/hooks/useUserBorder";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  replyToId?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  isEdited: boolean;
  reactions: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
  createdAt: string;
  updatedAt?: string;
  readBy: string[];
}

interface MessageBubbleProps {
  message: Message;
  sender?: {
    id: string;
    name: string;
    image?: string;
  };
  isOwn?: boolean;
  isGroup?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
}

export function MessageBubble({
  message,
  sender,
  isOwn = false,
  isGroup = false,
  onReply,
  onEdit,
  onDelete,
  onReaction
}: MessageBubbleProps) {
  const { data: session } = useSession();
  const { border: userBorder } = useUserBorder(sender?.id || "");
  const [showReactions, setShowReactions] = useState(false);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isRead = message.readBy.includes(session?.user?.id || "");
  const hasReactions = message.reactions.length > 0;

  const commonReactions = ['❤️', '👍', '😊', '😂', '🎉', '🔥'];

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 group",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for group chats */}
      {isGroup && !isOwn && (
        <div className="flex-shrink-0">
          <FlexibleAvatar
            src={sender?.image}
            name={sender?.name}
            userBorder={userBorder}
            size="sm"
          />
        </div>
      )}

      <div className={cn(
        "max-w-[70%] flex flex-col",
        isOwn && "items-end"
      )}>
        {/* Sender name for group chats */}
        {isGroup && !isOwn && (
          <div className="mb-1">
            <span className="text-sm font-medium text-gray-700">
              {sender?.name}
            </span>
          </div>
        )}

        {/* Reply to message */}
        {message.replyTo && (
          <div
            className={cn(
              "p-2 rounded-lg mb-1 text-sm border-l-2",
              isOwn
                ? "bg-blue-50 border-blue-300"
                : "bg-gray-50 border-gray-300"
            )}
            onClick={() => onReply?.(message.replyTo!)}
          >
            <div className="text-xs text-gray-500 mb-1">
              Replying to {message.replyTo.senderName}
            </div>
            <div className="text-gray-700 truncate">
              {message.replyTo.content}
            </div>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "relative group/message",
            !isOwn && "flex items-start gap-2"
          )}
        >
          <Card
            className={cn(
              "relative shadow-sm transition-colors",
              isOwn
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white border-gray-200",
              message.type === 'SYSTEM' && "bg-gray-100 text-gray-600 border-gray-300"
            )}
          >
            <CardContent className="p-3">
              {/* Message content */}
              {message.type === 'TEXT' && (
                <p className={cn(
                  "text-sm whitespace-pre-wrap break-words",
                  isOwn && "text-white"
                )}>
                  {message.content}
                </p>
              )}

              {message.type === 'IMAGE' && (
                <div className="space-y-2">
                  <img
                    src={message.content}
                    alt="Image"
                    className="rounded-lg max-w-full h-auto cursor-pointer"
                    onClick={() => window.open(message.content, '_blank')}
                  />
                  {message.content && (
                    <p className="text-xs text-gray-500">Image</p>
                  )}
                </div>
              )}

              {message.type === 'FILE' && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-xs">📎</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {message.content.split('/').pop()}
                    </p>
                    <p className="text-xs text-gray-500">File</p>
                  </div>
                </div>
              )}

              {message.type === 'SYSTEM' && (
                <p className="text-sm text-center italic">
                  {message.content}
                </p>
              )}

              {/* Edited indicator */}
              {message.isEdited && (
                <div className="flex items-center gap-1 mt-1">
                  <Edit className="w-3 h-3 opacity-70" />
                  <span className={cn(
                    "text-xs opacity-70",
                    isOwn && "text-blue-100"
                  )}>
                    edited
                  </span>
                </div>
              )}

              {/* Timestamp and read status */}
              {message.type !== 'SYSTEM' && (
                <div className={cn(
                  "flex items-center gap-1 mt-1 text-xs",
                  isOwn ? "text-blue-100 justify-end" : "text-gray-500 justify-start"
                )}>
                  <span>{formatTimestamp(message.createdAt)}</span>
                  {isOwn && (
                    <div className="flex items-center">
                      {isRead ? (
                        <CheckCheck className="w-4 h-4 text-blue-100" />
                      ) : (
                        <Check className="w-4 h-4 text-blue-200" />
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message actions */}
          {message.type !== 'SYSTEM' && (
            <div className={cn(
              "absolute opacity-0 group-hover/message:opacity-100 transition-opacity",
              isOwn
                ? "-left-20 top-0"
                : "-right-20 top-0"
            )}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? "end" : "start"}>
                  <DropdownMenuItem onClick={() => onReply?.(message)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  {isOwn && (
                    <DropdownMenuItem onClick={() => onEdit?.(message.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setShowReactions(!showReactions)}>
                    <Heart className="h-4 w-4 mr-2" />
                    React
                  </DropdownMenuItem>
                  {isOwn && (
                    <DropdownMenuItem
                      onClick={() => onDelete?.(message.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Reactions */}
        {hasReactions && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {message.reactions.map((reaction, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => onReaction?.(message.id, reaction.emoji)}
              >
                <span className="mr-1">{reaction.emoji}</span>
                <span className="text-xs">{reaction.count}</span>
              </Badge>
            ))}
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <div className={cn(
            "flex gap-1 p-2 bg-white border rounded-lg shadow-lg mt-2",
            isOwn && "ml-auto"
          )}>
            {commonReactions.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-lg hover:bg-gray-100"
                onClick={() => {
                  onReaction?.(message.id, emoji);
                  setShowReactions(false);
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Typing indicator component
export function TypingIndicator({ users }: { users: Array<{ name: string }> }) {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) return `${users[0].name} is typing...`;
    if (users.length === 2) return `${users[0].name} and ${users[1].name} are typing...`;
    return `${users.length} people are typing...`;
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
      </div>
      <span className="text-sm text-gray-500 italic">
        {getTypingText()}
      </span>
    </div>
  );
}