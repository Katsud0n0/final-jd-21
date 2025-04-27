
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

2. **Create a migration script** at `scripts/migrate_to_sqlite.js`:

```javascript
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Function to migrate localStorage data to SQLite
async function migrateToSQLite() {
  try {
    console.log('Starting migration from localStorage to SQLite...');
    
    // Read localStorage data from a JSON file (you'll need to export this first)
    const localStorageFile = path.join(__dirname, '../data/localStorage_export.json');
    
    if (!fs.existsSync(localStorageFile)) {
      console.error('localStorage export file not found. Please run the export script first.');
      process.exit(1);
    }
    
    const localStorageData = JSON.parse(fs.readFileSync(localStorageFile, 'utf8'));
    const requests = localStorageData['jd-requests'] || [];
    
    if (!requests.length) {
      console.log('No requests found in localStorage export.');
      return;
    }
    
    console.log(`Found ${requests.length} requests to migrate.`);
    
    // Send data to backend migration endpoint
    const response = await fetch('http://localhost:3000/api/migrate/localstorage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requests)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('Migration successful:', result.message);
      console.log(`Migrated ${result.count} requests to SQLite database.`);
    } else {
      console.error('Migration failed:', result.error);
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}

migrateToSQLite();
```

### Connecting Frontend to Backend

To connect your frontend React application to the SQLite backend, update the API utility:

```javascript
// No changes needed to src/api/index.ts - it's already set up to connect to the backend
// Just make sure the backend server is running on http://localhost:3000
```

### Data Migration From LocalStorage to SQLite

1. **Create Export Script** at `scripts/export_localStorage.js`:

```javascript
const fs = require('fs');
const path = require('path');
const prompt = require('prompt-sync')({ sigint: true });

// Function to export localStorage data
function exportLocalStorage() {
  try {
    console.log('This script will help you export localStorage data from your browser to a JSON file.');
    console.log('\nInstructions:');
    console.log('1. Open your browser and navigate to your application');
    console.log('2. Open Developer Tools (F12 or right-click -> Inspect)');
    console.log('3. Go to the Console tab');
    console.log('4. Run this command: copy(JSON.stringify(localStorage))');
    console.log('5. Paste the copied data below:');
    
    const data = prompt('\nPaste localStorage data: ');
    
    try {
      const parsedData = JSON.parse(data);
      
      // Create data directory if it doesn't exist
      const dataDir = path.join(__dirname, '../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Save to file
      const outputFile = path.join(dataDir, 'localStorage_export.json');
      fs.writeFileSync(outputFile, JSON.stringify(parsedData, null, 2));
      
      console.log(`\nData successfully exported to: ${outputFile}`);
      console.log('You can now run the migration script to import this data into SQLite.');
    } catch (parseError) {
      console.error('Error parsing localStorage data:', parseError.message);
      console.log('Make sure you copied the data correctly.');
    }
  } catch (error) {
    console.error('Error exporting data:', error);
  }
}

exportLocalStorage();
```

### Project Requirements and Workflow

The request and project lifecycle information from the original document remains unchanged:

#### Request Types
1. **Single Department Requests**
   - Expiration: 30 days
   - Status Notes: 
     - If rejected or expired, users should submit a new request to restart.
     - When rejected, status changes back to "Pending" from "In Process"
     - When rejected, rejection reason is stored and sent to creator
     - Rejection notes are displayed in the user's profile and can be cleared individually or all at once
     - When rejecting a single request, users are prompted to provide an optional reason for the rejection

2. **Multi-Department Requests**
   - Expiration: 45 days
   - Status Notes: 
     - If rejected or expired, users should submit a new request to restart.
     - When any participant rejects, the status changes back to "Pending" and that user is removed from participants
     - When rejected, rejection reason is stored and sent to creator
     - Request stays in "Pending" until at least 2 users accept
     - If user count drops below 2, request returns to "Pending" status
     - Rejection notes are displayed in the user's profile and can be cleared individually or all at once

3. **Projects**
   - Initial Period: 60 days
   - Archival Period: 7 additional days after initial period
   - Status Notes: 
     - If rejected or expired, users should submit a new request to restart or contact the admin for further queries.
     - Projects can be rejected by participants at any time
     - When any participant rejects a project, they are removed from the participant list and status changes back to "Pending"
     - Projects follow the same participant logic as multi-department requests
     - Project stays in "Pending" until at least 2 users accept
     - If user count drops below 2, project returns to "Pending" status
     - When a user joins a project, status remains "Pending" until the minimum required users (2+) have accepted
     - Rejection reasons are stored and sent to creator
     - Rejection notes are displayed in the user's profile and can be cleared individually or all at once

## How to Run the Backend

1. **Install dependencies**:
   ```bash
   npm install express cors body-parser sqlite3 prompt-sync node-fetch
   ```

2. **Initialize the database**:
   ```bash
   mkdir -p ./data
   node server/index.js
   ```

3. **Export localStorage data** (if migrating from existing app):
   ```bash
   node scripts/export_localStorage.js
   ```

4. **Migrate data to SQLite** (after exporting):
   ```bash
   node scripts/migrate_to_sqlite.js
   ```

5. **Run in development mode**:
   ```bash
   # Terminal 1 - Backend server
   node server/index.js
   
   # Terminal 2 - Frontend development server
   npm run dev
   ```

6. **Run in production mode**:
   ```bash
   # Build frontend
   npm run build
   
   # Run backend (will serve frontend from dist folder)
   NODE_ENV=production node server/index.js
   ```

## Database Structure

### Request/Project Storage
- SQLite database is stored in the project's data directory at `./data/jd-requests.db`
- Access using any SQLite client like DB Browser for SQLite or SQLiteStudio
- Main tables include:
  - requests: Stores all request and project information
  - rejections: Stores rejection reasons and metadata
  - users: Stores user information and roles
  - departments: Stores department information
  - participants_completed: Tracks which users have marked requests as completed

### Local Database Access

#### SQLite Database Location
The SQLite database file is located at `./data/jd-requests.db` in the project root directory.

#### How to View the Database
1. Download and install a SQLite browser like "DB Browser for SQLite" (https://sqlitebrowser.org/)
2. Open the application and select "Open Database"
3. Navigate to your project directory and select the `./data/jd-requests.db` file
4. You can now browse tables, run queries, and examine the data structure

#### Alternative Using SQLite CLI
1. Install SQLite command-line tool if not already installed
2. Open a terminal in your project directory
3. Run `sqlite3 ./data/jd-requests.db`
4. Use SQLite commands like `.tables` to see available tables, and SQL queries to examine data

## Import Sample Data

To import the sample Excel data, use the provided Python script:

```bash
pip install openpyxl
python scripts/import_excel_data.py public/sample-data.xlsx
```
