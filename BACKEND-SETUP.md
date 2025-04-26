
# JD Frameworks - Backend Setup

This document provides instructions for setting up the backend server using Express and SQLite to support the JD Frameworks dashboard platform.

## Database Schema

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  fullName TEXT,
  department TEXT,
  email TEXT,
  role TEXT,
  status TEXT DEFAULT 'active'
);

-- Requests table
CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  department TEXT,
  departments TEXT, -- JSON array of departments for projects
  creator TEXT,
  creatorDepartment TEXT,
  status TEXT,
  type TEXT,
  dateCreated TEXT,
  usersNeeded INTEGER,
  usersAccepted INTEGER DEFAULT 0,
  participants TEXT, -- JSON array of participants (usernames)
  participantsCompleted TEXT, -- JSON array of users who completed the request/project
  archived INTEGER DEFAULT 0,
  archivedAt TEXT,
  isExpired INTEGER DEFAULT 0,
  lastStatusUpdate TEXT,
  lastStatusUpdateTime TEXT,
  multiDepartment INTEGER DEFAULT 0,
  acceptedBy TEXT, -- JSON array of users who accepted the request
  FOREIGN KEY(creator) REFERENCES users(username)
);
```

## Setting Up the Express Server

1. Install required dependencies:
```bash
npm install express sqlite3 cors
```

2. Create a `server.js` file with the following code:

```javascript
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Create and initialize database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      fullName TEXT,
      department TEXT,
      email TEXT,
      role TEXT,
      status TEXT DEFAULT 'active'
    )
  `);

  // Create requests table
  db.run(`
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      department TEXT,
      departments TEXT,
      creator TEXT,
      creatorDepartment TEXT,
      status TEXT,
      type TEXT,
      dateCreated TEXT,
      usersNeeded INTEGER,
      usersAccepted INTEGER DEFAULT 0,
      participants TEXT,
      participantsCompleted TEXT,
      archived INTEGER DEFAULT 0,
      archivedAt TEXT,
      isExpired INTEGER DEFAULT 0,
      lastStatusUpdate TEXT,
      lastStatusUpdateTime TEXT,
      multiDepartment INTEGER DEFAULT 0,
      acceptedBy TEXT,
      FOREIGN KEY(creator) REFERENCES users(username)
    )
  `);

  // Insert demo users if they don't exist
  const demoUsers = [
    {
      id: uuidv4(),
      username: 'admin',
      fullName: 'Admin User',
      department: 'Human Resources',
      email: 'admin@example.com',
      role: 'admin'
    },
    {
      id: uuidv4(),
      username: 'client',
      fullName: 'Client User',
      department: 'Marketing',
      email: 'client@example.com',
      role: 'client'
    }
  ];

  demoUsers.forEach(user => {
    db.get('SELECT * FROM users WHERE username = ?', [user.username], (err, row) => {
      if (err) console.error(err);
      if (!row) {
        db.run(
          'INSERT INTO users (id, username, fullName, department, email, role) VALUES (?, ?, ?, ?, ?, ?)',
          [user.id, user.username, user.fullName, user.department, user.email, user.role]
        );
      }
    });
  });
}

// API endpoints for users
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users/login', (req, res) => {
  const { username } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  });
});

// API endpoints for requests
app.get('/api/requests', (req, res) => {
  db.all('SELECT * FROM requests', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Parse JSON strings to arrays
    rows.forEach(row => {
      row.departments = JSON.parse(row.departments || '[]');
      row.participants = JSON.parse(row.participants || '[]');
      row.participantsCompleted = JSON.parse(row.participantsCompleted || '[]');
      row.acceptedBy = JSON.parse(row.acceptedBy || '[]');
    });
    
    res.json(rows);
  });
});

app.post('/api/requests', (req, res) => {
  const request = req.body;
  request.id = request.id || uuidv4();
  request.dateCreated = request.dateCreated || new Date().toISOString();
  request.status = request.status || 'Pending';
  request.usersAccepted = request.usersAccepted || 0;
  request.archived = request.archived || 0;
  request.isExpired = request.isExpired || 0;
  
  // Convert arrays to JSON strings
  const departments = JSON.stringify(request.departments || []);
  const participants = JSON.stringify(request.participants || []);
  const participantsCompleted = JSON.stringify(request.participantsCompleted || []);
  const acceptedBy = JSON.stringify(request.acceptedBy || []);

  db.run(`
    INSERT INTO requests (
      id, title, description, department, departments, creator, creatorDepartment,
      status, type, dateCreated, usersNeeded, usersAccepted, participants,
      participantsCompleted, archived, multiDepartment, acceptedBy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    request.id, request.title, request.description, request.department, 
    departments, request.creator, request.creatorDepartment,
    request.status, request.type, request.dateCreated, request.usersNeeded,
    request.usersAccepted, participants, participantsCompleted, request.archived,
    request.multiDepartment ? 1 : 0, acceptedBy
  ], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: request.id, message: 'Request created successfully' });
  });
});

