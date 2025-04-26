
## Database Schema

```sql
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
  FOREIGN KEY(creator) REFERENCES users(username)
);
```

## API Endpoints

### Accept Request
```javascript
app.post('/requests/:id/accept', (req, res) => {
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
app.post('/requests/:id/complete', (req, res) => {
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
```

