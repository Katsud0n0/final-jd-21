
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import RequestForm from "./RequestForm";

type HeaderProps = {
  title?: string;
};

const Header = ({ title }: HeaderProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRequestSuccess = () => {
    setIsDialogOpen(false);
    // Reload the current page to show the new request
    window.location.reload();
  };

  // Determine the current page title based on the pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("departments")) return "Departments";
    if (path.includes("requests")) return "Requests";
    if (path.includes("profile")) return "Your Profile";
    if (path.includes("team")) return "Team";
    if (path.includes("settings")) return "Settings";
    if (path.includes("home")) return "Home";
    return "JD Frameworks";
  };

  return (
    <header className="h-16 border-b border-jd-card flex items-center justify-between px-6">
      <h1 className="text-xl font-medium">{title || getPageTitle()}</h1>
      
      <div className="flex items-center gap-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-jd-purple hover:bg-jd-darkPurple">
              <Plus className="mr-2 h-4 w-4" /> New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-jd-card border-jd-card">
            <DialogHeader>
              <DialogTitle>Create New Request</DialogTitle>
              <DialogDescription>
                Submit a new interdepartmental request here.
              </DialogDescription>
            </DialogHeader>
            <RequestForm onSuccess={handleRequestSuccess} />
          </DialogContent>
        </Dialog>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-transparent border-none hover:bg-jd-card flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-jd-purple flex items-center justify-center text-white">
                {user?.fullName?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="hidden md:inline-block">{user?.fullName || "User"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-jd-card border-jd-card">
            <DropdownMenuLabel className="font-normal">
              <div className="font-medium">{user?.fullName}</div>
              <div className="text-xs text-jd-mutedText">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link to="/profile">
              <DropdownMenuItem className="hover:bg-jd-card/60 cursor-pointer">
                Profile
              </DropdownMenuItem>
            </Link>
            <Link to="/settings">
              <DropdownMenuItem className="hover:bg-jd-card/60 cursor-pointer">
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:bg-jd-card/60 cursor-pointer text-jd-red" onClick={logout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
