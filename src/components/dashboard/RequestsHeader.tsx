
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import RequestForm from "./RequestForm";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface RequestsHeaderProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  handleRequestSuccess: () => void;
  clearAllRequests?: () => void;
}

const RequestsHeader = ({ 
  dialogOpen, 
  setDialogOpen, 
  handleRequestSuccess,
  clearAllRequests 
}: RequestsHeaderProps) => {
  const { user } = useAuth();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-3xl font-bold">Requests</h2>
        <p className="text-jd-mutedText text-lg">
          Manage and track department requests
        </p>
      </div>
      <div className="flex gap-2">
        {user?.role === "admin" && clearAllRequests && (
          <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-jd-red text-jd-red hover:bg-jd-red/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear {user.department} Requests
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-jd-card border-jd-card">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Department Requests</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to clear all requests for {user.department}? This action cannot be undone.
                </AlertDialogDescription>
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
        )}
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
    </div>
  );
};

export default RequestsHeader;
