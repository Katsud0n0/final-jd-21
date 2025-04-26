
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, Trash2, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RejectionModal from "@/components/profile/RejectionModal";
import { Request } from "@/types/profileTypes";
import AcceptedItems from "@/components/profile/AcceptedItems";

// Create RejectionModal component if it doesn't exist already
const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [createdRequests, setCreatedRequests] = useState<Request[]>([]);
  const [acceptedItems, setAcceptedItems] = useState<Request[]>([]);
  const [historyItems, setHistoryItems] = useState<Request[]>([]);
  const [rejectionNotes, setRejectionNotes] = useState<any[]>([]);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>("all");
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'request' | 'project' | 'multi-department'>('request');
  
  useEffect(() => {
    // Load data from localStorage
    const fetchData = () => {
      try {
        setLoading(true);
        
        // Get all requests
        const allRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
        
        // Filter for current user
        if (user) {
          // Requests created by user
          const userCreatedRequests = allRequests.filter((req: Request) => 
            req.creator === user.username && !req.archived
          );
          
          // Requests accepted by user (but not created by user)
          const userAcceptedRequests = allRequests.filter((req: Request) => {
            const acceptedBy = Array.isArray(req.acceptedBy) ? req.acceptedBy : [req.acceptedBy];
            return acceptedBy.includes(user.username) && 
                   req.creator !== user.username && 
                   !req.archived &&
                   req.status !== "Completed" && 
                   req.status !== "Rejected";
          });
          
          // History items (completed or rejected)
          const userHistoryItems = allRequests.filter((req: Request) => {
            const acceptedBy = Array.isArray(req.acceptedBy) ? req.acceptedBy : [req.acceptedBy];
            return (req.creator === user.username || acceptedBy.includes(user.username)) &&
                  (req.status === "Completed" || req.status === "Rejected") &&
                  !req.archived;
          });
          
          // Get rejection notes
          const storedRejectionNotes = JSON.parse(localStorage.getItem(`rejection-notes-${user.username}`) || "[]");
          
          setCreatedRequests(userCreatedRequests);
          setAcceptedItems(userAcceptedRequests);
          setHistoryItems(userHistoryItems);
          setRejectionNotes(storedRejectionNotes);
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Mark item as completed
  const handleMarkCompleted = (id: string) => {
    if (!user) return;
    
    try {
      // Get all requests
      const allRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      
      // Find the request to mark as completed
      const updatedRequests = allRequests.map((req: Request) => {
        if (req.id === id) {
          // Create or update the participantsCompleted array
          const participantsCompleted = Array.isArray(req.participantsCompleted) 
            ? [...req.participantsCompleted, user.username]
            : [user.username];
          
          // Check if all participants have completed the request
          const acceptedBy = Array.isArray(req.acceptedBy) ? req.acceptedBy : [req.acceptedBy];
          const allCompleted = acceptedBy.every(participant => participantsCompleted.includes(participant));
          
          // Only change status to Completed if all participants have completed it
          // AND there are at least 2 participants (for multi-dept and projects)
          const newStatus = allCompleted && acceptedBy.length >= 2 ? "Completed" : req.status;
          
          return {
            ...req,
            participantsCompleted,
            status: newStatus,
            lastStatusUpdateTime: new Date().toLocaleTimeString()
          };
        }
        return req;
      });
      
      // Save updated requests
      localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
      
      // Update local state
      const updatedAcceptedItems = acceptedItems.map(item => {
        if (item.id === id) {
          // Update the participantsCompleted array
          const participantsCompleted = Array.isArray(item.participantsCompleted)
            ? [...item.participantsCompleted, user.username]
            : [user.username];
          
          return {
            ...item,
            participantsCompleted,
            lastStatusUpdateTime: new Date().toLocaleTimeString()
          };
        }
        return item;
      });
      
      setAcceptedItems(updatedAcceptedItems);
      
      toast({
        title: "Item marked as completed",
        description: "You have marked this item as completed.",
      });
    } catch (error) {
      console.error("Error marking as completed:", error);
      toast({
        title: "Error",
        description: "Could not mark the item as completed.",
        variant: "destructive",
      });
    }
  };
  
  // Check if user has already marked an item as completed
  const hasMarkedCompleted = (item: Request) => {
    if (!user) return false;
    
    return Array.isArray(item.participantsCompleted) && 
           item.participantsCompleted.includes(user.username);
  };
  
  // Abandon/reject an item
  const handleAbandon = (id: string, reason?: string) => {
    if (!user) return;
    
    try {
      // Get all requests
      const allRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      
      // Find the request to abandon/reject
      const requestToUpdate = allRequests.find((req: Request) => req.id === id);
      
      if (!requestToUpdate) {
        throw new Error("Request not found");
      }
      
      let updatedRequests;
      
      // Handle differently based on request type
      if (requestToUpdate.type === "project" || requestToUpdate.multiDepartment) {
        // For projects and multi-department requests:
        // 1. Remove user from acceptedBy
        // 2. Change status back to "Pending"
        // 3. Store rejection reason if provided
        updatedRequests = allRequests.map((req: Request) => {
          if (req.id === id) {
            const acceptedBy = Array.isArray(req.acceptedBy) 
              ? req.acceptedBy.filter(u => u !== user.username)
              : [];
              
            // Update usersAccepted count
            const usersAccepted = acceptedBy.length;
            
            // Set status based on participant count
            // Status should be "Pending" if less than 2 users have accepted
            // (This ensures projects with just 1 user remain in "Pending" status)
            const newStatus = usersAccepted < 2 ? "Pending" : "In Process";
            
            return {
              ...req,
              acceptedBy,
              usersAccepted,
              status: newStatus,
              lastStatusUpdateTime: new Date().toLocaleTimeString()
            };
          }
          return req;
        });
      } else {
        // For single department requests:
        // 1. Set status to "Rejected"
        // 2. Store rejection reason if provided
        updatedRequests = allRequests.map((req: Request) => {
          if (req.id === id) {
            return {
              ...req,
              status: "Rejected",
              lastStatusUpdateTime: new Date().toLocaleTimeString()
            };
          }
          return req;
        });
      }
      
      // Save updated requests
      localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
      
      // Store rejection reason
      if (reason) {
        const creator = requestToUpdate.creator;
        
        // Get existing rejection notes for creator
        const creatorRejectionNotes = JSON.parse(
          localStorage.getItem(`rejection-notes-${creator}`) || "[]"
        );
        
        // Add new rejection note
        const newRejectionNote = {
          id: Date.now().toString(),
          requestId: id,
          requestTitle: requestToUpdate.title,
          rejectedBy: user.username,
          reason,
          timestamp: new Date().toISOString()
        };
        
        creatorRejectionNotes.push(newRejectionNote);
        
        // Save updated rejection notes
        localStorage.setItem(
          `rejection-notes-${creator}`,
          JSON.stringify(creatorRejectionNotes)
        );
      }
      
      // Update local state - remove the abandoned item
      setAcceptedItems(acceptedItems.filter(item => item.id !== id));
      
      toast({
        title: requestToUpdate.type === "project" ? "Project rejected" : "Request rejected",
        description: `You have rejected this ${requestToUpdate.type === "project" ? "project" : "request"}.`,
      });
    } catch (error) {
      console.error("Error abandoning/rejecting:", error);
      toast({
        title: "Error",
        description: "Could not abandon/reject the item.",
        variant: "destructive",
      });
    }
  };
  
  // Handle clear all rejection notes
  const handleClearAllRejectionNotes = () => {
    if (!user) return;
    
    try {
      localStorage.setItem(`rejection-notes-${user.username}`, JSON.stringify([]));
      setRejectionNotes([]);
      
      toast({
        title: "Notes cleared",
        description: "All rejection notes have been cleared.",
      });
    } catch (error) {
      console.error("Error clearing rejection notes:", error);
    }
  };
  
  // Handle remove single rejection note
  const handleRemoveRejectionNote = (noteId: string) => {
    if (!user) return;
    
    try {
      const updatedNotes = rejectionNotes.filter(note => note.id !== noteId);
      localStorage.setItem(`rejection-notes-${user.username}`, JSON.stringify(updatedNotes));
      setRejectionNotes(updatedNotes);
      
      toast({
        title: "Note removed",
        description: "The rejection note has been removed.",
      });
    } catch (error) {
      console.error("Error removing rejection note:", error);
    }
  };
  
  // Filter history items by type
  const filteredHistoryItems = historyItems.filter(item => {
    if (historyTypeFilter === "all") return true;
    if (historyTypeFilter === "request" && item.type === "request" && !item.multiDepartment) return true;
    if (historyTypeFilter === "multi" && (item.multiDepartment || (item.type === "request" && item.multiDepartment))) return true;
    if (historyTypeFilter === "project" && item.type === "project") return true;
    return false;
  });
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      <div className="mb-8">
        <div className="bg-jd-card rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-jd-purple flex items-center justify-center text-white text-2xl font-medium">
                {user?.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-medium">{user?.fullName}</h2>
              <p className="text-jd-mutedText">@{user?.username}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="bg-jd-purple/10 text-jd-purple px-3 py-1 rounded-full text-sm">
                  {user?.department}
                </div>
                <div className="bg-jd-purple/10 text-jd-purple px-3 py-1 rounded-full text-sm">
                  {user?.role || "User"}
                </div>
              </div>
              <p className="mt-2 text-jd-mutedText">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="created">
        <TabsList className="w-full grid grid-cols-1 md:grid-cols-4 mb-6">
          <TabsTrigger value="created">
            Created Requests {createdRequests.length > 0 && `(${createdRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted Items {acceptedItems.length > 0 && `(${acceptedItems.length})`}
          </TabsTrigger>
          <TabsTrigger value="history">
            History {historyItems.length > 0 && `(${historyItems.length})`}
          </TabsTrigger>
          <TabsTrigger value="rejections">
            Rejection Notes {rejectionNotes.length > 0 && `(${rejectionNotes.length})`}
          </TabsTrigger>
        </TabsList>
        
        {/* Created Requests Tab */}
        <TabsContent value="created">
          <div className="bg-jd-card rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-medium">Created Requests</h3>
                <p className="text-jd-mutedText">
                  Requests you've created
                </p>
              </div>
            </div>
            
            {createdRequests.length > 0 ? (
              <div className="space-y-4">
                {createdRequests.map((item, index) => (
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
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs
                            ${item.status === "Pending" ? "bg-jd-orange/20 text-jd-orange" : 
                              item.status === "In Process" ? "bg-blue-500/20 text-blue-500" : 
                              item.status === "Completed" ? "bg-green-500/20 text-green-500" : 
                              "bg-gray-500/20 text-gray-500"}`}>
                            {item.status}
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
                            
                            {item.acceptedBy.length < 2 && (
                              <p className="text-xs text-amber-600 mt-1">
                                Waiting for more users to join before changing to In Process
                              </p>
                            )}
                          </div>
                        )}
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
                <p className="text-jd-mutedText">
                  You haven't created any requests yet.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Accepted Items Tab */}
        <TabsContent value="accepted">
          <AcceptedItems 
            acceptedItems={acceptedItems} 
            handleMarkCompleted={handleMarkCompleted} 
            handleAbandon={handleAbandon} 
            hasMarkedCompleted={hasMarkedCompleted}
            user={user}
          />
          <RejectionModal 
            isOpen={rejectionModalOpen}
            setIsOpen={setRejectionModalOpen}
            itemType={selectedItemType}
            onConfirm={handleAbandon}
            itemId={selectedItemId || ""}
          />
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <div className="bg-jd-card rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-medium">History</h3>
                <p className="text-jd-mutedText">
                  Previously completed and rejected items
                </p>
              </div>
              
              {historyItems.length > 0 && (
                <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
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
            
            {filteredHistoryItems.length > 0 ? (
              <div className="space-y-4">
                {filteredHistoryItems.map((item, index) => (
                  <div key={index} className="border border-jd-bg rounded-lg p-4 opacity-70">
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
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs
                            ${item.status === "Completed" ? "bg-green-500/20 text-green-500" : 
                              "bg-gray-500/20 text-gray-500"}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-sm text-jd-purple">{item.department}</p>
                        <p className="text-sm text-jd-mutedText mt-1">
                          {item.description?.slice(0, 100)}{item.description?.length > 100 ? '...' : ''}
                        </p>
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
                <p className="text-jd-mutedText">
                  No historical items found.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Rejection Notes Tab */}
        <TabsContent value="rejections">
          <div className="bg-jd-card rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-medium">Rejection Notes</h3>
                <p className="text-jd-mutedText">
                  Notes from users who rejected your requests
                </p>
              </div>
              
              {rejectionNotes.length > 0 && (
                <Button 
                  variant="outline" 
                  className="text-jd-red hover:bg-jd-red/10"
                  onClick={handleClearAllRejectionNotes}
                >
                  Clear All Notes
                </Button>
              )}
            </div>
            
            {rejectionNotes.length > 0 ? (
              <div className="space-y-4">
                {rejectionNotes.map((note, index) => (
                  <div key={index} className="border border-jd-bg rounded-lg p-4">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{note.requestTitle}</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveRejectionNote(note.id)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                    <p className="text-sm text-jd-purple">
                      Rejected by: {note.rejectedBy}
                    </p>
                    <p className="text-sm text-jd-mutedText mt-2">
                      {note.reason || "No reason provided"}
                    </p>
                    <p className="text-xs text-jd-mutedText mt-2">
                      {new Date(note.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-jd-bg rounded-lg">
                <p className="text-jd-mutedText">
                  No rejection notes to display.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
