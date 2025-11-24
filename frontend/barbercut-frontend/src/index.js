import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { BookingProvider } from './context/BookingContext';
import { AuthProvider } from './context/AuthContext';

const bootstrapCdn = document.createElement('link');
bootstrapCdn.rel = 'stylesheet';
bootstrapCdn.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css';
bootstrapCdn.crossOrigin = 'anonymous';
document.head.appendChild(bootstrapCdn);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BookingProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  </React.StrictMode>
);