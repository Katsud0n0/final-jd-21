
import { teamMembers } from "@/data/team";
import TeamMemberCard from "@/components/dashboard/TeamMemberCard";

const Team = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-medium">Team</h2>
      <p className="text-jd-mutedText">
        Connect with team members across different departments
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <TeamMemberCard
            key={member.id}
            id={member.id}
            name={member.name}
            username={member.username}
            department={member.department}
            role={member.role}
            email={member.email}
            phone={member.phone}
          />
        ))}
      </div>
    </div>
  );
};

export default Team;
