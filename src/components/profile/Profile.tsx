
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ProfileSidebar from "./ProfileSidebar";
import ActivitySummary from "./ActivitySummary";
import ArchivedItems from "./ArchivedItems";
import AcceptedItems from "./AcceptedItems";
import HistoryItems from "./HistoryItems";
import { Request } from "@/types/profileTypes";
import api from "@/api";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [userRequests, setUserRequests] = useState<Request[]>([]);
  const [acceptedItems, setAcceptedItems] = useState<Request[]>([]);
  const [archivedItems, setArchivedItems] = useState<Request[]>([]);
  const [historyItems, setHistoryItems] = useState<Request[]>([]);
  
  useEffect(() => {
    if (!user) return;
    
    const loadUserData = async () => {
      setLoading(true);
      try {
        // Fetch requests via API
        let requests = await api.getUserRequests(user.username);
        
        // Prepare filtered sets
        const accepted = requests.filter(req => 
          !req.archived && 
          req.status === "In Process" && 
          Array.isArray(req.acceptedBy) && 
          req.acceptedBy.includes(user.username)
        );
        
        const archived = requests.filter(req => 
          req.archived === true
        );
          
        const history = requests.filter(req => 
          req.status === "Completed" || 
          req.status === "Rejected" || 
          req.creator === user.username
        );
        
        setUserRequests(requests);
        setAcceptedItems(accepted);
        setArchivedItems(archived);
        setHistoryItems(history);
      } catch (error) {
        console.error("Error loading user data:", error);
        toast({
          title: "Error",
          description: "Failed to load your profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user, toast]);
  
  const handleUnarchive = async (id: string) => {
    try {
      // Update via API
      await api.updateRequest(id, { archived: false, archivedAt: null });
      
      // Update local state
      const updatedArchivedItems = archivedItems.filter(item => item.id !== id);
      setArchivedItems(updatedArchivedItems);
      
      // Show toast
      toast({
        title: "Item Restored",
        description: "The item has been successfully restored"
      });
      
      // Refresh user data
      if (user) {
        api.getUserRequests(user.username).then(requests => {
          setUserRequests(requests);
        });
      }
    } catch (error) {
      console.error("Error unarchiving:", error);
      toast({
        title: "Error",
        description: "Failed to unarchive the item",
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      // Delete via API
      await api.deleteRequest(id);
      
      // Update local state
      const updatedArchivedItems = archivedItems.filter(item => item.id !== id);
      setArchivedItems(updatedArchivedItems);
      
      // Show toast
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
  
  const handleStatusChange = async (id: string, status: string) => {
    try {
      // Call API to update request status
      await api.updateRequest(id, { status });
      
      // Update local state
      const updatedRequests = userRequests.map(request => {
        if (request.id === id) {
          return { ...request, status };
        }
        return request;
      });
      
      setUserRequests(updatedRequests);
      
      // Refresh the categorized lists
      const accepted = updatedRequests.filter(req => 
        !req.archived && 
        req.status === "In Process" && 
        Array.isArray(req.acceptedBy) && 
        req.acceptedBy.includes(user?.username || "")
      );
      
      const history = updatedRequests.filter(req => 
        req.status === "Completed" || 
        req.status === "Rejected" || 
        req.creator === user?.username
      );
      
      setAcceptedItems(accepted);
      setHistoryItems(history);
      
      toast({
        title: "Status Updated",
        description: `Request status has been updated to ${status}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update the status",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <ProfileSidebar 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            user={user}
            counts={{
              accepted: acceptedItems.length,
              archived: archivedItems.length,
              history: historyItems.length
            }}
          />
        </div>
        
        <div className="md:col-span-3">
          {activeTab === "overview" && (
            <ActivitySummary 
              userData={user} 
              requests={historyItems} 
              className="mb-6" 
            />
          )}
          
          {activeTab === "accepted" && (
            <AcceptedItems 
              items={acceptedItems} 
              onStatusChange={handleStatusChange} 
              userData={user} 
            />
          )}
          
          {activeTab === "archived" && (
            <ArchivedItems 
              archivedItems={archivedItems} 
              handleUnarchive={handleUnarchive}
              handleDelete={handleDelete}
              user={user} 
            />
          )}
          
          {activeTab === "history" && (
            <HistoryItems 
              items={historyItems}
              userData={user}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
