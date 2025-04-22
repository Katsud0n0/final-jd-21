
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

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
      
      <div className="mt-8 pt-6 border-t border-jd-bg">
        <Button 
          variant="outline" 
          onClick={() => setShowDemoCredentials(!showDemoCredentials)}
          className="w-full flex items-center justify-center"
        >
          {showDemoCredentials ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide Demo Credentials
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Show Demo Credentials
            </>
          )}
        </Button>
        
        {showDemoCredentials && (
          <div className="mt-4 p-4 bg-jd-bg rounded-lg">
            <h3 className="font-medium mb-2">Admin Logins:</h3>
            <ul className="space-y-1 text-sm text-jd-mutedText">
              <li>Water Supply: admin@water.com</li>
              <li>Electricity: admin@electricity.com</li>
              <li>Health: admin@health.com</li>
              <li>Education: admin@education.com</li>
              <li>Sanitation: admin@sanitation.com</li>
              <li>Public Works: admin@publicworks.com</li>
              <li>Transportation: admin@transport.com</li>
              <li>Urban Development: admin@urban.com</li>
              <li>Environment: admin@environment.com</li>
              <li>Finance: admin@finance.com</li>
            </ul>
            
            <h3 className="font-medium mt-4 mb-2">Client Login:</h3>
            <p className="text-sm text-jd-mutedText">
              Username: client@jdframeworks.com
            </p>
            
            <p className="mt-4 text-xs text-jd-mutedText">Password for all accounts: password123</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
