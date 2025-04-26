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
  privacySettings?: {
    showEmail: boolean;
    showPhone: boolean;
    allowDirectMessages: boolean;
    showOnlineStatus: boolean;
  };
  notificationSettings?: {
    emailNotifications: boolean;
    requestUpdates: boolean;
    departmentAnnouncements: boolean;
    mentionAlerts: boolean;
  };
};

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, fullName: string, department: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUserStatus: (username: string, status: "active" | "blocked" | "banned") => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("jd-user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      
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
    const updatedUsers = allUsers.map(u => 
      u.username === username ? { ...u, status } : u
    );
    
    saveAllUsers(updatedUsers);
    
    if (user?.username === username) {
      const updatedUser = { ...user, status };
      localStorage.setItem("jd-user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
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

  const updateUser = (updatedUser: User) => {
    localStorage.setItem("jd-user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    const updatedUsers = allUsers.map(u => 
      u.id === updatedUser.id ? updatedUser : u
    );
    
    saveAllUsers(updatedUsers);
  };

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const storedUsers = JSON.parse(localStorage.getItem("jd-users") || "[]");
      const existingUser = storedUsers.find((u: User) => u.username.toLowerCase() === username.toLowerCase());
      
      if (existingUser) {
        if (existingUser.status === "banned") {
          throw new Error("Your account has been banned. Please contact support.");
        }
        
        localStorage.setItem("jd-user", JSON.stringify(existingUser));
        setUser(existingUser);
        
        toast({
          title: "Login successful",
          description: `Welcome back, ${existingUser.fullName}! You are logged in as ${existingUser.role}${existingUser.role === 'admin' ? ' for ' + existingUser.department : ''}.`,
        });
        
        navigate("/dashboard");
        return;
      }
      
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
      
      const newAllUsers = [...allUsers, userData];
      saveAllUsers(newAllUsers);
      
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

  const register = async (
    username: string,
    fullName: string,
    department: string,
    password: string
  ) => {
    try {
      setIsLoading(true);
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
      
      const userData: User = {
        id: `user-${Date.now()}`,
        username: username.toLowerCase(),
        fullName,
        department,
        email: email,
        role: isAdmin ? "admin" : "client",
        status: "active"
      };
      
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
        updateUser,
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
