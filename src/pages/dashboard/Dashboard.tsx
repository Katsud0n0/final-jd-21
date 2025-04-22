import { FileText, Clock, UserCheck, CheckCircle, Activity, TrendingUp, Users, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { departments } from "@/data/departments";

const Dashboard = () => {
  const [requests, setRequests] = useState<any[]>([]);
  
  useEffect(() => {
    // Load requests from localStorage
    const storedRequests = localStorage.getItem("jd-requests");
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests));
    }
  }, []);

  // Count requests by status
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === "Pending").length;
  const inProgressRequests = requests.filter(r => r.status === "In progress").length;
  const completedRequests = requests.filter(r => r.status === "Completed").length;

  // Sample activities data
  const recentActivities = [
    {
      id: 1,
      type: "meeting",
      title: "Department Heads Meeting",
      time: "2 hours ago",
      icon: <Users className="text-jd-purple" size={20} />
    },
    {
      id: 2,
      type: "project",
      title: "New Project Initiated",
      time: "4 hours ago",
      icon: <TrendingUp className="text-green-500" size={20} />
    },
    {
      id: 3,
      type: "update",
      title: "Monthly Reports Updated",
      time: "6 hours ago",
      icon: <Activity className="text-blue-500" size={20} />
    },
    {
      id: 4,
      type: "deadline",
      title: "Project Deadline Updated",
      time: "12 hours ago",
      icon: <Calendar className="text-orange-500" size={20} />
    }
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-medium">Welcome back, vardhan</h2>
      
      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-jd-card rounded-lg p-4 border-l-4 border-jd-blue">
          <div className="text-3xl font-bold">{totalRequests}</div>
          <div className="text-sm text-jd-mutedText mb-2">All department requests</div>
          <div className="text-lg font-medium flex items-center gap-2">
            <FileText size={18} />
            Total Requests
          </div>
        </div>
        
        <div className="bg-jd-card rounded-lg p-4 border-l-4 border-jd-orange">
          <div className="text-3xl font-bold">{pendingRequests}</div>
          <div className="text-sm text-jd-mutedText mb-2">Awaiting action</div>
          <div className="text-lg font-medium flex items-center gap-2">
            <Clock size={18} />
            Pending
          </div>
        </div>
        
        <div className="bg-jd-card rounded-lg p-4 border-l-4 border-jd-blue">
          <div className="text-3xl font-bold">{inProgressRequests}</div>
          <div className="text-sm text-jd-mutedText mb-2">Currently being processed</div>
          <div className="text-lg font-medium flex items-center gap-2">
            <UserCheck size={18} />
            In Progress
          </div>
        </div>
        
        <div className="bg-jd-card rounded-lg p-4 border-l-4 border-jd-green">
          <div className="text-3xl font-bold">{completedRequests}</div>
          <div className="text-sm text-jd-mutedText mb-2">Successfully resolved</div>
          <div className="text-lg font-medium flex items-center gap-2">
            <CheckCircle size={18} />
            Completed
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities - Replacing Department Statistics */}
        <div className="lg:col-span-1 bg-jd-card rounded-lg p-6">
          <h3 className="text-xl font-medium mb-6">Recent Activities</h3>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-jd-bg transition-colors">
                <div className="h-10 w-10 rounded-full bg-jd-bg flex items-center justify-center">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-jd-mutedText">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Requests */}
        <div className="lg:col-span-2 bg-jd-card rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-medium">Your Recent Requests</h3>
            <a href="/requests" className="text-sm text-jd-purple hover:underline">
              View All
            </a>
          </div>
          
          {requests.length > 0 ? (
            <div className="space-y-4">
              {requests.slice(0, 3).map((request, index) => (
                <div key={index} className="p-4 bg-jd-bg rounded-lg">
                  <div className="flex justify-between">
                    <h4 className="font-medium">{request.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      request.status === "Pending" 
                        ? "bg-jd-orange/20 text-jd-orange"
                        : request.status === "In progress" 
                        ? "bg-jd-blue/20 text-jd-blue"
                        : "bg-jd-green/20 text-jd-green"
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-jd-mutedText mt-1">Submitted to {request.department}</p>
                  <p className="text-sm text-jd-mutedText mt-1">{request.dateCreated}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="h-20 w-20 bg-jd-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-jd-mutedText" />
              </div>
              <h4 className="text-xl mb-2">No Requests Yet</h4>
              <p className="text-jd-mutedText mb-6">
                You haven't created any interdepartmental requests yet.
              </p>
              <Button className="bg-jd-purple hover:bg-jd-darkPurple">
                Create Your First Request
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
