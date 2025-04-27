
# Backend Setup Guide

## SQLite Database Setup

### Initial Database Configuration

1. **Create Data Directory**:
   ```bash
   mkdir -p ./data
   ```

2. **Install Required Dependencies**:
   ```bash
   npm install sqlite3 express cors body-parser
   ```

3. **Database Location**: 
   The SQLite database file will be stored at `./data/jd-requests.db` in your project root directory.

## Backend Server Setup

### Create Express Server

1. **Create a new file** at `server/index.js`:

```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database connection
const dbPath = path.resolve(__dirname, '../data/jd-requests.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    setupDatabase();
  }
});

// Set up database tables
function setupDatabase() {
  // Create requests table
  db.run(`CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT,
    departments TEXT,
    status TEXT NOT NULL,
    dateCreated TEXT NOT NULL,
    creator TEXT NOT NULL,
    creatorDepartment TEXT,
    createdAt TEXT,
    type TEXT NOT NULL,
    creatorRole TEXT,
    isExpired INTEGER DEFAULT 0,
    archived INTEGER DEFAULT 0,
    multiDepartment INTEGER DEFAULT 0,
    acceptedBy TEXT,
    usersAccepted INTEGER DEFAULT 0,
    usersNeeded INTEGER DEFAULT 2,
    lastStatusUpdateTime TEXT,
    lastStatusUpdate TEXT,
    priority TEXT,
    archivedAt TEXT,
    statusChangedBy TEXT
  )`);

  // Create rejections table
  db.run(`CREATE TABLE IF NOT EXISTS rejections (
    id TEXT PRIMARY KEY,
    requestId TEXT NOT NULL,
    username TEXT NOT NULL,
    reason TEXT,
    date TEXT NOT NULL,
    hidden INTEGER DEFAULT 0,
    FOREIGN KEY (requestId) REFERENCES requests(id)
  )`);

  // Create participants_completed table
  db.run(`CREATE TABLE IF NOT EXISTS participants_completed (
    id TEXT PRIMARY KEY,
    requestId TEXT NOT NULL,
    username TEXT NOT NULL,
    completedAt TEXT NOT NULL,
    FOREIGN KEY (requestId) REFERENCES requests(id)
  )`);

  // Create departments table
  db.run(`CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT
  )`);

  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    password TEXT,
    FOREIGN KEY (department) REFERENCES departments(name)
  )`);
}

// API Routes
// Departments
app.get('/api/departments', (req, res) => {
  db.all('SELECT * FROM departments', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Users
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, fullName, email, department, role, phone FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/users/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT id, username, fullName, email, department, role, phone FROM users WHERE username = ?', 
    [username], 
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // In a real app you'd check password hash here
      // For demo purposes we'll accept any password
      res.json(user);
    }
  );
});

