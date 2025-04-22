import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Clock, Check, X, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);

  useEffect(() => {
    loadRequests();
    
    // Check for expired archived projects and status changes
    const interval = setInterval(() => {
      checkArchivedProjects();
      checkExpiredItems();
    }, 60000); // Check every minute
    
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

  // Check for expired items (completed or rejected for more than 1 day)
  const checkExpiredItems = () => {
    const now = new Date();
    const storedRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
    
    const updatedRequests = storedRequests.map((req: any) => {
      // Check if completed or rejected status
      if ((req.status === "Completed" || req.status === "Rejected") && req.lastStatusUpdate) {
        const statusUpdateDate = new Date(req.lastStatusUpdate);
        const oneDayLater = new Date(statusUpdateDate);
        oneDayLater.setDate(oneDayLater.getDate() + 1);
        
        if (now > oneDayLater && !req.isExpired) {
          // Mark as expired for visual fading, will be deleted on next check
          return { ...req, isExpired: true };
        } else if (req.isExpired) {
          // If already marked as expired, it should be deleted now
          return null;
        }
      }
      
      return req;
    }).filter(Boolean); // Remove null items (deleted requests)
    
    if (updatedRequests.length < storedRequests.length || JSON.stringify(updatedRequests) !== JSON.stringify(storedRequests)) {
      localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
      setRequests(updatedRequests);
    }
  };

  // Filter requests for current user
  const userRequests = requests.filter((r: any) => r.creator === user?.username);

  // Get archived projects (admin only)
  const archivedProjects = requests.filter(
    (r: any) => r.type === "project" && r.archived && 
    // Show archived projects only to admins
    (user?.role === "admin" ? r.department === user?.department : r.creator === user?.username)
  );

  // Get accepted requests/projects (in process)
  const acceptedItems = requests.filter(
    (r: any) => {
      // For regular requests: show if status is "In Process" and created by current user
      if (r.type === "request") {
        return r.status === "In Process" && r.creator === user?.username;
      }
      
      // For projects: Only show projects where all required users have accepted
      if (r.type === "project") {
        return r.status === "In Process" && 
               r.creator === user?.username &&
               r.usersAccepted >= r.usersNeeded;
      }
      
      return false;
    }
  );

  // Get history items (completed or rejected)
  const historyItems = requests.filter(
    (r: any) => (r.status === "Completed" || r.status === "Rejected") && r.creator === user?.username
  );

  // Calculate stats
  const totalRequests = userRequests.length;
  const completedRequests = userRequests.filter((r: any) => r.status === "Completed").length;
  const pendingRequests = userRequests.filter((r: any) => r.status === "Pending").length;
  const inProcessRequests = userRequests.filter((r: any) => r.status === "In Process").length;
  const rejectedRequests = userRequests.filter((r: any) => r.status === "Rejected").length;

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

  // Handle mark as completed
  const handleMarkCompleted = (itemId: string) => {
    const now = new Date();
    const updatedRequests = requests.map((r: any) => 
      r.id === itemId ? { 
        ...r, 
        status: "Completed", 
        lastStatusUpdate: now.toISOString(),
        lastStatusUpdateTime: now.toLocaleTimeString()
      } : r
    );
    setRequests(updatedRequests);
    localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
    
    toast({
      title: "Marked as Completed",
      description: "The item has been marked as completed successfully.",
    });
  };

  // Handle abandon (mark as rejected) - only for requests, not projects
  const handleAbandon = (itemId: string) => {
    const item = requests.find((r: any) => r.id === itemId);
    
    // Don't allow abandoning projects
    if (item && item.type === "project") {
      toast({
        title: "Cannot abandon project",
        description: "Projects cannot be abandoned once accepted.",
        variant: "destructive"
      });
      return;
    }
    
    const now = new Date();
    const updatedRequests = requests.map((r: any) => 
      r.id === itemId ? { 
        ...r, 
        status: "Rejected", 
        lastStatusUpdate: now.toISOString(),
        lastStatusUpdateTime: now.toLocaleTimeString()
      } : r
    );
    setRequests(updatedRequests);
    localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
    
    toast({
      title: "Request Abandoned",
      description: "The item has been abandoned and marked as rejected.",
    });
  };

  // Handle clear history
  const handleClearHistory = () => {
    const updatedRequests = requests.filter((r: any) => 
      !(r.creator === user?.username && (r.status === "Completed" || r.status === "Rejected"))
    );
    setRequests(updatedRequests);
    localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
    
    toast({
      title: "History cleared",
      description: "Your history has been cleared successfully.",
    });
    
    setShowClearHistoryDialog(false);
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

  // Determine if the Archived tab should be shown (only for admins)
  const showArchivedTab = user?.role === "admin";

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
          <TabsList className={`grid ${showArchivedTab ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            {showArchivedTab && (
              <TabsTrigger value="archived" className="flex items-center gap-1">
                <Archive size={16} /> Archived
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="activity" className="space-y-6 mt-4">
            <div className="bg-jd-card rounded-lg p-6">
              <h3 className="text-xl font-medium mb-6">Activity Summary</h3>
              <p className="text-jd-mutedText mb-4">Overview of your activity on the platform</p>
              
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-4xl font-bold text-jd-purple">{totalRequests}</div>
                  <p className="text-jd-mutedText">Total</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-jd-orange">{pendingRequests}</div>
                  <p className="text-jd-mutedText">Pending</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-blue-500">{inProcessRequests}</div>
                  <p className="text-jd-mutedText">In Process</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-500">{completedRequests}</div>
                  <p className="text-jd-mutedText">Completed</p>
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
                            activity.status === "Completed" ? "bg-green-500/20 text-green-500" :
                            "bg-red-500/20 text-red-500"
                          }`}>
                            {activity.status}
                          </span>
                          <span className="text-xs text-jd-mutedText mt-1">{activity.dateCreated}</span>
                          {activity.lastStatusUpdateTime && (
                            <div className="flex items-center gap-1 text-xs text-jd-mutedText mt-1">
                              <Clock size={12} />
                              <span>
                                Updated: {activity.lastStatusUpdateTime}
                              </span>
                            </div>
                          )}
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

          <TabsContent value="accepted" className="mt-4">
            <div className="bg-jd-card rounded-lg p-6">
              <h3 className="text-xl font-medium mb-6">Accepted Items</h3>
              <p className="text-jd-mutedText mb-4">
                Requests and projects you've accepted and are currently working on
              </p>
              
              {acceptedItems.length > 0 ? (
                <div className="space-y-4">
                  {acceptedItems.map((item: any, index) => (
                    <div key={index} className="border border-jd-bg rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-jd-purple">{item.department}</p>
                          <p className="text-sm text-jd-mutedText mt-1">{item.description?.slice(0, 100)}{item.description?.length > 100 ? '...' : ''}</p>
                          <div className="mt-2 flex items-center">
                            <span className="bg-blue-500/20 text-blue-500 px-2 py-1 rounded text-xs">In Process</span>
                            {item.lastStatusUpdateTime && (
                              <div className="flex items-center gap-1 text-xs text-jd-mutedText ml-4">
                                <Clock size={12} />
                                <span>
                                  Last updated: {item.lastStatusUpdateTime}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
                            onClick={() => handleMarkCompleted(item.id)}
                          >
                            <Check size={16} />
                            Mark Completed
                          </Button>
                          
                          {/* Show Abandon button only for requests, not for projects */}
                          {item.type !== "project" && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="flex items-center gap-1"
                              onClick={() => handleAbandon(item.id)}
                            >
                              <X size={16} />
                              Abandon
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-jd-bg rounded-lg">
                  <Clock size={48} className="mx-auto text-jd-mutedText mb-3" />
                  <h4 className="text-lg font-medium mb-2">No Accepted Items</h4>
                  <p className="text-jd-mutedText max-w-md mx-auto">
                    You haven't accepted any requests or projects yet. Items you accept will appear here.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="bg-jd-card rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-medium">History</h3>
                  <p className="text-jd-mutedText">
                    Items that have been completed or rejected
                  </p>
                </div>
                
                {historyItems.length > 0 && (
                  <AlertDialog open={showClearHistoryDialog} onOpenChange={setShowClearHistoryDialog}>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                        Clear History
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-jd-card border-jd-card">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear History</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to clear your history? This will permanently remove all completed and rejected items.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-jd-bg hover:bg-jd-bg/80">Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-600 hover:bg-red-700"
                          onClick={handleClearHistory}
                        >
                          Clear History
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              
              {historyItems.length > 0 ? (
                <div className="space-y-4">
                  {historyItems.map((item: any, index) => (
                    <div 
                      key={index} 
                      className={`border border-jd-bg rounded-lg p-4 ${item.isExpired ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-jd-purple">{item.department}</p>
                          <p className="text-sm text-jd-mutedText mt-1">{item.description?.slice(0, 100)}{item.description?.length > 100 ? '...' : ''}</p>
                          <div className="mt-2 flex items-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.status === "Completed" ? "bg-green-500/20 text-green-500" :
                              "bg-red-500/20 text-red-500"
                            }`}>
                              {item.status}
                            </span>
                            {item.lastStatusUpdateTime && (
                              <div className="flex items-center gap-1 text-xs text-jd-mutedText ml-4">
                                <Clock size={12} />
                                <span>
                                  Updated: {item.lastStatusUpdateTime}
                                </span>
                              </div>
                            )}
                            {item.isExpired && (
                              <span className="ml-4 text-xs text-red-500">
                                Expired - Will be deleted soon
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-jd-bg rounded-lg">
                  <Check size={48} className="mx-auto text-jd-mutedText mb-3" />
                  <h4 className="text-lg font-medium mb-2">No History</h4>
                  <p className="text-jd-mutedText max-w-md mx-auto">
                    You don't have any completed or rejected items in your history.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {showArchivedTab && (
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
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
