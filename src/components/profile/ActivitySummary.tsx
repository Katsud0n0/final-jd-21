
import React from 'react';
import { Request } from '@/types/profileTypes';

interface ActivitySummaryProps {
  userRequests: Request[];
}

const ActivitySummary = ({ userRequests }: ActivitySummaryProps) => {
  // Calculate stats
  const totalRequests = userRequests.length;
  const completedRequests = userRequests.filter((r) => r.status === "Completed").length;
  const pendingRequests = userRequests.filter((r) => r.status === "Pending").length;
  const inProcessRequests = userRequests.filter((r) => r.status === "In Process").length;
  const rejectedRequests = userRequests.filter((r) => r.status === "Rejected").length;
  
  return (
    <div className="bg-jd-card rounded-lg p-6">
      <h3 className="text-xl font-medium mb-6">Activity Summary</h3>
      <p className="text-jd-mutedText mb-4">Overview of your activity on the platform</p>
      
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-4xl font-bold text-jd-purple">{totalRequests}</div>
          <p className="text-jd-mutedText">Total</p>
        </div>
        <div>
          <div className="text-4xl font-bold text-jd-orange">{pendingRequests}</div>
          <p className="text-jd-mutedText">Pending</p>
        </div>
        <div>
          <div className="text-4xl font-bold text-blue-500">{inProcessRequests}</div>
          <p className="text-jd-mutedText">In Process</p>
        </div>
        <div>
          <div className="text-4xl font-bold text-green-500">{completedRequests}</div>
          <p className="text-jd-mutedText">Completed</p>
        </div>
      </div>
    </div>
  );
};

export default ActivitySummary;
