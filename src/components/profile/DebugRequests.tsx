
import React from 'react';
import { Button } from '@/components/ui/button';
import { Request } from '@/types/profileTypes';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const DebugRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = React.useState<Request[]>([]);

  const loadRequests = () => {
    const storedRequests = localStorage.getItem("jd-requests");
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests));
    }
  };

  React.useEffect(() => {
    loadRequests();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Debug Requests</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Debug Requests Data</DialogTitle>
        </DialogHeader>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Current user: {user?.username} ({user?.department})</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>AcceptedBy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-xs">{request.id.substring(0, 8)}</TableCell>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{request.type}</TableCell>
                  <TableCell>{request.status}</TableCell>
                  <TableCell>{request.creator}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {Array.isArray(request.acceptedBy) 
                      ? request.acceptedBy.join(', ')
                      : typeof request.acceptedBy === 'string'
                        ? request.acceptedBy
                        : 'None'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DebugRequests;
