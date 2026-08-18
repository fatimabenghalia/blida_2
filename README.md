# Association El Badr - Facility Management System

## Project Overview
This is a comprehensive facility management system for Association El Badr, an organization that provides free accommodation and transportation services for patients and their companions. The system manages buildings, rooms, beds, patient information, reservations, and staff schedules.

## System Architecture

### Backend
- **Node.js/Express API** serving multiple RESTful endpoints
- **PostgreSQL Database** for data persistence
- **JWT Authentication** for securing user sessions
- **Docker** for containerization and deployment

### Frontend
- **HTML/CSS/JavaScript** single-page application
- **Responsive Design** supporting all device sizes
- **Modern UI** with Font Awesome icons and clean design
- **Multi-lingual Support** with interface in French

## Component Structure

### Database
Nine relational tables defined in `script.sql`:
- **Administrateurs**: System administrators with login credentials
- **Batiments**: Buildings managed by the organization
- **Chambres**: Rooms within buildings
- **Lits**: Beds within rooms with availability status
- **Patients**: Patient information including medical details
- **Personnel**: Staff information and roles
- **Horaires_Personnel**: Staff schedules and assignments
- **Reservations**: Room/bed reservations with status tracking
- **Accompagnateurs**: Information about patient companions

### API Endpoints
The backend (`backend/index.js`) exposes RESTful endpoints for:
- User authentication and registration
- CRUD operations for all database entities
- Reservation management
- Resource availability tracking

### Frontend Pages
- **Homepage** (`index.html`): Showcases services with imagery
- **Login/Register** (`login.html`, `register.html`): User authentication
- **Dashboard** (`dashboard.html`): Patient reservation management
- **Reservation** (`reservation.html`): Creating new accommodation requests
- **Admin Panel** (`admin.html`): Administrative control center

## Features
- **User Authentication**: Secure login and registration
- **Reservation System**: Bed booking with status tracking
- **Administrative Controls**: User, building, and resource management
- **Responsive Design**: Mobile-friendly interface
- **Status Tracking**: Monitor reservation lifecycle

## Services Offered
- **Free Accommodation**: 45 fully equipped rooms for patients and companions
- **Free Transportation**: 24/7 transport service to hospitals
- **Meals**: Balanced meals adapted to patient needs

## Technical Implementation

### Authentication
- JWT token-based authentication
- Password hashing for security
- Role-based access control

### Data Management
- RESTful API for all CRUD operations
- Relational database with referential integrity
- Input validation and sanitization

### User Interface
- Responsive design using Flexbox and CSS Grid
- Custom styling with multiple CSS files
- Interactive elements with JavaScript event handling

## Setup Instructions

### Prerequisites
- Node.js and npm
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL (if running without Docker)

### Database Setup
```bash
# Using Docker
docker-compose up -d

# Manual PostgreSQL setup (Windows)
./setup-postgres.ps1
```

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
# Using PowerShell script
./start-frontend.ps1

# Manually
cd frontend
# Serve with any static file server
```

## Project Structure
- `backend/`: Node.js/Express API
  - `routes/`: API endpoint definitions
  - `config/`: Configuration files
- `frontend/`: Web client
  - HTML pages
  - CSS stylesheets
  - JavaScript for client-side logic
- `script.sql`: Database schema definition
- Docker configuration for deployment

## User Roles
- **Administrators**: Complete system management
- **Patients/Users**: Reservation creation and tracking

## System Workflow
1. Users register accounts through the registration page
2. Users can make reservation requests after logging in
3. Administrators review and manage reservation requests
4. System tracks room and bed availability
5. Staff schedules are managed to ensure proper coverage

## Design Features
- Professional branding with organization logo
- Blue-based color scheme with accent colors
- Responsive design supporting all device sizes
- Interactive elements with hover effects
- Status indicators for reservations (pending, accepted, rejected)

## Contact Information
- **Address**: Dar El Ihsane, Cité 1500 logts BEZ
- **Phone/Fax**: 025.30.06.73
- **Email**: contact@elbadr.org

## Comptes de test

Pour tester le système, vous pouvez utiliser les comptes suivants:

### Compte Administrateur
- Email: admin.test@elbadr.org
- Mot de passe: AdminTest123!

### Compte Patient
- Email: ahmed.benali@email.com  
- Mot de passe: Patient123! 