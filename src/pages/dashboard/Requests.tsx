
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import RequestsHeader from "@/components/dashboard/RequestsHeader";
import RequestsFilters from "@/components/dashboard/RequestsFilters";
import RequestsTable from "@/components/dashboard/RequestsTable";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { Request } from "@/types/profileTypes";
import { handleAcceptRequest, canUserAcceptRequest } from "@/utils/requestHelpers";
import api from "@/api";

const Requests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilters, setDepartmentFilters] = useState<string[]>([]);
  
  // Item to delete
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  useEffect(() => {
    // Load requests from API
    const loadRequests = async () => {
      try {
        setLoading(true);
        const requests = await api.getRequests();
        
        // Filter out archived projects for non-admin users
        const filteredRequests = user?.role === 'admin'
          ? requests
          : requests.filter((req: Request) => !req.archived);
          
        setAllRequests(filteredRequests);
        setFilteredRequests(filteredRequests);
      } catch (error) {
        console.error("Error loading requests:", error);
        toast({
          title: "Error",
          description: "Failed to load requests",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadRequests();
  }, [user, toast]);
  
  // Apply filters
  useEffect(() => {
    let results = [...allRequests];
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter((request) => 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.creator.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== "All") {
      results = results.filter((request) => request.status === statusFilter);
    }
    
    // Apply department filter
    if (departmentFilters.length > 0) {
      results = results.filter((request) => {
        // For requests with multiple departments, check if any of them match
        if (Array.isArray(request.departments) && request.departments.length > 0) {
          return request.departments.some(dept => departmentFilters.includes(dept));
        }
        // For single-department requests, check the department property
        return departmentFilters.includes(request.department);
      });
    }
    
    setFilteredRequests(results);
  }, [allRequests, searchTerm, statusFilter, departmentFilters]);
  
  const handleRequestSuccess = async () => {
    setDialogOpen(false);
    
    try {
      // Reload requests from API
      const requests = await api.getRequests();
      
      // Filter out archived projects for non-admin users
      const filteredRequests = user?.role === 'admin'
        ? requests
        : requests.filter((req: Request) => !req.archived);
        
      setAllRequests(filteredRequests);
      setFilteredRequests(filteredRequests);
      
      toast({
        title: "Success",
        description: "Request created successfully",
      });
    } catch (error) {
      console.error("Error reloading requests after creation:", error);
    }
  };
  
  const toggleDepartmentFilter = (department: string) => {
    setDepartmentFilters((prev) => {
      if (prev.includes(department)) {
        return prev.filter((d) => d !== department);
      } else {
        return [...prev, department];
      }
    });
  };
  
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setDepartmentFilters([]);
  };
  
  const canEditStatus = (request: Request) => {
    if (!user) return false;
    
    // Admin can always edit status
    if (user.role === "admin") return true;
    
    // Client can never edit status directly
    if (user.role === "client") return false;
    
    return false;
  };
  
  const canDeleteRequest = (request: Request) => {
    if (!user) return false;
    
    // Only admins and the creator can delete a request
    if (user.role === "admin" || request.creator === user.username) {
      return true;
    }
    
    return false;
  };
  
  const canArchiveProject = (request: Request) => {
    if (!user) return false;
    
    // Only admins can archive projects
    if (user.role === "admin" && request.type === "project") {
      return !request.archived;
    }
    
    return false;
  };
  
  const canAcceptRequest = (request: Request) => {
    if (!user) return false;
    
    // Only clients can accept requests
    if (user.role !== "client") return false;
    
    return canUserAcceptRequest(request, user.username, user.department);
  };
  
  const handleStatusChange = async (id: string, status: string) => {
    try {
      // Update request via API
      await api.updateRequest(id, { status });
      
      // Update local state
      const updatedRequests = allRequests.map((request) => {
        if (request.id === id) {
          return {
            ...request,
            status,
            lastStatusUpdateTime: new Date().toLocaleTimeString(),
          };
        }
        return request;
      });
      
      setAllRequests(updatedRequests);
      
      toast({
        title: "Status Updated",
        description: `Request status has been updated to ${status}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update the status",
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };
  
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      // Delete request via API
      await api.deleteRequest(itemToDelete);
      
      // Update local state
      const updatedRequests = allRequests.filter((request) => request.id !== itemToDelete);
      
      setAllRequests(updatedRequests);
      setFilteredRequests(updatedRequests);
      
      toast({
        title: "Request Deleted",
        description: "The request has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting request:", error);
      toast({
        title: "Error",
        description: "Failed to delete the request",
        variant: "destructive",
      });
    } finally {
      setItemToDelete(null);
    }
  };
  
  const handleArchive = async (id: string) => {
    try {
      // First try archiving via API endpoint
      const response = await fetch(`http://localhost:3000/api/requests/${id}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // If the specific archive endpoint fails, fall back to update request
        await api.updateRequest(id, { 
          archived: true, 
          archivedAt: new Date().toISOString()
        });
      }
      
      // Update local state
      const updatedRequests = allRequests.filter(request => request.id !== id);
      
      setAllRequests(updatedRequests);
      setFilteredRequests(updatedRequests);
      
      toast({
        title: "Project Archived",
        description: "The project has been archived successfully and moved to your profile's archived section.",
      });
    } catch (error) {
      console.error("Error archiving project:", error);
      toast({
        title: "Error",
        description: "Failed to archive the project",
        variant: "destructive",
      });
    }
  };
  
  const handleAcceptProject = async (request: Request) => {
    try {
      if (!user) return;
      
      // Update the request via API
      await api.acceptRequest(request.id, user.username);
      
      // Refresh requests from API
      const refreshedRequests = await api.getRequests();
      
      // Filter for non-admin users
      const filteredRequests = user?.role === 'admin'
        ? refreshedRequests
        : refreshedRequests.filter((req: Request) => !req.archived);
      
      setAllRequests(filteredRequests);
      
      toast({
        title: request.type === "project" ? "Project Accepted" : "Request Accepted",
        description: `You have accepted the ${request.type === "project" ? "project" : "request"}. You can find it in your profile.`,
      });
    } catch (error) {
      console.error("Error accepting project:", error);
      toast({
        title: "Error",
        description: `Failed to accept the ${request.type === "project" ? "project" : "request"}`,
        variant: "destructive",
      });
    }
  };
  
  // Function to handle clearing all departmental requests (admin only)
  const handleClearDepartmentalRequests = async () => {
    if (!user || user.role !== "admin") return;
    
    try {
      // Get all requests
      const allCurrentRequests = await api.getRequests();
      
      // Filter out requests for admin's department
      for (const request of allCurrentRequests) {
        const isDepartmentRequest = request.department === user.department || 
          (Array.isArray(request.departments) && request.departments.includes(user.department));
        
        if (isDepartmentRequest) {
          await api.deleteRequest(request.id);
        }
      }
      
      // Reload requests
      const refreshedRequests = await api.getRequests();
      setAllRequests(refreshedRequests);
      setFilteredRequests(refreshedRequests);
      setDeleteOpen(false);
      
      toast({
        title: "Requests cleared",
        description: `All ${user.department} department requests have been cleared`,
      });
    } catch (error) {
      console.error("Error clearing departmental requests:", error);
      toast({
        title: "Error",
        description: "Failed to clear departmental requests",
        variant: "destructive",
      });
    }
  };
  
  // Render department tags
  const renderDepartmentTags = (request: Request) => {
    if (Array.isArray(request.departments) && request.departments.length > 0) {
      const displayedDepartments = request.departments.slice(0, 1);
      const remainingCount = request.departments.length - 1;
      
      return (
        <div className="flex flex-wrap gap-1">
          {displayedDepartments.map((dept, index) => (
            <span 
              key={index}
              className="bg-jd-bg px-2 py-1 rounded-full text-xs"
            >
              {dept}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="bg-jd-bg px-2 py-1 rounded-full text-xs">
              +{remainingCount} more
            </span>
          )}
        </div>
      );
    }
    
    return <span>{request.department}</span>;
  };
  
  return (
    <div className="container mx-auto py-8">
      <RequestsHeader 
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        handleRequestSuccess={handleRequestSuccess}
      />
      
      <div className="mt-8 space-y-4">
        <RequestsFilters 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          departmentFilters={departmentFilters}
          toggleDepartmentFilter={toggleDepartmentFilter}
          clearFilters={clearFilters}
        />
        
        <RequestsTable 
          requests={filteredRequests}
          canEditStatus={canEditStatus}
          canDeleteRequest={canDeleteRequest}
          canArchiveProject={canArchiveProject}
          canAcceptRequest={canAcceptRequest}
          handleStatusChange={handleStatusChange}
          handleDelete={handleDelete}
          handleArchive={handleArchive}
          handleAcceptProject={handleAcceptProject}
          confirmDelete={confirmDelete}
          renderDepartmentTags={renderDepartmentTags}
          userRole={user?.role}
          username={user?.username}
        />
        
        {/* Clear All Requests Button for Admins */}
        {user?.role === "admin" && (
          <div className="flex justify-end mt-6">
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="ml-auto">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All {user.department} Requests
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-jd-card border-jd-card">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all requests related to the {user.department} department.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearDepartmentalRequests}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
