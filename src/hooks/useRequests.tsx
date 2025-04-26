
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Request } from "@/types/profileTypes";
import { useRequestFilters } from "./useRequestFilters";
import { useRequestDialogs } from "./useRequestDialogs";
import { useRequestPermissions } from "./useRequestPermissions";
import { useRequestUtils } from "./useRequestUtils";

export const useRequests = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);

  // Import refactored hooks
  const { 
    searchTerm, 
    setSearchTerm, 
    statusFilter, 
    setStatusFilter,
    departmentFilters,
    toggleDepartmentFilter,
    activeTab,
    setActiveTab,
    clearFilters,
    filterRequests
  } = useRequestFilters();

  const {
    dialogOpen,
    setDialogOpen,
    requestToDelete,
    setRequestToDelete,
    projectToAccept,
    setProjectToAccept,
    acceptDialogOpen,
    setAcceptDialogOpen,
    detailsDialogOpen,
    setDetailsDialogOpen,
    selectedRequest,
    setSelectedRequest,
    openDetailsDialog,
    handleDelete,
    handleAcceptProject: initHandleAcceptProject
  } = useRequestDialogs();

  const {
    isUserDepartmentIncluded,
    canAcceptRequest,
    canAbandonRequest,
    canDeleteRequest,
    canEditStatus,
    canArchiveProject
  } = useRequestPermissions(user);

  const {
    renderDepartmentTags: initRenderDepartmentTags,
    renderAcceptedByDetails
  } = useRequestUtils();

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
      // Check completed/rejected items for expiry
      if ((req.status === "Completed" || req.status === "Rejected") && req.lastStatusUpdate) {
        const statusUpdateDate = new Date(req.lastStatusUpdate);
        const oneDayLater = new Date(statusUpdateDate);
        oneDayLater.setDate(oneDayLater.getDate() + 1);
        
        if (now > oneDayLater && !req.isExpired) {
          updated = true;
          return { ...req, isExpired: true };
        }
      } 
      
      // Remove expired items
      if (req.isExpired) {
        updated = true;
        return null;
      }
      
      // Skip non-pending items
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
        const shouldCompleteRequest = updatedParticipantsCompleted.length >= acceptedBy.length && acceptedBy.length >= 2;
        
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
        
        if (newStatus === "In Process" && (!r.multiDepartment && r.type !== "project")) {
          // For single department requests, just set one acceptedBy
          updatedRequest.acceptedBy = [user.username];
          updatedRequest.usersAccepted = 1;
        } else if (newStatus === "In Process" && (r.type === "request" || r.multiDepartment)) {
          const currentAcceptedBy = Array.isArray(r.acceptedBy) ? r.acceptedBy : [];
          
          if (!currentAcceptedBy.includes(user.username)) {
            updatedRequest.acceptedBy = [...currentAcceptedBy, user.username];
            updatedRequest.usersAccepted = (r.usersAccepted || 0) + 1;
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
          return {
            ...r,
            acceptedBy: currentAcceptedBy,
            usersAccepted: Math.max((r.usersAccepted || 0) - 1, 0),
            participantsCompleted: participantsCompleted,
            status: "Pending",
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
          statusChangedBy: user.username,
          acceptedBy: [], // Clear acceptedBy for rejected single requests
          usersAccepted: 0
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
    // For single department requests, don't allow accepting if already accepted by someone
    if (!request.multiDepartment && request.type !== "project") {
      const currentAcceptedBy = Array.isArray(request.acceptedBy) ? request.acceptedBy : [];
      if (currentAcceptedBy.length > 0) {
        toast({
          title: "Request already accepted",
          description: "This request has already been accepted by another user.",
          variant: "destructive"
        });
        return;
      }
    }
    
    initHandleAcceptProject(request);
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
    
    // For single department requests, don't allow accepting if already accepted by someone
    if (!project.multiDepartment && project.type !== "project") {
      const currentAcceptedBy = Array.isArray(project.acceptedBy) ? project.acceptedBy : [];
      if (currentAcceptedBy.length > 0) {
        toast({
          title: "Request already accepted",
          description: "This request has already been accepted by another user.",
          variant: "destructive"
        });
        setAcceptDialogOpen(false);
        return;
      }
    }
    
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
    // 1. It's a multi-department request and has 2+ users
    // 2. It's not a multi-department request (single department case)
    const shouldUpdateStatus = 
      (
        (project.multiDepartment || project.type === "project") && updatedUsersAccepted >= 2
      ) ||
      (!project.multiDepartment && project.type !== "project");
    
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

  // Customize renderDepartmentTags to use the openDetailsDialog from this hook
  const renderDepartmentTags = (request: Request) => {
    return initRenderDepartmentTags(request, openDetailsDialog);
  };

  // Filter requests based on current filters
  const filteredRequests = filterRequests(requests);

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
