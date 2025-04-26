import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import { departments } from "@/data/departments";
import { toast } from "react-toastify";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    department: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === "password" || name === "confirmPassword") {
      setPasswordError("");
    }
  };

  const handleDepartmentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, department: value }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.department) {
      toast({
        title: "Department required",
        description: "Please select your department before registering.",
        variant: "destructive"
      });
      return;
    }
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await register(
        formData.username,
        formData.fullName,
        formData.department,
        formData.password
      );
      navigate("/home");
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-jd-card rounded-lg shadow-lg">
      <div className="flex justify-center mb-8">
        <h1 className="text-3xl font-bold">
          <span>JD </span>
          <span className="text-jd-purple">Frameworks</span>
        </h1>
      </div>
      
      <h2 className="text-2xl font-semibold mb-2">Register</h2>
      <p className="text-jd-mutedText mb-6">Fill in your details to create an account</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={handleChange}
            required
            className="bg-jd-bg border-jd-card/60"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="bg-jd-bg border-jd-card/60"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select
            value={formData.department}
            onValueChange={handleDepartmentChange}
            required
          >
            <SelectTrigger className="bg-jd-bg border-jd-card/60">
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
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            required
            className="bg-jd-bg border-jd-card/60"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="bg-jd-bg border-jd-card/60"
          />
          {passwordError && (
            <p className="text-sm text-red-500">{passwordError}</p>
          )}
        </div>
        
        <Button
          type="submit"
          className="w-full bg-jd-purple hover:bg-jd-darkPurple"
          disabled={isLoading}
        >
          {isLoading ? "Registering..." : "Register"}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-jd-mutedText">
          Already have an account?{" "}
          <Link to="/login" className="text-jd-purple hover:text-jd-darkPurple">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
