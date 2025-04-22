
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

type User = {
  id: string;
  username: string;
  fullName: string;
  department: string;
  email: string;
  phone?: string;
  role: "admin" | "client";
};

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, fullName: string, department: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("jd-user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Check for predefined admin accounts
      const email = username.includes('@') ? username : `${username.toLowerCase()}@jdframeworks.com`;
      const isAdmin = email.endsWith('@water.com') || 
                     email.endsWith('@electricity.com') || 
                     email.endsWith('@health.com') || 
                     email.endsWith('@education.com') || 
                     email.endsWith('@sanitation.com') || 
                     email.endsWith('@publicworks.com') || 
                     email.endsWith('@transport.com') || 
                     email.endsWith('@urban.com') || 
                     email.endsWith('@environment.com') || 
                     email.endsWith('@finance.com');
      
      // Determine department from email
      let department = "General";
      if (email.includes('@water.')) department = "Water Supply";
      else if (email.includes('@electricity.')) department = "Electricity";
      else if (email.includes('@health.')) department = "Health";
      else if (email.includes('@education.')) department = "Education";
      else if (email.includes('@sanitation.')) department = "Sanitation";
      else if (email.includes('@publicworks.')) department = "Public Works";
      else if (email.includes('@transport.')) department = "Transportation";
      else if (email.includes('@urban.')) department = "Urban Development";
      else if (email.includes('@environment.')) department = "Environment";
      else if (email.includes('@finance.')) department = "Finance";
      
      // Mock user data (in a real app, this would come from your API or SQLite database)
      const userData: User = {
        id: "user-123",
        username: username.toLowerCase(),
        fullName: username.split('@')[0].charAt(0).toUpperCase() + username.split('@')[0].slice(1),
        department: department,
        email: email,
        phone: "+91 9876543210",
        role: isAdmin ? "admin" : "client"
      };
      
      // Save to localStorage (in a real app with SQLite, you'd instead verify against the database)
      localStorage.setItem("jd-user", JSON.stringify(userData));
      setUser(userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.fullName}! You are logged in as ${userData.role}${isAdmin ? ' for ' + department : ''}.`,
      });
      
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, fullName: string, department: string, password: string) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const email = username.includes('@') ? username : `${username.toLowerCase()}@jdframeworks.com`;
      const isAdmin = email.endsWith('@water.com') || 
                     email.endsWith('@electricity.com') || 
                     email.endsWith('@health.com') || 
                     email.endsWith('@education.com') || 
                     email.endsWith('@sanitation.com') || 
                     email.endsWith('@publicworks.com') || 
                     email.endsWith('@transport.com') || 
                     email.endsWith('@urban.com') || 
                     email.endsWith('@environment.com') || 
                     email.endsWith('@finance.com');
      
      // In a real app, this would store data in SQLite
      const userData: User = {
        id: `user-${Date.now()}`,
        username: username.toLowerCase(),
        fullName,
        department,
        email: email,
        role: isAdmin ? "admin" : "client"
      };
      
      localStorage.setItem("jd-user", JSON.stringify(userData));
      setUser(userData);
      
      toast({
        title: "Registration successful",
        description: "Welcome to JD Frameworks!",
      });
      
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Could not create your account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("jd-user");
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
