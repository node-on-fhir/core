// packages/patient-matching/lib/utils/identityValidation.js
import { get } from 'lodash';
import moment from 'moment';

// Identity validation utilities
export const IdentityValidation = {
  // Validate SSN format
  validateSSN: function(ssn) {
    if (!ssn) return { isValid: false, message: 'SSN is required' };
    
    const cleanSSN = ssn.replace(/\D/g, '');
    
    if (cleanSSN.length !== 9) {
      return { isValid: false, message: 'SSN must be 9 digits' };
    }
    
    // Check for invalid patterns
    if (cleanSSN === '000000000' || cleanSSN === '111111111' || 
        cleanSSN === '999999999' || cleanSSN.substring(0, 3) === '000' ||
        cleanSSN.substring(3, 5) === '00' || cleanSSN.substring(5) === '0000') {
      return { isValid: false, message: 'Invalid SSN pattern' };
    }
    
    return { isValid: true, cleaned: cleanSSN };
  },
  
  // Validate driver's license format by state
  validateDriversLicense: function(dlNumber, state) {
    if (!dlNumber || !state) {
      return { isValid: false, message: 'Driver\'s license number and state are required' };
    }
    
    // Sample state patterns (simplified)
    const statePatterns = {
      'CA': /^[A-Z]\d{7}$/,
      'NY': /^[A-Z]\d{7}$/,
      'TX': /^\d{8}$/,
      'FL': /^[A-Z]\d{12}$/,
      'IL': /^[A-Z]\d{11}$/
    };
    
    const pattern = statePatterns[state.toUpperCase()];
    if (!pattern) {
      return { isValid: true, message: 'State validation not implemented' };
    }
    
    const isValid = pattern.test(dlNumber.toUpperCase());
    return {
      isValid,
      message: isValid ? 'Valid' : `Invalid format for ${state} driver's license`
    };
  },
  
  // Validate passport number
  validatePassport: function(passportNumber, country = 'US') {
    if (!passportNumber) {
      return { isValid: false, message: 'Passport number is required' };
    }
    
    // US passport pattern
    if (country === 'US') {
      const pattern = /^[A-Z]\d{8}$|^\d{9}$/;
      const isValid = pattern.test(passportNumber.toUpperCase());
      return {
        isValid,
        message: isValid ? 'Valid' : 'Invalid US passport format'
      };
    }
    
    // Generic validation for other countries
    return {
      isValid: passportNumber.length >= 6 && passportNumber.length <= 12,
      message: 'Passport number should be 6-12 characters'
    };
  },
  
  // Validate email format
  validateEmail: function(email) {
    if (!email) {
      return { isValid: false, message: 'Email is required' };
    }
    
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = pattern.test(email);
    
    return {
      isValid,
      message: isValid ? 'Valid' : 'Invalid email format'
    };
  },
  
  // Validate phone number
  validatePhone: function(phone, country = 'US') {
    if (!phone) {
      return { isValid: false, message: 'Phone number is required' };
    }
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (country === 'US') {
      const isValid = cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
      return {
        isValid,
        message: isValid ? 'Valid' : 'US phone must be 10 digits',
        cleaned: cleaned.length === 11 ? cleaned.substring(1) : cleaned
      };
    }
    
    return {
      isValid: cleaned.length >= 10 && cleaned.length <= 15,
      message: 'Phone number should be 10-15 digits',
      cleaned
    };
  },
  
  // Validate date of birth
  validateBirthDate: function(birthDate) {
    if (!birthDate) {
      return { isValid: false, message: 'Birth date is required' };
    }
    
    const date = moment(birthDate);
    if (!date.isValid()) {
      return { isValid: false, message: 'Invalid date format' };
    }
    
    const now = moment();
    const age = now.diff(date, 'years');
    
    if (date.isAfter(now)) {
      return { isValid: false, message: 'Birth date cannot be in the future' };
    }
    
    if (age > 150) {
      return { isValid: false, message: 'Invalid birth date (too old)' };
    }
    
    return {
      isValid: true,
      age,
      formatted: date.format('YYYY-MM-DD')
    };
  },
  
  // Calculate identity assurance level
  calculateIAL: function(patient, verificationMethods = []) {
    let score = 0;
    
    // Check for verified identifiers
    const identifiers = get(patient, 'identifier', []);
    const hasVerifiedId = identifiers.some(id => {
      const extensions = get(id, 'extension', []);
      return extensions.some(ext => 
        ext.url === 'http://hl7.org/fhir/StructureDefinition/identifier-reliability' &&
        ext.valueCode === 'verified'
      );
    });
    
    if (hasVerifiedId) score += 40;
    
    // Check verification methods
    if (verificationMethods.includes('biometric')) score += 30;
    if (verificationMethods.includes('in-person')) score += 20;
    if (verificationMethods.includes('document-upload')) score += 10;
    if (verificationMethods.includes('two-factor')) score += 10;
    
    // Determine IAL
    if (score >= 90) return 'IAL3';
    if (score >= 50) return 'IAL2';
    return 'IAL1';
  },
  
  // Validate identifier checksum (Luhn algorithm)
  validateLuhn: function(number) {
    if (!number) return false;
    
    const digits = number.toString().replace(/\D/g, '');
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  },
  
  // Validate Medicare number
  validateMedicareNumber: function(medicareNumber) {
    if (!medicareNumber) {
      return { isValid: false, message: 'Medicare number is required' };
    }
    
    const cleaned = medicareNumber.replace(/\D/g, '');
    
    if (cleaned.length !== 11) {
      return { isValid: false, message: 'Medicare number must be 11 digits' };
    }
    
    return {
      isValid: true,
      cleaned,
      formatted: `${cleaned.substring(0, 3)}-${cleaned.substring(3, 5)}-${cleaned.substring(5)}`
    };
  }
};

export default IdentityValidation;