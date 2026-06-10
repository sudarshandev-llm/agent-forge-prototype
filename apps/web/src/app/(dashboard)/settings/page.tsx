'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/store/ui-store';
import { getInitials } from '@/lib/utils';
import {
  User,
  Key,
  Bell,
  Palette,
  Save,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const { addToast } = useUIStore();
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [profile, setProfile] = useState({
    name: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    username: user?.username || '',
    bio: '',
  });

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: '1', name: 'Development', key: 'af_dev_sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', createdAt: '2024-01-15', lastUsed: '2024-03-20', enabled: true },
    { id: '2', name: 'Production', key: 'af_prod_sk_z9y8x7w6v5u4t3s2r1q0p9o8i7u6y5t4', createdAt: '2024-02-01', lastUsed: '2024-03-21', enabled: true },
  ]);

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    executionCompleted: true,
    executionFailed: true,
    agentErrors: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      addToast('Profile updated successfully', 'success');
    } catch {
      addToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    addToast('API key copied to clipboard', 'success');
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="mr-2 h-4 w-4" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" /> Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="text-lg">{getInitials(profile.name || 'User')}</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. 1MB max.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile.email} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed. Contact support.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Tell us about yourself..."
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys for programmatic access. Keep your keys secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{apiKey.name}</span>
                      <Badge variant={apiKey.enabled ? 'success' : 'secondary'}>
                        {apiKey.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleKeyVisibility(apiKey.id)}>
                        {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => copyApiKey(apiKey.key)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted rounded-md p-2">
                    <code className="text-sm font-mono">
                      {showKeys[apiKey.id] ? apiKey.key : `${apiKey.key.slice(0, 12)}${'•'.repeat(32)}${apiKey.key.slice(-4)}`}
                    </code>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Created: {apiKey.createdAt}</span>
                    <span>Last used: {apiKey.lastUsed}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Generate New API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'executionCompleted', label: 'Execution Completed', desc: 'When an agent execution finishes' },
                  { key: 'executionFailed', label: 'Execution Failed', desc: 'When an agent execution fails' },
                  { key: 'agentErrors', label: 'Agent Errors', desc: 'When an agent encounters an error' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label>{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Digest</h4>
                {[
                  { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary of activity' },
                  { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Product updates and tips' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label>{item.label}</Label>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                      }
                    />
                  </div>
                ))}
              </div>

              <Button onClick={() => addToast('Notification preferences saved', 'success')}>
                <Save className="mr-2 h-4 w-4" /> Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'light', label: 'Light', icon: '☀️' },
                    { value: 'dark', label: 'Dark', icon: '🌙' },
                    { value: 'system', label: 'System', icon: '💻' },
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTheme(t.value)}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                        theme === t.value
                          ? 'border-primary bg-primary/5'
                          : 'border-transparent hover:bg-muted'
                      }`}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <span className="font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>UI Density</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'compact', label: 'Compact' },
                    { value: 'comfortable', label: 'Comfortable' },
                    { value: 'spacious', label: 'Spacious' },
                  ].map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      className="flex flex-col items-center gap-2 rounded-lg border-2 border-transparent p-4 transition-all hover:bg-muted"
                    >
                      <span className="font-medium">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