// ADD THIS NEW ENDPOINT FOR USER REGISTRATION
app.post('/api/users/register', (req, res) => {
  const { username, fullName, email, department, role, phone, password } = req.body;
  
  // Generate a unique ID
  const id = `user_${Date.now()}`;
  
  db.run(
    `INSERT INTO users (id, username, fullName, email, department, role, phone, password) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    [id, username, fullName, email, department, role, phone, password],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      
      res.status(201).json({
        id,
        username,
        fullName,
        email,
        department,
        role,
        phone
      });
    }
  );
});

// Requests
app.get('/api/requests', (req, res) => {
  db.all('SELECT * FROM requests', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    // Process each request to handle JSON fields
    const processedRows = rows.map(row => {
      try {
        if (row.departments) row.departments = JSON.parse(row.departments);
        if (row.acceptedBy) row.acceptedBy = JSON.parse(row.acceptedBy);
        
        // Get rejections for this request
        db.all('SELECT * FROM rejections WHERE requestId = ?', [row.id], (err, rejections) => {
          if (!err && rejections) {
            row.rejections = rejections;
          }
        });
        
        // Get completed participants
        db.all('SELECT username FROM participants_completed WHERE requestId = ?', [row.id], (err, completed) => {
          if (!err && completed) {
            row.participantsCompleted = completed.map(p => p.username);
          }
        });
      } catch (e) {
        console.error('Error processing request data:', e);
      }
      return row;
    });
    
    res.json(processedRows);
  });
});

app.post('/api/requests', (req, res) => {
  const request = req.body;
  
  // Convert arrays to JSON strings for storage
  if (Array.isArray(request.departments)) {
    request.departments = JSON.stringify(request.departments);
  }
  
  if (Array.isArray(request.acceptedBy)) {
    request.acceptedBy = JSON.stringify(request.acceptedBy);
  }
  
  const sql = `INSERT INTO requests (
    id, title, description, department, departments, status, dateCreated, 
    creator, creatorDepartment, createdAt, type, creatorRole, 
    multiDepartment, usersNeeded
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [
    request.id,
    request.title,
    request.description,
    request.department,
    request.departments,
    request.status,
    request.dateCreated,
    request.creator,
    request.creatorDepartment,
    request.createdAt,
    request.type,
    request.creatorRole,
    request.multiDepartment ? 1 : 0,
    request.usersNeeded || 2
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({
      message: 'Request created successfully',
      requestId: request.id
    });
  });
});

app.put('/api/requests/:id', (req, res) => {
  const requestId = req.params.id;
  const updates = req.body;
  
  // Convert arrays to JSON strings for storage
  if (Array.isArray(updates.departments)) {
    updates.departments = JSON.stringify(updates.departments);
  }
  
  if (Array.isArray(updates.acceptedBy)) {
    updates.acceptedBy = JSON.stringify(updates.acceptedBy);
  }
  
  // Build dynamic update query
  const fields = Object.keys(updates)
    .filter(key => key !== 'id')
    .map(key => `${key} = ?`);
    
  const values = Object.keys(updates)
    .filter(key => key !== 'id')
    .map(key => updates[key]);
  
  values.push(requestId);
  
  const sql = `UPDATE requests SET ${fields.join(', ')} WHERE id = ?`;
  
  db.run(sql, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    res.json({
      message: 'Request updated successfully',
      requestId
    });
  });
});

app.delete('/api/requests/:id', (req, res) => {
  const requestId = req.params.id;
  
  db.run('DELETE FROM rejections WHERE requestId = ?', [requestId], (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    db.run('DELETE FROM participants_completed WHERE requestId = ?', [requestId], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.run('DELETE FROM requests WHERE id = ?', [requestId], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json({
          message: 'Request deleted successfully',
          requestId
        });
      });
    });
  });
});

// Accept a request
app.post('/api/requests/:id/accept', (req, res) => {
  const requestId = req.params.id;
  const { username } = req.body;
  
  db.get('SELECT * FROM requests WHERE id = ?', [requestId], (err, request) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    let acceptedBy = [];
    try {
      if (request.acceptedBy) {
        acceptedBy = JSON.parse(request.acceptedBy);
      }
    } catch (e) {
      acceptedBy = [];
    }
    
    if (!acceptedBy.includes(username)) {
      acceptedBy.push(username);
    }
    
    const usersAccepted = acceptedBy.length;
    const usersNeeded = request.usersNeeded || 2;
    const newStatus = (request.multiDepartment || request.type === 'project') && usersAccepted >= usersNeeded 
      ? 'In Process' 
      : request.status;
    
    const now = new Date().toISOString();
    
    db.run(`
      UPDATE requests 
      SET acceptedBy = ?, usersAccepted = ?, status = ?, lastStatusUpdate = ?, lastStatusUpdateTime = ?
      WHERE id = ?
    `, [
      JSON.stringify(acceptedBy),
      usersAccepted,
      newStatus,
      now,
      new Date().toLocaleTimeString(),
      requestId
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        message: 'Request accepted successfully',
        usersAccepted,
        usersNeeded,
        status: newStatus
      });
    });
  });
});

