
// API utilities for connecting to the SQLite backend
const API_URL = 'http://localhost:3000/api';

// Helper function for handling API errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API request failed');
  }
  return response.json();
};

export const api = {
  // User endpoints
  login: async (username: string, password?: string) => {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse(response);
  },
  
  getUsers: async () => {
    const response = await fetch(`${API_URL}/users`);
    return handleResponse(response);
  },
  
  updateUser: async (userId: string, userData: any) => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },
  
  // Department endpoints
  getDepartments: async () => {
    const response = await fetch(`${API_URL}/departments`);
    return handleResponse(response);
  },
  
  // Request endpoints
  getRequests: async () => {
    const response = await fetch(`${API_URL}/requests`);
    return handleResponse(response);
  },
  
  createRequest: async (requestData: any) => {
    const response = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    return handleResponse(response);
  },
  
  updateRequest: async (requestId: string, requestData: any) => {
    const response = await fetch(`${API_URL}/requests/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    return handleResponse(response);
  },
  
  deleteRequest: async (requestId: string) => {
    const response = await fetch(`${API_URL}/requests/${requestId}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },
  
  acceptRequest: async (requestId: string, username: string) => {
    const response = await fetch(`${API_URL}/requests/${requestId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return handleResponse(response);
  },
  
  completeRequest: async (requestId: string, username: string) => {
    const response = await fetch(`${API_URL}/requests/${requestId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return handleResponse(response);
  },
  
  abandonRequest: async (requestId: string, username: string) => {
    const response = await fetch(`${API_URL}/requests/${requestId}/abandon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return handleResponse(response);
  },
  
  rejectRequest: async (requestId: string, username: string) => {
    const response = await fetch(`${API_URL}/requests/${requestId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return handleResponse(response);
  },
  
  getUserRequests: async (username: string) => {
    const response = await fetch(`${API_URL}/requests/user/${username}`);
    return handleResponse(response);
  },
  
  filterRequests: async (filters: Record<string, string>) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/requests/filter?${queryParams}`);
    return handleResponse(response);
  },
  
  checkExpiredRequests: async () => {
    const response = await fetch(`${API_URL}/requests/check-expiration`, {
      method: 'POST'
    });
    return handleResponse(response);
  },
  
  // Function to check if a user can accept a request 
  // (This is now more permissive to allow accepting after rejection)
  canUserAcceptRequest: async (requestId: string, username: string, department: string) => {
    const response = await fetch(`${API_URL}/requests/${requestId}/can-accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, department })
    });
    return handleResponse(response);
  }
};

export default api;
