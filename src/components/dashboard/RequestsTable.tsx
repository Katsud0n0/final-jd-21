
import { Trash2, Archive, Check, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Request } from "@/types/profileTypes";

interface RequestsTableProps {
  requests: Request[];
  canEditStatus: (request: Request) => boolean;
  canDeleteRequest: (request: Request) => boolean;
  canArchiveProject: (request: Request) => boolean;
  canAcceptRequest: (request: Request) => boolean;
  canAbandonRequest?: (request: Request) => boolean;
  handleStatusChange: (id: string, status: string) => void;
  handleDelete: (id: string) => void;
  handleArchive: (id: string) => void;
  handleAbandon?: (id: string) => void;
  handleAcceptProject: (request: Request) => void;
  confirmDelete: () => void;
  renderDepartmentTags: (request: Request) => JSX.Element;
  userRole?: string;
  username?: string;
}

const statusOptions = ["Pending", "In Process", "Completed", "Rejected"];

const RequestsTable = ({
  requests,
  canEditStatus,
  canDeleteRequest,
  canArchiveProject,
  canAcceptRequest,
  canAbandonRequest,
  handleStatusChange,
  handleDelete,
  handleArchive,
  handleAbandon,
  handleAcceptProject,
  confirmDelete,
  renderDepartmentTags,
  userRole,
  username,
}: RequestsTableProps) => {
  return (
    <div className="bg-jd-card rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-jd-bg">
              <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">TITLE</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">REQUIRED DEPARTMENTS</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">DATE CREATED</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">CREATOR</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">STATUS</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">EXPIRES</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-jd-mutedText">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map((request) => (
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
                            
                            <div>
                              <h4 className="text-sm font-medium mb-1">Accepted By:</h4>
                              {(request.acceptedBy && (
                                Array.isArray(request.acceptedBy) ? request.acceptedBy.length > 0 : request.acceptedBy
                              )) ? (
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(request.acceptedBy) ? (
                                    (request.multiDepartment || request.type === "project") ? (
                                      // For multi-dept and projects, show current acceptedBy list
                                      request.acceptedBy.map((user, idx) => (
                                        <div key={idx} className="flex items-center gap-1">
                                          <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                                            {user}
                                          </span>
                                          {request.participantsCompleted?.includes(user) && (
                                            <Check size={12} className="text-green-500" />
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      // For single requests, show only current username if accepted
                                      username && request.acceptedBy.includes(username) ? (
                                        <div className="flex items-center gap-1">
                                          <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                                            {username}
                                          </span>
                                        </div>
                                      ) : <p className="text-jd-mutedText text-sm">None yet</p>
                                    )
                                  ) : (
                                    <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                                      {request.acceptedBy}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="text-jd-mutedText text-sm">None yet</p>
                              )}
                            </div>
                            
                            {request.type === "request" && (
                              <div className="mt-2 p-2 bg-red-100 text-red-800 text-xs rounded-md">
                                If rejected, please submit a new request to restart
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      {request.type === "project" && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-jd-purple/20 text-jd-purple rounded-full">
                          Project
                        </span>
                      )}
                      {request.multiDepartment && request.type === "request" && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-500/20 text-blue-500 rounded-full">
                          Multi-Dept
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
                          "bg-gray-500/20 text-gray-500"
                        }`}>
                          {request.status}
                        </span>
                        {(request.type === "project" || request.multiDepartment) && request.usersNeeded && (
                          <span className="text-xs text-jd-mutedText mt-1">
                            {request.usersAccepted && request.usersAccepted > 0 
                              ? `Accepted by ${request.usersAccepted}/${request.usersNeeded} users`
                              : "No users have accepted yet"}
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
                          <span>{request.multiDepartment ? "45 days" : "30 days"}</span>
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
                        {canArchiveProject(request) && userRole === "admin" && (
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
                      
                      {userRole === "client" && (
                        <div>
                          {canAcceptRequest(request) ? (
                            <Button 
                              size="sm"
                              variant="outline"
                              className="w-full mt-1 bg-jd-green/10 text-jd-green hover:bg-jd-green/20 border-jd-green/20"
                              onClick={() => handleAcceptProject(request)}
                            >
                              <Check size={14} className="mr-1" />
                              Accept {request.type === "project" ? "Project" : "Request"}
                            </Button>
                          ) : (
                            <div className="text-xs text-jd-mutedText mt-1 p-2 bg-jd-bg rounded-md">
                              {Array.isArray(request.acceptedBy) && 
                              username && 
                              request.acceptedBy.includes(username) ? (
                                <span className="text-jd-green font-medium">Accepted</span>
                              ) : (
                                <span className="text-jd-mutedText">
                                  {request.creator === username ? "Can't accept" : 
                                   (request.status === "Rejected" && !request.multiDepartment && request.type !== "project") || 
                                   (request.status === "Completed") ? 
                                   "Can't accept" : "Not for your department"}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-jd-mutedText">
                  No requests found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestsTable;
