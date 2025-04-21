
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState(() => {
    const storedRequests = localStorage.getItem("jd-requests");
    return storedRequests ? JSON.parse(storedRequests) : [];
  });

  // Calculate stats
  const totalRequests = requests.length;
  const completedRequests = requests.filter((r: any) => r.status === "Completed").length;
  const pendingRequests = requests.filter((r: any) => r.status === "Pending").length;

  // Get recent activity
  const recentActivity = requests.slice(0, 3);

  // Format initials for avatar
  const getInitials = () => {
    if (!user?.fullName) return "U";
    return user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-jd-card rounded-lg p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="h-24 w-24 rounded-full bg-jd-purple flex items-center justify-center text-white text-2xl font-medium">
              {getInitials()}
            </div>
            <h2 className="mt-4 text-2xl font-medium">{user?.username}</h2>
            <p className="text-jd-mutedText">@{user?.username}</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-jd-mutedText text-sm">Department</p>
              <p className="font-medium">{user?.department}</p>
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
            <Button variant="outline" className="w-full">
              Edit Profile
            </Button>
            <Button variant="outline" className="w-full">
              Settings
            </Button>
            <Button 
              variant="destructive" 
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={logout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-jd-card rounded-lg p-6">
          <h3 className="text-xl font-medium mb-6">Activity Summary</h3>
          <p className="text-jd-mutedText mb-4">Overview of your activity on the platform</p>
          
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-jd-purple">{totalRequests}</div>
              <p className="text-jd-mutedText">Total Requests</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-500">{completedRequests}</div>
              <p className="text-jd-mutedText">Completed</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-jd-orange">{pendingRequests}</div>
              <p className="text-jd-mutedText">Pending</p>
            </div>
          </div>
        </div>
        
        <div className="bg-jd-card rounded-lg p-6">
          <h3 className="text-xl font-medium mb-6">Recent Activity</h3>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity: any, index) => (
                <div key={index} className="border-b border-jd-bg last:border-0 pb-4 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{activity.title}</h4>
                      <p className="text-sm text-jd-purple">{activity.department}</p>
                      <p className="text-sm text-jd-mutedText mt-1">{activity.description?.slice(0, 100)}{activity.description?.length > 100 ? '...' : ''}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`px-2 py-1 rounded text-xs ${
                        activity.status === "Pending" ? "bg-jd-orange/20 text-jd-orange" :
                        activity.status === "In progress" ? "bg-jd-blue/20 text-jd-blue" :
                        "bg-green-500/20 text-green-500"
                      }`}>
                        {activity.status}
                      </span>
                      <span className="text-xs text-jd-mutedText mt-1">{activity.dateCreated}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-jd-mutedText">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
