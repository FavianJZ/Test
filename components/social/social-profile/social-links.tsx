"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Github,
  Link,
  Plus,
  ExternalLink,
  Trash2,
  Edit,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  displayText?: string;
  isActive: boolean;
  icon: string;
  color: string;
}

interface SocialLinksProps {
  userId?: string;
  editable?: boolean;
  maxLinks?: number;
}

const PLATFORMS = [
  { value: 'website', label: 'Website', icon: Globe, color: 'text-blue-600', placeholder: 'https://yourwebsite.com' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600', placeholder: '@username' },
  { value: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-sky-600', placeholder: '@username' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-700', placeholder: 'username' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-800', placeholder: 'username' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-600', placeholder: 'channel' },
  { value: 'github', label: 'GitHub', icon: Github, color: 'text-gray-800', placeholder: 'username' },
  { value: 'other', label: 'Other', icon: Link, color: 'text-gray-600', placeholder: 'https://example.com' }
];

export function SocialLinks({ userId, editable = true, maxLinks = 5 }: SocialLinksProps) {
  const { data: session } = useSession();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newLink, setNewLink] = useState<Partial<SocialLink>>({
    platform: 'website',
    url: '',
    displayText: ''
  });
  const [saving, setSaving] = useState(false);

  const isOwnProfile = !userId || userId === session?.user?.id;

  useEffect(() => {
    fetchSocialLinks();
  }, [userId]);

  const fetchSocialLinks = async () => {
    try {
      const response = await fetch(`/api/users/${userId || session?.user?.id}/social-links`);
      if (response.ok) {
        const data = await response.json();
        setLinks(data.links || []);
      }
    } catch (error) {
      console.error('Error fetching social links:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformUrl = (platform: string, input: string) => {
    const cleanInput = input.trim();

    if (!cleanInput) return '';

    // If it's already a URL, return as is
    if (cleanInput.startsWith('http://') || cleanInput.startsWith('https://')) {
      return cleanInput;
    }

    // Platform-specific URL generation
    switch (platform) {
      case 'website':
        return cleanInput.startsWith('http') ? cleanInput : `https://${cleanInput}`;
      case 'instagram':
        return cleanInput.startsWith('@')
          ? `https://instagram.com/${cleanInput.slice(1)}`
          : `https://instagram.com/${cleanInput}`;
      case 'twitter':
        return cleanInput.startsWith('@')
          ? `https://twitter.com/${cleanInput.slice(1)}`
          : `https://twitter.com/${cleanInput}`;
      case 'facebook':
        return cleanInput.startsWith('@')
          ? `https://facebook.com/${cleanInput.slice(1)}`
          : `https://facebook.com/${cleanInput}`;
      case 'linkedin':
        return cleanInput.startsWith('@')
          ? `https://linkedin.com/in/${cleanInput.slice(1)}`
          : `https://linkedin.com/in/${cleanInput}`;
      case 'youtube':
        return cleanInput.startsWith('@')
          ? `https://youtube.com/${cleanInput.slice(1)}`
          : `https://youtube.com/${cleanInput}`;
      case 'github':
        return `https://github.com/${cleanInput.replace('@', '')}`;
      default:
        return cleanInput.startsWith('http') ? cleanInput : `https://${cleanInput}`;
    }
  };

  const getDisplayText = (platform: string, url: string, customText?: string) => {
    if (customText && customText.trim()) return customText.trim();

    const platformConfig = PLATFORMS.find(p => p.value === platform);
    if (!platformConfig) return url;

    // Extract username from URL for display
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Handle different platform URL formats
      if (platform === 'instagram' || platform === 'twitter' || platform === 'facebook') {
        const username = pathname.split('/').pop();
        return username ? `@${username}` : url;
      }

      if (platform === 'linkedin') {
        const username = pathname.split('/in/').pop();
        return username ? username : url;
      }

      if (platform === 'youtube') {
        const username = pathname.split('/').pop();
        return username ? username : url;
      }

      if (platform === 'github') {
        const username = pathname.split('/').pop();
        return username ? `@${username}` : url;
      }

      // For websites, just show the domain
      if (platform === 'website') {
        return urlObj.hostname;
      }

      return url;
    } catch {
      return url;
    }
  };

  const saveSocialLinks = async () => {
    if (!isOwnProfile) return;

    setSaving(true);
    try {
      const response = await fetch('/api/users/social-links', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ links })
      });

      if (response.ok) {
        toast.success('Social links updated successfully!');
        setEditing(false);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update social links');
      }
    } catch (error) {
      console.error('Error saving social links:', error);
      toast.error('Failed to update social links');
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    if (!newLink.url?.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    if (links.length >= maxLinks) {
      toast.error(`Maximum ${maxLinks} social links allowed`);
      return;
    }

    const platformConfig = PLATFORMS.find(p => p.value === newLink.platform);
    if (!platformConfig) return;

    const url = getPlatformUrl(newLink.platform, newLink.url);
    const displayText = newLink.displayText || getDisplayText(newLink.platform, url);

    const link: SocialLink = {
      id: Date.now().toString(),
      platform: newLink.platform,
      url,
      displayText,
      isActive: true,
      icon: platformConfig.value,
      color: platformConfig.color
    };

    setLinks(prev => [...prev, link]);
    setNewLink({ platform: 'website', url: '', displayText: '' });
  };

  const removeLink = (id: string) => {
    setLinks(prev => prev.filter(link => link.id !== id));
  };

  const toggleLinkActive = (id: string) => {
    setLinks(prev => prev.map(link =>
      link.id === id ? { ...link, isActive: !link.isActive } : link
    ));
  };

  const getPlatformIcon = (platform: string) => {
    const config = PLATFORMS.find(p => p.value === platform);
    return config ? <config.icon className="h-4 w-4" /> : <Link className="h-4 w-4" />;
  };

  const getPlatformColor = (platform: string) => {
    const config = PLATFORMS.find(p => p.value === platform);
    return config ? config.color : 'text-gray-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeLinks = links.filter(link => link.isActive);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Social Links
          </CardTitle>
          {isOwnProfile && editable && (
            <div className="flex gap-2">
              {editing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(false);
                      fetchSocialLinks(); // Reset to original state
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveSocialLinks}
                    disabled={saving}
                  >
                    {saving ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              )}
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* View Mode */}
        {!editing && (
          <div className="space-y-3">
            {activeLinks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Globe className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No social links added</p>
                <p className="text-sm mt-1">
                  {isOwnProfile
                    ? "Add your social media profiles to connect with others"
                    : "This user hasn't added any social links yet"
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {activeLinks.map((link) => {
                  const platformConfig = PLATFORMS.find(p => p.value === link.platform);
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors group"
                    >
                      <div className={cn("flex-shrink-0", getPlatformColor(link.platform))}>
                        {getPlatformIcon(link.platform)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {link.displayText}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {platformConfig?.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {link.url}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Edit Mode */}
        {editing && isOwnProfile && (
          <div className="space-y-4">
            {/* Existing Links */}
            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.id} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className={cn("flex-shrink-0", getPlatformColor(link.platform))}>
                    {getPlatformIcon(link.platform)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {link.displayText || link.url}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {link.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLinkActive(link.id)}
                      className={cn(
                        "h-8 w-8 p-0",
                        link.isActive ? "text-green-600" : "text-gray-400"
                      )}
                    >
                      {link.isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLink(link.id)}
                      className="h-8 w-8 p-0 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Link */}
            {links.length < maxLinks && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Add Social Link</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="text-xs">Platform</Label>
                      <Select
                        value={newLink.platform}
                        onValueChange={(value) => setNewLink(prev => ({ ...prev, platform: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLATFORMS.map((platform) => (
                            <SelectItem key={platform.value} value={platform.value}>
                              <div className="flex items-center gap-2">
                                <platform.icon className="h-4 w-4" />
                                {platform.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">URL or Username</Label>
                      <Input
                        placeholder={PLATFORMS.find(p => p.value === newLink.platform)?.placeholder}
                        value={newLink.url}
                        onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Display Text (Optional)</Label>
                      <Input
                        placeholder="Custom display text"
                        value={newLink.displayText}
                        onChange={(e) => setNewLink(prev => ({ ...prev, displayText: e.target.value }))}
                      />
                    </div>

                    <Button
                      onClick={addLink}
                      disabled={!newLink.url?.trim()}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Link
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {links.length >= maxLinks && (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">Maximum {maxLinks} social links reached</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}