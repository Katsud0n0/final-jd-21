
import { Users, TrendingUp, Activity, Calendar } from "lucide-react";

// This interface can be updated when connecting to your backend
interface RecentActivity {
  id: number;
  type: string;
  title: string;
  time: string;
  icon: JSX.Element;
}

const RecentActivities = () => {
  // This mock data can be replaced with API calls when you connect your backend
  const recentActivities: RecentActivity[] = [
    {
      id: 1,
      type: "meeting",
      title: "Department Heads Meeting",
      time: "2 hours ago",
      icon: <Users className="text-jd-purple" size={20} />
    },
    {
      id: 2,
      type: "project",
      title: "New Project Initiated",
      time: "4 hours ago",
      icon: <TrendingUp className="text-green-500" size={20} />
    },
    {
      id: 3,
      type: "update",
      title: "Monthly Reports Updated",
      time: "6 hours ago",
      icon: <Activity className="text-blue-500" size={20} />
    },
    {
      id: 4,
      type: "deadline",
      title: "Project Deadline Updated",
      time: "12 hours ago",
      icon: <Calendar className="text-orange-500" size={20} />
    }
  ];

  return (
    <div className="bg-jd-card rounded-lg p-6">
      <h3 className="text-xl font-medium mb-6">Recent Activities</h3>
      <div className="space-y-4">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-jd-bg transition-colors">
            <div className="h-10 w-10 rounded-full bg-jd-bg flex items-center justify-center">
              {activity.icon}
            </div>
            <div className="flex-1">
              <p className="font-medium">{activity.title}</p>
              <p className="text-sm text-jd-mutedText">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivities;
