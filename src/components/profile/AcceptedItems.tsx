
import React, { useState } from 'react';
import { Request } from '@/types/profileTypes';
import { Check, Clock, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AcceptedItemsProps {
  acceptedItems: Request[];
  handleMarkCompleted: (id: string) => void;
  handleAbandon: (id: string) => void;
  hasMarkedCompleted: (item: Request) => boolean;
  user: any;
}

const AcceptedItems = ({ 
  acceptedItems, 
  handleMarkCompleted, 
  handleAbandon,
  hasMarkedCompleted,
  user
}: AcceptedItemsProps) => {
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Filter accepted items by type
  const filteredItems = acceptedItems.filter(item => {
    if (typeFilter === "all") return true;
    if (typeFilter === "request" && item.type === "request" && !item.multiDepartment) return true;
    if (typeFilter === "multi" && (item.multiDepartment || (item.type === "request" && item.multiDepartment))) return true;
    if (typeFilter === "project" && item.type === "project") return true;
    return false;
  });

  const initiateAbandon = (id: string) => {
    setSelectedItemId(id);
    setAbandonDialogOpen(true);
  };

  const confirmAbandon = () => {
    if (selectedItemId) {
      handleAbandon(selectedItemId);
    }
    setAbandonDialogOpen(false);
    setSelectedItemId(null);
  };

  return (
    <div className="bg-jd-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-medium">Accepted Items</h3>
          <p className="text-jd-mutedText">
            Requests and projects you're currently working on
          </p>
        </div>
        
        {acceptedItems.length > 0 && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <SelectValue placeholder="Filter by type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="request">Single Requests</SelectItem>
              <SelectItem value="multi">Multi-Department</SelectItem>
              <SelectItem value="project">Projects</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((item, index) => (
            <div key={index} className="border border-jd-bg rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{item.title}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs
                      ${item.type === "project" ? "bg-blue-500/20 text-blue-500" : 
                        item.multiDepartment ? "bg-purple-500/20 text-purple-500" : 
                        "bg-green-500/20 text-green-500"}`}>
                      {item.type === "project" ? "Project" : 
                        item.multiDepartment ? "Multi-Dept" : 
                        "Request"}
                    </span>
                  </div>
                  <p className="text-sm text-jd-purple">{item.department}</p>
                  <p className="text-sm text-jd-mutedText mt-1">
                    {item.description?.slice(0, 100)}{item.description?.length > 100 ? '...' : ''}
                  </p>
                  
                  {(item.multiDepartment || item.type === "project") && item.acceptedBy && Array.isArray(item.acceptedBy) && (
                    <div className="mt-2">
                      <p className="text-xs text-jd-mutedText">Participants ({item.acceptedBy.length}):</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.acceptedBy.map((username, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                              {username}
                            </span>
                            {item.participantsCompleted?.includes(username) && (
                              <Check size={12} className="text-green-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`border-green-500 text-green-500 hover:bg-green-500/10
                      ${hasMarkedCompleted(item) ? 'bg-green-500/10 cursor-not-allowed opacity-50' : ''}`}
                    onClick={() => handleMarkCompleted(item.id)}
                    disabled={hasMarkedCompleted(item)}
                  >
                    {hasMarkedCompleted(item) ? (
                      <span className="flex items-center gap-1">
                        <Check size={16} /> Completed
                      </span>
                    ) : (
                      'Mark Completed'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-jd-red text-jd-red hover:bg-jd-red/10"
                    onClick={() => initiateAbandon(item.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
              
              {item.lastStatusUpdateTime && (
                <div className="mt-2 flex items-center gap-1 text-xs text-jd-mutedText">
                  <Clock size={12} />
                  <span>
                    Last updated: {item.lastStatusUpdateTime}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-jd-bg rounded-lg">
          <Clock size={48} className="mx-auto text-jd-mutedText mb-3" />
          <h4 className="text-lg font-medium mb-2">No Accepted Items</h4>
          <p className="text-jd-mutedText max-w-md mx-auto">
            You haven't accepted any requests or projects yet. Go to the Requests tab to find items to work on.
          </p>
        </div>
      )}
      
      <AlertDialog open={abandonDialogOpen} onOpenChange={setAbandonDialogOpen}>
        <AlertDialogContent className="bg-jd-card border-jd-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Request</AlertDialogTitle>
            <p className="text-jd-mutedText">
              Are you sure you want to reject this request? For multi-department requests or projects, you will be removed from the participants list.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-jd-bg hover:bg-jd-bg/80">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmAbandon}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AcceptedItems;