// Complete a request
app.post('/api/requests/:id/complete', (req, res) => {
  const requestId = req.params.id;
  const { username } = req.body;
  
  // First check if the request exists
  db.get('SELECT * FROM requests WHERE id = ?', [requestId], (err, request) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // Check if the user has already marked this as complete
    db.get('SELECT * FROM participants_completed WHERE requestId = ? AND username = ?', 
      [requestId, username], 
      (err, completed) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (completed) {
          return res.json({
            message: 'User has already marked this as complete',
            alreadyCompleted: true
          });
        }
        
        // Add user to completed participants
        const now = new Date().toISOString();
        db.run(`
          INSERT INTO participants_completed (id, requestId, username, completedAt)
          VALUES (?, ?, ?, ?)
        `, [
          Date.now().toString(),
          requestId,
          username,
          now
        ], function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Check if all participants have completed
          db.all('SELECT * FROM participants_completed WHERE requestId = ?', [requestId], (err, completedParticipants) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            let acceptedBy = [];
            try {
              if (request.acceptedBy) {
                acceptedBy = JSON.parse(request.acceptedBy);
              }
            } catch (e) {
              acceptedBy = [];
            }
            
            // Update status to Completed if all participants have completed
            if (
              (request.multiDepartment || request.type === 'project') && 
              completedParticipants.length >= acceptedBy.length && 
              acceptedBy.length >= (request.usersNeeded || 2)
            ) {
              db.run(`
                UPDATE requests 
                SET status = ?, lastStatusUpdate = ?, lastStatusUpdateTime = ?
                WHERE id = ?
              `, [
                'Completed',
                now,
                new Date().toLocaleTimeString(),
                requestId
              ]);
            }
            
            res.json({
              message: 'Completion status updated',
              requestId,
              completedParticipants: completedParticipants.map(p => p.username)
            });
          });
        });
      }
    );
  });
});

// Reject a request
app.post('/api/requests/:id/reject', (req, res) => {
  const requestId = req.params.id;
  const { username, reason } = req.body;
  
  // First check if the request exists
  db.get('SELECT * FROM requests WHERE id = ?', [requestId], (err, request) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    const rejectionId = Date.now().toString();
    
    // Add rejection record
    db.run(`
      INSERT INTO rejections (id, requestId, username, reason, date)
      VALUES (?, ?, ?, ?, ?)
    `, [
      rejectionId,
      requestId,
      username,
      reason || '',
      formattedDate
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // For multi-department or project requests, remove user from acceptedBy
      if (request.multiDepartment || request.type === 'project') {
        let acceptedBy = [];
        try {
          if (request.acceptedBy) {
            acceptedBy = JSON.parse(request.acceptedBy);
          }
        } catch (e) {
          acceptedBy = [];
        }
        
        const updatedAcceptedBy = acceptedBy.filter(u => u !== username);
        const usersAccepted = updatedAcceptedBy.length;
        
        // Status returns to Pending if participant count drops
        const newStatus = usersAccepted < (request.usersNeeded || 2) ? 'Pending' : request.status;
        
        db.run(`
          UPDATE requests 
          SET acceptedBy = ?, usersAccepted = ?, status = ?, lastStatusUpdate = ?, lastStatusUpdateTime = ?
          WHERE id = ?
        `, [
          JSON.stringify(updatedAcceptedBy),
          usersAccepted,
          newStatus,
          now.toISOString(),
          now.toLocaleTimeString(),
          requestId
        ]);
        
        // Also remove from completed participants if present
        db.run('DELETE FROM participants_completed WHERE requestId = ? AND username = ?', [requestId, username]);
      } else {
        // For single department requests, change status to Rejected
        db.run(`
          UPDATE requests 
          SET status = ?, acceptedBy = ?, usersAccepted = ?, lastStatusUpdate = ?, lastStatusUpdateTime = ?, statusChangedBy = ?
          WHERE id = ?
        `, [
          'Rejected',
          '[]',
          0,
          now.toISOString(),
          now.toLocaleTimeString(),
          username,
          requestId
        ]);
      }
      
      res.json({
        message: 'Request rejected successfully',
        rejectionId
      });
    });
  });
});

// Clear rejection notes
app.delete('/api/users/:username/rejections', (req, res) => {
  const username = req.params.username;
  
  db.run('UPDATE rejections SET hidden = 1 WHERE username = ?', [username], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      message: 'All rejection notes cleared successfully',
      count: this.changes
    });
  });
});

// Clear specific rejection note
app.delete('/api/users/:username/rejections/:rejectionId', (req, res) => {
  const { username, rejectionId } = req.params;
  
  db.run('UPDATE rejections SET hidden = 1 WHERE id = ? AND username = ?', [rejectionId, username], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Rejection note not found' });
    }
    
    res.json({
      message: 'Rejection note cleared successfully'
    });
  });
});

