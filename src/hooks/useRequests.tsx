import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Request } from "@/types/profileTypes";
import { Check } from "lucide-react";
import { api } from "@/api";

export const useRequests = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [departmentFilters, setDepartmentFilters] = useState<string[]>([]);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [projectToAccept, setProjectToAccept] = useState<string | null>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  useEffect(() => {
    loadRequests();
    checkExpiredRequests();
    const checkExpiryInterval = setInterval(checkExpiredRequests, 60000);
    return () => clearInterval(checkExpiryInterval);
  }, []);

  const loadRequests = () => {
    const storedRequests = localStorage.getItem("jd-requests");
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests));
    }
  };

  const clearAllRequests = () => {
    if (!user || user.role !== 'admin') return;
    
    const storedRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
    
    const filteredRequests = storedRequests.filter((req: Request) => {
      if (Array.isArray(req.departments)) {
        return !req.departments.includes(user.department);
      } else if (typeof req.department === 'string') {
        return !req.department.includes(user.department);
      }
      return true;
    });
    
    localStorage.setItem("jd-requests", JSON.stringify(filteredRequests));
    setRequests(filteredRequests);
    
    toast({
      title: `${user.department} requests cleared`,
      description: `All requests for your department have been cleared from the system.`,
    });
  };

  const checkExpiredRequests = () => {
    const now = new Date();
    const storedRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
    
    let updated = false;
    
    const updatedRequests = storedRequests.map((req: Request) => {
      if ((req.status === "Completed" || req.status === "Rejected") && req.lastStatusUpdate) {
        const statusUpdateDate = new Date(req.lastStatusUpdate);
        const oneDayLater = new Date(statusUpdateDate);
        oneDayLater.setDate(oneDayLater.getDate() + 1);
        
        if (now > oneDayLater && !req.isExpired) {
          updated = true;
          return { ...req, isExpired: true };
        }
      } 
      
      if (req.isExpired) {
        updated = true;
        return null;
      }
      
      if (req.status !== "Pending") return req;
      
      const createdDate = new Date(req.createdAt || req.dateCreated);
      
      if (req.type === "request") {
        // Use 45 days for multi-department requests, 30 for regular requests
        const expiryDays = req.multiDepartment ? 45 : 30;
        const expiryDate = new Date(createdDate);
        expiryDate.setDate(expiryDate.getDate() + expiryDays);
        
        if (now > expiryDate) {
          updated = true;
          return null;
        }
      } else if (req.type === "project") {
        const archiveDays = 60;
        const archiveDate = new Date(createdDate);
        archiveDate.setDate(archiveDate.getDate() + archiveDays);
        
        if (now > archiveDate && !req.archived) {
          updated = true;
          return { ...req, archived: true, archivedAt: now.toISOString() };
        }
        
        if (req.archived && req.archivedAt) {
          const deleteDate = new Date(req.archivedAt);
          deleteDate.setDate(deleteDate.getDate() + 7);
          
          if (now > deleteDate) {
            updated = true;
            return null;
          }
        }
      }
      
      return req;
    }).filter(Boolean);
    
    if (updated) {
      localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
      setRequests(updatedRequests);
      
      toast({
        title: "Requests updated",
        description: "Some requests have been archived or removed due to expiration.",
      });
    }
  };

  const handleRequestSuccess = () => {
    setDialogOpen(false);
    loadRequests();
    toast({
      title: "Request created",
      description: "Your request has been successfully created.",
    });
  };

  const handleStatusChange = (requestId: string, newStatus: string) => {
    if (!user) return;
    
    const now = new Date();
    const requestToUpdate = requests.find(r => r.id === requestId);
    
    if (requestToUpdate && (requestToUpdate.status === "Completed" || requestToUpdate.status === "Rejected")) {
      toast({
        title: "Status cannot be changed",
        description: "Completed or rejected requests cannot have their status changed.",
        variant: "destructive"
      });
      return;
    }

    // For multi-department requests or projects, handle the completion logic differently
    if ((requestToUpdate?.multiDepartment || requestToUpdate?.type === "project") && newStatus === "Completed") {
      const participantsCompleted = requestToUpdate.participantsCompleted || [];
      
      // Add current user to the completed participants if not already there
      if (!participantsCompleted.includes(user.username)) {
        const updatedParticipantsCompleted = [...participantsCompleted, user.username];
        
        // Only change status to Completed if all required participants have completed
        const acceptedBy = Array.isArray(requestToUpdate.acceptedBy) ? requestToUpdate.acceptedBy : [];
        const shouldCompleteRequest = updatedParticipantsCompleted.length >= acceptedBy.length;
        
        const updatedRequests = requests.map(r => {
          if (r.id === requestId) {
            return {
              ...r,
              participantsCompleted: updatedParticipantsCompleted,
              ...(shouldCompleteRequest && { 
                status: "Completed",
                lastStatusUpdate: now.toISOString(),
                lastStatusUpdateTime: now.toLocaleTimeString()
              })
            };
          }
          return r;
        });
        
        setRequests(updatedRequests);
        localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
        
        toast({
          title: shouldCompleteRequest ? "Request completed" : "Progress saved",
          description: shouldCompleteRequest 
            ? "All participants have marked this as complete." 
            : "Other participants need to mark as completed as well.",
        });
        
        return;
      }
    }
    
    // Handle regular status changes
    const updatedRequests = requests.map(r => {
      if (r.id === requestId) {
        const updatedRequest = { 
          ...r, 
          status: newStatus, 
          lastStatusUpdate: now.toISOString(),
          lastStatusUpdateTime: now.toLocaleTimeString(),
          statusChangedBy: user.username
        };
        
        if (newStatus === "In Process" && (r.type === "request" || r.multiDepartment)) {
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

  const handleAbandon = (id: string) => {
    if (!user) return;
    
    const request = requests.find(r => r.id === id);
    
    if (!request) {
      toast({
        title: "Request not found",
        description: "The request you're trying to reject could not be found.",
        variant: "destructive"
      });
      return;
    }
    
    // For multi-department requests or projects
    if (request.multiDepartment || request.type === "project") {
      const currentAcceptedBy = Array.isArray(request.acceptedBy) ? [...request.acceptedBy] : [];
      const userIndex = currentAcceptedBy.indexOf(user.username);
      
      if (userIndex === -1) {
        toast({
          title: "Not participating",
          description: "You are not participating in this request.",
          variant: "destructive"
        });
        return;
      }
      
      // Remove the user from acceptedBy list
      currentAcceptedBy.splice(userIndex, 1);
      
      // Remove from participants completed list if present
      const participantsCompleted = request.participantsCompleted ? 
        request.participantsCompleted.filter(username => username !== user.username) : 
        [];
      
      const now = new Date();
      const updatedRequests = requests.map(r => {
        if (r.id === id) {
          // Always set status to Pending when any user abandons for multi-dept or project
          const newStatus = "Pending";
          
          return {
            ...r,
            acceptedBy: currentAcceptedBy,
            usersAccepted: (r.usersAccepted || 0) - 1,
            participantsCompleted: participantsCompleted,
            status: newStatus,
            lastStatusUpdate: now.toISOString(),
            lastStatusUpdateTime: now.toLocaleTimeString()
          };
        }
        return r;
      });
      
      setRequests(updatedRequests);
      localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
      
      toast({
        title: "Request rejected",
        description: "You have been removed from the participants list and the request is now pending.",
      });
      return;
    }
    
    // For single department requests
    const now = new Date();
    const updatedRequests = requests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: "Rejected",
          lastStatusUpdate: now.toISOString(),
          lastStatusUpdateTime: now.toLocaleTimeString(),
          statusChangedBy: user.username
        };
      }
      return r;
    });
    
    setRequests(updatedRequests);
    localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
    
    toast({
      title: "Request rejected",
      description: "You have successfully rejected the request.",
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

  const handleAcceptProject = (request: Request) => {
    setSelectedRequest(request);
    setProjectToAccept(request.id);
    setAcceptDialogOpen(true);
  };

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
    
    const currentAcceptedBy = Array.isArray(project.acceptedBy) ? project.acceptedBy : [];
    
    if (currentAcceptedBy.includes(user.username)) {
      toast({
        title: "Already accepted",
        description: "You have already accepted this request.",
      });
      setAcceptDialogOpen(false);
      return;
    }
    
    const updatedAcceptedBy = [...currentAcceptedBy, user.username];
    const updatedUsersAccepted = (project.usersAccepted || 0) + 1;
    
    // Update status to "In Process" if:
    // 1. It's a multi-department request and has enough users
    // 2. It's not a multi-department request (single department case)
    // Note: We're allowing In Process even if status was previously Rejected
    const shouldUpdateStatus = 
      (
        (project.multiDepartment && updatedUsersAccepted >= (project.usersNeeded || 1)) ||
        !project.multiDepartment
      );
    
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
    
    const updatedRequests = [...requests];
    updatedRequests[projectIndex] = updatedProject;
    
    setRequests(updatedRequests);
    localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
    
    toast({
      title: "Accepted",
      description: shouldUpdateStatus 
        ? `You've accepted the ${project.type}. It has now moved to In Process status.` 
        : `You've accepted the ${project.type}. It needs more users before it can start.`,
    });
    
    setAcceptDialogOpen(false);
    setProjectToAccept(null);
  };

  const isUserDepartmentIncluded = (request: Request): boolean => {
    if (!user) return false;
    
    if (Array.isArray(request.departments)) {
      return request.departments.includes(user.department);
    }
    
    if (typeof request.department === 'string') {
      return request.department === user.department;
    }
    
    return false;
  };

  const canAcceptRequest = (request: Request) => {
    if (!user || !request || user.role !== "client") return false;

    // Don't allow accepting your own requests
    if (request.creator === user.username) return false;
    
    // Check if request is not archived
    const notArchived = !request.archived;
    
    // Check if the request is for the user's department
    const isForUserDepartment = isUserDepartmentIncluded(request);
    
    // Check if user has already accepted
    const acceptedBy = Array.isArray(request.acceptedBy) ? [...request.acceptedBy] : 
                      request.acceptedBy ? [request.acceptedBy as string] : [];
    const notAlreadyAccepted = !acceptedBy.includes(user.username);
    
    // Don't allow accepting completed requests
    if (request.status === "Completed") {
      return false;
    }
    
    // Don't allow accepting rejected single requests (not multi-department or project)
    if (request.status === "Rejected" && !request.multiDepartment && request.type !== "project") {
      return false;
    }

    return notArchived && isForUserDepartment && notAlreadyAccepted;
  };

  const canAbandonRequest = (request: Request) => {
    if (!user || !request || user.role !== "client") return false;

    if (request.type === "project" && !request.multiDepartment) return false;

    if (request.status !== "Pending" && request.status !== "In Process") return false;

    const acceptedBy = Array.isArray(request.acceptedBy) ? request.acceptedBy : [];
    
    return acceptedBy.includes(user.username);
  };

  const canDeleteRequest = (request: Request) => {
    if (request.status === "Completed" || request.status === "Rejected") {
      return false;
    }
    
    if (user?.role === "admin") {
      return isUserDepartmentIncluded(request);
    }
    
    return user?.username === request.creator;
  };

  const canEditStatus = (request: Request) => {
    if (request.status === "Completed" || request.status === "Rejected") {
      return false;
    }
    
    return user?.role === "admin" && isUserDepartmentIncluded(request);
  };

  const canArchiveProject = (request: Request) => {
    return (request.type === "project" || request.multiDepartment) && 
           user?.role === "admin" && 
           isUserDepartmentIncluded(request);
  };

  const openDetailsDialog = (request: Request) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };

  const toggleDepartmentFilter = (department: string) => {
    if (departmentFilters.includes(department)) {
      setDepartmentFilters(departmentFilters.filter(d => d !== department));
    } else {
      setDepartmentFilters([...departmentFilters, department]);
    }
  };

  const clearFilters = () => {
    setStatusFilter("All");
    setDepartmentFilters([]);
    setSearchTerm("");
  };

  const renderDepartmentTags = (request: Request) => {
    if (request.type === "project") {
      const depts = Array.isArray(request.departments) ? request.departments : 
                    request.department ? [request.department] : [];
      
      const maxDisplayed = 2;
      
      if (depts.length <= maxDisplayed) {
        return (
          <div className="flex flex-wrap gap-1">
            {depts.map((dept, idx) => (
              <span key={idx} className="bg-jd-bg text-xs px-2 py-1 rounded-full">
                {dept}
              </span>
            ))}
          </div>
        );
      } else {
        const displayed = depts.slice(0, maxDisplayed);
        const remaining = depts.length - maxDisplayed;
        
        return (
          <div className="flex flex-wrap gap-1">
            {displayed.map((dept, idx) => (
              <span key={idx} className="bg-jd-bg text-xs px-2 py-1 rounded-full">
                {dept}
              </span>
            ))}
            <span className="bg-jd-purple/20 text-jd-purple text-xs px-2 py-1 rounded-full cursor-pointer" 
                  onClick={() => openDetailsDialog(request)}>
              +{remaining} more
            </span>
          </div>
        );
      }
    }
    
    const depts = request.departments || [request.department as string];
    const maxDisplayed = 2;
    
    if (!Array.isArray(depts) || depts.length <= maxDisplayed) {
      return (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(depts) ? depts.map((dept, idx) => (
            <span key={idx} className="bg-jd-bg text-xs px-2 py-1 rounded-full">
              {dept}
            </span>
          )) : (
            <span className="bg-jd-bg text-xs px-2 py-1 rounded-full">
              {depts}
            </span>
          )}
        </div>
      );
    } else {
      const displayed = depts.slice(0, maxDisplayed);
      const remaining = depts.length - maxDisplayed;
      
      return (
        <div className="flex flex-wrap gap-1">
          {displayed.map((dept, idx) => (
            <span key={idx} className="bg-jd-bg text-xs px-2 py-1 rounded-full">
              {dept}
            </span>
          ))}
          <span className="bg-jd-purple/20 text-jd-purple text-xs px-2 py-1 rounded-full cursor-pointer" 
                onClick={() => openDetailsDialog(request)}>
            +{remaining} more
          </span>
        </div>
      );
    }
  };

  const renderAcceptedByDetails = (request: Request) => {
    if (!request.acceptedBy || (Array.isArray(request.acceptedBy) && request.acceptedBy.length === 0)) {
      return "None";
    }
    
    // For multi-department requests and projects, show all accepted users
    if (request.multiDepartment || request.type === "project") {
      if (Array.isArray(request.acceptedBy)) {
        return (
          <div className="space-y-1 mt-1">
            {request.acceptedBy.map((username, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                  {username}
                </span>
                {request.participantsCompleted?.includes(username) && (
                  <Check size={12} className="text-green-500" />
                )}
              </div>
            ))}
            {request.usersNeeded && request.acceptedBy.length < request.usersNeeded && (
              <div className="text-xs text-jd-mutedText mt-1">
                Waiting for {request.usersNeeded - request.acceptedBy.length} more participants
              </div>
            )}
          </div>
        );
      }
    }
    
    // For single requests, only show current user if they accepted
    if (user && (
      (Array.isArray(request.acceptedBy) && request.acceptedBy.includes(user.username)) || 
      request.acceptedBy === user.username
    )) {
      return (
        <div className="space-y-1 mt-1">
          <div className="flex items-center gap-1">
            <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
              {user.username}
            </span>
            {request.participantsCompleted?.includes(user.username) && (
              <Check size={12} className="text-green-500" />
            )}
          </div>
        </div>
      );
    }
    
    return "None";
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (typeof request.department === 'string' && request.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (request.creator && request.creator.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "All" || request.status === statusFilter;
    
    let matchesDepartment = true;
    if (departmentFilters.length > 0) {
      if (Array.isArray(request.departments)) {
        matchesDepartment = request.departments.some(dept => 
          departmentFilters.includes(dept)
        );
      } else {
        matchesDepartment = departmentFilters.includes(request.department as string);
      }
    }
    
    const matchesType = 
      activeTab === "all" || 
      (activeTab === "requests" && request.type === "request") || 
      (activeTab === "projects" && request.type === "project");
    
    const isNotArchived = !request.archived;
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesType && isNotArchived;
  });

  return {
    requests: filteredRequests,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    departmentFilters,
    toggleDepartmentFilter,
    dialogOpen,
    setDialogOpen,
    activeTab,
    setActiveTab,
    acceptDialogOpen,
    setAcceptDialogOpen,
    detailsDialogOpen,
    setDetailsDialogOpen,
    selectedRequest,
    clearFilters,
    handleRequestSuccess,
    handleStatusChange,
    handleDelete,
    handleArchive,
    handleAbandon,
    handleAcceptProject,
    confirmDelete,
    confirmAcceptProject,
    clearAllRequests,
    canEditStatus,
    canDeleteRequest,
    canArchiveProject,
    canAcceptRequest,
    canAbandonRequest,
    renderDepartmentTags,
    renderAcceptedByDetails,
  };
};
