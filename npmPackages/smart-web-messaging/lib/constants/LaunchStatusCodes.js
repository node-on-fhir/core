// packages/smart-web-messaging/lib/constants/LaunchStatusCodes.js

/**
 * Launch Status Code System
 * Based on the SMART Web Messaging IG FSH definition
 * @see workzone/smart-web-messaging/input/fsh/LaunchStatusCode.fsh
 */
LaunchStatusCodes = {
  SYSTEM: 'http://hl7.org/fhir/smart-web-messaging/CodeSystem/launch-status-code-system',
  
  // Status codes
  SUCCESS: 'success',
  ERROR: 'error',
  
  // Display names
  DISPLAY: {
    success: 'Successful',
    error: 'Failure'
  },
  
  // Definitions
  DEFINITION: {
    success: 'A requested activity launch was successful',
    error: 'A requested activity launch failed'
  }
};