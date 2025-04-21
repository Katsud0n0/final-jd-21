
import { cn } from "@/lib/utils";

interface TeamMemberCardProps {
  id: string;
  name: string;
  username: string;
  department: string;
  role: string;
  email: string;
  phone: string;
}

const TeamMemberCard = ({
  id,
  name,
  username,
  department,
  role,
  email,
  phone,
}: TeamMemberCardProps) => {
  // Get initials for the avatar
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Generate color based on department
  const getDepartmentColor = () => {
    switch (department.toLowerCase()) {
      case "water supply":
        return "bg-department-water";
      case "electricity":
        return "bg-department-electricity";
      case "health":
        return "bg-department-health";
      case "education":
        return "bg-department-education";
      case "sanitation":
        return "bg-department-sanitation";
      case "public works":
        return "bg-department-public-works";
      case "transportation":
        return "bg-department-transportation";
      case "urban development":
        return "bg-department-urban-development";
      case "environment":
        return "bg-department-environment";
      case "finance":
        return "bg-department-finance";
      default:
        return "bg-jd-purple";
    }
  };

  return (
    <div className="bg-jd-card rounded-lg p-6">
      <div className="flex flex-col items-center mb-4">
        <div className={cn("h-20 w-20 rounded-full flex items-center justify-center text-white text-xl font-medium", getDepartmentColor())}>
          {initials}
        </div>
        <h3 className="mt-3 text-lg font-medium">{name}</h3>
        <p className="text-sm text-jd-mutedText">@{username}</p>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-jd-mutedText text-sm">Department</p>
          <p className="font-medium">{department}</p>
        </div>
        <div>
          <p className="text-jd-mutedText text-sm">Role</p>
          <p className="text-jd-purple">{role}</p>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-jd-mutedText" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">{email}</p>
        </div>
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-jd-mutedText" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <p className="text-sm">{phone}</p>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberCard;
