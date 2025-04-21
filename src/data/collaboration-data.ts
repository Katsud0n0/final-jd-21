
// This data is currently hard-coded in the frontend
// To use with SQLite backend, you would need to:
// 1. Create appropriate tables in SQLite
// 2. Set up API endpoints to fetch this data
// 3. Replace the static data with API calls

export const collaborationData = [
  {
    id: 1,
    departments: ["Water Supply", "Public Works"],
    project: "Pipeline Infrastructure Expansion",
    collaborationLevel: 85,
    completionRate: 72
  },
  {
    id: 2,
    departments: ["Health", "Education"],
    project: "School Health Program",
    collaborationLevel: 92,
    completionRate: 88
  },
  {
    id: 3,
    departments: ["Transportation", "Urban Development"],
    project: "Metro Rail Connectivity",
    collaborationLevel: 78,
    completionRate: 60
  },
  {
    id: 4,
    departments: ["Electricity", "Environment"],
    project: "Solar Panel Installation",
    collaborationLevel: 90,
    completionRate: 82
  },
  {
    id: 5,
    departments: ["Sanitation", "Health"],
    project: "Public Hygiene Initiative",
    collaborationLevel: 86,
    completionRate: 74
  },
  {
    id: 6,
    departments: ["Finance", "Public Works"],
    project: "Budget Allocation for Infrastructure",
    collaborationLevel: 76,
    completionRate: 80
  },
  {
    id: 7,
    departments: ["Water Supply", "Sanitation"],
    project: "Sewage Treatment Plant Upgrade",
    collaborationLevel: 89,
    completionRate: 65
  },
  {
    id: 8,
    departments: ["Education", "Finance"],
    project: "School Funding Program",
    collaborationLevel: 82,
    completionRate: 78
  }
];

export const departmentInteractionData = {
  "Water Supply": {
    "Public Works": 85,
    "Sanitation": 80,
    "Environment": 75,
    "Health": 60,
    "Finance": 40,
    "Education": 20,
    "Electricity": 50,
    "Transportation": 30,
    "Urban Development": 65
  },
  "Electricity": {
    "Public Works": 70,
    "Environment": 85,
    "Finance": 60,
    "Urban Development": 75,
    "Water Supply": 50,
    "Transportation": 45,
    "Health": 30,
    "Education": 25,
    "Sanitation": 20
  },
  "Health": {
    "Education": 85,
    "Sanitation": 80,
    "Water Supply": 60,
    "Environment": 70,
    "Finance": 55,
    "Public Works": 40,
    "Transportation": 30,
    "Electricity": 30,
    "Urban Development": 35
  }
};

export const monthlyCollaborationData = [
  { month: 'Jan', collaborations: 24 },
  { month: 'Feb', collaborations: 30 },
  { month: 'Mar', collaborations: 28 },
  { month: 'Apr', collaborations: 35 },
  { month: 'May', collaborations: 40 },
  { month: 'Jun', collaborations: 48 },
  { month: 'Jul', collaborations: 52 },
  { month: 'Aug', collaborations: 58 },
  { month: 'Sep', collaborations: 62 },
  { month: 'Oct', collaborations: 68 },
  { month: 'Nov', collaborations: 72 },
  { month: 'Dec', collaborations: 78 }
];

export const projectSuccessRateData = [
  { department: 'Water Supply', successRate: 78 },
  { department: 'Electricity', successRate: 82 },
  { department: 'Health', successRate: 90 },
  { department: 'Education', successRate: 85 },
  { department: 'Sanitation', successRate: 72 },
  { department: 'Public Works', successRate: 68 },
  { department: 'Transportation', successRate: 76 },
  { department: 'Urban Dev', successRate: 80 },
  { department: 'Environment', successRate: 88 },
  { department: 'Finance', successRate: 86 }
];
