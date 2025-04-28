import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { departments } from "@/data/departments";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import api from "@/api";

interface RequestFormProps {
  onSuccess?: () => void;
}

const RequestForm = ({ onSuccess }: RequestFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [formError, setFormError] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [multiDepartmentRequest, setMultiDepartmentRequest] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department: "",
    type: "request",
    relatedProject: "", // For linking to existing projects
    priority: "medium",
    usersNeeded: "2", // Minimum 2 users by default for projects
  });

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const requests = await api.getRequests();
        const projects = requests.filter((req: any) => req.type === "project" && !req.archived);
        setExistingProjects(projects);
      } catch (error) {
        console.error("Error loading projects:", error);
        const localRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
        const projects = localRequests.filter((req: any) => req.type === "project" && !req.archived);
        setExistingProjects(projects);
      }
    };
    
    loadProjects();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, department: value }));
    setFormError(""); // Clear any error when department is selected
  };

  const handleMultiDepartmentToggle = (checked: boolean) => {
    setMultiDepartmentRequest(checked);
    if (!checked) {
      setSelectedDepartments([]);
    }
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      type: value, 
      relatedProject: "",
      usersNeeded: value === "project" ? "2" : prev.usersNeeded
    }));
    
    if (value === "request") {
      setSelectedDepartments([]);
      setMultiDepartmentRequest(false);
    }
  };

  const handleDepartmentCheckboxChange = (deptName: string, checked: boolean) => {
    if (checked) {
      const maxDepts = formData.type === "project" ? 5 : 2;
      if (selectedDepartments.length < maxDepts) {
        setSelectedDepartments([...selectedDepartments, deptName]);
      } else {
        toast({
          title: `Maximum departments reached`,
          description: `You can select a maximum of ${maxDepts} departments for a ${formData.type}.`,
          variant: "destructive",
        });
      }
    } else {
      setSelectedDepartments(selectedDepartments.filter(d => d !== deptName));
    }
  };

  const handleProjectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, relatedProject: value }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, priority: value }));
  };
  
  const handleUsersNeededChange = (value: string) => {
    setFormData((prev) => ({ ...prev, usersNeeded: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.type === "request" && !multiDepartmentRequest && !formData.department) {
      setFormError("Please select a department");
      return;
    }
    
    if (formData.type === "request" && multiDepartmentRequest && selectedDepartments.length === 0) {
      setFormError("Please select at least 1 department for your request");
      return;
    }
    
    if (formData.type === "project" && selectedDepartments.length < 3) {
      setFormError("Please select at least 3 departments for your project");
      return;
    }
    
    setIsSubmitting(true);
    setFormError("");

    try {
      const now = new Date();
      
      let departmentList: string[] = [];
      
      if (formData.type === "project" || multiDepartmentRequest) {
        departmentList = [...selectedDepartments];
      } else {
        departmentList = [formData.department];
      }
      
      const initialStatus = (formData.type === "project" || multiDepartmentRequest) ? "Pending" : "Pending";
      
      const newItem = {
        id: `#${Math.floor(100000 + Math.random() * 900000)}`,
        title: formData.title,
        department: departmentList[0] || user?.department || "General",
        departments: departmentList,
        status: initialStatus,
        dateCreated: now.toLocaleDateString("en-GB"),
        creator: user?.username || "user",
        creatorDepartment: user?.department || "Unknown Department",
        description: formData.description,
        type: formData.type,
        createdAt: now.toISOString(),
        creatorRole: user?.role || "client",
        isExpired: false,
        acceptedBy: formData.type === "project" ? [user?.username || "user"] : [],
        usersAccepted: formData.type === "project" ? 1 : 0,
        participantsCompleted: [],
        multiDepartment: formData.type === "project" || multiDepartmentRequest,
        usersNeeded: formData.type === "project" 
          ? parseInt(formData.usersNeeded) + 1
          : multiDepartmentRequest 
            ? departmentList.length 
            : 1,
        ...(formData.type === "project" && {
          priority: formData.priority,
          archived: false,
        }),
        ...(formData.relatedProject && formData.relatedProject !== "none" && {
          relatedProject: formData.relatedProject,
        }),
      };

      await api.createRequest(newItem);

      setFormData({
        title: "",
        description: "",
        department: "",
        type: "request",
        relatedProject: "",
        priority: "medium",
        usersNeeded: "2",
      });
      setSelectedDepartments([]);
      setMultiDepartmentRequest(false);

      if (onSuccess) {
        onSuccess();
      }

      toast({
        title: `${formData.type === 'project' ? 'Project' : 'Request'} created`,
        description: `Your ${formData.type} has been successfully created with a pending status. ${
          formData.type === 'request' 
            ? 'Requests expire after 30 days if not approved. If rejected, please submit a new request to restart.'
            : 'Projects expire after 60 days if not approved.'
        }`,
      });
    } catch (error) {
      console.error("Error creating request:", error);
      toast({
        title: "Submission failed",
        description: "Could not submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollArea className="h-[600px] pr-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            value={formData.type}
            onValueChange={handleTypeChange}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="request">Request</SelectItem>
              <SelectItem value="project">Project</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.type === "request" && (
          <>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="multi-department" 
                  checked={multiDepartmentRequest}
                  onCheckedChange={handleMultiDepartmentToggle}
                />
                <label
                  htmlFor="multi-department"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Request that requires multiple departments (1-2)
                </label>
              </div>
            </div>

            {!multiDepartmentRequest ? (
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center">
                  Required Department <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select
                  value={formData.department}
                  onValueChange={handleDepartmentChange}
                  required={!multiDepartmentRequest}
                >
                  <SelectTrigger className={formError ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formError && <p className="text-xs text-red-500">{formError}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="flex items-center">
                  Required Departments <span className="text-red-500 ml-1">*</span>
                  <span className="text-xs text-jd-mutedText ml-2">
                    (Select 1-2 departments)
                  </span>
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2 p-2 max-h-48 overflow-y-auto border rounded-md">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dept-${dept.id}`}
                        checked={selectedDepartments.includes(dept.name)}
                        onCheckedChange={(checked) => 
                          handleDepartmentCheckboxChange(dept.name, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`dept-${dept.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {dept.name}
                      </label>
                    </div>
                  ))}
                </div>
                {formError && <p className="text-xs text-red-500">{formError}</p>}
                {selectedDepartments.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedDepartments.map((dept) => (
                      <div key={dept} className="bg-jd-purple/20 text-jd-purple text-xs px-2 py-1 rounded-full flex items-center">
                        {dept}
                        <button
                          type="button"
                          className="ml-1"
                          onClick={() => handleDepartmentCheckboxChange(dept, false)}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="relatedProject">Related Project (Optional)</Label>
              <Select
                value={formData.relatedProject}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select related project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {existingProjects.length > 0 ? (
                    existingProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-projects" disabled>
                      No projects exist at this moment
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {formData.type === "project" && (
          <div className="space-y-2">
            <Label className="flex items-center">
              Required Departments <span className="text-red-500 ml-1">*</span>
              <span className="text-xs text-jd-mutedText ml-2">
                (Select 3-5 departments)
              </span>
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-2 p-2 max-h-48 overflow-y-auto border rounded-md">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dept-${dept.id}`}
                    checked={selectedDepartments.includes(dept.name)}
                    onCheckedChange={(checked) => 
                      handleDepartmentCheckboxChange(dept.name, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`dept-${dept.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {dept.name}
                  </label>
                </div>
              ))}
            </div>
            {formError && <p className="text-xs text-red-500">{formError}</p>}
            {selectedDepartments.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedDepartments.map((dept) => (
                  <div key={dept} className="bg-jd-purple/20 text-jd-purple text-xs px-2 py-1 rounded-full flex items-center">
                    {dept}
                    <button
                      type="button"
                      className="ml-1"
                      onClick={() => handleDepartmentCheckboxChange(dept, false)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">
            {formData.type === 'project' ? 'Project Title' : 'Request Title'}
          </Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={`Enter a brief title for your ${formData.type}`}
            required
          />
        </div>

        {formData.type === 'project' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={handlePriorityChange}
                required={formData.type === 'project'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="usersNeeded">Number of Users Needed</Label>
              <Select
                value={formData.usersNeeded}
                onValueChange={handleUsersNeededChange}
                required={formData.type === 'project'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select number of users needed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 users</SelectItem>
                  <SelectItem value="3">3 users</SelectItem>
                  <SelectItem value="4">4 users</SelectItem>
                  <SelectItem value="5">5 users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={`Provide details about your ${formData.type}`}
            rows={4}
            required
          />
        </div>

        <div className="text-xs text-jd-mutedText mt-2">
          {formData.type === 'request' 
            ? (multiDepartmentRequest 
               ? 'Note: Multi-department requests expire after 45 days if status remains pending. If rejected or expired, please submit a new request to restart.'
               : 'Note: Requests expire after 30 days if status remains pending. If rejected or expired, please submit a new request to restart.')
            : 'Note: Projects are archived after 60 days and deleted after 7 more days if status remains pending. If rejected or expired, please submit a new request to restart or contact the admin for further queries.'
          }
        </div>

        <Button type="submit" className="w-full bg-jd-purple hover:bg-jd-darkPurple" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : `Submit ${formData.type === 'project' ? 'Project' : 'Request'}`}
        </Button>
      </form>
    </ScrollArea>
  );
};

export default RequestForm;
