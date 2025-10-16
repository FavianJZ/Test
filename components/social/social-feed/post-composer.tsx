"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Image,
  File,
  X,
  Send,
  Paperclip,
  MapPin,
  Smile,
  Users,
  Globe,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PostAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size: number;
  preview?: string;
}

interface PostComposerProps {
  onPostCreated?: () => void;
  placeholder?: string;
  maxLength?: number;
  compact?: boolean;
}

export function PostComposer({
  onPostCreated,
  placeholder = "What's on your mind?",
  maxLength = 2000,
  compact = false
}: PostComposerProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charactersRemaining = maxLength - content.length;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const files = event.target.files;
    if (!files) return;

    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for files

    Array.from(files).forEach(async (file) => {
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds the ${type === 'image' ? '5MB' : '10MB'} limit`);
        return;
      }

      if (attachments.length >= 5) {
        toast.error('Maximum 5 attachments allowed');
        return;
      }

      const attachment: PostAttachment = {
        id: Date.now().toString() + Math.random().toString(),
        type,
        name: file.name,
        size: file.size,
        url: '', // Will be set after upload
        preview: type === 'image' ? URL.createObjectURL(file) : undefined
      };

      // Upload file to server
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload/post', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          attachment.url = data.url;
          setAttachments(prev => [...prev, attachment]);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    });

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSubmit = async () => {
    if (!content.trim() && attachments.length === 0) {
      toast.error('Please add some content or attachments');
      return;
    }

    if (!session?.user?.id) {
      toast.error('You must be logged in to create a post');
      return;
    }

    setLoading(true);

    try {
      const postData = {
        content: content.trim(),
        attachments: attachments.map(att => ({
          type: att.type,
          url: att.url,
          name: att.name,
          size: att.size
        })),
        visibility,
        location: location.trim() || undefined
      };

      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
      });

      if (response.ok) {
        const post = await response.json();
        toast.success('Post created successfully!');

        // Reset form
        setContent("");
        setAttachments([]);
        setLocation("");
        setVisibility('public');
        setShowAdvanced(false);

        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }

        onPostCreated?.();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'friends': return <Users className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getVisibilityText = () => {
    switch (visibility) {
      case 'public': return 'Anyone can see';
      case 'friends': return 'Friends only';
      case 'private': return 'Only you';
      default: return 'Anyone can see';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (compact) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[80px] max-h-[200px] resize-none border-0 focus-visible:ring-0 bg-gray-50"
              maxLength={maxLength}
            />
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e, 'image')}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e, 'file')}
                  className="hidden"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  className="h-8 w-8 p-0"
                >
                  <Image className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 w-8 p-0"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || (!content.trim() && attachments.length === 0)}
                className="w-full"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post
              </Button>
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative group"
                >
                  {attachment.type === 'image' && attachment.preview ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <File className="h-6 w-6 text-gray-400" />
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(attachment.id)}
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create Post</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main content input */}
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] max-h-[300px] resize-none"
          maxLength={maxLength}
        />

        {/* Character counter */}
        <div className="text-right text-xs text-gray-500">
          {charactersRemaining} characters remaining
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Attachments</Label>
              <span className="text-xs text-gray-500">
                {attachments.length}/5 files
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="relative group border rounded-lg overflow-hidden"
                >
                  {attachment.type === 'image' && attachment.preview ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.name}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-50 flex flex-col items-center justify-center">
                      <File className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-xs text-gray-600 text-center px-2 truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                      className="bg-white/90 hover:bg-white text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced options */}
        <div className="space-y-3">
          {/* Attachment buttons */}
          <div className="flex gap-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e, 'image')}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileSelect(e, 'file')}
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={attachments.length >= 5}
            >
              <Image className="h-4 w-4 mr-2" />
              Add Photo
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= 5}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Add File
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Smile className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Hide' : 'Show'} Options
            </Button>
          </div>

          {/* Advanced options */}
          {showAdvanced && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              {/* Visibility */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  {getVisibilityIcon()}
                  Who can see this post
                </Label>
                <Select
                  value={visibility}
                  onValueChange={(value: any) => setVisibility(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Public
                      </div>
                    </SelectItem>
                    <SelectItem value="friends">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Friends
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Private
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-gray-600 mt-1">
                {getVisibilityText()}
              </div>

              {/* Location */}
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location (optional)
                </Label>
                <Input
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && attachments.length === 0)}
          className="w-full"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Create Post
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}