# JD Frameworks – Project Dashboard Platform

## 📚 Project Overview

**JD Frameworks** is a dashboard web application designed for seamless department and project management within large organizations (such as government or educational institutions). The platform helps visualize cross-department collaboration, track project progress, manage team members, requests, and analyze performance using interactive charts.

This project is developed as a college project. It is fully functional in its current form using realistic mock data, even without any backend connection!


## ✨ Features

### Request Management
- Create and track department requests
- Toggle between Requests and Projects views
- Status tracking (Pending, In Process, Approved, Rejected)
- Request expiration:
  - Regular requests expire after 30 days if pending
  - Completed/Rejected requests expire after 1 day

### Project System
- Projects require multiple users (2-5 participants)
- Project creator is automatically counted as first participant
- All participants see the project in their profile once accepted
- Project features:
  - Cannot be abandoned once accepted
  - Requires all participants to mark as complete
  - Shows acceptance progress (e.g., "Accepted by 2/3 users")
  - Auto-updates to "In Process" when required users join
  - Archives after 60 days if pending

### Role-Based Access
- **Admin Features:**
  - View all requests/projects in their department
  - Change request/project status
  - Archive projects
  - Access to department management
  - Clear all requests (admin only)
  
- **Client Features:**
  - Create requests and projects
  - Accept available projects
  - View own submissions
  - Mark projects as complete
  - Cannot modify other users' requests

### Profile & Settings
- Privacy settings management
- Notification preferences
- Account information updates
- View accepted requests and projects
- Project completion tracking

## 🗂️ Data Storage Options

### Local Storage (Default)
- All data persists in browser's localStorage
- Perfect for demos and testing
- No setup required

### SQLite Integration (Optional)
To use SQLite for persistent storage:

1. **Setup Backend:**
   ```sh
   npm install sqlite3 express cors
   ```

2. **Create Database Schema:**
   ```sql
   -- Users table
   CREATE TABLE users (
     id TEXT PRIMARY KEY,
     username TEXT UNIQUE,
     fullName TEXT,
     department TEXT,
     email TEXT,
     role TEXT,
     status TEXT DEFAULT 'active'
   );

   -- Requests table
   CREATE TABLE requests (
     id TEXT PRIMARY KEY,
     title TEXT,
     description TEXT,
     department TEXT,
     creator TEXT,
     status TEXT,
     type TEXT,
     dateCreated TEXT,
     usersNeeded INTEGER,
     usersAccepted INTEGER DEFAULT 0,
     FOREIGN KEY(creator) REFERENCES users(username)
   );

   -- Request participants
   CREATE TABLE request_participants (
     request_id TEXT,
     username TEXT,
     status TEXT,
     completedAt TEXT,
     FOREIGN KEY(request_id) REFERENCES requests(id),
     FOREIGN KEY(username) REFERENCES users(username)
   );
   ```

3. **Configure Express Server:**
   Create `backend/server.js`:
   ```javascript
   const express = require('express');
   const sqlite3 = require('sqlite3');
   const cors = require('cors');
   
   const app = express();
   app.use(cors());
   app.use(express.json());
   
   const db = new sqlite3.Database('./database.sqlite');
   
   // Define your API endpoints here
   
   app.listen(3000, () => {
     console.log('Server running on port 3000');
   });
   ```

4. **Update Frontend:**
   - Replace localStorage calls with API requests
   - Add proper error handling
   - Implement user sessions

## 🛠️ Technologies Used

- **Frontend:** React + TypeScript + Vite
- **UI Kit:** shadcn/ui, Tailwind CSS
- **Routing:** react-router-dom
- **Charts:** recharts
- **State Management & Data Fetching:** @tanstack/react-query (future-proofing)
- **Persistent Storage:** browser localStorage for requests, static files for sample data

No backend is required to use or demo the platform!


## 🗂️ Where is the Data Stored?

### Home Tab & Analytics

