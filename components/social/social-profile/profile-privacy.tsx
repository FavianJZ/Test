"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Users,
  Globe,
  UserPlus,
  MessageSquare,
  Bell,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  allowFriendRequests: boolean;
  allowMessages: 'everyone' | 'friends' | 'none';
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowPostComments: 'everyone' | 'friends' | 'none';
  allowTagging: boolean;
  showAchievements: boolean;
  showFriendList: boolean;
  allowProfileSearch: boolean;
  emailNotifications: {
    friendRequests: boolean;
    messages: boolean;
    mentions: boolean;
    postLikes: boolean;
    comments: boolean;
    achievementUnlocks: boolean;
  };
  pushNotifications: {
    friendRequests: boolean;
    messages: boolean;
    mentions: boolean;
    postLikes: boolean;
    comments: boolean;
    achievementUnlocks: boolean;
  };
}

interface ProfilePrivacyProps {
  userId?: string;
  onSave?: (settings: PrivacySettings) => void;
}

export function ProfilePrivacy({ userId, onSave }: ProfilePrivacyProps) {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    allowFriendRequests: true,
    allowMessages: 'everyone',
    showOnlineStatus: true,
    showLastSeen: true,
    allowPostComments: 'everyone',
    allowTagging: true,
    showAchievements: true,
    showFriendList: true,
    allowProfileSearch: true,
    emailNotifications: {
      friendRequests: true,
      messages: true,
      mentions: true,
      postLikes: true,
      comments: true,
      achievementUnlocks: true
    },
    pushNotifications: {
      friendRequests: true,
      messages: true,
      mentions: true,
      postLikes: false,
      comments: true,
      achievementUnlocks: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isOwnProfile = !userId || userId === session?.user?.id;

  useEffect(() => {
    if (isOwnProfile && session?.user?.id) {
      fetchPrivacySettings();
    }
  }, [isOwnProfile, session?.user?.id]);

  const fetchPrivacySettings = async () => {
    try {
      const response = await fetch('/api/profile/privacy');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!isOwnProfile) return;

    setSaving(true);
    try {
      const response = await fetch('/api/profile/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Privacy settings saved successfully!');
        onSave?.(settings);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save privacy settings');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'friends': return <Users className="h-4 w-4" />;
      case 'private': return <Lock className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'text-green-600 bg-green-50 border-green-200';
      case 'friends': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'private': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOwnProfile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold mb-2">Privacy Settings</h3>
          <p className="text-gray-600">You can only view your own privacy settings.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Who can see your profile</Label>
              <p className="text-sm text-gray-600 mt-1">
                Control who can view your profile information
              </p>
            </div>
            <Select
              value={settings.profileVisibility}
              onValueChange={(value: any) => updateSetting('profileVisibility', value)}
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
                    Friends Only
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

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              {getVisibilityIcon(settings.profileVisibility)}
              <span className="text-sm font-medium">Current Setting:</span>
              <Badge className={cn("text-xs", getVisibilityColor(settings.profileVisibility))}>
                {settings.profileVisibility.charAt(0).toUpperCase() + settings.profileVisibility.slice(1)}
              </Badge>
            </div>
            <p className="text-xs text-gray-600">
              {settings.profileVisibility === 'public' && 'Anyone can see your profile and posts'}
              {settings.profileVisibility === 'friends' && 'Only your friends can see your profile and posts'}
              {settings.profileVisibility === 'private' && 'Only you can see your profile'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Interaction Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Interaction Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Friend Requests</Label>
              <p className="text-sm text-gray-600">Let others send you friend requests</p>
            </div>
            <Switch
              checked={settings.allowFriendRequests}
              onCheckedChange={(checked) => updateSetting('allowFriendRequests', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Messages</Label>
              <p className="text-sm text-gray-600">Who can send you direct messages</p>
            </div>
            <Select
              value={settings.allowMessages}
              onValueChange={(value: any) => updateSetting('allowMessages', value)}
              disabled={!settings.allowFriendRequests}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="friends">Friends</SelectItem>
                <SelectItem value="none">No One</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Post Comments</Label>
              <p className="text-sm text-gray-600">Who can comment on your posts</p>
            </div>
            <Select
              value={settings.allowPostComments}
              onValueChange={(value: any) => updateSetting('allowPostComments', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="friends">Friends</SelectItem>
                <SelectItem value="none">No One</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Tagging</Label>
              <p className="text-sm text-gray-600">Let others tag you in posts and comments</p>
            </div>
            <Switch
              checked={settings.allowTagging}
              onCheckedChange={(checked) => updateSetting('allowTagging', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status and Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Status & Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Online Status</Label>
              <p className="text-sm text-gray-600">Let others see when you're online</p>
            </div>
            <Switch
              checked={settings.showOnlineStatus}
              onCheckedChange={(checked) => updateSetting('showOnlineStatus', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Last Seen</Label>
              <p className="text-sm text-gray-600">Show when you were last active</p>
            </div>
            <Switch
              checked={settings.showLastSeen}
              onCheckedChange={(checked) => updateSetting('showLastSeen', checked)}
              disabled={!settings.showOnlineStatus}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Achievements</Label>
              <p className="text-sm text-gray-600">Display your achievements on your profile</p>
            </div>
            <Switch
              checked={settings.showAchievements}
              onCheckedChange={(checked) => updateSetting('showAchievements', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Friend List</Label>
              <p className="text-sm text-gray-600">Let others see your friends</p>
            </div>
            <Switch
              checked={settings.showFriendList}
              onCheckedChange={(checked) => updateSetting('showFriendList', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Profile Search</Label>
              <p className="text-sm text-gray-600">Let others find you through search</p>
            </div>
            <Switch
              checked={settings.allowProfileSearch}
              onCheckedChange={(checked) => updateSetting('allowProfileSearch', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Email Notifications
            </h4>
            <div className="space-y-3 ml-6">
              {[
                { key: 'friendRequests', label: 'Friend Requests', icon: <UserPlus className="h-4 w-4" /> },
                { key: 'messages', label: 'Direct Messages', icon: <MessageSquare className="h-4 w-4" /> },
                { key: 'mentions', label: 'Mentions', icon: <Bell className="h-4 w-4" /> },
                { key: 'postLikes', label: 'Post Likes', icon: <Users className="h-4 w-4" /> },
                { key: 'comments', label: 'Comments', icon: <MessageSquare className="h-4 w-4" /> },
                { key: 'achievementUnlocks', label: 'Achievement Unlocks', icon: <Shield className="h-4 w-4" /> }
              ].map(({ key, label, icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {icon}
                    <Label>{label}</Label>
                  </div>
                  <Switch
                    checked={settings.emailNotifications[key as keyof typeof settings.emailNotifications]}
                    onCheckedChange={(checked) => updateSetting(`emailNotifications.${key}`, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Push Notifications */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Push Notifications
            </h4>
            <div className="space-y-3 ml-6">
              {[
                { key: 'friendRequests', label: 'Friend Requests', icon: <UserPlus className="h-4 w-4" /> },
                { key: 'messages', label: 'Direct Messages', icon: <MessageSquare className="h-4 w-4" /> },
                { key: 'mentions', label: 'Mentions', icon: <Bell className="h-4 w-4" /> },
                { key: 'postLikes', label: 'Post Likes', icon: <Users className="h-4 w-4" /> },
                { key: 'comments', label: 'Comments', icon: <MessageSquare className="h-4 w-4" /> },
                { key: 'achievementUnlocks', label: 'Achievement Unlocks', icon: <Shield className="h-4 w-4" /> }
              ].map(({ key, label, icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {icon}
                    <Label>{label}</Label>
                  </div>
                  <Switch
                    checked={settings.pushNotifications[key as keyof typeof settings.pushNotifications]}
                    onCheckedChange={(checked) => updateSetting(`pushNotifications.${key}`, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="min-w-32"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}