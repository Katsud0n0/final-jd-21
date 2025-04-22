
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface DepartmentCardProps {
  id: string;
  name: string;
  description: string;
  icon: string | JSX.Element;
  color: string;
  requestCount: number;
}

const DepartmentCard = ({
  id,
  name,
  description,
  icon,
  color,
  requestCount,
}: DepartmentCardProps) => {
  const { user } = useAuth();
  
  // Check if admin has access to this department
  const hasAccess = user?.role === "admin" ? user.department === name : true;

  return (
    <div className="border border-jd-card rounded-lg bg-jd-card overflow-hidden">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-white font-medium",
              `bg-department-${id}`
            )}
          >
            {typeof icon === 'string' ? icon : icon}
          </div>
          <div>
            <h3 className="font-medium">{name}</h3>
            <p className="text-sm text-jd-mutedText">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="h-8 w-8 rounded-full bg-jd-bg flex items-center justify-center">
              {requestCount}
            </div>
          </div>
          <Link 
            to={`/departments/${id}`} 
            className={cn(
              "text-jd-purple hover:text-jd-darkPurple",
              !hasAccess && "opacity-50 pointer-events-none"
            )}
            title={!hasAccess ? "You don't have access to this department" : "View department"}
          >
            <ChevronRight />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DepartmentCard;
