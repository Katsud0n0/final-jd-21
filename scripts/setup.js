
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const baseDir = path.join(__dirname, '..');
const dataDir = path.join(baseDir, 'data', 'excel');

console.log('🚀 Setting up the project...');

// Ensure directories exist
if (!fs.existsSync(path.join(baseDir, 'data'))) {
  fs.mkdirSync(path.join(baseDir, 'data'));
  console.log('✅ Created data directory');
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log('✅ Created data/excel directory');
}

// Check for sample data file
const sampleDataPath = path.join(baseDir, 'public', 'sample-data.xlsx');
if (!fs.existsSync(sampleDataPath)) {
  console.error('❌ Sample data file not found at: public/sample-data.xlsx');
  console.log('Please ensure the file exists before continuing.');
  process.exit(1);
}

// Install dependencies if needed
console.log('📦 Checking dependencies...');

const checkDependency = (cmd, name, installCmd) => {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    console.log(`✅ ${name} is installed`);
    return true;
  } catch (error) {
    console.log(`⚠️ ${name} is not installed`);
    
    if (installCmd) {
      const question = `Do you want to install ${name}? (y/n): `;
      rl.question(question, (answer) => {
        if (answer.toLowerCase() === 'y') {
          try {
            console.log(`Installing ${name}...`);
            execSync(installCmd, { stdio: 'inherit' });
            console.log(`✅ ${name} installed successfully`);
          } catch (err) {
            console.error(`❌ Failed to install ${name}. Please install it manually.`);
          }
        } else {
          console.log(`⚠️ ${name} is required for this application to work properly.`);
        }
        process.exit(0);
      });
      return false;
    }
  }
};

const checkNodeDependencies = () => {
  try {
    const packageJson = require(path.join(baseDir, 'package.json'));
    const requiredDeps = ['express', 'cors', 'body-parser'];
    
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies[dep]) {
        console.log(`⚠️ Missing npm dependency: ${dep}`);
        console.log(`Installing ${dep}...`);
        execSync(`npm install ${dep}`, { stdio: 'inherit' });
        console.log(`✅ Installed ${dep}`);
      } else {
        console.log(`✅ ${dep} is already in package.json`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking node dependencies:', error.message);
  }
};

// Check python and required modules
if (checkDependency('python', 'Python')) {
  try {
    execSync('python -c "import openpyxl"', { stdio: 'ignore' });
    console.log('✅ Python openpyxl module is installed');
  } catch (error) {
    console.log('⚠️ Python openpyxl module is not installed');
    console.log('Installing openpyxl...');
    try {
      execSync('pip install openpyxl', { stdio: 'inherit' });
      console.log('✅ openpyxl installed successfully');
    } catch (installError) {
      console.error('❌ Failed to install openpyxl. Please install it manually using: pip install openpyxl');
    }
  }
}

// Check node.js
checkDependency('node', 'Node.js');

// Check npm dependencies
checkNodeDependencies();

// Import sample data
console.log('📊 Importing sample data...');
try {
  execSync(`python ${path.join(baseDir, 'scripts', 'import_excel_data.py')} ${sampleDataPath}`, { stdio: 'inherit' });
  console.log('✅ Sample data imported successfully');
} catch (error) {
  console.error('❌ Failed to import sample data:', error.message);
}

// Test Excel file access
console.log('🧪 Testing Excel file access...');
try {
  const testPath = path.join(dataDir, 'requests.xlsx');
  if (fs.existsSync(testPath)) {
    console.log(`✅ Excel file exists at ${testPath}`);
    console.log('✅ Excel file permissions are correct');
  } else {
    console.error(`❌ Excel file does not exist at ${testPath}`);
    console.log('Attempting to create test file...');
    try {
      execSync(`python -c "import openpyxl; wb = openpyxl.Workbook(); wb.save('${testPath}')"`, { stdio: 'ignore' });
      console.log(`✅ Test Excel file created at ${testPath}`);
      fs.unlinkSync(testPath); // Remove test file
    } catch (err) {
      console.error(`❌ Failed to create test Excel file: ${err.message}`);
      console.log('Please check directory permissions');
    }
  }
} catch (error) {
  console.error('❌ Error testing Excel file access:', error.message);
}

console.log('\n');
console.log('🎉 Setup complete! You can now run the application.');
console.log('   Start the backend: node server/index.js');
console.log('   Start the frontend: npm run dev');
console.log('\n');

rl.close();
