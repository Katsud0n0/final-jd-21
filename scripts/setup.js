
const fs = require('fs');
const path = require('path');

// Create data directories
const dirs = [
  './data',
  './data/excel'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

