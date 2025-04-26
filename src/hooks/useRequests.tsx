import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Request } from "@/types/profileTypes";
import { Check } from "lucide-react";

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
      } else {
        return req.department !== user.department;
      }
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
        const expiryDays = 30;
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
    
    const updatedRequests = requests.map(r => {
      if (r.id === requestId) {
        const updatedRequest = { 
          ...r, 
          status: newStatus, 
          lastStatusUpdate: now.toISOString(),
          lastStatusUpdateTime: now.toLocaleTimeString(),
          statusChangedBy: user.username
        };
        
        if (newStatus === "In Process" && r.type === "request") {
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
        description: "The request you're trying to abandon could not be found.",
        variant: "destructive"
      });
      return;
    }
    
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
    
    currentAcceptedBy.splice(userIndex, 1);
    
    const updatedRequests = requests.map(r => {
      if (r.id === id) {
        return {
          ...r,
          acceptedBy: currentAcceptedBy,
          usersAccepted: (r.usersAccepted || 0) - 1
        };
      }
      return r;
    });
    
    setRequests(updatedRequests);
    localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
    
    toast({
      title: "Request abandoned",
      description: "You have successfully abandoned the request.",
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

    // For client users, allow accepting requests that are pending and not archived
    // Users shouldn't be able to accept their own requests
    const isPending = request.status === "Pending";
    const notArchived = !request.archived;
    const isNotCreator = request.creator !== user.username;
    
    // Check if the request is for the user's department
    const isForUserDepartment = isUserDepartmentIncluded(request);
    
    // Basic conditions that apply to both projects and requests
    const basicConditions = isPending && notArchived && isNotCreator && isForUserDepartment;
    
    if (!basicConditions) return false;
    
    // Check if user has already accepted this request or project
    const acceptedBy = Array.isArray(request.acceptedBy) ? request.acceptedBy : [];
    
    // Make sure user hasn't already accepted this request/project
    return !acceptedBy.includes(user.username);
  };

  const canAbandonRequest = (request: Request) => {
    if (!user || !request || user.role !== "client") return false;

    // Allow abandoning all types of requests and multi-department projects
    if (request.type === "project" && !request.multiDepartment) return false;

    // Can't abandon if status not pending or in process
    if (request.status !== "Pending" && request.status !== "In Process") return false;

    // Check if user has accepted this request/project
    const acceptedBy = Array.isArray(request.acceptedBy) ? request.acceptedBy : [];
    
    // User can abandon if they've accepted this request/project
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
    const depts = request.departments || [request.department as string];
    const maxDisplayed = 2;
    
    if (!Array.isArray(depts) || depts.length <= maxDisplayed) {
      return (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(depts) ? depts.map(dept => (
            <span key={dept} className="bg-jd-bg text-xs px-2 py-1 rounded-full">
              {dept}
            </span>
          )) : depts}
        </div>
      );
    } else {
      const displayed = depts.slice(0, maxDisplayed);
      const remaining = depts.length - maxDisplayed;
      
      return (
        <div className="flex flex-wrap gap-1">
          {displayed.map(dept => (
            <span key={dept} className="bg-jd-bg text-xs px-2 py-1 rounded-full">
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
    
    return typeof request.acceptedBy === 'string' ? request.acceptedBy : 'None';
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
