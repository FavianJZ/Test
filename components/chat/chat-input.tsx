"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Send,
  Paperclip,
  Image,
  Smile,
  X,
  File
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmojiPicker } from "./emoji-picker";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (content: string, type: 'TEXT' | 'IMAGE' | 'FILE', file?: File) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  onCancelReply?: () => void;
}

export function ChatInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  placeholder = "Type a message...",
  disabled = false,
  replyTo,
  onCancelReply
}: ChatInputProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Typing indicators
  useEffect(() => {
    if (message.length > 0) {
      onTypingStart?.();

      const typingTimeout = setTimeout(() => {
        onTypingStop?.();
      }, 1000);

      return () => clearTimeout(typingTimeout);
    } else {
      onTypingStop?.();
    }
  }, [message, onTypingStart, onTypingStop]);

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedFile) || isSending || disabled) return;

    console.log('=== SENDING MESSAGE ===');
    console.log('Message:', message.trim());
    console.log('Selected file:', selectedFile);

    setIsSending(true);

    try {
      if (selectedFile) {
        const fileType = selectedFile.type.startsWith('image/') ? 'IMAGE' : 'FILE';
        console.log('Sending file message:', fileType);
        await onSendMessage(message.trim(), fileType, selectedFile);
      } else {
        console.log('Sending text message');
        await onSendMessage(message.trim(), 'TEXT');
      }

      console.log('Message sent successfully');
      setMessage("");
      setSelectedFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
      console.log('=== END SENDING MESSAGE ===');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    textareaRef.current?.focus();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('audio/')) return <File className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getFileSize = (file: File) => {
    const size = file.size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-1">
      {/* Reply indicator */}
      {replyTo && (
        <div className="flex items-center justify-between p-2 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-blue-600 mb-1">
              Replying to {replyTo.senderName}
            </div>
            <div className="text-sm text-gray-700 truncate">
              {replyTo.content}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelReply}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getFileIcon(selectedFile)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-gray-500">
                  {getFileSize(selectedFile)}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeSelectedFile}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      
      {/* Main input */}
      <Card className="border-2">
        <CardContent className="p-1">
          <div className="flex items-center gap-1">
            {/* Left side actions */}
            <div className="flex items-center gap-0">
              {/* File upload */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={disabled}
                  >
                    <Paperclip className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <File className="h-4 w-4 mr-2" />
                    Upload File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
                    <Image className="h-4 w-4 mr-2" />
                    Upload Image
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Emoji picker */}
              <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled} />
            </div>

            {/* Message input */}
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[32px] max-h-[100px] resize-none border-0 focus-visible:ring-0 bg-transparent text-sm py-1"
              rows={1}
            />

            {/* Send button */}
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={(!message.trim() && !selectedFile) || disabled || isSending}
              className={cn(
                "h-7 w-7 p-0",
                (message.trim() || selectedFile) && "bg-blue-500 hover:bg-blue-600"
              )}
            >
              {isSending ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={(e) => handleFileSelect(e, 'file')}
            className="hidden"
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, 'image')}
            className="hidden"
          />
        </CardContent>
      </Card>
    </div>
  );
}