
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

interface RequestFormProps {
  onSuccess?: () => void;
}

const RequestForm = ({ onSuccess }: RequestFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingProjects, setExistingProjects] = useState<any[]>([]);
  const [formError, setFormError] = useState("");
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
    // Load existing projects from localStorage
    const requests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
    const projects = requests.filter((req: any) => req.type === "project" && !req.archived);
    setExistingProjects(projects);
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

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      type: value, 
      relatedProject: "",
      // Reset usersNeeded to 2 if changing to project type
      usersNeeded: value === "project" ? "2" : prev.usersNeeded
    }));
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
    
    // Validate department selection
    if (!formData.department) {
      setFormError("Please select a department");
      return;
    }
    
    setIsSubmitting(true);
    setFormError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get existing requests
      const existingRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      
      const now = new Date();
      
      // Create new request/project
      const newItem = {
        id: `#${Math.floor(100000 + Math.random() * 900000)}`,
        title: formData.title,
        department: formData.department,
        status: "Pending", // Always start with Pending status
        dateCreated: now.toLocaleDateString("en-GB"),
        creator: user?.username || "user",
        description: formData.description,
        type: formData.type,
        createdAt: now.toISOString(), // Add creation timestamp for expiration calculation
        creatorRole: user?.role || "client", // Save the role for permission checking
        isExpired: false, // Not expired by default
        acceptedBy: [], // Track which users have accepted the project
        usersAccepted: 0, // Counter for accepted users
        ...(formData.type === "project" && {
          priority: formData.priority,
          archived: false,
          usersNeeded: parseInt(formData.usersNeeded), // Store as number
        }),
        ...(formData.type === "request" && formData.relatedProject && {
          relatedProject: formData.relatedProject !== "none" ? formData.relatedProject : null,
        }),
      };
      
      // Add the new item to the array
      const updatedRequests = [newItem, ...existingRequests];
      
      // Save back to localStorage
      localStorage.setItem("jd-requests", JSON.stringify(updatedRequests));

      // Reset form
      setFormData({
        title: "",
        description: "",
        department: "",
        type: "request",
        relatedProject: "",
        priority: "medium",
        usersNeeded: "2", // Reset to default 2 users
      });

      // Call the success callback
      if (onSuccess) {
        onSuccess();
      }

      toast({
        title: `${formData.type === 'project' ? 'Project' : 'Request'} created`,
        description: `Your ${formData.type} has been successfully created with a pending status. ${
          formData.type === 'request' 
            ? 'Requests expire after 30 days if not approved.' 
            : 'Projects expire after 60 days if not approved.'
        }`,
      });
    } catch (error) {
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

      <div className="space-y-2">
        <Label htmlFor="department" className="flex items-center">
          Department <span className="text-red-500 ml-1">*</span>
        </Label>
        <Select
          value={formData.department}
          onValueChange={handleDepartmentChange}
          required
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
                {/* Starting from 2 users now as minimum */}
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
          ? 'Note: Requests expire after 30 days if status remains pending.'
          : 'Note: Projects are archived after 60 days and deleted after 7 more days if status remains pending.'
        }
      </div>

      <Button type="submit" className="w-full bg-jd-purple hover:bg-jd-darkPurple" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : `Submit ${formData.type === 'project' ? 'Project' : 'Request'}`}
      </Button>
    </form>
  );
};

export default RequestForm;
