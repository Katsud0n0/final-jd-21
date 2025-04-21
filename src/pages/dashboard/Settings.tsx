
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("account");
  const [formData, setFormData] = useState({
    username: user?.username || "",
    fullName: user?.fullName || "",
    department: user?.department || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Update user in localStorage
    const currentUser = JSON.parse(localStorage.getItem("jd-user") || "{}");
    const updatedUser = {
      ...currentUser,
      fullName: formData.fullName,
      email: formData.email,
    };
    localStorage.setItem("jd-user", JSON.stringify(updatedUser));
    
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate password change
    toast({
      title: "Password changed",
      description: "Your password has been changed successfully.",
    });
    
    // Reset password fields
    setFormData((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="account" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-jd-bg">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="mt-6">
          <div className="bg-jd-card rounded-lg p-6">
            <h3 className="text-xl font-medium mb-2">Profile Information</h3>
            <p className="text-jd-mutedText mb-6">Update your account details and personal information.</p>
            
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    className="flex-1"
                    readOnly
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  readOnly
                />
              </div>
              
              <div className="pt-4 border-t border-jd-bg">
                <h4 className="text-lg font-medium mb-4">Email Address</h4>
                <div className="space-y-2">
                  <Label htmlFor="email">Change your email address for communications.</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" className="bg-jd-purple hover:bg-jd-darkPurple">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <div className="bg-jd-card rounded-lg p-6">
            <h3 className="text-xl font-medium mb-2">Notification Settings</h3>
            <p className="text-jd-mutedText mb-6">Manage how and when you receive notifications.</p>
            
            <div className="bg-jd-bg/50 border border-jd-card/50 rounded-lg p-4 flex items-center">
              <AlertCircle className="text-jd-purple mr-3" size={24} />
              <div>
                <h4 className="font-medium">Coming Soon</h4>
                <p className="text-sm text-jd-mutedText">
                  Notification settings will be available in a future update. Stay tuned!
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <div className="bg-jd-card rounded-lg p-6">
            <h3 className="text-xl font-medium mb-2">Change Password</h3>
            <p className="text-jd-mutedText mb-6">Update your password to maintain account security.</p>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="pt-2">
                <Button type="submit" className="bg-jd-purple hover:bg-jd-darkPurple">
                  Change Password
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
