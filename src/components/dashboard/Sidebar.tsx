
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Home,
  BarChart,
  FileText,
  Building2,
  UserCircle,
  Users,
  Settings as SettingsIcon
} from "lucide-react";

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      title: "Home",
      path: "/home",
      icon: Home,
    },
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: BarChart,
    },
    {
      title: "Departments",
      path: "/departments",
      icon: Building2,
    },
    {
      title: "Requests",
      path: "/requests",
      icon: FileText,
    },
    {
      title: "Profile",
      path: "/profile",
      icon: UserCircle,
    },
    {
      title: "Team",
      path: "/team",
      icon: Users,
    },
    {
      title: "Settings",
      path: "/settings",
      icon: SettingsIcon,
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-jd-bg border-r border-jd-card">
      <div className="flex items-center p-4 border-b border-jd-card">
        <Link to="/dashboard" className="flex items-center">
          <span className="text-xl font-bold text-white">JD</span>
          <span className="text-xl font-medium ml-2 text-jd-purple">Frameworks</span>
        </Link>
      </div>

      <div className="p-4 border-b border-jd-card">
        <div className="text-sm text-jd-mutedText">Welcome,</div>
        <div className="font-medium text-lg">{user?.fullName || "User"}</div>
        <div className="text-sm text-jd-mutedText">{user?.department}</div>
      </div>

      <nav className="p-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md mt-1 transition-colors",
              location.pathname === item.path
                ? "bg-jd-card text-jd-purple font-medium"
                : "text-jd-mutedText hover:bg-jd-card hover:text-jd-text"
            )}
          >
            <item.icon size={20} />
            <span>{item.title}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
