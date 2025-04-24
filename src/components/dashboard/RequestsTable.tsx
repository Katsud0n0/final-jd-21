
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
  handleStatusChange: (id: string, status: string) => void;
  handleDelete: (id: string) => void;
  handleArchive: (id: string) => void;
  handleAcceptProject: (request: Request) => void;
  confirmDelete: () => void;
  renderDepartmentTags: (request: Request) => JSX.Element;
  userRole?: string;
}

const statusOptions = ["Pending", "In Process", "Completed", "Rejected"];

const RequestsTable = ({
  requests,
  canEditStatus,
  canDeleteRequest,
  canArchiveProject,
  canAcceptRequest,
  handleStatusChange,
  handleDelete,
  handleArchive,
  handleAcceptProject,
  confirmDelete,
  renderDepartmentTags,
  userRole,
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
                      {canAcceptRequest(request) && (
                        <Button 
                          size="sm"
                          variant="outline"
                          className="w-full mt-1"
                          onClick={() => handleAcceptProject(request)}
                        >
                          <Check size={14} className="mr-1" />
                          {request.type === "project" ? "Accept Project" : "Accept Request"}
                        </Button>
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
