import { useState, useEffect } from "react";
import { Trash2, Plus, Archive, Check, X, Clock, Ban, Filter, Info } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { departments } from "@/data/departments";
import { Request } from "@/types/profileTypes";

const statusOptions = ["Pending", "In Process", "Completed", "Rejected"];

const Requests = () => {
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
        description: "You have already accepted this project.",
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
      title: "Project accepted",
      description: shouldUpdateStatus 
        ? "You've accepted the project and it has now moved to In Process status."
        : "You've accepted the project. It needs more users before it can start.",
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
    if (!user || !request) return false;

    const basicConditions = user.role === "client" && 
                           request.status === "Pending" && 
                           !request.archived;
    
    if (!basicConditions) return false;
    
    if (!isUserDepartmentIncluded(request)) {
      return false;
    }
    
    if (request.type === "project") {
      const acceptedBy = Array.isArray(request.acceptedBy) ? request.acceptedBy : [];
      return request.creator !== user.username && !acceptedBy.includes(user.username);
    }
    
    return request.creator !== user.username;
  };

  const canDeleteRequest = (request: Request) => {
    if (request.status === "Completed" || request.status === "Rejected") {
      return false;
    }
    
    if (user?.role === "admin") {
      return user.department === request.department;
    }
    
    return user?.username === request.creator;
  };

  const canEditStatus = (request: Request) => {
    if (request.status === "Completed" || request.status === "Rejected") {
      return false;
    }
    
    return user?.role === "admin" && user?.department === request.department;
  };

  const canArchiveProject = (request: Request) => {
    return request.type === "project" && 
           user?.role === "admin" && 
           user?.department === request.department;
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
    if (!request.acceptedBy) return "None";
    
    if (Array.isArray(request.acceptedBy)) {
      if (request.acceptedBy.length === 0) return "None";
      
      if (request.type === "project") {
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
      
      return request.acceptedBy.join(", ");
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

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
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

      <Tabs defaultValue="all" onValueChange={value => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
      </Tabs>

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
        <div className="w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto flex justify-between items-center">
                <Filter size={18} className="mr-2" />
                <span>Departments Filter</span>
                {departmentFilters.length > 0 && (
                  <span className="ml-2 bg-jd-purple text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {departmentFilters.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Filter by Department</h4>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {departments.map(dept => (
                    <div key={dept.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-${dept.id}`}
                        checked={departmentFilters.includes(dept.name)}
                        onCheckedChange={checked => {
                          if (checked) {
                            toggleDepartmentFilter(dept.name);
                          } else {
                            toggleDepartmentFilter(dept.name);
                          }
                        }}
                      />
                      <label
                        htmlFor={`filter-${dept.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {dept.name}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear All Filters
                  </Button>
                  <Button size="sm">Apply Filters</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {(departmentFilters.length > 0 || statusFilter !== "All" || searchTerm) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-jd-mutedText">Active Filters:</span>
          {statusFilter !== "All" && (
            <div className="bg-jd-bg px-2 py-1 rounded-full text-xs flex items-center gap-1">
              Status: {statusFilter}
              <button onClick={() => setStatusFilter("All")} className="hover:text-jd-purple">
                <X size={14} />
              </button>
            </div>
          )}
          {departmentFilters.map(dept => (
            <div key={dept} className="bg-jd-bg px-2 py-1 rounded-full text-xs flex items-center gap-1">
              {dept}
              <button onClick={() => toggleDepartmentFilter(dept)} className="hover:text-jd-purple">
                <X size={14} />
              </button>
            </div>
          ))}
          {searchTerm && (
            <div className="bg-jd-bg px-2 py-1 rounded-full text-xs flex items-center gap-1">
              Search: {searchTerm}
              <button onClick={() => setSearchTerm("")} className="hover:text-jd-purple">
                <X size={14} />
              </button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear All
          </Button>
        </div>
      )}
      
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
                  REQUIRED DEPARTMENTS
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
                    className={`border-t border-jd-bg ${
                      (request.status === "Completed" || request.status === "Rejected") ? 'opacity-50' : ''
                    } ${request.isExpired ? 'opacity-30' : ''}`}
                  >
                    <td className="px-4 py-4 text-sm">{request.id}</td>
                    <td className="px-4 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <span>{request.title}</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                              <Info size={14} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-jd-card border-jd-card">
                            <DialogHeader>
                              <DialogTitle>{request.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                              <div>
                                <h4 className="text-sm font-medium mb-1">Required Departments:</h4>
                                <p className="text-jd-mutedText text-sm">
                                  {Array.isArray(request.departments) 
                                    ? request.departments.join(", ") 
                                    : request.department}
                                </p>
                              </div>
                              {request.creatorDepartment && (
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Creator Department:</h4>
                                  <p className="text-jd-mutedText text-sm">{request.creatorDepartment}</p>
                                </div>
                              )}
                              <div>
                                <h4 className="text-sm font-medium mb-1">Description:</h4>
                                <p className="text-jd-mutedText text-sm">{request.description}</p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        {request.type === "project" && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-jd-purple/20 text-jd-purple rounded-full">
                            Project
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {renderDepartmentTags(request)}
                    </td>
                    <td className="px-4 py-4 text-sm">{request.dateCreated}</td>
                    <td className="px-4 py-4 text-sm">
                      {request.creator}
                      {request.creatorDepartment && (
                        <div className="text-xs text-jd-mutedText italic">
                          ({request.creatorDepartment})
                        </div>
                      )}
                    </td>
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
                        {canAcceptRequest(request) ? (
                          <>
                            {request.type === "project" ? (
                              <Button 
                                size="sm