// Check expiration
app.post('/api/requests/check-expiration', (req, res) => {
  const now = new Date();
  
  // Find completed/rejected requests that should be marked as expired
  db.all(`
    SELECT id, lastStatusUpdate, status FROM requests 
    WHERE (status = 'Completed' OR status = 'Rejected') 
    AND lastStatusUpdate IS NOT NULL
    AND isExpired = 0
  `, [], (err, requests) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    let expiredCount = 0;
    let deletedCount = 0;
    
    for (const request of requests) {
      const statusUpdateDate = new Date(request.lastStatusUpdate);
      const oneDayLater = new Date(statusUpdateDate);
      oneDayLater.setDate(oneDayLater.getDate() + 1);
      
      if (now > oneDayLater) {
        db.run('UPDATE requests SET isExpired = 1 WHERE id = ?', [request.id]);
        expiredCount++;
      }
    }
    
    // Find already expired requests to delete
    db.all('SELECT id FROM requests WHERE isExpired = 1', [], (err, expiredRequests) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      for (const request of expiredRequests) {
        db.run('DELETE FROM participants_completed WHERE requestId = ?', [request.id]);
        db.run('DELETE FROM rejections WHERE requestId = ?', [request.id]);
        db.run('DELETE FROM requests WHERE id = ?', [request.id]);
        deletedCount++;
      }
      
      // Find and expire pending requests
      db.all(`
        SELECT id, createdAt, type, multiDepartment FROM requests 
        WHERE status = 'Pending'
      `, [], (err, pendingRequests) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        for (const request of pendingRequests) {
          const createdDate = new Date(request.createdAt);
          let shouldDelete = false;
          
          if (request.type === 'request') {
            const expiryDays = request.multiDepartment ? 45 : 30;
            const expiryDate = new Date(createdDate);
            expiryDate.setDate(expiryDate.getDate() + expiryDays);
            
            if (now > expiryDate) {
              shouldDelete = true;
            }
          } else if (request.type === 'project') {
            const archiveDays = 60;
            const archiveDate = new Date(createdDate);
            archiveDate.setDate(archiveDate.getDate() + archiveDays);
            
            if (now > archiveDate) {
              // Mark project as archived instead of deleting
              db.run(`
                UPDATE requests 
                SET archived = 1, archivedAt = ?
                WHERE id = ?
              `, [now.toISOString(), request.id]);
            }
          }
          
          if (shouldDelete) {
            db.run('DELETE FROM participants_completed WHERE requestId = ?', [request.id]);
            db.run('DELETE FROM rejections WHERE requestId = ?', [request.id]);
            db.run('DELETE FROM requests WHERE id = ?', [request.id]);
            deletedCount++;
          }
        }
        
        // Check for archived projects that need to be deleted
        db.all(`
          SELECT id, archivedAt FROM requests 
          WHERE archived = 1 AND archivedAt IS NOT NULL
        `, [], (err, archivedProjects) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          for (const project of archivedProjects) {
            const archiveDate = new Date(project.archivedAt);
            const deleteDate = new Date(archiveDate);
            deleteDate.setDate(deleteDate.getDate() + 7);
            
            if (now > deleteDate) {
              db.run('DELETE FROM participants_completed WHERE requestId = ?', [project.id]);
              db.run('DELETE FROM rejections WHERE requestId = ?', [project.id]);
              db.run('DELETE FROM requests WHERE id = ?', [project.id]);
              deletedCount++;
            }
          }
          
          res.json({
            message: 'Expiration check completed',
            expiredCount,
            deletedCount
          });
        });
      });
    });
  });
});

