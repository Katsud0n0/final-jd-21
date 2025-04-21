
import { BarChart, LineChart, PieChart, Bar, Line, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { 
  collaborationData, 
  departmentInteractionData, 
  monthlyCollaborationData, 
  projectSuccessRateData 
} from '@/data/collaboration-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Home = () => {
  // Colors for charts
  const colors = [
    "#3b82f6", // Water Supply - blue
    "#f59e0b", // Electricity - amber
    "#ef4444", // Health - red
    "#4ade80", // Education - green
    "#9b87f5", // Sanitation - purple
    "#94a3b8", // Public Works - slate
    "#f97316", // Transportation - orange
    "#6366f1", // Urban Development - indigo
    "#10b981", // Environment - emerald
    "#0ea5e9", // Finance - sky
  ];

  // Common tooltip style with white text
  const tooltipStyle = {
    backgroundColor: '#1A1F2C', 
    borderColor: '#374151', 
    color: '#E5E7EB'
  };

  // Generate department interaction chart data
  const interactionChartData = Object.entries(departmentInteractionData).map(([dept, interactions]) => {
    return {
      name: dept,
      ...interactions
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold mb-2">Interdepartmental Cooperation Insights</h2>
        <p className="text-jd-mutedText text-lg">
          Analytics and statistics on collaboration between city departments
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-jd-card border-jd-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Projects</CardTitle>
            <CardDescription>Active collaborative projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{collaborationData.length}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-jd-card border-jd-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Avg. Collaboration</CardTitle>
            <CardDescription>Average collaboration score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(
                collaborationData.reduce((sum, item) => sum + item.collaborationLevel, 0) / collaborationData.length
              )}%
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-jd-card border-jd-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Avg. Completion</CardTitle>
            <CardDescription>Project completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(
                collaborationData.reduce((sum, item) => sum + item.completionRate, 0) / collaborationData.length
              )}%
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-jd-card border-jd-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Departments</CardTitle>
            <CardDescription>Active in collaboration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">10</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Collaboration Trend */}
        <Card className="bg-jd-card border-jd-card/60">
          <CardHeader>
            <CardTitle>Monthly Collaboration Trend</CardTitle>
            <CardDescription>
              Number of interdepartmental collaborations per month
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyCollaborationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: '#E5E7EB' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="collaborations"
                  stroke="#9b87f5"
                  strokeWidth={3}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Department Success Rates */}
        <Card className="bg-jd-card border-jd-card/60">
          <CardHeader>
            <CardTitle>Department Success Rates</CardTitle>
            <CardDescription>
              Project success rates by department
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectSuccessRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="department" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: '#E5E7EB' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Legend />
                <Bar dataKey="successRate" name="Success Rate (%)">
                  {projectSuccessRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Project Collaboration Metrics */}
        <Card className="bg-jd-card border-jd-card/60">
          <CardHeader>
            <CardTitle>Project Collaboration Metrics</CardTitle>
            <CardDescription>
              Collaboration level vs. completion rate for each project
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={collaborationData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis 
                  dataKey="project" 
                  type="category" 
                  stroke="#9CA3AF" 
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: '#E5E7EB' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Legend />
                <Bar dataKey="collaborationLevel" name="Collaboration Level (%)" fill="#9b87f5" />
                <Bar dataKey="completionRate" name="Completion Rate (%)" fill="#4ade80" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Department Interaction Analysis */}
        <Card className="bg-jd-card border-jd-card/60">
          <CardHeader>
            <CardTitle>Department Interaction Analysis</CardTitle>
            <CardDescription>
              How frequently departments interact with each other
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectSuccessRateData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="successRate"
                  nameKey="department"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {projectSuccessRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, `Success Rate`]}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: '#E5E7EB' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Key Insights */}
      <Card className="bg-jd-card border-jd-card/60">
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>
            Important findings from the interdepartmental cooperation data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-jd-purple">Health and Education Synergy</h4>
              <p className="text-jd-mutedText">
                The highest collaboration level (92%) is between Health and Education departments, 
                particularly in implementing the School Health Program which has achieved 88% completion rate.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-jd-purple">Infrastructure Challenges</h4>
              <p className="text-jd-mutedText">
                Transportation and Urban Development show collaboration levels of 78%, but completion rates 
                lag at 60%, indicating challenges in the Metro Rail Connectivity project implementation.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-jd-purple">Environmental Initiatives</h4>
              <p className="text-jd-mutedText">
                Electricity and Environment departments maintain a strong 90% collaboration level on 
                sustainable energy projects, with solar panel installations at 82% completion.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-jd-purple">Monthly Growth</h4>
              <p className="text-jd-mutedText">
                Interdepartmental collaborations have consistently increased by an average of 5% 
                month-over-month throughout the year, reaching peak activity in December.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
