
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
  } = useRequests();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <RequestsHeader 
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        handleRequestSuccess={handleRequestSuccess}
      />

      <Tabs defaultValue="all" value={activeTab} onValueChange={value => setActiveTab(value)}>
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
        canAbandonRequest={canAbandonRequest}
        handleStatusChange={handleStatusChange}
        handleDelete={handleDelete}
        handleArchive={handleArchive}
        handleAbandon={handleAbandon}
        handleAcceptProject={handleAcceptProject}
        confirmDelete={confirmDelete}
        renderDepartmentTags={renderDepartmentTags}
        userRole={user?.role}
        username={user?.username}
      />
      
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
            <AlertDialogTitle>Accept {selectedRequest?.type === "project" ? "Project" : "Request"}</AlertDialogTitle>
            <p className="text-jd-mutedText">
              Are you sure you want to accept this {selectedRequest?.type === "project" ? "project" : "request"}? You will be added as a participant.
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
                <h4 className="text-sm font-medium mb-1">Required Departments:</h4>
                <p className="text-jd-mutedText text-sm">
                  {Array.isArray(selectedRequest.departments) 
                    ? selectedRequest.departments.join(", ") 
                    : selectedRequest.department}
                </p>
              </div>
              {selectedRequest.creatorDepartment && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Creator Department:</h4>
                  <p className="text-jd-mutedText text-sm">{selectedRequest.creatorDepartment}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium mb-1">Description:</h4>
                <p className="text-jd-mutedText text-sm">{selectedRequest.description}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Accepted By:</h4>
                {renderAcceptedByDetails(selectedRequest)}
              </div>
              
              {/* Removed the note about rejection from here as requested */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Requests;
