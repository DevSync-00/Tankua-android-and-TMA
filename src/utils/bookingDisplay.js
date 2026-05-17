/** Normalize booking record fields for ticket UI. */
export const getBookingDisplay = (booking) => {
  const pickup = booking?.pickup_station || booking?.pickupStation || {};

  return {
    destinationName: booking?.destination_name || booking?.destinationName || 'Destination',
    qrCode: booking?.qr_code || booking?.qrCode || 'N/A',
    date: booking?.date || '',
    stationName: pickup?.name || pickup?.stationName || 'Pickup Station',
    pickupTime: pickup?.pickupTime || pickup?.pickup_time || '',
    seats: booking?.seats || 1,
    totalPrice: booking?.total_price || booking?.totalPrice || 0,
    status: booking?.status || 'confirmed',
  };
};
