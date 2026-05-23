/**
 * Profile validation utilities
 * Checks if user profile is complete before allowing bookings
 */

/**
 * Validates if a user profile is complete
 * Required fields: name, phone_number, emergency_contact, location
 * 
 * @param {Object} user - User object from database
 * @returns {Object} Validation result with isValid and missingFields
 */
export const validateProfile = (user) => {
  if (!user) {
    return {
      isValid: false,
      missingFields: ['name', 'phone_number', 'emergency_contact', 'location'],
      message: 'User profile not found',
    };
  }

  // Debug logging (remove in production)
  console.log('Validating profile:', {
    name: user.name,
    phone_number: user.phone_number,
    emergency_contact: user.emergency_contact,
    location: user.location,
  });

  const missingFields = [];
  
  // Check name (handle null, undefined, and empty strings)
  const name = user.name;
  if (!name || (typeof name === 'string' && name.trim() === '')) {
    missingFields.push('name');
    console.log('Missing name:', { name, type: typeof name, isEmpty: typeof name === 'string' && name.trim() === '' });
  }
  
  // Check phone number (handle null, undefined, and empty strings)
  const phoneNumber = user.phone_number;
  if (!phoneNumber || (typeof phoneNumber === 'string' && phoneNumber.trim() === '')) {
    missingFields.push('phone_number');
    console.log('Missing phone_number:', { phoneNumber, type: typeof phoneNumber, isEmpty: typeof phoneNumber === 'string' && phoneNumber.trim() === '' });
  }
  
  // Check emergency contact (handle null, undefined, and empty strings)
  const emergencyContact = user.emergency_contact;
  if (!emergencyContact || (typeof emergencyContact === 'string' && emergencyContact.trim() === '')) {
    missingFields.push('emergency_contact');
    console.log('Missing emergency_contact:', { emergencyContact, type: typeof emergencyContact, isEmpty: typeof emergencyContact === 'string' && emergencyContact.trim() === '' });
  }
  
  // Check location (handle null, undefined, and empty strings)
  const location = user.location;
  if (!location || (typeof location === 'string' && location.trim() === '')) {
    missingFields.push('location');
    console.log('Missing location:', { location, type: typeof location, isEmpty: typeof location === 'string' && location.trim() === '' });
  }
  
  console.log('Validation result:', { isValid: missingFields.length === 0, missingFields });

  return {
    isValid: missingFields.length === 0,
    missingFields,
    message: missingFields.length > 0
      ? `Please complete your profile. Missing: ${missingFields.join(', ')}`
      : 'Profile is complete',
  };
};

/**
 * Gets a user-friendly message for missing profile fields
 * 
 * @param {Array} missingFields - Array of missing field names
 * @returns {String} User-friendly message
 */
export const getProfileIncompleteMessage = (missingFields) => {
  const fieldLabels = {
    name: 'Name',
    phone_number: 'Phone Number',
    emergency_contact: 'Emergency Contact',
    location: 'Location',
  };

  const labels = missingFields.map(field => fieldLabels[field] || field);
  
  if (labels.length === 1) {
    return `Please update your ${labels[0]} in your profile to continue booking.`;
  } else if (labels.length === 2) {
    return `Please update your ${labels[0]} and ${labels[1]} in your profile to continue booking.`;
  } else {
    return `Please complete your profile (${labels.join(', ')}) to continue booking.`;
  }
};


