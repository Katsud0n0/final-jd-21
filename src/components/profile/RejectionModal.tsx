
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  itemType: 'request' | 'project' | 'multi-department';
}

const RejectionModal = ({ isOpen, onClose, onReject, itemType }: RejectionModalProps) => {
  const [reason, setReason] = useState('');
  
  const handleSubmit = () => {
    onReject(reason.trim());
    setReason('');
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-jd-card border-jd-card">
        <AlertDialogHeader>
          <AlertDialogTitle>Reject {itemType === 'project' ? 'Project' : 'Request'}</AlertDialogTitle>
          <p className="text-jd-mutedText">
            Please provide a reason for rejecting this {itemType} (optional)
          </p>
        </AlertDialogHeader>
        
        <div className="my-4">
          <Label htmlFor="rejection-reason">Rejection Reason</Label>
          <Textarea 
            id="rejection-reason"
            placeholder="Enter your reason for rejecting..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2"
          />
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-jd-bg hover:bg-jd-bg/80">Cancel</AlertDialogCancel>
          <AlertDialogAction 
            className="bg-red-600 hover:bg-red-700"
            onClick={handleSubmit}
          >
            Reject
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RejectionModal;
