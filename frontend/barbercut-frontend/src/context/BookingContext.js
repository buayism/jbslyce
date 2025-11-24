import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [service, setService] = useState(null);
  const [barber, setBarber] = useState(null);
  const [slot, setSlot] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);

  const value = {
    service,
    barber,
    slot,
    pendingBooking,
    selectService: (s) => { setService(s); setBarber(null); },
    selectBarber: (b) => setBarber(b),
    selectSlot: (t) => setSlot(t),
    setPendingBooking,
    reset: () => { setService(null); setBarber(null); }
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
