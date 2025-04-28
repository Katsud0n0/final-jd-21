
# Backend Setup Guide

## Excel Database Setup

### Initial Setup

1. **Create Data Directory**:
   ```bash
   mkdir -p ./data/excel
   ```

2. **Install Required Dependencies**:
   ```bash
   npm install express cors body-parser
   pip install openpyxl
   ```

3. **Data Location**: 
   All data is stored in Excel files in the `./data/excel` directory:
   - `departments.xlsx`: Department information
   - `users.xlsx`: User data
   - `requests.xlsx`: All requests and their statuses

## Backend Server Setup

### Express Server Setup

1. **Install Node.js Dependencies**:
   ```bash
   npm install express cors body-parser
   ```

2. **Start the Backend Server**:
   ```bash
   node server/index.js
   ```

   The server will start on port 3000 by default.

### Python Data Processing Setup

1. **Install Python Dependencies**:
   ```bash
   pip install openpyxl
   ```

2. **Import Sample Data**:
   ```bash
   python scripts/import_excel_data.py public/sample-data.xlsx
   ```

## Data Storage Locations

1. **Excel Files** (./data/excel/):
   - departments.xlsx
   - users.xlsx
   - requests.xlsx

2. **Sample Data**:
   - Location: `public/sample-data.xlsx`
   - Use this as a template for your data structure

## Excel File Structure

### departments.xlsx
- id (Text)
- name (Text)
- icon (Text)
- color (Text)
- description (Text)

### users.xlsx
- id (Text)
- username (Text)
- fullName (Text)
- email (Text)
- department (Text)
- role (Text)
- phone (Text)
- password (Text)

### requests.xlsx
- id (Text)
- title (Text)
- description (Text)
- department (Text)
- status (Text)
- dateCreated (Date)
- creator (Text)
- type (Text)
- multiDepartment (Boolean)
- usersNeeded (Number)
- archived (Boolean)
- archivedAt (Date)

## Running the Project

1. **Start the Backend**:
   ```bash
   node server/index.js
   ```

2. **Start the Frontend**:
   ```bash
   npm run dev
   ```

3. **Access the Application**:
   Open your browser and navigate to `http://localhost:5173`

## Troubleshooting

1. **Data Access**:
   - Excel files are stored in `./data/excel/`
   - You can open these files directly with Microsoft Excel or similar software
   - Make sure to close Excel before running the application to avoid file locks

2. **Common Issues**:
   - If you get file access errors, ensure Excel files aren't open in another program
   - Check that all required directories exist
   - Verify Python and Node.js are installed correctly

3. **Data Backup**:
   - Regular backups of the Excel files are recommended
   - Keep a copy of `sample-data.xlsx` as a template

## Development Guidelines

1. **Adding New Fields**:
   - Update both Excel templates and backend validation
   - Maintain consistent data types across all layers

2. **Data Validation**:
   - All dates should be in ISO format
   - IDs should be unique
   - Required fields must not be empty

3. **Security**:
   - Keep Excel files in a secure location
   - Implement proper access controls
   - Regular backup of data files
