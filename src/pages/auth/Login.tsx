
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DemoCredentials from "./DemoCredentials";

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.username, formData.password);
    } catch (error) {
      console.error("Login error:", error);
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
      
      <h2 className="text-2xl font-semibold mb-2">Login</h2>
      <p className="text-jd-mutedText mb-6">Enter your credentials to access your account</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            required
            className="bg-jd-bg border-jd-card/60"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="text-sm text-jd-purple hover:text-jd-darkPurple"
            >
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
            className="bg-jd-bg border-jd-card/60"
          />
        </div>
        
        <Button
          type="submit"
          className="w-full bg-jd-purple hover:bg-jd-darkPurple"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-jd-mutedText">
          Don't have an account?{" "}
          <Link to="/register" className="text-jd-purple hover:text-jd-darkPurple">
            Register
          </Link>
        </p>
      </div>
      
      <DemoCredentials />
    </div>
  );
};

export default Login;
