
import { Request } from '@/types/profileTypes';
import React from 'react';

export const useRequestUtils = () => {
  const renderDepartmentTags = (request: Request, openDetailsDialog: (request: Request) => void) => {
    if (request.type === "project") {
      const depts = Array.isArray(request.departments) ? request.departments : 
                    request.department ? [request.department] : [];
      
      const maxDisplayed = 2;
      
      if (depts.length <= maxDisplayed) {
        return (
          <div className="flex flex-wrap gap-1">
            {depts.map((dept, idx) => (
              <span key={idx} className="bg-jd-bg text-xs px-2 py-1 rounded-full">
                {dept}
              </span>
            ))}
          </div>
        );
      } else {
        const displayed = depts.slice(0, maxDisplayed);
        const remaining = depts.length - maxDisplayed;
        
        return (
          <div className="flex flex-wrap gap-1">
            {displayed.map((dept, idx) => (
              <span key={idx} className="bg-jd-bg text-xs px-2 py-1 rounded-full">
                {dept}
              </span>
            ))}
            <span className="bg-jd-purple/20 text-jd-purple text-xs px-2 py-1 rounded-full cursor-pointer" 
                  onClick={() => openDetailsDialog(request)}>
              +{remaining} more
            </span>
          </div>
        );
      }
    }
    
    const depts = request.departments || [request.department as string];
    const maxDisplayed = 2;
    
    if (!Array.isArray(depts) || depts.length <= maxDisplayed) {
      return (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(depts) ? depts.map((dept, idx) => (
            <span key={idx} className="bg-jd-bg text-xs px-2 py-1 rounded-full">
              {dept}
            </span>
          )) : (
            <span className="bg-jd-bg text-xs px-2 py-1 rounded-full">
              {depts}
            </span>
          )}
        </div>
      );
    } else {
      const displayed = depts.slice(0, maxDisplayed);
      const remaining = depts.length - maxDisplayed;
      
      return (
        <div className="flex flex-wrap gap-1">
          {displayed.map((dept, idx) => (
            <span key={idx} className="bg-jd-bg text-xs px-2 py-1 rounded-full">
              {dept}
            </span>
          ))}
          <span className="bg-jd-purple/20 text-jd-purple text-xs px-2 py-1 rounded-full cursor-pointer" 
                onClick={() => openDetailsDialog(request)}>
            +{remaining} more
          </span>
        </div>
      );
    }
  };

  const renderAcceptedByDetails = (request: Request) => {
    if (!request.acceptedBy || (Array.isArray(request.acceptedBy) && request.acceptedBy.length === 0)) {
      return "None";
    }
    
    // For multi-department requests and projects, show all accepted users
    if (request.multiDepartment || request.type === "project") {
      if (Array.isArray(request.acceptedBy)) {
        return (
          <div className="space-y-1 mt-1">
            {request.acceptedBy.map((username, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                  {username}
                </span>
                {request.participantsCompleted?.includes(username) && (
                  <span className="text-green-500">✓</span>
                )}
              </div>
            ))}
            {request.usersNeeded && request.acceptedBy.length < request.usersNeeded && (
              <div className="text-xs text-jd-mutedText mt-1">
                Waiting for {request.usersNeeded - request.acceptedBy.length} more participants
              </div>
            )}
          </div>
        );
      }
    }
    
    // For single requests, only show the first user who accepted
    if (!request.multiDepartment && request.type !== "project") {
      const acceptedUser = Array.isArray(request.acceptedBy) ? request.acceptedBy[0] : request.acceptedBy;
      if (acceptedUser) {
        return (
          <div className="space-y-1 mt-1">
            <div className="flex items-center gap-1">
              <span className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                {acceptedUser}
              </span>
            </div>
          </div>
        );
      }
    }
    
    return "None";
  };

  return {
    renderDepartmentTags,
    renderAcceptedByDetails
  };
};
