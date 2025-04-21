
// ***** SQLite Integration Guide *****
//
// This file currently contains mock data for the dashboard. To implement a SQLite backend:
//
// 1. Setup SQLite Database:
//    - Install SQLite and required packages: `npm install sqlite3 express cors`
//    - Create a backend folder with Express server setup
//
// 2. Create Database Schema:
// ```sql
// -- Example schema.sql file
// CREATE TABLE IF NOT EXISTS departments (
//   id INTEGER PRIMARY KEY,
//   name TEXT NOT NULL
// );
//
// CREATE TABLE IF NOT EXISTS projects (
//   id INTEGER PRIMARY KEY,
//   name TEXT NOT NULL,
//   collaboration_level INTEGER NOT NULL,
//   completion_rate INTEGER NOT NULL
// );
//
// CREATE TABLE IF NOT EXISTS project_departments (
//   project_id INTEGER,
//   department_id INTEGER,
//   PRIMARY KEY (project_id, department_id),
//   FOREIGN KEY (project_id) REFERENCES projects(id),
//   FOREIGN KEY (department_id) REFERENCES departments(id)
// );
//
// CREATE TABLE IF NOT EXISTS department_interactions (
//   department1_id INTEGER,
//   department2_id INTEGER,
//   interaction_level INTEGER NOT NULL,
//   PRIMARY KEY (department1_id, department2_id),
//   FOREIGN KEY (department1_id) REFERENCES departments(id),
//   FOREIGN KEY (department2_id) REFERENCES departments(id)
// );
//
// CREATE TABLE IF NOT EXISTS monthly_collaborations (
//   id INTEGER PRIMARY KEY,
//   month TEXT NOT NULL,
//   collaborations INTEGER NOT NULL
// );
//
// CREATE TABLE IF NOT EXISTS project_success_rates (
//   department_id INTEGER PRIMARY KEY,
//   success_rate INTEGER NOT NULL,
//   FOREIGN KEY (department_id) REFERENCES departments(id)
// );
// ```
//
// 3. Create API Endpoints:
// ```javascript
// // Example backend/server.js
// const express = require('express');
// const sqlite3 = require('sqlite3').verbose();
// const cors = require('cors');
// 
// const app = express();
// app.use(cors());
// app.use(express.json());
// 
// // Connect to SQLite database
// const db = new sqlite3.Database('./database.sqlite', (err) => {
//   if (err) console.error('Database connection error:', err);
//   else console.log('Connected to SQLite database');
// });
// 
// // Get collaboration data
// app.get('/api/collaboration-data', (req, res) => {
//   const query = `
//     SELECT p.id, p.name as project, p.collaboration_level, p.completion_rate, 
//            GROUP_CONCAT(d.name) as departments
//     FROM projects p
//     JOIN project_departments pd ON p.id = pd.project_id
//     JOIN departments d ON pd.department_id = d.id
//     GROUP BY p.id
//   `;
//   
//   db.all(query, [], (err, rows) => {
//     if (err) {
//       res.status(500).json({ error: err.message });
//       return;
//     }
//     
//     // Format the data to match frontend expectations
//     const formattedData = rows.map(row => ({
//       id: row.id,
//       departments: row.departments.split(','),
//       project: row.project,
//       collaborationLevel: row.collaboration_level,
//       completionRate: row.completion_rate
//     }));
//     
//     res.json(formattedData);
//   });
// });
// 
// // Add similar endpoints for other data
// // ...
// 
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// ```
//
// 4. Update Frontend to Fetch Data:
// ```typescript
// // Example from your React component
// import { useState, useEffect } from 'react';
// 
// const HomeTab = () => {
//   const [collaborationData, setCollaborationData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await fetch('http://localhost:5000/api/collaboration-data');
//         const data = await response.json();
//         setCollaborationData(data);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     
//     fetchData();
//   }, []);
//   
//   // Rest of your component...
// };
// ```
//
// 5. Data Import Script:
// - Create a script to import initial data from Excel to SQLite
// - See scripts/import_excel_data.py for an example

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
