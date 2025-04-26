
import { useState } from 'react';
import { Request } from '@/types/profileTypes';

export const useRequestDialogs = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [projectToAccept, setProjectToAccept] = useState<string | null>(null);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  
  const openDetailsDialog = (request: Request) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };
  
  const handleDelete = (id: string) => {
    setRequestToDelete(id);
  };
  
  const handleAcceptProject = (request: Request) => {
    setSelectedRequest(request);
    setProjectToAccept(request.id);
    setAcceptDialogOpen(true);
  };

  return {
    dialogOpen,
    setDialogOpen,
    requestToDelete,
    setRequestToDelete,
    projectToAccept,
    setProjectToAccept,
    acceptDialogOpen,
    setAcceptDialogOpen,
    detailsDialogOpen,
    setDetailsDialogOpen,
    selectedRequest,
    setSelectedRequest,
    openDetailsDialog,
    handleDelete,
    handleAcceptProject,
  };
};
