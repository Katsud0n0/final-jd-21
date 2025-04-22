
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "react-router-dom";

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const defaultTab = queryParams.get("tab") || "account";
  
  const [accountData, setAccountData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    showEmail: user?.privacySettings?.showEmail || false,
    showPhone: user?.privacySettings?.showPhone || false,
    allowDirectMessages: user?.privacySettings?.allowDirectMessages || true,
    showOnlineStatus: user?.privacySettings?.showOnlineStatus || true,
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: user?.notificationSettings?.emailNotifications || true,
    requestUpdates: user?.notificationSettings?.requestUpdates || true,
    departmentAnnouncements: user?.notificationSettings?.departmentAnnouncements || true,
    mentionAlerts: user?.notificationSettings?.mentionAlerts || true,
  });

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrivacyToggle = (setting: string) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev],
    }));
  };

  const handleNotificationToggle = (setting: string) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev],
    }));
  };

  const handleUpdateAccount = () => {
    // Update the user's account information
    if (user) {
      updateUser({
        ...user,
        fullName: accountData.fullName,
        email: accountData.email,
        phone: accountData.phone,
      });
      
      toast({
        title: "Account updated",
        description: "Your account information has been updated successfully.",
      });
    }
  };

  const handleUpdateSecurity = () => {
    // Validate passwords
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }
    
    // For demo, just show success toast
    toast({
      title: "Password updated",
      description: "Your password has been updated successfully.",
    });
    
    // Reset the form
    setSecurityData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleUpdatePrivacy = () => {
    // Update the user's privacy settings
    if (user) {
      updateUser({
        ...user,
        privacySettings: privacySettings,
      });
      
      toast({
        title: "Privacy settings updated",
        description: "Your privacy settings have been updated successfully.",
      });
    }
  };
  
  const handleUpdateNotifications = () => {
    // Update the user's notification settings
    if (user) {
      updateUser({
        ...user,
        notificationSettings: notificationSettings,
      });
      
      toast({
        title: "Notification settings updated",
        description: "Your notification settings have been updated successfully.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="text-jd-mutedText">Manage your account and application settings</p>
      </div>
      
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-6 mt-6">
          <div className="bg-jd-card rounded-lg p-6">
            <h3 className="text-xl font-medium mb-6">Account Information</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={accountData.fullName}
                  onChange={handleAccountChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={accountData.email}
                  onChange={handleAccountChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={accountData.phone}
                  onChange={handleAccountChange}
                />
              </div>
              
              <Button 
                onClick={handleUpdateAccount}
                className="mt-2 bg-jd-purple hover:bg-jd-darkPurple"
              >
                Update Account
              </Button>
            </div>
          </div>
          
          <div className="bg-jd-card rounded-lg p-6">
            <h3 className="text-xl font-medium mb-6">Department Information</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <div className="p-2 bg-jd-bg rounded">{user?.department}</div>
              </div>
              
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="p-2 bg-jd-bg rounded capitalize">{user?.role}</div>
              </div>
              
              <div className="space-y-2">
                <Label>Joined Date</Label>
                <div className="p-2 bg-jd-bg rounded">April 10, 2023</div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6 mt-6">
          <div className="bg-jd-card rounded-lg p-6">
            <h3 className="text-xl font-medium mb-6">Password</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={securityData.currentPassword}
                  onChange={handleSecurityChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={securityData.newPassword}
                  onChange={handleSecurityChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={securityData.confirmPassword}
                  onChange={handleSecurityChange}
                />
              </div>
              
              <Button 
                onClick={handleUpdateSecurity}
                className="mt-2 bg-jd-purple hover:bg-jd-darkPurple"
              >
                Update Password
              </Button>
            </div>
          </div>
          
          {/* Admin-only section for blocking and banning */}
          {user?.role === "admin" && (
            <div className="bg-jd-card rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium">Blocking & Banning</h3>
                <span className="px-2 py-1 bg-jd-purple/20 text-jd-purple rounded text-xs">Coming Soon</span>
              </div>
              
              <p className="text-jd-mutedText mb-4">
                As an administrator, you'll soon be able to block or ban users from accessing department resources.
              </p>
              
              <div className="bg-jd-bg p-4 rounded-lg text-jd-mutedText">
                <p>This feature is currently in development and will be available in a future update.</p>
              </div>
            </div>
          )}
          
          <div className="bg-jd-card rounded-lg p-6">
            <h3 className="text-xl font-medium mb-6">Sessions</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-jd-bg rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">Current Session</div>
                    <div className="text-sm text-jd-mutedText">Chrome on Windows • IP 192.168.1.1</div>
                  </div>
                  <div className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs h-fit">
                    Active
                  </div>
                </div>
              </div>
              
              <Button 
                variant="destructive"
                className="mt-2"
              >
                Log Out All Other Sessions
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="privacy" className="space-y-6 mt-6">
          <div className="bg-jd-card rounded-lg p-6">
            <h3 className="text-xl font-medium mb-6">Privacy Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show email to other departments</Label>
                  <div className="text-sm text-jd-mutedText">
                    Allow other departments to see your email address
                  </div>
                </div>
                <Switch 
                  checked={privacySettings.showEmail}
                  onCheckedChange={() => handlePrivacyToggle("showEmail")}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show phone number to other departments</Label>
                  <div className="text-sm text-jd-mutedText">
                    Allow other departments to see your phone number
                  </div>
                </div>
                <Switch 
                  checked={privacySettings.showPhone}
                  onCheckedChange={() => handlePrivacyToggle("showPhone")}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow direct messages</Label>
                  <div className="text-sm text-jd-mutedText">
                    Allow other departments to send you direct messages
                  </div>
                </div>
                <Switch 
                  checked={privacySettings.allowDirectMessages}
                  onCheckedChange={() => handlePrivacyToggle("allowDirectMessages")}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show online status</Label>
                  <div className="text-sm text-jd-mutedText">
                    Let others see when you're online
                  </div>
                </div>
                <Switch 
                  checked={privacySettings.showOnlineStatus}
                  onCheckedChange={() => handlePrivacyToggle("showOnlineStatus")}
                />
              </div>
              
              <Button 
                onClick={handleUpdatePrivacy}
                className="mt-2 bg-jd-purple hover:bg-jd-darkPurple"
              >
                Save Privacy Settings
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <div className="bg-jd-card rounded-lg p-6">
            <h3 className="text-xl font-medium mb-6">Notification Preferences</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <div className="text-sm text-jd-mutedText">
                    Receive notifications via email
                  </div>
                </div>
                <Switch 
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleNotificationToggle("emailNotifications")}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Request Updates</Label>
                  <div className="text-sm text-jd-mutedText">
                    Get notified about updates to your requests
                  </div>
                </div>
                <Switch 
                  checked={notificationSettings.requestUpdates}
                  onCheckedChange={() => handleNotificationToggle("requestUpdates")}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Department Announcements</Label>
                  <div className="text-sm text-jd-mutedText">
                    Receive notifications about department announcements
                  </div>
                </div>
                <Switch 
                  checked={notificationSettings.departmentAnnouncements}
                  onCheckedChange={() => handleNotificationToggle("departmentAnnouncements")}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mention Alerts</Label>
                  <div className="text-sm text-jd-mutedText">
                    Get notified when someone mentions you
                  </div>
                </div>
                <Switch 
                  checked={notificationSettings.mentionAlerts}
                  onCheckedChange={() => handleNotificationToggle("mentionAlerts")}
                />
              </div>
              
              <Button 
                onClick={handleUpdateNotifications}
                className="mt-2 bg-jd-purple hover:bg-jd-darkPurple"
              >
                Save Notification Settings
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
