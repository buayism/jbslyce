# BarberCut Reservation Management System - Frontend

## Tech Stack
- React.js
- JavaScript

## Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run the Application**:
   ```bash
   npm start
   ```
   - The frontend will start on port 3000
   - Open http://localhost:3000 in your browser

## Features

- Client-side booking form for creating reservations
- View existing reservations by client ID
- Barber/admin dashboard for managing pending reservations
- Approve or decline reservation requests
- Responsive UI with client and admin views

## Components

1. **BookingForm.js** - Allows clients to create new reservations
2. **ReservationsList.js** - Displays a client's existing reservations
3. **AdminDashboard.js** - Enables barbers to view and manage pending reservations

## API Integration

The frontend communicates with the backend API at `http://localhost:8080`. Make sure the backend is running before using the frontend.

## Error Handling

- Shows error messages for slot conflicts
- Handles network errors gracefully
- Provides user feedback for all operations