
# Backend Setup Guide

## Project Requirements and Workflow

### Request and Project Lifecycle

#### Request Types
1. **Single Department Requests**
   - Expiration: 30 days
   - Status Notes: 
     - If rejected or expired, users should submit a new request to restart.

2. **Multi-Department Requests**
   - Expiration: 45 days
   - Status Notes: 
     - If rejected or expired, users should submit a new request to restart.

3. **Projects**
   - Initial Period: 60 days
   - Archival Period: 7 additional days after initial period
   - Status Notes: 
     - If rejected or expired, users should submit a new request to restart or contact the admin for further queries.

## Additional Implementation Notes

### Rejection and Expiration Handling
- Implement clear mechanisms to track and communicate request/project status
- Provide clear UI indicators for rejection and expiration states
- Ensure users can easily understand next steps after rejection or expiration

### Admin Interaction
- Create admin dashboard features to manage expired or rejected requests
- Implement communication channels for users to follow up on complex request scenarios

## Recommended Backend Endpoints

### Request Management
- `POST /requests/create`
- `GET /requests/list`
- `PUT /requests/{id}/status`
- `DELETE /requests/{id}`

### Project Management
- `POST /projects/create`
- `GET /projects/list`
- `PUT /projects/{id}/status`
- `DELETE /projects/{id}`
