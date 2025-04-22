
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
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
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department: "",
    type: "request", // New field: can be 'request' or 'project'
    startDate: "",
    endDate: "",
    priority: "medium",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, department: value }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value }));
  };

  const handlePriorityChange = (value: string) => {
    setFormData((prev) => ({ ...prev, priority: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get existing requests
      const existingRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
      
      // Create new request/project
      const newItem = {
        id: `#${Math.floor(100000 + Math.random() * 900000)}`,
        title: formData.title,
        department: formData.department,
        status: "Pending",
        dateCreated: new Date().toLocaleDateString("en-GB"),
        creator: user?.username || "user",
        description: formData.description,
        type: formData.type,
        ...(formData.type === "project" && {
          startDate: formData.startDate,
          endDate: formData.endDate,
          priority: formData.priority,
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
        startDate: "",
        endDate: "",
        priority: "medium",
      });

      // Call the success callback
      if (onSuccess) {
        onSuccess();
      }

      toast({
        title: `${formData.type === 'project' ? 'Project' : 'Request'} created`,
        description: `Your ${formData.type} has been successfully created.`,
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
        <Label htmlFor="department">Department</Label>
        <Select
          value={formData.department}
          onValueChange={handleDepartmentChange}
          required
        >
          <SelectTrigger>
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
      </div>

      {formData.type === 'project' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required={formData.type === 'project'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                required={formData.type === 'project'}
              />
            </div>
          </div>

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

      <Button type="submit" className="w-full bg-jd-purple hover:bg-jd-darkPurple" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : `Submit ${formData.type === 'project' ? 'Project' : 'Request'}`}
      </Button>
    </form>
  );
};

export default RequestForm;
