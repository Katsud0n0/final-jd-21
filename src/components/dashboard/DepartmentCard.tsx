
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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
          <Link to={`/departments/${id}`} className="text-jd-purple hover:text-jd-darkPurple">
            <ChevronRight />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DepartmentCard;
