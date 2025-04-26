
# Backend Setup Guide

## Project Requirements and Workflow

### Request and Project Lifecycle

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

## Additional Implementation Notes

### Rejection and Expiration Handling
- Implement clear mechanisms to track and communicate request/project status
- Provide clear UI indicators for rejection and expiration states
- Ensure users can easily understand next steps after rejection or expiration
- Rejection button is enabled for all requests and projects in the user profile
- Rejection button is disabled (faded out) after a user marks an item as completed
- Projects and multi-department requests return to pending status when rejected by any participant
- Optional rejection reasons are captured via modal and displayed to request creators
- Rejection notes can be hidden individually or cleared all at once by the request creator

### Status Transitions
- Projects and multi-department requests require at least 2 participating users to move to "In Process" status
- Projects stay in "Pending" status until at least 2 users have accepted (even if creator + 1 user)
- When a new user joins a project, it should remain in "Pending" status until the minimum required users (2+) have accepted
- When a participant leaves a project or multi-department request, it immediately returns to "Pending" status
- Only after all participants mark a project or multi-department request as completed does it change to "Completed" status
- Individual completion status is tracked per user and visually indicated in the interface

### Rejection Notes System
- When rejecting any request or project, users are prompted for an optional rejection reason
- Reasons are stored with username and timestamp
- All rejection notes are displayed to the request creator in their profile under "Rejection Notes"
- Creators can hide individual notes or clear all notes at once
- Hidden notes remain hidden until the page is refreshed or all notes are cleared

### Admin Interaction
- Create admin dashboard features to manage expired or rejected requests
- Implement communication channels for users to follow up on complex request scenarios

## Database Structure

### Request/Project Storage
- SQLite database is stored in the project's data directory (typically at `./data/jd-requests.db`)
- Access using any SQLite client like DB Browser for SQLite or SQLiteStudio
- Main tables include:
  - requests: Stores all request and project information
  - rejections: Stores rejection reasons and metadata
  - users: Stores user information and roles

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

## Recommended Backend Endpoints

### Request Management
- `POST /requests/create`
- `GET /requests/list`
- `PUT /requests/{id}/status`
- `DELETE /requests/{id}`
- `POST /requests/{id}/reject` (with optional reason parameter)
- `DELETE /requests/{id}/rejections` (clears rejection notes)
- `DELETE /requests/{id}/rejections/{rejectionId}` (clears specific rejection note)

### Project Management
- `POST /projects/create`
- `GET /projects/list`
- `PUT /projects/{id}/status`
- `DELETE /projects/{id}`
- `POST /projects/{id}/reject` (with optional reason parameter)
- `DELETE /projects/{id}/rejections` (clears rejection notes)
- `DELETE /projects/{id}/rejections/{rejectionId}` (clears specific rejection note)

### Participant Management
- `POST /requests/{id}/participants` (adds a participant)
- `DELETE /requests/{id}/participants/{username}` (removes a participant)
- `POST /requests/{id}/participants/{username}/complete` (marks participant as complete)

### Rejection Notes Management
- `GET /users/{username}/rejections` (gets all rejection notes for a user)
- `DELETE /users/{username}/rejections` (clears all rejection notes)
- `DELETE /users/{username}/rejections/{rejectionId}` (clears specific rejection note)

### Data Storage Notes
- In the development environment, data is temporarily stored in browser localStorage under the key "jd-requests"
- This allows for easier testing and development without database setup
- In production, all data will be properly stored in the SQLite database described above
