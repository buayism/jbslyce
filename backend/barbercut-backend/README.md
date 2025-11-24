# BarberCut Reservation Management System - Backend

## Tech Stack
- Java 17
- Spring Boot 3.3.4
- MongoDB

## Prerequisites
- Java 17 or higher
- Maven 3.6+
- MongoDB (local or remote instance)

## Setup Instructions

1. **Install MongoDB**:
   - Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Or use MongoDB Atlas for a cloud database
   - Start the MongoDB service

2. **Configure MongoDB Connection**:
   - Update the connection string in `src/main/resources/application.properties`:
   ```
   spring.data.mongodb.uri=mongodb://localhost:27017/barbercut
   ```
   - Replace with your MongoDB connection string if using a remote database

3. **Build the Application**:
   ```bash
   mvn clean install
   ```

4. **Run the Application**:
   ```bash
   mvn spring-boot:run
   ```
   - The backend will start on port 8080

## API Endpoints

- `POST /api/reservations` - Create a new reservation
- `GET /api/reservations/client/{clientId}` - Get all reservations for a client
- `GET /api/reservations/barber/{barberId}/pending` - Get pending reservations for a barber
- `PUT /api/reservations/{id}/status` - Update reservation status (approve/decline)

## Features

- Prevents double-booking with compound unique index on (barberId, slot)
- RESTful API design
- Error handling for slot conflicts
- CORS enabled for frontend integration