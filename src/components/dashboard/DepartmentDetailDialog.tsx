
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { teamMembers } from "@/data/team";
import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";

interface DepartmentDetailDialogProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const DepartmentDetailDialog = ({ id, name, description, color }: DepartmentDetailDialogProps) => {
  const navigate = useNavigate();
  
  // Find department manager
  const manager = teamMembers.find(member => 
    member.department === name && member.role.toLowerCase().includes('head'));
  
  // Find all team members from this department
  const departmentMembers = teamMembers.filter(member => member.department === name);
  
  const goToTeam = () => {
    navigate("/team");
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-jd-card border-jd-card max-w-lg">
        <DialogHeader>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white bg-${color} mb-4`}>
            {name[0]}
          </div>
          <DialogTitle className="text-xl">{name} Department</DialogTitle>
          <DialogDescription className="text-jd-mutedText">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div>
            <h4 className="font-medium mb-2">Department Lead</h4>
            {manager ? (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-jd-purple flex items-center justify-center text-white">
                  {manager.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium">{manager.name}</p>
                  <p className="text-sm text-jd-mutedText">{manager.role}</p>
                  <p className="text-sm">{manager.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-jd-mutedText">No department lead assigned</p>
            )}
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Team Size</h4>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{departmentMembers.length} team members</span>
            </div>
          </div>
          
          <Button 
            onClick={goToTeam}
            className="bg-jd-purple hover:bg-jd-darkPurple w-full"
          >
            View Team Members
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepartmentDetailDialog;
