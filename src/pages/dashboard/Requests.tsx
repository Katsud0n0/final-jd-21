
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import RequestsHeader from "@/components/dashboard/RequestsHeader";
import RequestsFilters from "@/components/dashboard/RequestsFilters";
import RequestsTable from "@/components/dashboard/RequestsTable";
import { useRequests } from "@/hooks/useRequests";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const Requests = () => {
  const { user } = useAuth();
  const {
    requests,
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
    handleAcceptProject,
    confirmDelete,
    confirmAcceptProject,
    clearAllRequests,
    canEditStatus,
    canDeleteRequest,
    canArchiveProject,
    canAcceptRequest,
    renderDepartmentTags,
    renderAcceptedByDetails,
  } = useRequests();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <RequestsHeader 
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        handleRequestSuccess={handleRequestSuccess}
      />

      <Tabs defaultValue="all" onValueChange={value => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
        </TabsList>
      </Tabs>

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
        requests={requests}
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
        userRole={user?.username}
      />
      
      {/* Clear all requests button - moved to bottom right */}
      {user?.role === "admin" && clearAllRequests && (
        <div className="flex justify-end mt-6">
          <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
            <Button 
              variant="outline" 
              className="border-jd-red text-jd-red hover:bg-jd-red/10"
              onClick={() => setClearDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear {user.department} Requests
            </Button>
            <AlertDialogContent className="bg-jd-card border-jd-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Department Requests</AlertDialogTitle>
                <p className="text-jd-mutedText">
                  Are you sure you want to clear all requests for {user.department}? This action cannot be undone.
                </p>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-jd-bg hover:bg-jd-bg/80">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    clearAllRequests();
                    setClearDialogOpen(false);
                  }}
                >
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent className="bg-jd-card border-jd-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Accept Project</AlertDialogTitle>
            <p className="text-jd-mutedText">
              Are you sure you want to accept this project? You will be added as a participant.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-jd-bg hover:bg-jd-bg/80">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-jd-green hover:bg-jd-green/90"
              onClick={confirmAcceptProject}
            >
              Accept
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="bg-jd-card border-jd-card">
          <DialogHeader>
            <DialogTitle>{selectedRequest?.title}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-2">
              <div>
                <h4 className="text-sm font-medium mb-2">Required Departments:</h4>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(selectedRequest.departments) 
                    ? selectedRequest.departments.map(dept => (
                      <span key={dept} className="bg-jd-bg text-xs px-2 py-1 rounded-full">
                        {dept}
                      </span>
                    ))
                    : (
                      <span className="bg-jd-bg text-xs px-2 py-1 rounded-full">
                        {selectedRequest.department}
                      </span>
                    )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Description:</h4>
                <p className="text-jd-mutedText text-sm">{selectedRequest.description}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Created by:</h4>
                <p className="text-jd-mutedText text-sm">
                  {selectedRequest.creator}
                  {selectedRequest.creatorDepartment && (
                    <span className="italic"> ({selectedRequest.creatorDepartment})</span>
                  )}
                </p>
              </div>
              
              {selectedRequest.type === "project" && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Participants:</h4>
                  {renderAcceptedByDetails(selectedRequest)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Requests;