// Data Import Endpoints (for setup)
app.post('/api/import/departments', (req, res) => {
  const departments = req.body;
  
  const insertDepartment = (department) => {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO departments (id, name, icon, color)
        VALUES (?, ?, ?, ?)
      `, [
        department.id,
        department.name,
        department.icon,
        department.color
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  };
  
  Promise.all(departments.map(insertDepartment))
    .then(() => {
      res.json({
        message: 'Departments imported successfully',
        count: departments.length
      });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

app.post('/api/import/users', (req, res) => {
  const users = req.body;
  
  const insertUser = (user) => {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO users (id, username, fullName, email, department, role, phone, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.id,
        user.username,
        user.fullName,
        user.email,
        user.department,
        user.role,
        user.phone,
        user.password || 'password123' // Default password
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });
  };
  
  Promise.all(users.map(insertUser))
    .then(() => {
      res.json({
        message: 'Users imported successfully',
        count: users.length
      });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Migration endpoint to move from localStorage to SQLite
app.post('/api/migrate/localstorage', (req, res) => {
  const requests = req.body;
  
  if (!Array.isArray(requests)) {
    return res.status(400).json({ error: 'Expected an array of requests' });
  }
  
  const insertRequest = (request) => {
    return new Promise((resolve, reject) => {
      // Convert arrays to JSON strings for storage
      const departmentsStr = Array.isArray(request.departments) 
        ? JSON.stringify(request.departments) 
        : request.departments;
      
      const acceptedByStr = Array.isArray(request.acceptedBy) 
        ? JSON.stringify(request.acceptedBy) 
        : (request.acceptedBy ? JSON.stringify([request.acceptedBy]) : '[]');
      
      db.run(`
        INSERT OR REPLACE INTO requests (
          id, title, description, department, departments, status, dateCreated, 
          creator, creatorDepartment, createdAt, type, creatorRole, 
          multiDepartment, usersNeeded, acceptedBy, usersAccepted,
          lastStatusUpdate, lastStatusUpdateTime, priority, archived, archivedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        request.id,
        request.title,
        request.description,
        request.department,
        departmentsStr,
        request.status,
        request.dateCreated,
        request.creator,
        request.creatorDepartment,
        request.createdAt || request.dateCreated,
        request.type || 'request',
        request.creatorRole,
        request.multiDepartment ? 1 : 0,
        request.usersNeeded || 2,
        acceptedByStr,
        request.usersAccepted || 0,
        request.lastStatusUpdate,
        request.lastStatusUpdateTime,
        request.priority,
        request.archived ? 1 : 0,
        request.archivedAt
      ], function(err) {
        if (err) {
          console.error('Error inserting request:', err);
          reject(err);
        } else {
          // Now handle rejections if any
          if (Array.isArray(request.rejections) && request.rejections.length > 0) {
            const rejectionPromises = request.rejections.map(rejection => {
              return new Promise((resolveRejection, rejectRejection) => {
                db.run(`
                  INSERT INTO rejections (id, requestId, username, reason, date, hidden)
                  VALUES (?, ?, ?, ?, ?, ?)
                `, [
                  Date.now() + Math.random().toString(36).substring(2, 9),
                  request.id,
                  rejection.username,
                  rejection.reason || '',
                  rejection.date,
                  rejection.hidden ? 1 : 0
                ], function(rejErr) {
                  if (rejErr) rejectRejection(rejErr);
                  else resolveRejection();
                });
              });
            });
            
            Promise.all(rejectionPromises)
              .then(() => resolve())
              .catch(err => reject(err));
          } else {
            resolve();
          }
        }
      });
    });
  };
  
  Promise.all(requests.map(insertRequest))
    .then(() => {
      res.json({
        message: 'LocalStorage data migrated successfully',
        count: requests.length
      });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Serve static files from the React app for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

2. **Create a new file** at `src/api/apiConfig.js` to connect the frontend to the backend:

```javascript
// src/api/apiConfig.js
// Configure your API endpoints here

const API_URL = 'http://localhost:3000/api';

export default API_URL;
```

3. **Create a new file** at `src/api/localStorageToAPI.js` to bridge the localStorage operations in your frontend:

```javascript
// src/api/localStorageToAPI.js
import API_URL from './apiConfig';

// This function synchronizes localStorage operations with the backend API
export const syncDataWithBackend = async () => {
  try {
    // 1. Get the data from localStorage
    const requests = JSON.parse(localStorage.getItem('jd-requests') || '[]');
    const users = JSON.parse(localStorage.getItem('jd-users') || '[]');
    const departments = JSON.parse(localStorage.getItem('jd-departments') || '[]');

    // 2. Send data to backend
    if (departments.length > 0) {
      await fetch(`${API_URL}/import/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(departments)
      });
    }

    if (users.length > 0) {
      await fetch(`${API_URL}/import/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(users)
      });
    }

    if (requests.length > 0) {
      await fetch(`${API_URL}/migrate/localstorage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requests)
      });
    }

    console.log('Data synchronized with backend successfully');
    return true;
  } catch (error) {
    console.error('Error synchronizing data with backend:', error);
    return false;
  }
};

