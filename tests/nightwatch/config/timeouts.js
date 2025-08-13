// tests/nightwatch/config/timeouts.js

/**
 * Centralized timeout configuration for Nightwatch tests
 * Use these constants instead of hardcoded values
 */
module.exports = {
  TIMEOUTS: {
    minimal: 1000,      // Element already visible, quick checks
    quick: 2000,        // Fast UI updates, dropdown animations
    normal: 5000,       // Standard operations, page loads
    extended: 10000,    // Data operations, API calls
    maximum: 30000      // Complex operations, large data sets
  },
  
  RETRY: {
    interval: 500,      // Time between retry attempts
    attempts: 3         // Number of retry attempts
  },
  
  ANIMATION: {
    materialUI: 300,    // Material-UI animation duration
    transition: 150     // Page transition duration
  }
};