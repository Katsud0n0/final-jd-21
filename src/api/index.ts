// API utilities for connecting to the Excel backend
const API_URL = 'http://localhost:3000/api';

// Helper function for handling API errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API request failed');
  }
  return response.json();
};

// Helper for creating/checking the default localStorage structure
const ensureLocalStorageDefaults = () => {
  if (!localStorage.getItem("jd-requests")) {
    localStorage.setItem("jd-requests", JSON.stringify([]));
  }
};

export const api = {
  // User endpoints
  login: async (username: string, password?: string) => {
    try {
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API login error:", error);
      throw error;
    }
  },
  
  getUsers: async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      return handleResponse(response);
    } catch (error) {
      console.error("API getUsers error:", error);
      throw error;
    }
  },
  
  updateUser: async (userId: string, userData: any) => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API updateUser error:", error);
      throw error;
    }
  },
  
  // Department endpoints
  getDepartments: async () => {
    try {
      const response = await fetch(`${API_URL}/departments`);
      return handleResponse(response);
    } catch (error) {
      console.error("API getDepartments error:", error);
      throw error;
    }
  },
  
  // Request endpoints
  getRequests: async () => {
    try {
      const response = await fetch(`${API_URL}/requests`);
      return handleResponse(response);
    } catch (error) {
      console.error("API getRequests error:", error);
      // Fallback to localStorage if API fails
      console.log("Falling back to localStorage for requests");
      ensureLocalStorageDefaults();
      const localRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      return localRequests;
    }
  },
  
  createRequest: async (requestData: any) => {
    try {
      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API createRequest error:", error);
      // Fallback to localStorage if API fails
      console.log("Falling back to localStorage for request creation");
      
      const existingRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      const newItem = {
        ...requestData,
        id: requestData.id || `#${Math.floor(100000 + Math.random() * 900000)}`
      };
      const updatedRequests = [newItem, ...existingRequests];
      localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
      
      return newItem;
    }
  },
  
  updateRequest: async (requestId: string, requestData: any) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API updateRequest error:", error);
      // Fallback to localStorage if API fails
      console.log("Falling back to localStorage for request update");
      
      const existingRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      const updatedRequests = existingRequests.map((req: any) => 
        req.id === requestId ? { ...req, ...requestData } : req
      );
      localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
      
      return { ...requestData, id: requestId };
    }
  },
  
  deleteRequest: async (requestId: string) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}`, {
        method: 'DELETE'
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API deleteRequest error:", error);
      // Fallback to localStorage if API fails
      console.log("Falling back to localStorage for request deletion");
      
      const existingRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      const updatedRequests = existingRequests.filter((req: any) => req.id !== requestId);
      localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
      
      return { success: true };
    }
  },
  
  acceptRequest: async (requestId: string, username: string) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API acceptRequest error:", error);
      // Fallback to using updateRequest
      console.log("Falling back to localStorage for request acceptance");
      
      const existingRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      const request = existingRequests.find((req: any) => req.id === requestId);
      
      if (request) {
        const acceptedBy = Array.isArray(request.acceptedBy) ? [...request.acceptedBy] : [];
        if (!acceptedBy.includes(username)) {
          acceptedBy.push(username);
        }
        
        const usersAccepted = (request.usersAccepted || 0) + 1;
        const usersNeeded = request.usersNeeded || 1;
        const newStatus = usersAccepted >= usersNeeded ? "In Process" : "Pending";
        
        const updatedRequest = {
          ...request,
          acceptedBy,
          usersAccepted,
          status: newStatus,
          ...(newStatus === "In Process" && {
            lastStatusUpdate: new Date().toISOString(),
            lastStatusUpdateTime: new Date().toLocaleTimeString()
          })
        };
        
        const updatedRequests = existingRequests.map((req: any) => 
          req.id === requestId ? updatedRequest : req
        );
        
        localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));
        return updatedRequest;
      }
      
      throw error;
    }
  },
  
  completeRequest: async (requestId: string, username: string) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API completeRequest error:", error);
      // Fallback using localStorage
      const existingRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      const requestIndex = existingRequests.findIndex((req: any) => req.id === requestId);
      
      if (requestIndex !== -1) {
        const request = existingRequests[requestIndex];
        const now = new Date();
        
        if (request.multiDepartment || request.type === "project") {
          const participantsCompleted = Array.isArray(request.participantsCompleted) 
            ? [...request.participantsCompleted] 
            : [];
          
          if (!participantsCompleted.includes(username)) {
            participantsCompleted.push(username);
          }
          
          const acceptedBy = Array.isArray(request.acceptedBy) ? request.acceptedBy : [];
          const shouldComplete = participantsCompleted.length >= acceptedBy.length && acceptedBy.length >= 2;
          
          existingRequests[requestIndex] = {
            ...request,
            participantsCompleted,
            ...(shouldComplete && {
              status: "Completed",
              lastStatusUpdate: now.toISOString(),
              lastStatusUpdateTime: now.toLocaleTimeString()
            })
          };
        } else {
          existingRequests[requestIndex] = {
            ...request,
            status: "Completed",
            lastStatusUpdate: now.toISOString(),
            lastStatusUpdateTime: now.toLocaleTimeString(),
            statusChangedBy: username
          };
        }
        
        localStorage.setItem("jd-requests", JSON.stringify(existingRequests));
        return existingRequests[requestIndex];
      }
      
      throw error;
    }
  },
  
  abandonRequest: async (requestId: string, username: string) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/abandon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API abandonRequest error:", error);
      // Fallback using localStorage
      const existingRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      const requestIndex = existingRequests.findIndex((req: any) => req.id === requestId);
      
      if (requestIndex !== -1) {
        const request = existingRequests[requestIndex];
        const now = new Date();
        
        if (request.multiDepartment || request.type === "project") {
          const acceptedBy = Array.isArray(request.acceptedBy) ? [...request.acceptedBy] : [];
          const userIndex = acceptedBy.indexOf(username);
          
          if (userIndex !== -1) {
            acceptedBy.splice(userIndex, 1);
          }
          
          const participantsCompleted = Array.isArray(request.participantsCompleted)
            ? request.participantsCompleted.filter((u: string) => u !== username)
            : [];
            
          const rejections = Array.isArray(request.rejections) ? [...request.rejections] : [];
          rejections.push({
            username,
            reason: "",
            date: now.toLocaleString()
          });
          
          existingRequests[requestIndex] = {
            ...request,
            acceptedBy,
            usersAccepted: Math.max((request.usersAccepted || 0) - 1, 0),
            participantsCompleted,
            status: "Pending",
            lastStatusUpdate: now.toISOString(),
            lastStatusUpdateTime: now.toLocaleTimeString(),
            rejections
          };
        } else {
          const rejections = Array.isArray(request.rejections) ? [...request.rejections] : [];
          rejections.push({
            username,
            reason: "",
            date: now.toLocaleString()
          });
          
          existingRequests[requestIndex] = {
            ...request,
            status: "Rejected",
            lastStatusUpdate: now.toISOString(),
            lastStatusUpdateTime: now.toLocaleTimeString(),
            statusChangedBy: username,
            acceptedBy: [],
            usersAccepted: 0,
            rejections
          };
        }
        
        localStorage.setItem("jd-requests", JSON.stringify(existingRequests));
        return existingRequests[requestIndex];
      }
      
      throw error;
    }
  },
  
  rejectRequest: async (requestId: string, username: string, reason?: string) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, reason })
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API rejectRequest error:", error);
      // Fallback using localStorage
      const existingRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      const requestIndex = existingRequests.findIndex((req: any) => req.id === requestId);
      
      if (requestIndex !== -1) {
        const request = existingRequests[requestIndex];
        const now = new Date();
        
        const rejections = Array.isArray(request.rejections) ? [...request.rejections] : [];
        rejections.push({
          username,
          reason: reason || "",
          date: now.toLocaleString()
        });
        
        existingRequests[requestIndex] = {
          ...request,
          status: "Rejected",
          lastStatusUpdate: now.toISOString(),
          lastStatusUpdateTime: now.toLocaleTimeString(),
          statusChangedBy: username,
          rejections
        };
        
        localStorage.setItem("jd-requests", JSON.stringify(existingRequests));
        return existingRequests[requestIndex];
      }
      
      throw error;
    }
  },
  
  getUserRequests: async (username: string) => {
    try {
      const response = await fetch(`${API_URL}/requests/user/${username}`);
      return handleResponse(response);
    } catch (error) {
      console.error("API getUserRequests error:", error);
      // Fallback using localStorage
      console.log("Falling back to localStorage for user requests");
      const allRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      return allRequests.filter((req: any) => {
        if (req.creator === username) return true;
        const acceptedBy = Array.isArray(req.acceptedBy) ? req.acceptedBy : [];
        return acceptedBy.includes(username);
      });
    }
  },
  
  filterRequests: async (filters: Record<string, string>) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_URL}/requests/filter?${queryParams}`);
      return handleResponse(response);
    } catch (error) {
      console.error("API filterRequests error:", error);
      // Fallback implementation using localStorage
      console.log("Falling back to localStorage for filtered requests");
      let allRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      
      // Apply filters locally
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          if (key === 'department') {
            allRequests = allRequests.filter((req: any) => req.department === value);
          } else if (key === 'status' && value !== 'All') {
            allRequests = allRequests.filter((req: any) => req.status === value);
          } else if (key === 'search') {
            const searchValue = value.toLowerCase();
            allRequests = allRequests.filter((req: any) => {
              const title = String(req.title || '').toLowerCase();
              const description = String(req.description || '').toLowerCase();
              const department = String(req.department || '').toLowerCase();
              const creator = String(req.creator || '').toLowerCase();
              
              return title.includes(searchValue) || 
                     description.includes(searchValue) || 
                     department.includes(searchValue) || 
                     creator.includes(searchValue);
            });
          }
        }
      }
      
      return allRequests;
    }
  },
  
  checkExpiredRequests: async () => {
    try {
      const response = await fetch(`${API_URL}/requests/check-expiration`, {
        method: 'POST'
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API checkExpiredRequests error:", error);
      return { updated: false, error: error.message };
    }
  },
  
  // Function to check if a user can accept a request 
  canUserAcceptRequest: async (requestId: string, username: string, department: string) => {
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/can-accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, department })
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API canUserAcceptRequest error:", error);
      // Simple fallback
      return { canAccept: true };
    }
  },
  
  // Archive request
  archiveRequest: async (requestId: string) => {
    try {
      console.log(`Archiving request ${requestId}`);
      const response = await fetch(`${API_URL}/requests/${requestId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API archiveRequest error:", error);
      // Fallback using updateRequest
      console.log("Falling back to updateRequest for archiving");
      return api.updateRequest(requestId, { archived: true, archivedAt: new Date().toISOString() });
    }
  },
  
  // Unarchive request
  unarchiveRequest: async (requestId: string) => {
    try {
      console.log(`Unarchiving request ${requestId}`);
      const response = await fetch(`${API_URL}/requests/${requestId}/unarchive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      return handleResponse(response);
    } catch (error) {
      console.error("API unarchiveRequest error:", error);
      // Fallback using updateRequest
      console.log("Falling back to updateRequest for unarchiving");
      return api.updateRequest(requestId, { archived: false, archivedAt: null });
    }
  }
};

export default api;
