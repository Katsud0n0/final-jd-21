
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import RequestForm from "./RequestForm";

interface RequestsHeaderProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  handleRequestSuccess: () => void;
}

const RequestsHeader = ({ dialogOpen, setDialogOpen, handleRequestSuccess }: RequestsHeaderProps) => {
  return (
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
  );
};

export default RequestsHeader;
