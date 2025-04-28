import React from 'react';
import { Archive } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Request } from '@/types/profileTypes';
import api from '@/api';
import { useToast } from '@/hooks/use-toast';

interface ArchivedItemsProps {
  archivedItems: Request[];
  handleUnarchive: (id: string) => void;
  handleDelete: (id: string) => void;
  user: any;
}

const ArchivedItems = ({ archivedItems, handleUnarchive, handleDelete, user }: ArchivedItemsProps) => {
  const { toast } = useToast();
  
  const unarchive = async (id: string) => {
    try {
      // First try unarchiving via API endpoint
      const response = await fetch(`http://localhost:3000/api/requests/${id}/unarchive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // If the specific unarchive endpoint fails, fall back to update request
        await api.updateRequest(id, { archived: false, archivedAt: null });
      }
      
      handleUnarchive(id);
      
      toast({
        title: "Item Restored",
        description: "The item has been successfully restored"
      });
    } catch (error) {
      console.error("Error unarchiving:", error);
      toast({
        title: "Error",
        description: "Failed to unarchive the item",
        variant: "destructive"
      });
    }
  };
  
  const deleteItem = async (id: string) => {
    try {
      await api.deleteRequest(id);
      handleDelete(id);
      
      toast({
        title: "Item Deleted",
        description: "The item has been permanently deleted"
      });
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "Failed to delete the item",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="bg-jd-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-medium">Archived Items</h3>
          <p className="text-jd-mutedText">
            Archived requests and projects
          </p>
        </div>
      </div>
      
      {archivedItems.length > 0 ? (
        <div className="space-y-4">
          {archivedItems.map((item, index) => (
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
                  
                  {item.archivedAt && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-jd-mutedText">
                      <Clock size={12} />
                      <span>
                        Archived on: {new Date(item.archivedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => unarchive(item.id)}
                  >
                    Restore
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => deleteItem(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-jd-bg rounded-lg">
          <Archive size={48} className="mx-auto text-jd-mutedText mb-3" />
          <h4 className="text-lg font-medium mb-2">No Archived Items</h4>
          <p className="text-jd-mutedText max-w-md mx-auto">
            Items you archive will appear here. They are hidden from the main requests view.
          </p>
        </div>
      )}
    </div>
  );
};

export default ArchivedItems;
