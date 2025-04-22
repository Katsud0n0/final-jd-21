
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import RecentActivities from "@/components/dashboard/RecentActivities";
import StatCard from "@/components/dashboard/StatCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RequestForm from "@/components/dashboard/RequestForm";

const Dashboard = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  useEffect(() => {
    // Load requests from localStorage
    const storedRequests = localStorage.getItem("jd-requests");
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests));
    }
  }, []);

  const handleRequestSuccess = () => {
    setIsDialogOpen(false);
    // Reload requests to show the new one
    const storedRequests = localStorage.getItem("jd-requests");
    if (storedRequests) {
      setRequests(JSON.parse(storedRequests));
    }
  };

  // Count requests by status
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === "Pending").length;
  const completedRequests = requests.filter(r => r.status === "Completed").length;
  const rejectedRequests = requests.filter(r => r.status === "Rejected").length;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-medium">Welcome back, vardhan</h2>
      
      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Requests"
          value={totalRequests}
          description="All department requests"
          icon={<FileText size={18} />}
          color="jd-blue"
        />
        
        <StatCard 
          title="Pending"
          value={pendingRequests}
          description="Awaiting action"
          icon={<Clock size={18} />}
          color="jd-orange"
        />
        
        <StatCard 
          title="Completed"
          value={completedRequests}
          description="Request completed"
          icon={<CheckCircle size={18} />}
          color="jd-green"
        />
        
        <StatCard 
          title="Rejected"
          value={rejectedRequests}
          description="Request denied"
          icon={<XCircle size={18} />}
          color="jd-red"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities Component */}
        <div className="lg:col-span-1">
          <RecentActivities />
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
                <div 
                  key={index} 
                  className={`p-4 bg-jd-bg rounded-lg ${
                    (request.status === "Completed" || request.status === "Rejected") ? 'opacity-50' : ''
                  } ${request.isExpired ? 'opacity-30' : ''}`}
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium">{request.title}</h4>
                    <div className="flex flex-col">
                      <span className={`px-2 py-1 rounded text-xs ${
                        request.status === "Pending" 
                          ? "bg-jd-orange/20 text-jd-orange"
                          : request.status === "Completed" 
                            ? "bg-jd-green/20 text-jd-green"
                            : "bg-jd-red/20 text-jd-red"
                      }`}>
                        {request.status}
                      </span>
                      {(request.status === "Completed" || request.status === "Rejected") && (
                        <span className="text-xs text-jd-mutedText mt-1">Expires in 1 day</span>
                      )}
                    </div>
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
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-jd-purple hover:bg-jd-darkPurple">
                    Create Your First Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-jd-card border-jd-card">
                  <DialogHeader>
                    <DialogTitle>Create New Request</DialogTitle>
                    <DialogDescription>
                      Submit a new request to another department
                    </DialogDescription>
                  </DialogHeader>
                  <RequestForm onSuccess={handleRequestSuccess} />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
