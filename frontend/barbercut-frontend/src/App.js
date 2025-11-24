import React from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { AdminLayout, AdminDashboardHome, AdminBarbers, AdminClients, AdminReservations, AdminNotifications, AdminSettings } from './pages/admin';

import Home from './pages/Home';
import Services from './pages/Services';
import Login from './pages/Login';
import SelectBarber from './pages/SelectBarber';
import SelectSlot from './pages/SelectSlot';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import BookingSuccess from './pages/BookingSuccess';
import MyReservations from './pages/MyReservations';
import BarberDashboard from './pages/barber/BarberDashboard';
import MyProfile from './pages/barber/MyProfile';
import About from './pages/About';
import ClientDashboard from './pages/client/ClientDashboard';

// Legacy Book page removed; booking happens via new flow


function App() {
  return (
    <div className="App">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/select-barber" element={<SelectBarber />} />
          <Route path="/select-slot" element={<ProtectedRoute allowRoles={["CLIENT"]}><SelectSlot /></ProtectedRoute>} />
          <Route path="/booking-success" element={<ProtectedRoute allowRoles={["CLIENT"]}><BookingSuccess /></ProtectedRoute>} />
          <Route path="/my-reservations" element={<ProtectedRoute allowRoles={["CLIENT"]}><MyReservations /></ProtectedRoute>} />
          <Route path="/client/dashboard" element={<ProtectedRoute allowRoles={["CLIENT"]}><ClientDashboard /></ProtectedRoute>} />
          {/* Admin UI (frontend only; no auth guard) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardHome />} />
            <Route path="dashboard" element={<AdminDashboardHome />} />
            <Route path="barbers" element={<AdminBarbers />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="reservations" element={<AdminReservations />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="/barber/dashboard" element={<ProtectedRoute allowRoles={["BARBER"]}><BarberDashboard /></ProtectedRoute>} />
          <Route path="/barber/profile" element={<ProtectedRoute allowRoles={["BARBER"]}><MyProfile /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;