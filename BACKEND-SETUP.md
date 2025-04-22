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
      creator TEXT NOT NULL,
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
    
    // Convert group_concat results to arrays
    requests.forEach(request => {
      request.acceptedBy = request.acceptedBy ? request.acceptedBy.split(',') : [];
      request.completedBy = request.completedBy ? request.completedBy.split(',') : [];
      
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
      title, description, department, creator, type, priority, usersNeeded, relatedProject
    } = req.body;
    
    // Validate required fields
    if (!title || !department || !creator || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get creator info to store creatorRole
    const userInfo = await runQuery('SELECT role FROM users WHERE username = ?', [creator]);
    if (userInfo.length === 0) {
      return res.status(400).json({ error: 'Creator user not found' });
    }
    
    const now = new Date();
    const requestId = `#${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Insert the request
    await runCommand(`
      INSERT INTO requests (
        id, title, description, department, creator, creatorRole, status, 
        type, dateCreated, createdAt, priority, usersNeeded, relatedProject
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      requestId, 
      title, 
      description, 
      department, 
      creator, 
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
    
    // Convert group_concat results to arrays
    [...createdRequests, ...acceptedRequests].forEach(request => {
      request.acceptedBy = request.acceptedBy ? request.acceptedBy.split(',') : [];
      request.completedBy = request.completedBy ? request.completedBy.split(',') : [];
      
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
    
    // Calculate dates for comparison
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate()
