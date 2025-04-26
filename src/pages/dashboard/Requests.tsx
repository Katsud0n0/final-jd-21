
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
import RequestsHeader from "@/components/dashboard/RequestsHeader";
import RequestsFilters from "@/components/dashboard/RequestsFilters";
import RequestsTable from "@/components/dashboard/RequestsTable";
import { useRequests } from "@/hooks/useRequests";
import { useAuth } from "@/contexts/AuthContext";

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

  return (
    <div className="space-y-6">
      <RequestsHeader 
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        handleRequestSuccess={handleRequestSuccess}
        clearAllRequests={clearAllRequests}
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
        userRole={user?.role}
      />

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
