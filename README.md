# Maintenance Management System

A full-stack maintenance management system with role-based access control.

## Features

### User (Employee) Interface
- View all available equipment
- Select equipment and create maintenance requests (Corrective/Preventive)
- View own maintenance requests

### Admin Interface
- **Dashboard**: View statistics (equipment counts, maintenance status)
- **Kanban Board**: Visual board showing maintenance by status
- **Equipment Management**: Add new equipment
- **Schedule Maintenance**: Schedule open maintenance requests
- **Calendar**: View scheduled maintenance

### Technician Interface
- **Calendar**: View scheduled maintenance tasks
- **Maintenance Details**: View detailed information
- **Team Information**: View team members
- **Update Status**: Start and complete maintenance tasks

## Setup

### Backend
```bash
npm install
# Create .env with MONGO_URL, JWT_SECRET, PORT
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3001`
Backend runs on `http://localhost:3000`

## Routes Used (Existing - Not Modified)

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`

### Equipment
- `POST /api/equipment` (Admin only)
- `GET /api/equipment`
- `GET /api/equipment/:id`

### Maintenance
- `POST /api/maintenance` - Create request
- `GET /api/maintenance` - Get all (Admin only)
- `GET /api/maintenance/my` - Get technician's maintenance
- `PUT /api/maintenance/schedule` - Schedule (Admin only)
- `PUT /api/maintenance/start/:maintenanceId` - Start (Technician only)
- `PUT /api/maintenance/complete/:maintenanceId` - Complete (Technician only)

### Team
- `POST /api/team` - Create team (Admin only)
- `GET /api/team` - Get all teams with members
- `GET /api/team/available` - Get available technicians (Admin only)
- `POST /api/team/assign` - Assign technician (Admin only)
- `PUT /api/team/remove/:userId` - Remove technician (Admin only)

