const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure data directories exist
const dataDir = path.join(__dirname, '..', 'data');
const excelDir = path.join(dataDir, 'excel');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

if (!fs.existsSync(excelDir)) {
  fs.mkdirSync(excelDir);
}

// Helper function to run python scripts
const runPythonScript = (scriptName, args = []) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'scripts', scriptName);
    const pythonProcess = spawn('python', [scriptPath, ...args]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
      }
    });
  });
};

// Initialize sample data if Excel files don't exist
const initializeData = async () => {
  const requiredFiles = ['departments.xlsx', 'users.xlsx', 'requests.xlsx'];
  let needsInit = false;
  
  for (const file of requiredFiles) {
    const filePath = path.join(excelDir, file);
    if (!fs.existsSync(filePath)) {
      needsInit = true;
      console.log(`File not found: ${filePath}`);
    }
  }
  
  if (needsInit) {
    try {
      const sampleDataPath = path.join(__dirname, '..', 'public', 'sample-data.xlsx');
      console.log('Initializing data from sample file:', sampleDataPath);
      
      await runPythonScript('import_excel_data.py', [sampleDataPath]);
      console.log('Sample data initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
    }
  } else {
    console.log('Excel files already exist. Skipping initialization.');
  }
};

// Initialize data
initializeData();

// Create data access modules
const dataAccess = require('./data-access');

// User routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await dataAccess.getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await dataAccess.loginUser(username, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await dataAccess.updateUser(id, req.body);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Department routes
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await dataAccess.getDepartments();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Request routes
app.get('/api/requests', async (req, res) => {
  try {
    const requests = await dataAccess.getRequests();
    res.json(requests);
  } catch (error) {
    console.error('Error getting requests:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const newRequest = await dataAccess.createRequest(req.body);
    res.json(newRequest);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRequest = await dataAccess.updateRequest(id, req.body);
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dataAccess.deleteRequest(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Project and request action routes
app.post('/api/requests/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;
    const updatedRequest = await dataAccess.acceptRequest(id, username);
    res.json(updatedRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/requests/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;
    const updatedRequest = await dataAccess.completeRequest(id, username);
    res.json(updatedRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/requests/:id/abandon', async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;
    const updatedRequest = await dataAccess.abandonRequest(id, username);
    res.json(updatedRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, reason } = req.body;
    const updatedRequest = await dataAccess.rejectRequest(id, username, reason);
    res.json(updatedRequest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Archive/unarchive routes
app.post('/api/requests/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Archiving request ${id}`);
    const updatedRequest = await dataAccess.archiveRequest(id);
    console.log(`Archive result:`, updatedRequest);
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error archiving request:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/requests/:id/unarchive', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Unarchiving request ${id}`);
    const updatedRequest = await dataAccess.unarchiveRequest(id);
    console.log(`Unarchive result:`, updatedRequest);
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error unarchiving request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Filter routes
app.get('/api/requests/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const requests = await dataAccess.getUserRequests(username);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/requests/filter', async (req, res) => {
  try {
    const filters = req.query;
    const requests = await dataAccess.filterRequests(filters);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if expired
app.post('/api/requests/check-expiration', async (req, res) => {
  try {
    const result = await dataAccess.checkExpiredRequests();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Can user accept
app.post('/api/requests/:id/can-accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, department } = req.body;
    const result = await dataAccess.canUserAcceptRequest(id, username, department);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
