# BarberCut Reservation Management System

## Overview
This is a full-stack web application for managing barbershop bookings with two main roles:
- **Client side**: Users can create reservations and view their bookings
- **Barber/Admin side**: Barbers can view pending reservations and approve/decline them

The system prevents double-booking of the same barber/time slot.

## Project Structure
```
barbercut/
├── backend/ (Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/barbercut/reservation/
│   │   │   │   ├── controller/
│   │   │   │   ├── model/
│   │   │   │   ├── repository/
│   │   │   │   ├── service/
│   │   │   │   └── BarbercutApplication.java
│   │   │   └── resources/
│   │   │       └── application.properties
│   │   └── test/
│   ├── pom.xml
│   ├── README.md
│   └── ...
└── frontend/ (React)
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── BookingForm.js
    │   │   ├── ReservationsList.js
    │   │   └── AdminDashboard.js
    │   ├── App.js
    │   ├── App.css
    │   ├── index.js
    │   └── index.css
    ├── package.json
    ├── README.md
    └── ...
```

## Backend (Spring Boot + MongoDB)

### Features
- RESTful API with endpoints for reservation management
- MongoDB integration with Spring Data MongoDB
- Compound unique index to prevent double-booking
- CORS configuration for frontend integration
- Error handling for slot conflicts

### Key Components
1. **Reservation Model**:
   - Fields: id, barberId, clientId, slot (Instant), status, notes
   - Compound index on (barberId, slot) to prevent collisions

2. **Repository**:
   - MongoDB repository with custom query methods

3. **Service**:
   - Business logic for creating reservations with collision detection
   - Methods for retrieving reservations by client or barber
   - Status update functionality

4. **Controller**:
   - REST endpoints for all required operations
   - Error handling and proper HTTP status codes

## Frontend (React + JavaScript)

### Features
- Client-side booking form
- Reservation listing by client
- Admin dashboard for managing reservations
- Responsive UI with client and admin views
- API integration using fetch()

### Components
1. **BookingForm.js**:
   - Form for creating new reservations
   - Validation and error handling
   - Real-time feedback

2. **ReservationsList.js**:
   - Displays client's existing reservations
   - Filtering by client ID

3. **AdminDashboard.js**:
   - Shows pending reservations for barbers
   - Approve/decline functionality

## API Endpoints

### Backend REST API
- `POST /api/reservations` - Create a new reservation
- `GET /api/reservations/client/{clientId}` - Get all reservations for a client
- `GET /api/reservations/barber/{barberId}/pending` - Get pending reservations for a barber
- `PUT /api/reservations/{id}/status` - Update reservation status (approve/decline)

## Setup Instructions

### Backend
1. Install Java 17+ and Maven 3.6+
2. Install MongoDB and start the service
3. Update MongoDB connection string in `application.properties`
4. Build: `mvn clean install`
5. Run: `mvn spring-boot:run`

### Frontend
1. Install Node.js (14+)
2. Install dependencies: `npm install`
3. Run: `npm start`

## Technical Details

### Collision Prevention
The system uses a compound unique index on (barberId, slot) to prevent double-booking:
```java
@Document(collection = "reservations")
@CompoundIndex(name = "barber_slot_idx", def = "{'barberId': 1, 'slot': 1}", unique = true)
public class Reservation {
    // ...
}
```

### Error Handling
- Slot conflicts return HTTP 409 (Conflict)
- Reservation not found returns HTTP 404 (Not Found)
- Frontend displays user-friendly error messages

### CORS Configuration
CORS is enabled for localhost to allow frontend-backend communication during development:
```java
@CrossOrigin(origins = "http://localhost:3000")
```