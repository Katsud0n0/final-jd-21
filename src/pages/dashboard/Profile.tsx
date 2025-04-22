
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    loadRequests();
    
    // Check for expired archived projects
    const interval = setInterval(checkArchivedProjects, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const loadRequests = () => {
    const storedRequests = localStorage.getItem("jd-requests");
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests));
    }
  };
  
  // Check for archived projects that need to be deleted
  const checkArchivedProjects = () => {
    const now = new Date();
    const storedRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
    
    const updatedRequests = storedRequests.filter((req: any) => {
      // Skip if not archived or not pending
      if (!req.archived || req.status !== "Pending") return true;
      
      // For archived projects, check if 7 days have passed
      if (req.archivedAt) {
        const archiveDate = new Date(req.archivedAt);
        const deleteDate = new Date(archiveDate);
        deleteDate.setDate(deleteDate.getDate() + 7);
        
        return now <= deleteDate; // Keep if not yet due for deletion
      }
      
      return true;
    });
    
    if (updatedRequests.length < storedRequests.length) {
      // Some archived projects were deleted
      localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
      setRequests(updatedRequests);
      
      toast({
        title: "Projects removed",
        description: "Some archived projects have been automatically deleted after 7 days.",
      });
    }
  };

  // Filter requests for current user
  const userRequests = requests.filter((r: any) => r.creator === user?.username);

  // Get archived projects
  const archivedProjects = requests.filter(
    (r: any) => r.type === "project" && r.archived && r.creator === user?.username
  );

  // Calculate stats
  const totalRequests = userRequests.length;
  const completedRequests = userRequests.filter((r: any) => r.status === "Approved").length;
  const pendingRequests = userRequests.filter((r: any) => r.status === "Pending").length;

  // Get recent activity
  const recentActivity = userRequests
    .filter((r: any) => !r.archived)
    .slice(0, 3);

  // Format initials for avatar
  const getInitials = () => {
    if (!user?.fullName) return "U";
    return user.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Handle unarchive project
  const handleUnarchive = (projectId: string) => {
    const updatedRequests = requests.map((r: any) => 
      r.id === projectId ? { ...r, archived: false, archivedAt: null } : r
    );
    setRequests(updatedRequests);
    localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
    
    toast({
      title: "Project restored",
      description: "The project has been restored from the archive.",
    });
  };

  // Handle permanent delete
  const handleDelete = (projectId: string) => {
    const updatedRequests = requests.filter((r: any) => r.id !== projectId);
    setRequests(updatedRequests);
    localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
    
    toast({
      title: "Project deleted",
      description: "The project has been permanently deleted.",
    });
  };

  // Calculate days left before auto-deletion for archived projects
  const getDaysRemaining = (archivedAt: string) => {
    if (!archivedAt) return "Unknown";
    
    const archiveDate = new Date(archivedAt);
    const deleteDate = new Date(archiveDate);
    deleteDate.setDate(deleteDate.getDate() + 7);
    
    const now = new Date();
    const diffTime = deleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? `${diffDays} days` : "Today";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <div className="bg-jd-card rounded-lg p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="h-24 w-24 rounded-full bg-jd-purple flex items-center justify-center text-white text-2xl font-medium">
              {getInitials()}
            </div>
            <h2 className="mt-4 text-2xl font-medium">{user?.fullName}</h2>
            <p className="text-jd-mutedText">@{user?.username}</p>
          </div>
          
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
        <Tabs defaultValue="activity">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-1">
              <Archive size={16} /> Archived Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6 mt-4">
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
                  <p className="text-jd-mutedText">Approved</p>
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
                            activity.status === "In Process" ? "bg-blue-500/20 text-blue-500" :
                            activity.status === "Approved" ? "bg-green-500/20 text-green-500" :
                            "bg-red-500/20 text-red-500"
                          }`}>
                            {activity.status}
                          </span>
                          <span className="text-xs text-jd-mutedText mt-1">{activity.dateCreated}</span>
                          {activity.status === "Pending" && (
                            <div className="flex items-center gap-1 text-xs text-jd-mutedText mt-1">
                              <Clock size={12} />
                              <span>
                                Expires in: {activity.type === "request" ? "30 days" : "60 days"}
                              </span>
                            </div>
                          )}
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
          </TabsContent>

          <TabsContent value="archived" className="mt-4">
            <div className="bg-jd-card rounded-lg p-6">
              <h3 className="text-xl font-medium mb-6">Archived Projects</h3>
              <p className="text-jd-mutedText mb-4">
                Projects you've archived. These are hidden from the main view but still stored in the system.
                <br />If a project's status is still pending, it will be permanently deleted 7 days after archiving.
              </p>
              
              {archivedProjects.length > 0 ? (
                <div className="space-y-4">
                  {archivedProjects.map((project: any, index) => (
                    <div key={index} className="border border-jd-bg rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{project.title}</h4>
                          <p className="text-sm text-jd-purple">{project.department}</p>
                          <p className="text-sm text-jd-mutedText mt-1">{project.description?.slice(0, 100)}{project.description?.length > 100 ? '...' : ''}</p>
                          <div className="mt-2 flex items-center">
                            <span className="text-xs text-jd-mutedText">Archived on: {new Date(project.archivedAt).toLocaleDateString()}</span>
                            {project.status === "Pending" && (
                              <div className="ml-4 flex items-center gap-1 text-xs text-jd-orange">
                                <Clock size={12} />
                                <span>
                                  Auto-delete in: {getDaysRemaining(project.archivedAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUnarchive(project.id)}
                          >
                            Restore
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDelete(project.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-jd-bg rounded-lg">
                  <Archive size={48} className="mx-auto text-jd-mutedText mb-3" />
                  <h4 className="text-lg font-medium mb-2">No Archived Projects</h4>
                  <p className="text-jd-mutedText max-w-md mx-auto">
                    Projects you archive will appear here. Archived projects are hidden from the main requests view.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
