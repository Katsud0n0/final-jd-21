
# JD Frameworks - Backend Implementation Guide

This guide provides the complete setup and implementation code for connecting your JD Frameworks frontend to a SQLite backend.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Express Server Setup](#express-server-setup)
- [API Endpoints Implementation](#api-endpoints-implementation)
- [Frontend Integration](#frontend-integration)
- [Running the Application](#running-the-application)

## Prerequisites

Install the required dependencies:

```bash
npm install sqlite3 express cors body-parser
```

## Database Setup

Create a file named `setup-database.js`:

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// Connect to database
const db = new sqlite3.Database(path.join(dbDir, 'jd_frameworks.db'));

// Create tables
db.serialize(() => {
  // Departments table
  db.run(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      color TEXT
    )
  `);

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      fullName TEXT NOT NULL,
      department TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      privacySettings TEXT,
      notificationSettings TEXT,
      FOREIGN KEY(department) REFERENCES departments(name)
    )
  `);

  // Requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      department TEXT NOT NULL,
      departments TEXT, -- JSON array of departments for multi-department projects
      creator TEXT NOT NULL,
      creatorDepartment TEXT, -- Store the creator's department
      creatorRole TEXT,
      status TEXT NOT NULL,
      type TEXT NOT NULL,
      dateCreated TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      priority TEXT,
      archived INTEGER DEFAULT 0,
      archivedAt TEXT,
      isExpired INTEGER DEFAULT 0,
      lastStatusUpdate TEXT,
      lastStatusUpdateTime TEXT,
      usersNeeded INTEGER DEFAULT 0,
      usersAccepted INTEGER DEFAULT 0,
      relatedProject TEXT,
      FOREIGN KEY(department) REFERENCES departments(name),
      FOREIGN KEY(creator) REFERENCES users(username)
    )
  `);

  // RequestParticipants table (for tracking acceptances and completions)
  db.run(`
    CREATE TABLE IF NOT EXISTS request_participants (
      requestId TEXT NOT NULL,
      username TEXT NOT NULL,
      hasAccepted INTEGER DEFAULT 0,
      hasCompleted INTEGER DEFAULT 0,
      acceptedAt TEXT,
      completedAt TEXT,
      PRIMARY KEY (requestId, username),
      FOREIGN KEY(requestId) REFERENCES requests(id),
      FOREIGN KEY(username) REFERENCES users(username)
    )
  `);

  console.log('Database tables created successfully');

  // Insert default departments if they don't exist
  const departments = [
    { id: "water", name: "Water Supply", description: "Responsible for clean water distribution, maintenance of water infrastructure, and quality testing.", icon: "Droplet", color: "blue" },
    { id: "electricity", name: "Electricity", description: "Manages power distribution, electrical infrastructure, and handles power-related complaints.", icon: "Zap", color: "yellow" },
    { id: "health", name: "Health", description: "Oversees public health initiatives, medical facilities, and healthcare programs across the city.", icon: "Stethoscope", color: "red" },
    { id: "education", name: "Education", description: "Responsible for schools, educational programs, teacher training, and academic infrastructure.", icon: "GraduationCap", color: "green" },
    { id: "sanitation", name: "Sanitation", description: "Handles waste management, sewage systems, and maintains cleanliness throughout the city.", icon: "Trash2", color: "purple" },
    { id: "public-works", name: "Public Works", description: "Oversees construction and maintenance of roads, bridges, buildings and other public infrastructure.", icon: "Building", color: "gray" },
    { id: "transportation", name: "Transportation", description: "Manages public transit systems, traffic management, and transportation infrastructure.", icon: "Bus", color: "orange" },
    { id: "urban-development", name: "Urban Development", description: "Plans and implements city development projects, zoning regulations, and urban renewal.", icon: "Building2", color: "indigo" },
    { id: "environment", name: "Environment", description: "Focuses on environmental protection, green initiatives, and sustainability programs.", icon: "Leaf", color: "teal" },
    { id: "finance", name: "Finance", description: "Manages city budget, revenue collection, financial planning, and expenditure control.", icon: "DollarSign", color: "blue" }
  ];

  const insertDepartment = db.prepare("INSERT OR IGNORE INTO departments (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)");
  
  departments.forEach(dept => {
    insertDepartment.run(dept.id, dept.name, dept.description, dept.icon, dept.color);
  });
  
  insertDepartment.finalize();
  console.log('Default departments added');
});

// Close the database connection
db.close((err) => {
  if (err) {
    console.error('Error closing database:', err);
  } else {
    console.log('Database setup completed');
  }
});
```

## Express Server Setup

Create a file named `server.js`:

```javascript
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'database', 'jd_frameworks.db'));

// Helper function to run SQL queries with promises
function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

// Helper function to run a single SQL command (insert, update, delete)
function runCommand(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// API Routes

// 1. User Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await runQuery('SELECT * FROM users');
    
    // Parse privacy and notification settings JSON
    users.forEach(user => {
      if (user.privacySettings) {
        user.privacySettings = JSON.parse(user.privacySettings);
      }
      if (user.notificationSettings) {
        user.notificationSettings = JSON.parse(user.notificationSettings);
      }
    });
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { id, username, fullName, department, email, phone, role, status, privacySettings, notificationSettings } = req.body;
    
    // Validate required fields
    if (!username || !fullName || !department || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const userId = id || `user-${Date.now()}`;
    const userStatus = status || 'active';
    
    // Stringify JSON objects for storage
    const privacySettingsStr = privacySettings ? JSON.stringify(privacySettings) : null;
    const notificationSettingsStr = notificationSettings ? JSON.stringify(notificationSettings) : null;
    
    const result = await runCommand(
      'INSERT INTO users (id, username, fullName, department, email, phone, role, status, privacySettings, notificationSettings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, username, fullName, department, email, phone, role, userStatus, privacySettingsStr, notificationSettingsStr]
    );
    
    res.status(201).json({ message: 'User created successfully', id: userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await runQuery('SELECT * FROM users WHERE id = ?', [req.params.id]);
    
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Parse privacy and notification settings JSON
    if (user[0].privacySettings) {
      user[0].privacySettings = JSON.parse(user[0].privacySettings);
    }
    if (user[0].notificationSettings) {
      user[0].notificationSettings = JSON.parse(user[0].notificationSettings);
    }
    
    res.json(user[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, fullName, department, email, phone, role, status, privacySettings, notificationSettings } = req.body;
    const userId = req.params.id;
    
    // Get existing user to check if it exists
    const existingUser = await runQuery('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Stringify JSON objects for storage
    const privacySettingsStr = privacySettings ? JSON.stringify(privacySettings) : existingUser[0].privacySettings;
    const notificationSettingsStr = notificationSettings ? JSON.stringify(notificationSettings) : existingUser[0].notificationSettings;
    
    await runCommand(
      'UPDATE users SET username = ?, fullName = ?, department = ?, email = ?, phone = ?, role = ?, status = ?, privacySettings = ?, notificationSettings = ? WHERE id = ?',
      [
        username || existingUser[0].username,
        fullName || existingUser[0].fullName,
        department || existingUser[0].department,
        email || existingUser[0].email,
        phone !== undefined ? phone : existingUser[0].phone,
        role || existingUser[0].role,
        status || existingUser[0].status,
        privacySettingsStr,
        notificationSettingsStr,
        userId
      ]
    );
    
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // In a real app, you would validate the password here
    // For this demo, we just check if the user exists
    
    const users = await runQuery('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
    
    if (users.length === 0) {
      // User doesn't exist, check if it's an admin email
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
      
      // Create a new user
      const userId = `user-${Date.now()}`;
      const displayName = username.split('@')[0].charAt(0).toUpperCase() + username.split('@')[0].slice(1);
      
      await runCommand(
        'INSERT INTO users (id, username, fullName, department, email, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, username.toLowerCase(), displayName, department, email, isAdmin ? "+91 9876543210" : null, isAdmin ? "admin" : "client", "active"]
      );
      
      const newUser = await runQuery('SELECT * FROM users WHERE id = ?', [userId]);
      
      return res.json({
        message: 'User created and logged in successfully',
        user: newUser[0]
      });
    }
    
    // Check if user is banned
    if (users[0].status === 'banned') {
      return res.status(403).json({ 
        error: 'Your account has been banned. Please contact support.' 
      });
    }
    
    // Parse privacy and notification settings JSON
    if (users[0].privacySettings) {
      users[0].privacySettings = JSON.parse(users[0].privacySettings);
    }
    if (users[0].notificationSettings) {
      users[0].notificationSettings = JSON.parse(users[0].notificationSettings);
    }
    
    res.json({
      message: 'Login successful',
      user: users[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Department Routes
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await runQuery('SELECT * FROM departments');
    
    // Count requests per department
    for (let dept of departments) {
      const requests = await runQuery('SELECT COUNT(*) as count FROM requests WHERE department = ?', [dept.name]);
      dept.requestCount = requests[0].count;
    }
    
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Request Routes
app.get('/api/requests', async (req, res) => {
  try {
    // Get all requests
    const requests = await runQuery(`
      SELECT r.*, 
        (SELECT GROUP_CONCAT(username) 
         FROM request_participants 
         WHERE requestId = r.id AND hasAccepted = 1) as acceptedBy,
        (SELECT GROUP_CONCAT(username) 
         FROM request_participants 
         WHERE requestId = r.id AND hasCompleted = 1) as completedBy
      FROM requests r
      ORDER BY createdAt DESC
    `);
    
    // Convert group_concat results to arrays and parse JSON fields
    requests.forEach(request => {
      request.acceptedBy = request.acceptedBy ? request.acceptedBy.split(',') : [];
      request.completedBy = request.completedBy ? request.completedBy.split(',') : [];
      
      // Parse departments JSON if it exists
      if (request.departments) {
        try {
          request.departments = JSON.parse(request.departments);
        } catch (e) {
          request.departments = [request.department];
        }
      } else {
        request.departments = [request.department];
      }
      
      // For projects, confirm creator is automatically included
      if (request.type === 'project' && !request.acceptedBy.includes(request.creator)) {
        request.acceptedBy.push(request.creator);
      }
    });
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const {
      title, description, department, departments, creator, type, priority, usersNeeded, relatedProject
    } = req.body;
    
    // Validate required fields
    if (!title || !(department || departments) || !creator || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get creator info to store creatorRole and department
    const userInfo = await runQuery('SELECT role, department FROM users WHERE username = ?', [creator]);
    if (userInfo.length === 0) {
      return res.status(400).json({ error: 'Creator user not found' });
    }
    
    const now = new Date();
    const requestId = `#${Math.floor(100000 + Math.random() * 900000)}`;
    
    // For projects, use the first department as primary and store all as JSON array
    const primaryDepartment = department || (Array.isArray(departments) ? departments[0] : "General");
    const departmentsJson = Array.isArray(departments) 
      ? JSON.stringify(departments) 
      : JSON.stringify([primaryDepartment]);
    
    // Insert the request
    await runCommand(`
      INSERT INTO requests (
        id, title, description, department, departments, creator, creatorDepartment, creatorRole, status, 
        type, dateCreated, createdAt, priority, usersNeeded, relatedProject
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      requestId, 
      title, 
      description, 
      primaryDepartment,
      departmentsJson,
      creator,
      userInfo[0].department,
      userInfo[0].role,
      'Pending',
      type,
      now.toLocaleDateString('en-GB'),
      now.toISOString(),
      priority || 'medium',
      parseInt(usersNeeded) || (type === 'project' ? 2 : 0),
      relatedProject || null
    ]);
    
    // For projects, automatically add creator as participant
    if (type === 'project') {
      await runCommand(`
        INSERT INTO request_participants (requestId, username, hasAccepted, acceptedAt)
        VALUES (?, ?, ?, ?)
      `, [requestId, creator, 1, now.toISOString()]);
      
      // Update usersAccepted count
      await runCommand(`
        UPDATE requests 
        SET usersAccepted = 1
        WHERE id = ?
      `, [requestId]);
    }
    
    res.status(201).json({ 
      message: 'Request created successfully',
      id: requestId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/requests/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    const {
      status, lastStatusUpdate, archived, archivedAt, isExpired
    } = req.body;
    
    // Check if request exists
    const existingRequest = await runQuery('SELECT * FROM requests WHERE id = ?', [requestId]);
    if (existingRequest.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Update only provided fields
    const updateFields = [];
    const updateValues = [];
    
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
      
      // Also update lastStatusUpdate and lastStatusUpdateTime
      updateFields.push('lastStatusUpdate = ?');
      updateValues.push(req.body.lastStatusUpdate || new Date().toLocaleDateString('en-GB'));
      
      updateFields.push('lastStatusUpdateTime = ?');
      updateValues.push(new Date().toISOString());
    }
    
    if (archived !== undefined) {
      updateFields.push('archived = ?');
      updateValues.push(archived ? 1 : 0);
      
      if (archived) {
        updateFields.push('archivedAt = ?');
        updateValues.push(archivedAt || new Date().toISOString());
      }
    }
    
    if (isExpired !== undefined) {
      updateFields.push('isExpired = ?');
      updateValues.push(isExpired ? 1 : 0);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Add the request ID to the update values
    updateValues.push(requestId);
    
    // Execute the update
    await runCommand(
      `UPDATE requests SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    res.json({ message: 'Request updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/accept', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Check if request exists and get its details
    const existingRequest = await runQuery('SELECT * FROM requests WHERE id = ?', [requestId]);
    if (existingRequest.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const request = existingRequest[0];
    
    // Check if the user has already accepted
    const existingParticipant = await runQuery(
      'SELECT * FROM request_participants WHERE requestId = ? AND username = ?',
      [requestId, username]
    );
    
    if (existingParticipant.length > 0) {
      return res.status(400).json({ error: 'You have already accepted this request' });
    }
    
    // Check if project is full (for project type)
    if (request.type === 'project') {
      const currentAccepted = await runQuery(
        'SELECT COUNT(*) as count FROM request_participants WHERE requestId = ? AND hasAccepted = 1',
        [requestId]
      );
      
      // Add 1 for the creator if they're not already counted
      let totalAccepted = currentAccepted[0].count;
      
      // Check if creator is in participants list
      const creatorExists = await runQuery(
        'SELECT * FROM request_participants WHERE requestId = ? AND username = ?',
        [requestId, request.creator]
      );
      
      if (creatorExists.length === 0) {
        totalAccepted += 1; // Account for creator who is automatically added
      }
      
      if (totalAccepted >= request.usersNeeded) {
        return res.status(400).json({ error: 'This project already has the maximum number of participants' });
      }
    }
    
    // Add user as a participant
    const now = new Date().toISOString();
    await runCommand(
      'INSERT INTO request_participants (requestId, username, hasAccepted, acceptedAt) VALUES (?, ?, 1, ?)',
      [requestId, username, now]
    );
    
    // Update the usersAccepted count in the request
    await runCommand(
      'UPDATE requests SET usersAccepted = usersAccepted + 1 WHERE id = ?',
      [requestId]
    );
    
    // If all users needed are accepted, update status to In Process
    if (request.type === 'project') {
      const updatedRequest = await runQuery('SELECT * FROM requests WHERE id = ?', [requestId]);
      if (updatedRequest[0].usersAccepted >= updatedRequest[0].usersNeeded) {
        await runCommand(
          'UPDATE requests SET status = ?, lastStatusUpdate = ?, lastStatusUpdateTime = ? WHERE id = ?',
          ['In Process', new Date().toLocaleDateString('en-GB'), now, requestId]
        );
      }
    } else {
      // For regular requests, update to In Process immediately when accepted
      await runCommand(
        'UPDATE requests SET status = ?, lastStatusUpdate = ?, lastStatusUpdateTime = ? WHERE id = ?',
        ['In Process', new Date().toLocaleDateString('en-GB'), now, requestId]
      );
    }
    
    res.json({ message: 'Request accepted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/complete', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Check if request exists
    const existingRequest = await runQuery('SELECT * FROM requests WHERE id = ?', [requestId]);
    if (existingRequest.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const request = existingRequest[0];
    
    // Check if user has accepted this request
    const participant = await runQuery(
      'SELECT * FROM request_participants WHERE requestId = ? AND username = ? AND hasAccepted = 1',
      [requestId, username]
    );
    
    if (participant.length === 0) {
      return res.status(400).json({ error: 'You must accept a request before marking it as complete' });
    }
    
    // Mark as completed by this user
    const now = new Date().toISOString();
    await runCommand(
      'UPDATE request_participants SET hasCompleted = 1, completedAt = ? WHERE requestId = ? AND username = ?',
      [now, requestId, username]
    );
    
    // For projects, check if everyone has completed
    if (request.type === 'project') {
      // Get all participants
      const participants = await runQuery(
        'SELECT * FROM request_participants WHERE requestId = ? AND hasAccepted = 1',
        [requestId]
      );
      
      // Check if creator is in participants list, if not add them
      const creatorExists = participants.some(p => p.username === request.creator);
      if (!creatorExists) {
        // This is just a safety check, creator should always be in participants
        await runCommand(
          'INSERT INTO request_participants (requestId, username, hasAccepted, acceptedAt) VALUES (?, ?, 1, ?)',
          [requestId, request.creator, now]
        );
        participants.push({ username: request.creator, hasCompleted: 0 });
      }
      
      // Check if all participants have completed
      const allCompleted = participants.every(p => {
        return p.hasCompleted === 1 || (p.username === username && p.hasCompleted === 0);
      });
      
      if (allCompleted) {
        // Everyone has marked as completed, update status
        await runCommand(
          'UPDATE requests SET status = ?, lastStatusUpdate = ?, lastStatusUpdateTime = ? WHERE id = ?',
          ['Completed', new Date().toLocaleDateString('en-GB'), now, requestId]
        );
        
        return res.json({ 
          message: 'Project marked as completed by all participants',
          status: 'Completed'
        });
      } else {
        return res.json({ 
          message: 'You have marked this project as complete. Waiting for other participants to complete.',
          status: 'In Process'
        });
      }
    } else {
      // For regular requests, mark as completed immediately
      await runCommand(
        'UPDATE requests SET status = ?, lastStatusUpdate = ?, lastStatusUpdateTime = ? WHERE id = ?',
        ['Completed', new Date().toLocaleDateString('en-GB'), now, requestId]
      );
      
      return res.json({ 
        message: 'Request marked as completed',
        status: 'Completed'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/abandon', async (req, res) => {
  try {
    const requestId = req.params.id;
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    // Check if request exists and it's not a project (projects can't be abandoned)
    const existingRequest = await runQuery('SELECT * FROM requests WHERE id = ?', [requestId]);
    if (existingRequest.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    if (existingRequest[0].type === 'project') {
      return res.status(400).json({ error: 'Projects cannot be abandoned once accepted' });
    }
    
    // Remove user from participants
    await runCommand(
      'DELETE FROM request_participants WHERE requestId = ? AND username = ?',
      [requestId, username]
    );
    
    // Update the usersAccepted count in the request
    await runCommand(
      'UPDATE requests SET usersAccepted = usersAccepted - 1 WHERE id = ?',
      [requestId]
    );
    
    // If no users left, set back to Pending
    const updatedParticipants = await runQuery(
      'SELECT COUNT(*) as count FROM request_participants WHERE requestId = ? AND hasAccepted = 1',
      [requestId]
    );
    
    if (updatedParticipants[0].count === 0) {
      const now = new Date().toISOString();
      await runCommand(
        'UPDATE requests SET status = ?, lastStatusUpdate = ?, lastStatusUpdateTime = ? WHERE id = ?',
        ['Pending', new Date().toLocaleDateString('en-GB'), now, requestId]
      );
    }
    
    res.json({ message: 'Request abandoned successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests/user/:username', async (req, res) => {
  try {
    const username = req.params.username;
    
    // Get requests created by this user
    const createdRequests = await runQuery(`
      SELECT r.*, 
        (SELECT GROUP_CONCAT(username) 
         FROM request_participants 
         WHERE requestId = r.id AND hasAccepted = 1) as acceptedBy,
        (SELECT GROUP_CONCAT(username) 
         FROM request_participants 
         WHERE requestId = r.id AND hasCompleted = 1) as completedBy
      FROM requests r
      WHERE r.creator = ?
      ORDER BY r.createdAt DESC
    `, [username]);
    
    // Get requests accepted by this user
    const acceptedRequests = await runQuery(`
      SELECT r.*, 
        (SELECT GROUP_CONCAT(username) 
         FROM request_participants 
         WHERE requestId = r.id AND hasAccepted = 1) as acceptedBy,
        (SELECT GROUP_CONCAT(username) 
         FROM request_participants 
         WHERE requestId = r.id AND hasCompleted = 1) as completedBy
      FROM requests r
      INNER JOIN request_participants p ON r.id = p.requestId
      WHERE p.username = ? AND p.hasAccepted = 1 AND r.creator != ?
      ORDER BY r.createdAt DESC
    `, [username, username]);
    
    // Convert group_concat results to arrays and parse JSON fields
    [...createdRequests, ...acceptedRequests].forEach(request => {
      request.acceptedBy = request.acceptedBy ? request.acceptedBy.split(',') : [];
      request.completedBy = request.completedBy ? request.completedBy.split(',') : [];
      
      // Parse departments JSON if it exists
      if (request.departments) {
        try {
          request.departments = JSON.parse(request.departments);
        } catch (e) {
          request.departments = [request.department];
        }
      } else {
        request.departments = [request.department];
      }
      
      // For projects, confirm creator is automatically included in acceptedBy
      if (request.type === 'project' && !request.acceptedBy.includes(request.creator)) {
        request.acceptedBy.push(request.creator);
      }
    });
    
    res.json({
      created: createdRequests,
      accepted: acceptedRequests
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests/filter', async (req, res) => {
  try {
    const { status, department, search, type } = req.query;
    
    let query = 'SELECT r.*, ' +
      '(SELECT GROUP_CONCAT(username) FROM request_participants WHERE requestId = r.id AND hasAccepted = 1) as acceptedBy, ' +
      '(SELECT GROUP_CONCAT(username) FROM request_participants WHERE requestId = r.id AND hasCompleted = 1) as completedBy ' +
      'FROM requests r WHERE 1=1';
    
    const params = [];
    
    // Add status filter if provided
    if (status && status !== 'All') {
      query += ' AND r.status = ?';
      params.push(status);
    }
    
    // Add type filter if provided
    if (type && type !== 'all') {
      query += ' AND r.type = ?';
      params.push(type);
    }
    
    // Add department filter 
    if (department) {
      // Either primary department matches or it's in the JSON departments array
      // This is a simple approach - in a real DB you'd use JSON functions
      query += ' AND (r.department = ? OR r.departments LIKE ?)';
      params.push(department);
      params.push(`%${department}%`);
    }
    
    // Add search term if provided
    if (search) {
      query += ' AND (r.title LIKE ? OR r.id LIKE ? OR r.department LIKE ? OR r.creator LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    // Don't show archived projects
    query += ' AND (r.archived IS NULL OR r.archived = 0)';
    
    // Order by created date, newest first
    query += ' ORDER BY r.createdAt DESC';
    
    const requests = await runQuery(query, params);
    
    // Process the results
    requests.forEach(request => {
      request.acceptedBy = request.acceptedBy ? request.acceptedBy.split(',') : [];
      request.completedBy = request.completedBy ? request.completedBy.split(',') : [];
      
      // Parse departments JSON
      if (request.departments) {
        try {
          request.departments = JSON.parse(request.departments);
        } catch (e) {
          request.departments = [request.department];
        }
      } else {
        request.departments = [request.department]; 
      }
      
      // For projects, confirm creator is automatically included
      if (request.type === 'project' && !request.acceptedBy.includes(request.creator)) {
        request.acceptedBy.push(request.creator);
      }
    });
    
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  try {
    const requestId = req.params.id;
    
    // Delete participants first (due to foreign key constraints)
    await runCommand('DELETE FROM request_participants WHERE requestId = ?', [requestId]);
    
    // Delete the request
    const result = await runCommand('DELETE FROM requests WHERE id = ?', [requestId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json({ message: 'Request deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/check-expiration', async (req, res) => {
  try {
    const now = new Date();
    let updated = false;
    
    // 1. Completed/Rejected requests expire after 1 day
    const completedOrRejected = await runQuery(`
      SELECT id, lastStatusUpdate 
      FROM requests 
      WHERE (status = 'Completed' OR status = 'Rejected')
        AND isExpired = 0
    `);
    
    for (const request of completedOrRejected) {
      const statusUpdateDate = new Date(request.lastStatusUpdate);
      const oneDayLater = new Date(statusUpdateDate);
      oneDayLater.setDate(oneDayLater.getDate() + 1);
      
      if (now > oneDayLater) {
        await runCommand(
          'UPDATE requests SET isExpired = 1 WHERE id = ?',
          [request.id]
        );
        updated = true;
      }
    }
    
    // 2. Delete expired requests
    const expiredResult = await runCommand(
      'DELETE FROM requests WHERE isExpired = 1'
    );
    
    if (expiredResult.changes > 0) {
      updated = true;
    }
    
    // 3. Archive pending projects after 60 days
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    // Archive pending projects after 60 days
    const pendingProjects = await runQuery(`
      SELECT id, createdAt
      FROM requests
      WHERE type = 'project'
        AND status = 'Pending'
        AND (archived IS NULL OR archived = 0)
    `);
    
    for (const project of pendingProjects) {
      const createdDate = new Date(project.createdAt);
      if (createdDate < sixtyDaysAgo) {
        await runCommand(
          'UPDATE requests SET archived = 1, archivedAt = ? WHERE id = ?',
          [now.toISOString(), project.id]
        );
        updated = true;
      }
    }
    
    // 4. Delete archived projects after 7 more days
    const archivedProjects = await runQuery(`
      SELECT id, archivedAt
      FROM requests
      WHERE archived = 1
    `);
    
    for (const project of archivedProjects) {
      const archivedDate = new Date(project.archivedAt);
      const deleteDate = new Date(archivedDate);
      deleteDate.setDate(deleteDate.getDate() + 7);
      
      if (now > deleteDate) {
        // Delete participants first
        await runCommand(
          'DELETE FROM request_participants WHERE requestId = ?',
          [project.id]
        );
        
        // Then delete the project
        await runCommand(
          'DELETE FROM requests WHERE id = ?',
          [project.id]
        );
        
        updated = true;
      }
    }
    
    // 5. Delete pending regular requests after 30 days
    const pendingRequests = await runQuery(`
      SELECT id, createdAt
      FROM requests
      WHERE type = 'request'
        AND status = 'Pending'
    `);
    
    for (const request of pendingRequests) {
      const createdDate = new Date(request.createdAt);
      if (createdDate < thirtyDaysAgo) {
        // Delete participants first
        await runCommand(
          'DELETE FROM request_participants WHERE requestId = ?',
          [request.id]
        );
        
        // Then delete the request
        await runCommand(
          'DELETE FROM requests WHERE id = ?',
          [request.id]
        );
        
        updated = true;
      }
    }
    
    res.json({
      updated: updated,
      message: updated ? 'Expired items processed' : 'No items needed processing'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## API Endpoints Implementation

The server.js file above includes all necessary API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users` | GET | Get all users |
| `/api/users` | POST | Create a new user |
| `/api/users/:id` | GET | Get a user by ID |
| `/api/users/:id` | PUT | Update a user |
| `/api/users/login` | POST | Login a user or create if new |
| `/api/departments` | GET | Get all departments |
| `/api/requests` | GET | Get all requests |
| `/api/requests` | POST | Create a new request |
| `/api/requests/:id` | PUT | Update a request |
| `/api/requests/:id` | DELETE | Delete a request |
| `/api/requests/:id/accept` | POST | Accept a request |
| `/api/requests/:id/complete` | POST | Mark a request as complete |
| `/api/requests/:id/abandon` | POST | Abandon a request |
| `/api/requests/user/:username` | GET | Get requests for a specific user |
| `/api/requests/filter` | GET | Filter requests by criteria |
| `/api/requests/check-expiration` | POST | Check and process expired requests |

## Frontend Integration

To integrate the SQLite backend with the frontend, you'll need to replace the localStorage calls with API calls. Here's a simple utility file to help with that:

```javascript
// src/utils/api.js

const API_URL = 'http://localhost:3000/api';

export const api = {
  // User endpoints
  async getUsers() {
    const response = await fetch(`${API_URL}/users`);
    return await response.json();
  },
  
  async getUser(id) {
    const response = await fetch(`${API_URL}/users/${id}`);
    return await response.json();
  },
  
  async createUser(userData) {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await response.json();
  },
  
  async updateUser(id, userData) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return await response.json();
  },
  
  async login(username, password) {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return await response.json();
  },
  
  // Request endpoints
  async getRequests() {
    const response = await fetch(`${API_URL}/requests`);
    return await response.json();
  },
  
  async createRequest(requestData) {
    const response = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    return await response.json();
  },
  
  async updateRequest(id, requestData) {
    const response = await fetch(`${API_URL}/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    return await response.json();
  },
  
  async deleteRequest(id) {
    const response = await fetch(`${API_URL}/requests/${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  },
  
  async acceptRequest(id, username) {
    const response = await fetch(`${API_URL}/requests/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return await response.json();
  },
  
  async completeRequest(id, username) {
    const response = await fetch(`${API_URL}/requests/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return await response.json();
  },
  
  async abandonRequest(id, username) {
    const response = await fetch(`${API_URL}/requests/${id}/abandon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    return await response.json();
  },
  
  async getUserRequests(username) {
    const response = await fetch(`${API_URL}/requests/user/${username}`);
    return await response.json();
  },
  
  async filterRequests(filters) {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${API_URL}/requests/filter?${queryParams}`);
    return await response.json();
  },
  
  async checkExpiredRequests() {
    const response = await fetch(`${API_URL}/requests/check-expiration`, {
      method: 'POST'
    });
    return await response.json();
  },
  
  // Department endpoints
  async getDepartments() {
    const response = await fetch(`${API_URL}/departments`);
    return await response.json();
  }
};
```

## Running the Application

1. First, install the required dependencies:
   ```bash
   npm install sqlite3 express cors body-parser
   ```

2. Create and set up the database:
   ```bash
   node setup-database.js
   ```

3. Start the Express server:
   ```bash
   node server.js
   ```

4. Update your React components to use the API instead of localStorage. For example, replace code like:
   ```javascript
   const storedRequests = JSON.parse(localStorage.getItem("jd-requests") || "[]");
   ```

   with:
   ```javascript
   const storedRequests = await api.getRequests();
   ```

5. Make sure your frontend application is configured to use the API endpoints.

The backend now fully supports all the new features:
- Multiple department selection for projects (3-5 departments)
- Creator department tracking
- Enhanced filtering capabilities (status, department, search)
- Truncated tags with +X more functionality
- Project/request detail view

With this setup, all the accepted requests will properly appear in the profile tab, filtered by the correct acceptance criteria.
