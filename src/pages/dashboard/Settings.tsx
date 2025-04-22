
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ban, Bell, Lock, ShieldAlert, User } from "lucide-react";

const Settings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    requestUpdates: true,
    projectUpdates: true,
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showActivity: true,
  });

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Settings</h2>
      <p className="text-jd-mutedText">Manage your account settings and preferences</p>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="general">
            <User className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="mr-2 h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldAlert className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Update your basic profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Full Name</Label>
                <input type="text" id="name" className="w-full rounded p-2 border bg-jd-bg" value="Vardhan" disabled />
                <p className="text-xs text-jd-mutedText">Managed by your organization</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <input type="email" id="email" className="w-full rounded p-2 border bg-jd-bg" value="vardhan@company.com" disabled />
                <p className="text-xs text-jd-mutedText">Managed by your organization</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="department">Department</Label>
                <input type="text" id="department" className="w-full rounded p-2 border bg-jd-bg" value="IT Support" disabled />
                <p className="text-xs text-jd-mutedText">Managed by your organization</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Control how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Delivery Methods</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications" className="font-medium">
                      Email Notifications
                    </Label>
                    <p className="text-jd-mutedText text-sm">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, email: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications" className="font-medium">
                      Push Notifications
                    </Label>
                    <p className="text-jd-mutedText text-sm">
                      Receive notifications in your browser
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={notifications.push}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, push: checked }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Types</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="request-updates" className="font-medium">
                      Request Updates
                    </Label>
                    <p className="text-jd-mutedText text-sm">
                      Get notified when a request's status changes
                    </p>
                  </div>
                  <Switch
                    id="request-updates"
                    checked={notifications.requestUpdates}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        requestUpdates: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="project-updates" className="font-medium">
                      Project Updates
                    </Label>
                    <p className="text-jd-mutedText text-sm">
                      Get notified about changes to projects you're part of
                    </p>
                  </div>
                  <Switch
                    id="project-updates"
                    checked={notifications.projectUpdates}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        projectUpdates: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your privacy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Profile Visibility</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-profile" className="font-medium">
                      Show Profile
                    </Label>
                    <p className="text-jd-mutedText text-sm">
                      Allow others to see your profile information
                    </p>
                  </div>
                  <Switch
                    id="show-profile"
                    checked={privacy.showProfile}
                    onCheckedChange={(checked) =>
                      setPrivacy((prev) => ({ ...prev, showProfile: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-activity" className="font-medium">
                      Activity Visibility
                    </Label>
                    <p className="text-jd-mutedText text-sm">
                      Allow others to see your recent activity
                    </p>
                  </div>
                  <Switch
                    id="show-activity"
                    checked={privacy.showActivity}
                    onCheckedChange={(checked) =>
                      setPrivacy((prev) => ({ ...prev, showActivity: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage security options and access restrictions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Security</h3>
                <div>
                  <Button variant="outline">Change Password</Button>
                </div>
                <div>
                  <Button variant="outline">Enable Two-Factor Authentication</Button>
                </div>
              </div>
              
              {/* Blocking and Banning Options (moved from Requests tab) */}
              <div className="bg-jd-bg rounded-lg p-6 mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Ban className="text-jd-purple" size={24} />
                  <h3 className="text-xl font-medium">Blocking and Banning Options</h3>
                </div>
                <p className="text-jd-mutedText mb-4">
                  Advanced user management features for blocking and banning users will be available soon.
                  Stay tuned for these upcoming security enhancements.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Button variant="outline" disabled>Block User</Button>
                  <Button variant="outline" disabled>Manage Blocked Users</Button>
                </div>
              </div>
              
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
