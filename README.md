
# JD Frameworks – Project Dashboard Platform

## 📚 Project Overview

**JD Frameworks** is an advanced dashboard platform for realistic department/project management with full cross-role collaboration. This README reflects:
- Exact logic for requests and projects, including the required user interaction flow  
- Special project and profile behaviors
- Privacy features
- Full SQLite backend integration instructions

---

## ✨ Features

### Request Management
- Create and track department requests  
- "Clear All Requests" is admin-only  
- Toggle between Requests and Projects views  
- Status tracking (Pending, In Process, Completed, Rejected)  
- Request expiration:  
  - Regular requests expire after 30 days if pending  
  - Multi-department requests expire after 45 days if pending
  - Completed/Rejected requests expire after 1 day  
- **Department Restriction Logic:**
  - Only users from the specified departments can accept requests/projects
  - For regular requests, only the targeted department can accept
  - For projects, only users from the 3-5 selected departments can accept
  - Users from other departments see a disabled "Not for your department" button
- **Profile/Request sync logic:**  
  - When creating project requests, the **creator is automatically included** in the list of participants  
  - Projects require a minimum of 2 and a maximum of 5 users (including creator)  
  - Projects are visible in all participants' profiles (both creator and all who accept)  
  - All users (creator + accepted) can mark project as complete; project is only "Completed" when everyone has marked complete  
  - Projects **cannot be abandoned** by any user after accepting (Abandon button is disabled for projects)
- **Advanced Filtering & Details:**
  - Filter by status, department, or text search
  - Filter accepted items by type (All, Single Requests, Multi-Department, Projects)
  - Filter history items by type (All, Single Requests, Multi-Department, Projects)
  - Clickable info icon to view request/project details
  - Multi-department selection for projects (3-5 departments required)
  - Truncated department tags with "+X more" option for projects with many departments
  - Creator department displayed below creator name
  
### Single Request & Multi-Department Behavior

- **Single Department Requests:**
  - Can only be accepted by one user from the targeted department
  - Once accepted by one user, others cannot accept it
  - When rejected, status changes to "Rejected" and cannot be accepted by others
  - Expire after 30 days if not accepted

- **Multi-Department Requests:**
  - Users can accept and view the request in their profile immediately after accepting
  - Can view and work on the request (mark complete/reject) even if minimum users haven't joined yet
  - Status only changes to "In Process" when minimum required users (2+) have accepted
  - Each participant must mark the request as "Completed" from their profile
  - Request is only marked as "Completed" when all participants have completed it AND there are at least 2 participants
  - If any user rejects/abandons the request, their username is removed from participants
  - Request returns to "Pending" status when rejected by any user
  - Expire after 45 days if not accepted
  - When creating, displays note about 45-day expiry

### Project System
- Projects require 2–5 users **(including the creator!)**
- Projects require selecting 3-5 departments during creation
- The project creator is automatically counted as the first participant
- Creator department is displayed with the creator's name
- All participants (creator + all who accept) see the project in their profile tab after accepting
- Projects cannot be abandoned once accepted (no "Abandon" option at any time)
- Each participant must independently mark the project as "Completed" in their profile
- Project status updates to "Completed" only when **all** participants mark it complete
- Users cannot reject a project after marking it as completed
- Request expiration and archiving operates as before
- Only admins can access "Clear All Requests" and archived projects in their profile

### Role-Based Access
- **Admin Features:**
  - View all requests/projects in their department
  - Change request/project status
  - Archive projects
  - Access department management
  - Clear all requests (admin only)

- **Client Features:**
  - Create requests and projects
  - Accept available projects (only from their own department)
  - View own submissions
  - Mark projects as complete
  - Cannot abandon or modify projects after accepting
  - No access to archived projects or "Clear All Requests" option

### Profile & Settings
- Privacy settings management (fully functional)
- Notification Preferences: "Coming Soon"
- Settings page: All settings except Blocking & Banning + Notifications tab work 
- Project completion logic is "all users must complete" to set status to completed
- Reject button is disabled after marking an item as completed

## 🗂️ Data Storage Options

### Local Storage (Default)
- Demo uses browser localStorage, no setup needed

### SQLite Integration
To use SQLite for persistent storage:

1. **Setup Backend:**
   ```sh
   npm install sqlite3 express cors uuid
   ```

2. **Create Database Schema:**
   See the BACKEND-SETUP.md file for the complete schema and server implementation.

3. **Run the Server:**
   ```sh
   node server.js
   ```

4. **Access the Application:**
   Open your browser to http://localhost:3000

For complete backend setup instructions including all API endpoints and necessary code, 
please refer to the BACKEND-SETUP.md file in this repository.

---

## 👩‍💻 Running The Project Locally

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>
# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>
# Step 3: Install dependencies.
npm install
# Step 4: Start the dev server.
npm run dev
```

For backend integration:
```sh
# Install additional backend dependencies
npm install sqlite3 express cors uuid
# Run the backend server
node server.js
```

---

**All user profile, requests, and project flows (including admin/client permission enforcement, department restrictions and proper project logic) are now fully implemented.**  
For help, contact [Lovable support](https://lovable.dev).
