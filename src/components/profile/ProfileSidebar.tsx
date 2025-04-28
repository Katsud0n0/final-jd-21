
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "@/types/profileTypes";
import { LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dispatch, SetStateAction } from "react";

interface ProfileSidebarProps {
  user: UserProfile | null;
  logout?: () => void;
  activeTab?: string;
  onTabChange?: Dispatch<SetStateAction<string>>;
  counts?: {
    accepted: number;
    archived: number;
    history: number;
  };
}

const ProfileSidebar = ({ user, logout, activeTab, onTabChange, counts }: ProfileSidebarProps) => {
  const navigate = useNavigate();

  // Format initials for avatar
  const getInitials = () => {
    if (!user?.fullName) return "U";
    return user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="bg-jd-card rounded-lg p-6">
      <div className="flex flex-col items-center mb-6">
        <div className="h-24 w-24 rounded-full bg-jd-purple flex items-center justify-center text-white text-2xl font-medium">
          {getInitials()}
        </div>
        <h2 className="mt-4 text-2xl font-medium">{user?.fullName}</h2>
        <p className="text-jd-mutedText">@{user?.username}</p>
        
        {logout && (
          <Button 
            variant="ghost" 
            className="mt-4 text-jd-red hover:text-jd-red/90 hover:bg-jd-red/10 flex items-center gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        )}
      </div>
      
      {counts && onTabChange && (
        <div className="space-y-2 mb-6">
          <Button 
            variant={activeTab === "overview" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onTabChange("overview")}
          >
            Overview
          </Button>
          <Button 
            variant={activeTab === "accepted" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onTabChange("accepted")}
          >
            Accepted Items {counts.accepted > 0 && `(${counts.accepted})`}
          </Button>
          <Button 
            variant={activeTab === "archived" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onTabChange("archived")}
          >
            Archived Items {counts.archived > 0 && `(${counts.archived})`}
          </Button>
          <Button 
            variant={activeTab === "history" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onTabChange("history")}
          >
            History {counts.history > 0 && `(${counts.history})`}
          </Button>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <p className="text-jd-mutedText text-sm">Department</p>
          <p className="font-medium">{user?.department}</p>
        </div>
        
        <div>
          <p className="text-jd-mutedText text-sm">Role</p>
          <p className="capitalize">{user?.role}</p>
        </div>
        
        <div>
          <p className="text-jd-mutedText text-sm">Account Status</p>
          <div className="flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            <p>Active</p>
          </div>
        </div>
        
        <div>
          <p className="text-jd-mutedText text-sm">Email</p>
          <p>{user?.email}</p>
        </div>
        
        {user?.phone && (
          <div>
            <p className="text-jd-mutedText text-sm">Phone</p>
            <p>{user.phone}</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 space-y-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate("/settings?tab=account")}
        >
          Edit Profile
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate("/settings")}
        >
          Settings
        </Button>
      </div>
    </div>
  );
};

export default ProfileSidebar;
