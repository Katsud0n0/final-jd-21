
import { departments } from "@/data/departments";
import DepartmentCard from "@/components/dashboard/DepartmentCard";
import { useState, useEffect } from "react";
import DepartmentDetailDialog from "@/components/dashboard/DepartmentDetailDialog";

const Departments = () => {
  const [departmentsWithCounts, setDepartmentsWithCounts] = useState(departments);
  
  useEffect(() => {
    // Load requests from localStorage to count by department
    const storedRequests = localStorage.getItem("jd-requests");
    if (storedRequests) {
      const requests = JSON.parse(storedRequests);
      
      // Count requests by department
      const counts = requests.reduce((acc: Record<string, number>, req: any) => {
        if (req.department) {
          acc[req.department] = (acc[req.department] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Update departments with request counts
      const updatedDepts = departments.map(dept => ({
        ...dept,
        requestCount: counts[dept.name] || 0
      }));
      
      setDepartmentsWithCounts(updatedDepts);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium">City Departments</h2>
        <p className="text-jd-mutedText mt-1">
          Connect and collaborate with different municipal departments
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {departmentsWithCounts.map((dept) => (
          <div key={dept.id} className="bg-jd-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white bg-${dept.color} mr-3`}>
                  {dept.icon}
                </div>
                <div>
                  <h3 className="font-medium">{dept.name}</h3>
                  <p className="text-sm text-jd-mutedText">{dept.requestCount} requests</p>
                </div>
              </div>
              <DepartmentDetailDialog 
                id={dept.id}
                name={dept.name}
                description={dept.description}
                icon={dept.icon}
                color={dept.color}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Departments;
