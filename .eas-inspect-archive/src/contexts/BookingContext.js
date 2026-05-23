import React, { createContext, useState, useContext } from 'react';
import { supabase } from '../config/supabase';
import { validateProfile, getProfileIncompleteMessage } from '../utils/profileValidation';

const BookingContext = createContext();

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const [currentBooking, setCurrentBooking] = useState({
    destination: null,
    provider: null,
    trip: null,
    tripType: null,
    date: null,
    pickupStation: null,
    seats: 1,
    passengers: [], // Array of { name, age } for each passenger
    vehicleType: null,
    paymentMethod: null,
  });

  const updateBooking = (data) => {
    setCurrentBooking(prev => ({ ...prev, ...data }));
  };

  const resetBooking = () => {
    setCurrentBooking({
      destination: null,
      provider: null,
      trip: null,
      tripType: null,
      date: null,
      pickupStation: null,
      seats: 1,
      passengers: [],
      vehicleType: null,
      paymentMethod: null,
    });
  };

  // Helper function to check if a string is a valid UUID
  const isValidUUID = (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const createBooking = async (userId, userProfile) => {
    try {
      // Validate user profile before creating booking
      const validation = validateProfile(userProfile);
      if (!validation.isValid) {
        const error = new Error(getProfileIncompleteMessage(validation.missingFields));
        error.code = 'PROFILE_INCOMPLETE';
        error.missingFields = validation.missingFields;
        throw error;
      }

      const price = calculateTotalPrice();
      
      // Calculate payment deadline (2 hours from now)
      const paymentDeadline = new Date();
      paymentDeadline.setHours(paymentDeadline.getHours() + 2);

      const destination = currentBooking.destination;
      
      // Validate destination_id - only use if it's a valid UUID
      // If it's mock data with string IDs, set to null
      const destinationId = destination?.id && isValidUUID(String(destination.id))
        ? destination.id
        : null;

      // Validate provider_id - only use if it's a valid UUID
      const providerId = currentBooking.provider?.id && isValidUUID(String(currentBooking.provider.id))
        ? currentBooking.provider.id
        : null;

      // Validate trip_id - use from selected trip if available
      const tripId = currentBooking.trip?.id && isValidUUID(String(currentBooking.trip.id))
        ? currentBooking.trip.id
        : null;

      const destinationName = destination?.name || 'Unknown Destination';

      const booking = {
        user_id: userId,
        trip_id: tripId,
        destination_id: destinationId,
        destination_name: destinationName,
        provider_id: providerId,
        provider_name: currentBooking.provider?.name || null,
        trip_type: currentBooking.tripType || currentBooking.trip?.trip_type,
        date: currentBooking.date || currentBooking.trip?.departure_date || currentBooking.trip?.date,
        pickup_station: currentBooking.pickupStation,
        seats: currentBooking.seats,
        passenger_details: currentBooking.passengers && currentBooking.passengers.length > 0 
          ? currentBooking.passengers 
          : null, // Store passenger details as JSONB
        vehicle_type: currentBooking.vehicleType,
        payment_method: currentBooking.paymentMethod,
        base_price: price.basePrice,
        service_fee: price.serviceFee,
        provider_fee: price.providerFee,
        total_price: price.total,
        status: 'confirmed',
        payment_status: 'pending',
        payment_deadline: paymentDeadline.toISOString(),
        qr_code: generateQRCode(),
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([booking])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      throw error;
    }
  };

  const calculateTotalPrice = () => {
    // Get price from trip if available, otherwise use default
    let basePricePerSeat = currentBooking.trip?.price || 500; // Use trip price or default to 500 ETB
    
    // Apply trip type multipliers if needed (only if not already in trip price)
    if (currentBooking.tripType === 'private' && !currentBooking.trip?.price) {
      basePricePerSeat *= 3;
    } else if (currentBooking.tripType === 'holiday' && !currentBooking.trip?.price) {
      basePricePerSeat *= 1.5;
    }

    // Calculate total base price: price per seat * number of seats
    let basePrice = basePricePerSeat * (currentBooking.seats || 1);

    // Add pickup station extra price if applicable
    if (currentBooking.pickupStation?.extraPrice) {
      basePrice += currentBooking.pickupStation.extraPrice;
    }

    // Add vehicle extra price for private trips
    if (currentBooking.vehicleType?.price) {
      basePrice += currentBooking.vehicleType.price;
    }

    const serviceFee = Math.round(basePrice * 0.05); // 5% charged to rider
    const providerFee = Math.round(basePrice * 0.05); // 5% cut from provider
    const total = basePrice + serviceFee;

    return { basePrice, serviceFee, providerFee, total };
  };

  const generateQRCode = () => {
    return `TANKUA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
  };

  const getUserBookings = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      throw error;
    }
  };

  return (
    <BookingContext.Provider
      value={{
        currentBooking,
        updateBooking,
        resetBooking,
        createBooking,
        calculateTotalPrice,
        getUserBookings,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};
