
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
  status?: "active" | "blocked" | "banned";
};

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, fullName: string, department: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUserStatus: (username: string, status: "active" | "blocked" | "banned") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load all registered users
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("jd-user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      
      // Check if user is banned or blocked
      if (parsedUser.status === "banned") {
        toast({
          title: "Account banned",
          description: "Your account has been banned. Please contact support.",
          variant: "destructive",
        });
        localStorage.removeItem("jd-user");
      } else {
        setUser(parsedUser);
      }
    }
    
    // Load all users
    const storedUsers = localStorage.getItem("jd-users");
    if (storedUsers) {
      setAllUsers(JSON.parse(storedUsers));
    }
    
    setIsLoading(false);
  }, []);

  const saveAllUsers = (users: User[]) => {
    localStorage.setItem("jd-users", JSON.stringify(users));
    setAllUsers(users);
  };

  const updateUserStatus = (username: string, status: "active" | "blocked" | "banned") => {
    // Update in all users
    const updatedUsers = allUsers.map(u => 
      u.username === username ? { ...u, status } : u
    );
    
    saveAllUsers(updatedUsers);
    
    // If this is the current user, update their status too
    if (user?.username === username) {
      const updatedUser = { ...user, status };
      localStorage.setItem("jd-user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // If banned, log them out
      if (status === "banned") {
        logout();
        toast({
          title: "Account banned",
          description: "Your account has been banned. Please contact support.",
          variant: "destructive",
        });
      } else if (status === "blocked") {
        toast({
          title: "Account restricted",
          description: "Your account has been restricted. You can view your history but cannot create new requests.",
          variant: "destructive",
        });
      }
    }
    
    toast({
      title: "User status updated",
      description: `User ${username} has been ${status}.`,
    });
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Check if user exists in the stored users
      const storedUsers = JSON.parse(localStorage.getItem("jd-users") || "[]");
      const existingUser = storedUsers.find((u: User) => u.username.toLowerCase() === username.toLowerCase());
      
      if (existingUser) {
        // Check if user is banned
        if (existingUser.status === "banned") {
          throw new Error("Your account has been banned. Please contact support.");
        }
        
        // Use the existing user data
        localStorage.setItem("jd-user", JSON.stringify(existingUser));
        setUser(existingUser);
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${existingUser.fullName}! You are logged in as ${existingUser.role}${existingUser.role === 'admin' ? ' for ' + existingUser.department : ''}.`,
        });
        
        navigate("/dashboard");
        return;
      }
      
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
        id: "user-" + Date.now(),
        username: username.toLowerCase(),
        fullName: username.split('@')[0].charAt(0).toUpperCase() + username.split('@')[0].slice(1),
        department: department,
        email: email,
        phone: isAdmin ? "+91 9876543210" : undefined,
        role: isAdmin ? "admin" : "client",
        status: "active"
      };
      
      // Add to all users
      const newAllUsers = [...allUsers, userData];
      saveAllUsers(newAllUsers);
      
      // Save to localStorage
      localStorage.setItem("jd-user", JSON.stringify(userData));
      setUser(userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.fullName}! You are logged in as ${userData.role}${isAdmin ? ' for ' + department : ''}.`,
      });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
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
        role: isAdmin ? "admin" : "client",
        status: "active"
      };
      
      // Add to all users
      const newAllUsers = [...allUsers, userData];
      saveAllUsers(newAllUsers);
      
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
        updateUserStatus,
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
