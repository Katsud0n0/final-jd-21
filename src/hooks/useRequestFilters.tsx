
import { useState } from 'react';
import { Request } from '@/types/profileTypes';

export const useRequestFilters = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [departmentFilters, setDepartmentFilters] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  
  const toggleDepartmentFilter = (department: string) => {
    if (departmentFilters.includes(department)) {
      setDepartmentFilters(departmentFilters.filter(d => d !== department));
    } else {
      setDepartmentFilters([...departmentFilters, department]);
    }
  };

  const clearFilters = () => {
    setStatusFilter("All");
    setDepartmentFilters([]);
    setSearchTerm("");
  };
  
  const filterRequests = (requests: Request[]) => {
    return requests.filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (typeof request.department === 'string' && request.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (request.creator && request.creator.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "All" || request.status === statusFilter;
      
      let matchesDepartment = true;
      if (departmentFilters.length > 0) {
        if (Array.isArray(request.departments)) {
          matchesDepartment = request.departments.some(dept => 
            departmentFilters.includes(dept)
          );
        } else {
          matchesDepartment = departmentFilters.includes(request.department as string);
        }
      }
      
      const matchesType = 
        activeTab === "all" || 
        (activeTab === "requests" && request.type === "request") || 
        (activeTab === "projects" && request.type === "project");
      
      const isNotArchived = !request.archived;
      
      return matchesSearch && matchesStatus && matchesDepartment && matchesType && isNotArchived;
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    departmentFilters,
    toggleDepartmentFilter,
    activeTab,
    setActiveTab,
    clearFilters,
    filterRequests,
  };
};
