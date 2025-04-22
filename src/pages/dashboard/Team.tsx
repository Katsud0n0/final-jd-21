
import { useState } from "react";
import { teamMembers } from "@/data/team";
import TeamMemberCard from "@/components/dashboard/TeamMemberCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { departments } from "@/data/departments";

const Team = () => {
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  
  // Get unique departments
  const uniqueDepartments = ["All", ...departments.map(dept => dept.name)];

  // Filter team members by department
  const filteredMembers = departmentFilter === "All" 
    ? teamMembers 
    : teamMembers.filter(member => member.department === departmentFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-medium">Team</h2>
          <p className="text-jd-mutedText">
            Connect with team members across different departments
          </p>
        </div>
        
        <div className="w-full sm:w-64">
          <Select
            value={departmentFilter}
            onValueChange={setDepartmentFilter}
          >
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>Department: {departmentFilter}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {uniqueDepartments.map(dept => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              id={member.id}
              name={member.name}
              username={member.username}
              department={member.department}
              role={member.role}
              email={member.email}
              phone={member.phone}
            />
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <p className="text-jd-mutedText">No team members found in this department.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Team;
