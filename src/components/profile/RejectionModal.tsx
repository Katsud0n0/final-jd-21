
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface RejectionModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  itemType: 'request' | 'project' | 'multi-department';
  onConfirm: (id: string, reason?: string) => void;
  itemId: string;
}

const RejectionModal = ({ isOpen, setIsOpen, itemType, onConfirm, itemId }: RejectionModalProps) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(itemId, reason);
    setIsOpen(false);
    setReason('');
  };

  const handleCancel = () => {
    setIsOpen(false);
    setReason('');
  };

  const getDialogTitle = () => {
    switch (itemType) {
      case 'project':
        return 'Reject Project';
      case 'multi-department':
        return 'Reject Multi-Department Request';
      default:
        return 'Reject Request';
    }
  };

  const getDialogDescription = () => {
    switch (itemType) {
      case 'project':
        return 'Are you sure you want to reject this project? You will be removed as a participant.';
      case 'multi-department':
        return 'Are you sure you want to reject this multi-department request? You will be removed as a participant.';
      default:
        return 'Are you sure you want to reject this request? Please provide a reason for rejection.';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-jd-card border-jd-card">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Optional: Provide a reason for rejection"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          <Button 
            className="bg-jd-red hover:bg-jd-red/90" 
            onClick={handleConfirm}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectionModal;