// Monkey patch localStorage methods to sync with API
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  // Call original implementation first
  originalSetItem.call(this, key, value);
  
  // If it's our app data, sync with backend
  if (key === 'jd-requests' || key === 'jd-users' || key === 'jd-departments') {
    const data = JSON.parse(value);
    
    // Determine the API endpoint based on the key
    let endpoint;
    switch (key) {
      case 'jd-requests':
        endpoint = '/migrate/localstorage';
        break;
      case 'jd-users':
        endpoint = '/import/users';
        break;
      case 'jd-departments':
        endpoint = '/import/departments';
        break;
      default:
        return;
    }
    
    // Send data to backend
    fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: value
    })
    .then(response => response.json())
    .then(result => console.log(`Data synchronized with backend (${key}):`, result))
    .catch(error => console.error(`Error syncing ${key} with backend:`, error));
  }
};

// Initialize and sync data with backend on app load
export const initBackendSync = () => {
  // Check if database has been initialized
  fetch(`${API_URL}/departments`)
    .then(res => res.json())
    .then(data => {
      if (data.length === 0) {
        console.log('Database appears empty, attempting to sync from localStorage');
        syncDataWithBackend();
      } else {
        console.log('Database already contains data', data);
      }
    })
    .catch(err => {
      console.error('Cannot connect to backend:', err);
    });
};

export default syncDataWithBackend;
```

## How to Connect Your Frontend to the Backend

1. **Modify your main application file** (e.g., src/main.tsx) to initialize the backend sync:

```javascript
// Add these lines at the top of your main.tsx or index.tsx file
import { initBackendSync } from './api/localStorageToAPI';

// Initialize backend synchronization
initBackendSync();
```

## How to Run the Backend

1. **Install dependencies** (if you haven't already):
   ```bash
   npm install express cors body-parser sqlite3
   ```

2. **Start the backend server**:
   ```bash
   node server/index.js
   ```

3. **In a separate terminal, start your frontend**:
   ```bash
   npm run dev
   ```

## Troubleshooting Common Issues

### If data is not appearing in the database:

1. **Check server logs** in the terminal where you started the backend server for any error messages.

2. **Verify database connection** by checking if the server logs show "Connected to SQLite database at...".

3. **Inspect network requests** in the browser's developer tools (F12) to ensure that the frontend is actually sending requests to the backend.

4. **Check CORS settings** if you see errors related to cross-origin requests.

5. **Verify file paths** in the server/index.js configuration to ensure the database file is being created in the expected location.

### Database access:

Use DB Browser for SQLite to open the database file at `./data/jd-requests.db`. Make sure you close the database connection in DB Browser before running your application, as SQLite files can be locked for writing by only one process at a time.

### Manual data seeding:

If you need to manually add some initial data to get started, you can use the following API endpoints from a tool like Postman:

1. Add departments:
   ```
   POST http://localhost:3000/api/import/departments
   Content-Type: application/json
   
   [
     {
       "id": "dept1",
       "name": "Engineering",
       "icon": "💻",
       "color": "#3498db"
     },
     {
       "id": "dept2",
       "name": "Marketing",
       "icon": "📈",
       "color": "#2ecc71"
     }
   ]
   ```

2. Add users:
   ```
   POST http://localhost:3000/api/import/users
   Content-Type: application/json
   
   [
     {
       "id": "user1",
       "username": "johndoe",
       "fullName": "John Doe",
       "email": "john@example.com",
       "department": "Engineering",
       "role": "admin",
       "phone": "555-1234",
       "password": "password123"
     }
   ]
   ```

3. Manually check the data in the database using DB Browser for SQLite.

## Verifying Your Setup

After following these steps, you should be able to:

1. Add new departments through the UI and see them appear in the database
2. Register new users and see them appear in the database
3. Create new requests/projects and see them appear in the database
4. Perform actions like accepting/rejecting requests and see the changes reflected in the database

The key improvement is that we've added automatic synchronization between localStorage and the SQLite database, and also added support for a new user registration endpoint.
