import { createContext, useContext, useState } from 'react';

type BookingContextType = {
  guestId: string | null;
  setGuestId: (id: string | null) => void;
  clearBookingData: () => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [guestId, setGuestId] = useState<string | null>(null);

  const clearBookingData = () => {
    setGuestId(null);
  };

  return (
    <BookingContext.Provider value={{ guestId, setGuestId, clearBookingData }}>
      {children}
    </BookingContext.Provider>
  );
}

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}; 