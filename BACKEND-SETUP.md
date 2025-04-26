


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

2. **Multi-Department Requests**
   - Expiration: 45 days
   - Status Notes: 
     - If rejected or expired, users should submit a new request to restart.
     - When any participant rejects, the status changes back to "Pending" and that user is removed from participants
     - When rejected, rejection reason is stored and sent to creator
     - Request stays in "Pending" until at least 2 users accept
     - If user count drops below 2, request returns to "Pending" status

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
     - Rejection reasons are stored and sent to creator

## Additional Implementation Notes

### Rejection and Expiration Handling
- Implement clear mechanisms to track and communicate request/project status
- Provide clear UI indicators for rejection and expiration states
- Ensure users can easily understand next steps after rejection or expiration
- Rejection button is enabled for all requests and projects in the user profile
- Projects and multi-department requests return to pending status when rejected by any participant
- Optional rejection reasons are captured and displayed to request creators

### Admin Interaction
- Create admin dashboard features to manage expired or rejected requests
- Implement communication channels for users to follow up on complex request scenarios

## Recommended Backend Endpoints

### Request Management
- `POST /requests/create`
- `GET /requests/list`
- `PUT /requests/{id}/status`
- `DELETE /requests/{id}`
- `POST /requests/{id}/reject` (with optional reason parameter)

### Project Management
- `POST /projects/create`
- `GET /projects/list`
- `PUT /projects/{id}/status`
- `DELETE /projects/{id}`
- `POST /projects/{id}/reject` (with optional reason parameter)

