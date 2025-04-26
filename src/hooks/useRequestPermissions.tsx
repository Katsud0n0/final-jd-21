
import { Request } from '@/types/profileTypes';

export const useRequestPermissions = (user: any) => {
  const isUserDepartmentIncluded = (request: Request): boolean => {
    if (!user) return false;
    
    if (Array.isArray(request.departments)) {
      return request.departments.includes(user.department);
    }
    
    if (typeof request.department === 'string') {
      return request.department === user.department;
    }
    
    return false;
  };

  const canAcceptRequest = (request: Request) => {
    if (!user || !request || user.role !== "client") return false;

    // Don't allow accepting your own requests
    if (request.creator === user.username) return false;
    
    // Check if request is not archived
    const notArchived = !request.archived;
    
    // Check if the request is for the user's department
    const isForUserDepartment = isUserDepartmentIncluded(request);
    
    // Check if user has already accepted
    const acceptedBy = Array.isArray(request.acceptedBy) ? [...request.acceptedBy] : 
                      request.acceptedBy ? [request.acceptedBy as string] : [];
    const notAlreadyAccepted = !acceptedBy.includes(user.username);
    
    // Don't allow accepting completed requests
    if (request.status === "Completed") {
      return false;
    }
    
    // Don't allow accepting rejected single requests (not multi-department or project)
    if (request.status === "Rejected" && !request.multiDepartment && request.type !== "project") {
      return false;
    }
    
    // For single department requests, don't allow accepting if already accepted by someone
    if (!request.multiDepartment && request.type !== "project" && acceptedBy.length > 0) {
      return false;
    }

    return notArchived && isForUserDepartment && notAlreadyAccepted;
  };

  const canAbandonRequest = (request: Request) => {
    if (!user || !request || user.role !== "client") return false;

    // Can't abandon completed requests
    if (request.status === "Completed") return false;

    // Can't abandon projects
    if (request.type === "project") return false;

    if (request.status !== "Pending" && request.status !== "In Process") return false;

    const acceptedBy = Array.isArray(request.acceptedBy) ? request.acceptedBy : [];
    
    return acceptedBy.includes(user.username);
  };

  const canDeleteRequest = (request: Request) => {
    if (request.status === "Completed" || request.status === "Rejected") {
      return false;
    }
    
    if (user?.role === "admin") {
      return isUserDepartmentIncluded(request);
    }
    
    return user?.username === request.creator;
  };

  const canEditStatus = (request: Request) => {
    if (request.status === "Completed" || request.status === "Rejected") {
      return false;
    }
    
    return user?.role === "admin" && isUserDepartmentIncluded(request);
  };

  const canArchiveProject = (request: Request) => {
    return (request.type === "project" || request.multiDepartment) && 
           user?.role === "admin" && 
           isUserDepartmentIncluded(request);
  };
  
  return {
    isUserDepartmentIncluded,
    canAcceptRequest,
    canAbandonRequest,
    canDeleteRequest,
    canEditStatus,
    canArchiveProject,
  };
};