- **Source:** All analytics charts and summary data (collaboration, interactions, project rates) are defined in `src/data/collaboration-data.ts`.
- **How it Works:** This data is hardcoded and realistic, so the demo works out-of-the-box.
- **Custom Backend:** If you later connect a real backend (such as a SQLite API), you should replace this mock data with API calls.

### Requests & User Interactions

- **Source:** User-created requests are stored in `localStorage`, so all create/delete actions are retained on your browser.


## ⛔ Note for Your Project Submission

You do **NOT** need to connect a backend for this college project. All demo and interaction data comes from static files or local browser storage – simply clone and run!


---

## 💡 Role-Based System & SQLite Backend Integration

### Role-Based System Explanation

The app includes a complete role-based viewing system:

- **Admin Users:**
  - Can view all requests and projects across departments
  - Can change the status of any request (Pending, In Process, Approved, Rejected)
  - Can archive projects to hide them from the main view
  - Can delete any submission
  - Have access to special views for department management

- **Client Users:**
  - Can only view their own submissions
  - Cannot modify status, archive, or delete other users' requests
  - See request/project status in read-only mode

For demo purposes, the following login credentials are available:
- **Admin:** admin@[department].com (e.g., admin@water.com, admin@health.com)
- **Client:** Any email not matching the admin pattern

### Can I Run This With SQLite Locally?

Yes! This application is designed to work with a local SQLite database if needed. The current implementation uses localStorage for simplicity, but you can connect a SQLite backend for more robust data persistence.

Benefits of adding SQLite:
- **Persistent storage** across browser sessions
- **Multi-user access** for true role-based authentication
- **Robust data relationships** between departments, users, and requests
- **Query capabilities** for advanced reporting

The repository includes:
1. `scripts/import_excel_data.py` - A script to import initial data
2. SQL schema examples (in comments in `src/data/collaboration-data.ts`)
3. Instructions for setting up Express.js with SQLite

### (Optional) How To Connect SQLite Backend

**You only need this if you want real backend data! The project works fine with mock data for college submissions.**

### 1. Set Up SQLite + Express Backend

- Install dependencies:
  ```sh
  npm install sqlite3 express cors
  ```
- Create an `Express` server (see example in `src/data/collaboration-data.ts` for guidance).
- Build API endpoints to read/write data from SQLite (projects, departments, requests, etc).

### 2. Update Database Schema

- Write your schema using the example provided in `src/data/collaboration-data.ts` (inside comments).

### 3. Connect Frontend to Backend

- Replace mock data/statics in files like `src/data/collaboration-data.ts` with `fetch`/`axios` API calls to your backend endpoints.
- Adapt localStorage request logic (in `RequestForm.tsx` and wherever requests are displayed) to POST/GET requests to your server for persistent storage.

### 4. Testing

- Start your backend server (e.g., `node backend/server.js`).
- Update frontend code to use your backend URL (instead of static data).
- Confirm data shows up live from your API.

For college submissions, demo works fully without this step!


---

## 👩‍💻 Running The Project Locally

Just follow these simple steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm install

# Step 4: Start the development server.
npm run dev
```

Open `http://localhost:5173` (or the port Vite shows) in your browser to use the app.

---

## 📝 Important Files & Comments

- Analytics & charts mock data:  
  `src/data/collaboration-data.ts` (fully commented, includes SQLite backend example)
- Departments list:  
  `src/data/departments.ts`
- Team members:  
  `src/data/team.ts`
- Request logic & demo:  
  `src/components/dashboard/RequestForm.tsx` (comments show how localStorage works)
- All code is commented for smoother understanding and future integrations!

---

## 🗣️ Contact

For help, suggestions, or contributions, feel free to contact [Lovable support](https://lovable.dev) or post on [Lovable Discord](https://discord.gg/7TzaT2ehE9).

---

**This project is intended for educational/demo purposes.**  
Leave the mock data as is for your college submission, or follow the steps above to add real backend integration in the future!