// Accept request endpoint with correct multi-dept behavior
app.post('/api/requests/:id/accept', (req, res) => {
  const { id } = req.params;
  const { username, department } = req.body;
  
  db.get('SELECT * FROM requests WHERE id = ?', [id], (err, request) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    // Parse departments array
    const departments = JSON.parse(request.departments || '[]');
    const singleDept = request.department;
    
    // Check if user's department is allowed
    const isAllowedDepartment = departments.length > 0 
      ? departments.includes(department)
      : department === singleDept;
      
    if (!isAllowedDepartment) {
      return res.status(403).json({ 
        error: 'Not allowed - department mismatch' 
      });
    }
    
    // For single department requests, check if already accepted
    if (request.type === 'request' && !request.multiDepartment) {
      const acceptedBy = JSON.parse(request.acceptedBy || '[]');
      if (acceptedBy.length > 0) {
        return res.status(400).json({ error: 'Already accepted' });
      }
    }
    
    // Accept the request
    const acceptedBy = JSON.parse(request.acceptedBy || '[]');
    if (acceptedBy.includes(username)) {
      return res.status(400).json({ error: 'Already accepted by you' });
    }
    
    acceptedBy.push(username);
    const usersAccepted = request.usersAccepted + 1;
    
    // Only change status to In Process if minimum users reached
    const status = (request.multiDepartment || request.type === 'project') && usersAccepted >= 2
      ? 'In Process'
      : request.status;
    
    db.run(
      'UPDATE requests SET acceptedBy = ?, usersAccepted = ?, status = ? WHERE id = ?',
      [JSON.stringify(acceptedBy), usersAccepted, status, id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Request accepted', status });
      }
    );
  });
});

// Update completion status endpoint
app.post('/api/requests/:id/complete', (req, res) => {
  const { id } = req.params;
  const { username } = req.body;
  
  db.get('SELECT * FROM requests WHERE id = ?', [id], (err, request) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    if (request.multiDepartment || request.type === 'project') {
      let participantsCompleted = JSON.parse(request.participantsCompleted || '[]');
      const acceptedBy = JSON.parse(request.acceptedBy || '[]');
      
      if (!participantsCompleted.includes(username)) {
        participantsCompleted.push(username);
      }
      
      // Update status to Completed only if all accepted users have completed
      const allCompleted = participantsCompleted.length >= acceptedBy.length;
      const status = allCompleted ? 'Completed' : request.status;
      const now = new Date().toISOString();
      
      db.run(
        'UPDATE requests SET participantsCompleted = ?, status = ?, lastStatusUpdate = ? WHERE id = ?',
        [JSON.stringify(participantsCompleted), status, now, id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ 
            message: allCompleted ? 'Request completed' : 'Completion recorded',
            allCompleted 
          });
        }
      );
    } else {
      // Regular request completion
      const now = new Date().toISOString();
      db.run(
        'UPDATE requests SET status = ?, lastStatusUpdate = ? WHERE id = ?',
        ['Completed', now, id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Request completed' });
        }
      );
    }
  });
});

