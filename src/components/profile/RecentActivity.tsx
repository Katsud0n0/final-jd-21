
import React from 'react';
import { Clock } from 'lucide-react';
import { Request } from '@/types/profileTypes';

interface RecentActivityProps {
  recentActivity: Request[];
}

const RecentActivity = ({ recentActivity }: RecentActivityProps) => {
  return (
    <div className="bg-jd-card rounded-lg p-6">
      <h3 className="text-xl font-medium mb-6">Recent Activity</h3>
      
      {recentActivity.length > 0 ? (
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="border-b border-jd-bg last:border-0 pb-4 last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{activity.title}</h4>
                  <p className="text-sm text-jd-purple">{activity.department}</p>
                  <p className="text-sm text-jd-mutedText mt-1">
                    {activity.description?.slice(0, 100)}{activity.description?.length > 100 ? '...' : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`px-2 py-1 rounded text-xs ${
                    activity.status === "Pending" ? "bg-jd-orange/20 text-jd-orange" :
                    activity.status === "In Process" ? "bg-blue-500/20 text-blue-500" :
                    activity.status === "Completed" ? "bg-green-500/20 text-green-500" :
                    "bg-red-500/20 text-red-500"
                  }`}>
                    {activity.status}
                  </span>
                  <span className="text-xs text-jd-mutedText mt-1">{activity.dateCreated}</span>
                  {activity.lastStatusUpdateTime && (
                    <div className="flex items-center gap-1 text-xs text-jd-mutedText mt-1">
                      <Clock size={12} />
                      <span>
                        Updated: {activity.lastStatusUpdateTime}
                      </span>
                    </div>
                  )}
                  {activity.status === "Pending" && (
                    <div className="flex items-center gap-1 text-xs text-jd-mutedText mt-1">
                      <Clock size={12} />
                      <span>
                        Expires in: {activity.type === "request" ? "30 days" : "60 days"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-jd-mutedText">No recent activity</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
