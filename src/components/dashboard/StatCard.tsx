
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: ReactNode;
  color: string;
}

const StatCard = ({ title, value, description, icon, color }: StatCardProps) => {
  return (
    <div className={cn("border-l-4 border-", color, "bg-jd-card rounded-md p-4 flex flex-col")}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-jd-mutedText mb-2">{description}</div>
      <div className="text-lg font-medium flex items-center gap-2">
        {icon}
        {title}
      </div>
    </div>
  );
};

export default StatCard;
