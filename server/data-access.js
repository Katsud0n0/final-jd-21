
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Base directory for Excel files
const EXCEL_DIR = path.join(__dirname, '..', 'data', 'excel');

// Ensure the Excel directory exists
if (!fs.existsSync(EXCEL_DIR)) {
  fs.mkdirSync(EXCEL_DIR, { recursive: true });
}

// Check if Excel files exist, if not we need to initialize them
const requiredFiles = ['departments.xlsx', 'users.xlsx', 'requests.xlsx'];
let needsInitialization = false;

for (const file of requiredFiles) {
  const filePath = path.join(EXCEL_DIR, file);
  if (!fs.existsSync(filePath)) {
    needsInitialization = true;
    console.log(`File not found: ${filePath}`);
  }
}

if (needsInitialization) {
  console.log('Excel files not found. Initializing with sample data.');
  const sampleDataPath = path.join(__dirname, '..', 'public', 'sample-data.xlsx');
  
  // Run Python script to initialize data
  const pythonProcess = spawn('python', [
    path.join(__dirname, '..', 'scripts', 'import_excel_data.py'), 
    sampleDataPath
  ]);
  
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python stdout: ${data.toString()}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data.toString()}`);
  });
  
  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
}

// Helper function to run Python scripts for Excel operations
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
      console.error(`Python error: ${errorOutput}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = output.trim() ? JSON.parse(output) : null;
          resolve(result);
        } catch (error) {
          console.error('Failed to parse Python output:', output);
          reject(new Error(`Failed to parse Python output: ${error.message}`));
        }
      } else {
        console.error(`Python script exited with code ${code}: ${errorOutput}`);
        reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
      }
    });
  });
};

// User operations
const getUsers = async () => {
  return runPythonScript('excel_operations.py', ['get_users']);
};

const loginUser = async (username, password) => {
  return runPythonScript('excel_operations.py', ['login_user', username, password || '']);
};

const updateUser = async (userId, userData) => {
  return runPythonScript('excel_operations.py', ['update_user', userId, JSON.stringify(userData)]);
};

// Department operations
const getDepartments = async () => {
  return runPythonScript('excel_operations.py', ['get_departments']);
};

// Request operations
const getRequests = async () => {
  return runPythonScript('excel_operations.py', ['get_requests']);
};

const createRequest = async (requestData) => {
  return runPythonScript('excel_operations.py', ['create_request', JSON.stringify(requestData)]);
};

const updateRequest = async (requestId, requestData) => {
  return runPythonScript('excel_operations.py', ['update_request', requestId, JSON.stringify(requestData)]);
};

const deleteRequest = async (requestId) => {
  return runPythonScript('excel_operations.py', ['delete_request', requestId]);
};

const acceptRequest = async (requestId, username) => {
  return runPythonScript('excel_operations.py', ['accept_request', requestId, username]);
};

const completeRequest = async (requestId, username) => {
  return runPythonScript('excel_operations.py', ['complete_request', requestId, username]);
};

const abandonRequest = async (requestId, username) => {
  return runPythonScript('excel_operations.py', ['abandon_request', requestId, username]);
};

const rejectRequest = async (requestId, username, reason = '') => {
  return runPythonScript('excel_operations.py', ['reject_request', requestId, username, reason]);
};

const getUserRequests = async (username) => {
  return runPythonScript('excel_operations.py', ['get_user_requests', username]);
};

const filterRequests = async (filters) => {
  return runPythonScript('excel_operations.py', ['filter_requests', JSON.stringify(filters)]);
};

const checkExpiredRequests = async () => {
  return runPythonScript('excel_operations.py', ['check_expired_requests']);
};

const canUserAcceptRequest = async (requestId, username, department) => {
  return runPythonScript('excel_operations.py', ['can_user_accept_request', requestId, username, department]);
};

// Archive request
const archiveRequest = async (requestId) => {
  return runPythonScript('excel_operations.py', ['archive_request', requestId]);
};

// Unarchive request
const unarchiveRequest = async (requestId) => {
  return runPythonScript('excel_operations.py', ['unarchive_request', requestId]);
};

module.exports = {
  getUsers,
  loginUser,
  updateUser,
  getDepartments,
  getRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  acceptRequest,
  completeRequest,
  abandonRequest,
  rejectRequest,
  getUserRequests,
  filterRequests,
  checkExpiredRequests,
  canUserAcceptRequest,
  archiveRequest,
  unarchiveRequest
};
