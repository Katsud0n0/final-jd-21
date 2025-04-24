
import { Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { departments } from "@/data/departments";

interface RequestsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  departmentFilters: string[];
  toggleDepartmentFilter: (department: string) => void;
  clearFilters: () => void;
}

const statusOptions = ["Pending", "In Process", "Completed", "Rejected"];

const RequestsFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  departmentFilters,
  toggleDepartmentFilter,
  clearFilters,
}: RequestsFiltersProps) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
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
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span>Status: {statusFilter}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {statusOptions.map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto flex justify-between items-center">
                <Filter size={18} className="mr-2" />
                <span>Departments Filter</span>
                {departmentFilters.length > 0 && (
                  <span className="ml-2 bg-jd-purple text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {departmentFilters.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Filter by Department</h4>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {departments.map(dept => (
                    <div key={dept.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`filter-${dept.id}`}
                        checked={departmentFilters.includes(dept.name)}
                        onCheckedChange={checked => {
                          if (checked) {
                            toggleDepartmentFilter(dept.name);
                          } else {
                            toggleDepartmentFilter(dept.name);
                          }
                        }}
                      />
                      <label
                        htmlFor={`filter-${dept.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {dept.name}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear All Filters
                  </Button>
                  <Button size="sm">Apply Filters</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {(departmentFilters.length > 0 || statusFilter !== "All" || searchTerm) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-jd-mutedText">Active Filters:</span>
          {statusFilter !== "All" && (
            <div className="bg-jd-bg px-2 py-1 rounded-full text-xs flex items-center gap-1">
              Status: {statusFilter}
              <button onClick={() => setStatusFilter("All")} className="hover:text-jd-purple">
                <X size={14} />
              </button>
            </div>
          )}
          {departmentFilters.map(dept => (
            <div key={dept} className="bg-jd-bg px-2 py-1 rounded-full text-xs flex items-center gap-1">
              {dept}
              <button onClick={() => toggleDepartmentFilter(dept)} className="hover:text-jd-purple">
                <X size={14} />
              </button>
            </div>
          ))}
          {searchTerm && (
            <div className="bg-jd-bg px-2 py-1 rounded-full text-xs flex items-center gap-1">
              Search: {searchTerm}
              <button onClick={() => setSearchTerm("")} className="hover:text-jd-purple">
                <X size={14} />
              </button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear All
          </Button>
        </div>
      )}
    </>
  );
};

export default RequestsFilters;
