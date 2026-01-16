// tests/nightwatch/commands/waitForLoadingComplete.js

/**
 * Wait for all loading indicators to disappear
 * Checks for common loading patterns in Material-UI apps
 * 
 * @param {number} timeout - Maximum time to wait (default: 10000ms)
 */
exports.command = function(timeout = 10000) {
  // Check for multiple common loading indicators
  this
    .waitForElementNotPresent('.MuiCircularProgress-root', timeout)
    .waitForElementNotPresent('[data-testid="loading"]', timeout)
    .waitForElementNotPresent('.MuiLinearProgress-root', timeout)
    .waitForElementNotPresent('[role="progressbar"]', timeout);
    
  return this;
};