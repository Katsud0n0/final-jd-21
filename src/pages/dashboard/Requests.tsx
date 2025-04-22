import { useState, useEffect } from "react";
import { Trash2, Plus, Archive, Check, X, Clock, Ban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import RequestForm from "@/components/dashboard/RequestForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Request {
  id: string;
  title: string;
  department: string;
  dateCreated: string;
  status: string;
  creator: string;
  description: string;
  type: string;
  expirationDate?: string;
  archived?: boolean;
  archivedAt?: string;
  createdAt?: string;
  lastStatusUpdate?: string;
  acceptedBy?: string[] | string;
  isExpired?: boolean;
  lastStatusUpdateTime?: string;
  usersNeeded?: number;
  usersAccepted?: number;
}

const statusOptions = ["Pending", "In Process", "Completed", "Rejected"];

const Requests = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [projectToAccept, setProjectToAccept] = useState<string | null>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);

  useEffect(() => {
    // Load requests from localStorage
    loadRequests();
    
    // Check for expired requests immediately on component mount
    checkExpiredRequests();

    // Set up interval to check for expired requests
    const checkExpiryInterval = setInterval(checkExpiredRequests, 60000); // Check every minute

    return () => clearInterval(checkExpiryInterval);
  }, []);

  const loadRequests = () => {
    const storedRequests = localStorage.getItem("jd-requests");
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests));
    }
  };

  // Clear all requests from localStorage (admin only)
  const clearAllRequests = () => {
    localStorage.removeItem("jd-requests");
    setRequests([]);
    toast({
      title: "All requests cleared",
      description: "All requests have been cleared from the system.",
    });
  };

  // Function to check for expired requests
  const checkExpiredRequests = () => {
    const now = new Date();
    const storedRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
    
    let updated = false;
    
    // Process each request based on type and status
    const updatedRequests = storedRequests.map((req: Request) => {
      // Check for completed/rejected items to mark as expired after 1 day
      if ((req.status === "Completed" || req.status === "Rejected") && req.lastStatusUpdate) {
        const statusUpdateDate = new Date(req.lastStatusUpdate);
        const oneDayLater = new Date(statusUpdateDate);
        oneDayLater.setDate(oneDayLater.getDate() + 1);
        
        if (now > oneDayLater && !req.isExpired) {
          // Mark as expired for visual fading, will be deleted on next check
          updated = true;
          return { ...req, isExpired: true };
        }
      } 
      
      // Auto-delete expired items
      if (req.isExpired) {
        updated = true;
        return null; // Mark for deletion
      }
      
      if (req.status !== "Pending") return req;
      
      const createdDate = new Date(req.createdAt || req.dateCreated);
      
      if (req.type === "request") {
        // For requests: Auto-delete after 30 days if pending
        const expiryDays = 30;
        const expiryDate = new Date(createdDate);
        expiryDate.setDate(expiryDate.getDate() + expiryDays);
        
        if (now > expiryDate) {
          updated = true;
          return null; // Mark for deletion
        }
      } else if (req.type === "project") {
        // For projects: Auto-archive after 60 days if pending
        const archiveDays = 60;
        const archiveDate = new Date(createdDate);
        archiveDate.setDate(archiveDate.getDate() + archiveDays);
        
        if (now > archiveDate && !req.archived) {
          updated = true;
          return { ...req, archived: true, archivedAt: now.toISOString() };
        }
        
        // For archived projects: Auto-delete after 7 more days
        if (req.archived && req.archivedAt) {
          const deleteDate = new Date(req.archivedAt);
          deleteDate.setDate(deleteDate.getDate() + 7);
          
          if (now > deleteDate) {
            updated = true;
            return null; // Mark for deletion
          }
        }
      }
      
      return req;
    }).filter(Boolean); // Remove null items (deleted requests)
    
    if (updated) {
      // Some requests were expired/deleted
      localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
      setRequests(updatedRequests);
      
      toast({
        title: "Requests updated",
        description: "Some requests have been archived or removed due to expiration.",
      });
    }
  };

  // Function to close dialog and refresh requests
  const handleRequestSuccess = () => {
    setDialogOpen(false);
    loadRequests(); // Reload requests to show the new one
    toast({
      title: "Request created",
      description: "Your request has been successfully created.",
    });
  };

  const handleStatusChange = (requestId: string, newStatus: string) => {
    if (!user) return;
    
    const now = new Date();
    
    // Find the request we're updating
    const requestToUpdate = requests.find(r => r.id === requestId);
    
    // Don't allow status change if request is already completed or rejected
    if (requestToUpdate && (requestToUpdate.status === "Completed" || requestToUpdate.status === "Rejected")) {
      toast({
        title: "Status cannot be changed",
        description: "Completed or rejected requests cannot have their status changed.",
        variant: "destructive"
      });
      return;
    }
    
    const updatedRequests = requests.map(r => {
      if (r.id === requestId) {
        const updatedRequest = { 
          ...r, 
          status: newStatus, 
          lastStatusUpdate: now.toISOString(),
          lastStatusUpdateTime: now.toLocaleTimeString(),
        };
        
        // Handle "In Process" status for regular requests
        if (newStatus === "In Process" && r.type === "request") {
          // If it's a string (backward compatibility), convert to array
          const currentAcceptedBy = Array.isArray(r.acceptedBy) ? r.acceptedBy : [];
          
          if (!currentAcceptedBy.includes(user.username)) {
            updatedRequest.acceptedBy = [...currentAcceptedBy, user.username];
          }
        }
        
        return updatedRequest;
      }
      return r;
    });
    
    setRequests(updatedRequests);
    localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
    
    toast({
      title: "Status updated",
      description: "The request status has been updated successfully.",
    });
  };

  const handleDelete = (id: string) => {
    setRequestToDelete(id);
  };
  
  const handleArchive = (id: string) => {
    const updatedRequests = requests.map(r => 
      r.id === id ? { ...r, archived: true, archivedAt: new Date().toISOString() } : r
    );
    setRequests(updatedRequests);
    localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
    
    toast({
      title: "Project archived",
      description: "The project has been archived successfully.",
    });
  };

  const confirmDelete = () => {
    if (requestToDelete) {
      const updatedRequests = requests.filter(r => r.id !== requestToDelete);
      setRequests(updatedRequests);
      localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
      
      toast({
        title: "Request deleted",
        description: "The request has been deleted successfully.",
      });
      
      setRequestToDelete(null);
    }
  };

  // Open the accept confirmation dialog for a project
  const handleAcceptProject = (request: Request) => {
    setProjectToAccept(request.id);
    setAcceptDialogOpen(true);
  };

  // Handle project acceptance after confirmation
  const confirmAcceptProject = () => {
    if (!projectToAccept || !user) {
      setAcceptDialogOpen(false);
      return;
    }

    const now = new Date();
    const projectIndex = requests.findIndex(r => r.id === projectToAccept);
    
    if (projectIndex === -1) {
      setAcceptDialogOpen(false);
      return;
    }

    const project = requests[projectIndex];
    
    // Prepare the acceptedBy array
    const currentAcceptedBy = Array.isArray(project.acceptedBy) ? project.acceptedBy : [];
    
    if (currentAcceptedBy.includes(user.username)) {
      toast({
        title: "Already accepted",
        description: "You have already accepted this project.",
      });
      setAcceptDialogOpen(false);
      return;
    }
    
    // Update the project with the new user acceptance
    const updatedAcceptedBy = [...currentAcceptedBy, user.username];
    const updatedUsersAccepted = (project.usersAccepted || 0) + 1;
    
    // Check if we've reached the required number of users
    const shouldUpdateStatus = updatedUsersAccepted >= (project.usersNeeded || 1) && project.status === "Pending";
    
    const updatedProject = {
      ...project,
      acceptedBy: updatedAcceptedBy,
      usersAccepted: updatedUsersAccepted,
      status: shouldUpdateStatus ? "In Process" : project.status,
      ...(shouldUpdateStatus && {
        lastStatusUpdate: now.toISOString(),
        lastStatusUpdateTime: now.toLocaleTimeString(),
      })
    };
    
    // Update the requests array
    const updatedRequests = [...requests];
    updatedRequests[projectIndex] = updatedProject;
    
    setRequests(updatedRequests);
    localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
    
    toast({
      title: "Project accepted",
      description: shouldUpdateStatus 
        ? "You've accepted the project and it has now moved to In Process status."
        : "You've accepted the project. It needs more users before it can start.",
    });
    
    setAcceptDialogOpen(false);
    setProjectToAccept(null);
  };

  // Check if user can accept a request (only clients can accept),
  // but for requests, the creator should NOT see the button.
  const canAcceptRequest = (request: Request) => {
    if (!user || !request) return false;

    // Basic conditions for acceptance
    const basicConditions = user.role === "client" && 
                           request.status === "Pending" && 
                           !request.archived;
    
    if (!basicConditions) return false;
    
    // For projects, check if the user hasn't already accepted and is not the creator
    if (request.type === "project") {
      const acceptedBy = Array.isArray(request.acceptedBy) ? request.acceptedBy : [];
      // Exclude both creator and already accepted users
      return request.creator !== user.username && !acceptedBy.includes(user.username);
    }
    
    // For regular requests, user must not be the creator
    return request.creator !== user.username;
  };

  // Check if user can delete a specific request
  const canDeleteRequest = (request: Request) => {
    // Not deletable if completed or rejected
    if (request.status === "Completed" || request.status === "Rejected") {
      return false;
    }
    
    // Admin can delete requests in their department
    if (user?.role === "admin") {
      return user.department === request.department;
    }
    
    // Regular user can only delete their own requests that are not completed/rejected
    return user?.username === request.creator;
  };

  // Check if user can edit the status of a request
  const canEditStatus = (request: Request) => {
    // Cannot change status if already completed or rejected
    if (request.status === "Completed" || request.status === "Rejected") {
      return false;
    }
    
    // Only admin of the department can edit status
    return user?.role === "admin" && user?.department === request.department;
  };
  
  // Check if user can archive a project
  const canArchiveProject = (request: Request) => {
    // Only admin of the department can archive projects
    return request.type === "project" && 
           user?.role === "admin" && 
           user?.department === request.department;
  };

  // Show all requests to everyone - not filtering by permissions
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || request.status === statusFilter;
    
    // Filter by type based on active tab
    const matchesType = 
      activeTab === "all" || 
      (activeTab === "requests" && request.type === "request") || 
      (activeTab === "projects" && request.type === "project");
    
    // Don't show archived projects in main view for non-admins
    const isVisible = request.type !== "project" || 
                     !request.archived || 
                     (user?.role === "admin" && request.department === user.department);
    
    return matchesSearch && matchesStatus && matchesType && isVisible;
  });

  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Page Header with Make Request Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">Requests</h2>
          <p className="text-jd-mutedText text-lg">
            Manage and track department requests
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-jd-purple hover:bg-jd-darkPurple">
              <Plus className="mr-2 h-4 w-4" />
              Make a Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-jd-card border-jd-card">
            <DialogHeader>
              <DialogTitle>Create New Request</DialogTitle>
              <DialogDescription>
                Submit a new request to another department
              </DialogDescription>
            </DialogHeader>
            <RequestForm onSuccess={handleRequestSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Request/Project Type Tabs */}
      <Tabs defaultValue="all" onValueChange={value => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span>Status: {statusFilter}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {statusOptions.map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Requests Table */}
      <div className="bg-jd-card rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-jd-bg">
                <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">
                  TITLE
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">
                  DEPARTMENT
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">
                  DATE CREATED
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">
                  CREATOR
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">
                  STATUS
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">
                  EXPIRES
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr 
                    key={request.id} 
                    className={`border-t border-jd-bg ${(request.status === "Completed" || request.status === "Rejected") ? 'opacity-50' : ''} ${request.isExpired ? 'opacity-30' : ''}`}
                  >
                    <td className="px-4 py-4 text-sm">{request.id}</td>
                    <td className="px-4 py-4 text-sm font-medium">
                      {request.title}
                      {request.type === "project" && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-jd-purple/20 text-jd-purple rounded-full">
                          Project
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">{request.department}</td>
                    <td className="px-4 py-4 text-sm">{request.dateCreated}</td>
                    <td className="px-4 py-4 text-sm">{request.creator}</td>
                    <td className="px-4 py-4">
                      {canEditStatus(request) ? (
                        <Select
                          value={request.status}
                          onValueChange={(value) => handleStatusChange(request.id, value)}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(status => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            request.status === "Pending" ? "bg-jd-orange/20 text-jd-orange" : 
                            request.status === "In Process" ? "bg-blue-500/20 text-blue-500" :
                            request.status === "Completed" ? "bg-jd-green/20 text-jd-green" :
                            "bg-jd-red/20 text-jd-red"
                          }`}>
                            {request.status}
                          </span>
                          {request.type === "project" && request.usersNeeded && (
                            <span className="text-xs text-jd-mutedText mt-1">
                              Accepted by {request.usersAccepted || 0}/{request.usersNeeded} users
                            </span>
                          )}
                          {request.lastStatusUpdateTime && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-jd-mutedText">
                              <Clock size={12} />
                              <span>Updated: {request.lastStatusUpdateTime}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {/* Show expiration info in this column only */}
                      {request.type === "project" ? (
                        request.status === "Pending" ? (
                          <span>60 days</span>
                        ) : request.status === "Completed" || request.status === "Rejected" ? (
                          <span>1 day</span>
                        ) : (
                          <span className="text-jd-mutedText">N/A</span>
                        )
                      ) : (
                        <>
                          {request.status === "Pending" ? (
                            <span>30 days</span>
                          ) : (request.status === "Completed" || request.status === "Rejected") ? (
                            <span>1 day</span>
                          ) : (
                            <span className="text-jd-mutedText">N/A</span>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          {/* Only show Archive button for admins */}
                          {canArchiveProject(request) && user?.role === "admin" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-jd-purple hover:text-jd-darkPurple hover:bg-jd-purple/10"
                              onClick={() => handleArchive(request.id)}
                            >
                              <Archive size={18} />
                            </Button>
                          )}
                          
                          {canDeleteRequest(request) ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-jd-red hover:text-red-600 hover:bg-red-500/10"
                                  onClick={() => handleDelete(request.id)}
                                >
                                  <Trash2 size={18} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-jd-card border-jd-card">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Request</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this request? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-jd-bg hover:bg-jd-bg/80">Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={confirmDelete}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 cursor-not-allowed"
                              disabled={true}
                            >
                              <Trash2 size={18} />
                            </Button>
                          )}
                        </div>
                        {/* Acceptance buttons for projects/requests, only shown if allowed */}
                        {canAcceptRequest(request) && (
                          <>
                            {request.type === "project" ? (
                              <Button 
                                size="sm"
                                className="bg-jd-purple text-xs"
                                onClick={() => handleAcceptProject(request)}
                              >
                                Accept Project
                              </Button>
                            ) : (
                              <Button 
                                size="sm"
                                className="bg-jd-purple text-xs"
                                onClick={() => handleStatusChange(request.id, "In Process")}
                              >
                                Accept
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-jd-mutedText">
                    No requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Project Acceptance Confirmation Dialog */}
      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent className="bg-jd-card border-jd-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Project Acceptance</AlertDialogTitle>
            <AlertDialogDescription>
              Once accepted, you cannot abandon this project. You will be responsible for completing your part of the work.
              
              Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-jd-bg hover:bg-jd-bg/80">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-jd-purple hover:bg-jd-darkPurple"
              onClick={confirmAcceptProject}
            >
              Accept Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Clear all requests button (admin only) */}
      {isAdmin && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="mt-4"
              >
                Clear All Requests
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-jd-card border-jd-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Requests</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove ALL requests from the system. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-jd-bg hover:bg-jd-bg/80">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={clearAllRequests}
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
};

export default Requests;