// Reject/abandon request endpoint
app.post('/api/requests/:id/reject', (req, res) => {
  const { id } = req.params;
  const { username } = req.body;
  
  db.get('SELECT * FROM requests WHERE id = ?', [id], (err, request) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    
    // For multi-department or project requests
    if (request.multiDepartment || request.type === 'project') {
      let acceptedBy = JSON.parse(request.acceptedBy || '[]');
      let participantsCompleted = JSON.parse(request.participantsCompleted || '[]');
      
      // Remove user from participants lists
      acceptedBy = acceptedBy.filter(user => user !== username);
      participantsCompleted = participantsCompleted.filter(user => user !== username);
      
      const now = new Date().toISOString();
      const usersAccepted = Math.max((request.usersAccepted || 0) - 1, 0);
      
      // Set back to pending when a user rejects
      db.run(
        'UPDATE requests SET acceptedBy = ?, participantsCompleted = ?, usersAccepted = ?, status = ?, lastStatusUpdate = ? WHERE id = ?',
        [JSON.stringify(acceptedBy), JSON.stringify(participantsCompleted), usersAccepted, 'Pending', now, id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'You have been removed from participants and request is now pending' });
        }
      );
    } else {
      // For single department requests
      const now = new Date().toISOString();
      db.run(
        'UPDATE requests SET status = ?, lastStatusUpdate = ?, acceptedBy = ?, usersAccepted = 0 WHERE id = ?',
        ['Rejected', now, '[]', id],
        function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Request rejected successfully' });
        }
      );
    }
  });
});

// Check expired requests
app.post('/api/requests/check-expiration', (req, res) => {
  const now = new Date();
  
  db.all('SELECT * FROM requests WHERE isExpired = 0', [], (err, requests) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const updates = [];
    
    requests.forEach(request => {
      let shouldUpdate = false;
      let shouldDelete = false;
      
      // Check completed/rejected requests (expire after 1 day)
      if ((request.status === 'Completed' || request.status === 'Rejected') && request.lastStatusUpdate) {
        const statusUpdateDate = new Date(request.lastStatusUpdate);
        const oneDayLater = new Date(statusUpdateDate);
        oneDayLater.setDate(oneDayLater.getDate() + 1);
        
        if (now > oneDayLater) {
          shouldUpdate = true;
        }
      }
      
      // Check pending requests (expiration based on type)
      if (request.status === 'Pending') {
        const createdDate = new Date(request.dateCreated);
        
        if (request.multiDepartment) {
          // Multi-department requests expire after 45 days
          const expiryDate = new Date(createdDate);
          expiryDate.setDate(expiryDate.getDate() + 45);
          
          if (now > expiryDate) {
            shouldUpdate = true;
          }
        } else if (request.type === 'request') {
          // Regular requests expire after 30 days
          const expiryDate = new Date(createdDate);
          expiryDate.setDate(expiryDate.getDate() + 30);
          
          if (now > expiryDate) {
            shouldUpdate = true;
          }
        }
      }
      
      if (shouldUpdate) {
        updates.push(
          new Promise((resolve, reject) => {
            db.run(
              'UPDATE requests SET isExpired = 1 WHERE id = ?',
              [request.id],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          })
        );
      }
      
      // Check archived projects (delete after 7 days)
      if (request.archived && request.archivedAt) {
        const archiveDate = new Date(request.archivedAt);
        const deleteDate = new Date(archiveDate);
        deleteDate.setDate(deleteDate.getDate() + 7);
        
        if (now > deleteDate) {
          shouldDelete = true;
        }
      }
      
      if (shouldDelete) {
        updates.push(
          new Promise((resolve, reject) => {
            db.run(
              'DELETE FROM requests WHERE id = ?',
              [request.id],
              function(err) {
                if (err) reject(err);
                else resolve();
              }
            );
          })
        );
      }
    });
    
    Promise.all(updates)
      .then(() => {
        res.json({ message: `${updates.length} requests updated` });
      })
      .catch(error => {
        res.status(500).json({ error: error.message });
      });
  });
});

// Handle all other routes by serving the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Running the Server

1. Save the above code to a `server.js` file in the root of your project.

2. Install the UUID package:
```bash
npm install uuid
```

3. Start the server:
```bash
node server.js
```

4. The server will run on port 3000 by default and will automatically create the required database tables.

## Connecting the Frontend

Update your frontend API calls to use the local server:

1. Edit `src/api/index.ts` to point to your local server:
```typescript
const API_URL = 'http://localhost:3000/api';
```

2. For a production environment, you may want to use an environment variable:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

3. Build your frontend:
```bash
npm run build
```

4. The server will automatically serve the built files from the `dist` directory.

## Additional Notes

- Make sure to add appropriate error handling and validation in a production environment.
- For a real-world application, add authentication middleware and secure routes.
- You may want to add pagination for large datasets.
