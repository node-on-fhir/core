// tests/nightwatch/commands/saveAndVerify.js

/**
 * Click save button and verify successful save operation
 * Waits for loading to complete and optionally checks URL
 * 
 * @param {string} saveButtonSelector - CSS selector for the save button
 * @param {string} successUrl - Optional URL substring to verify after save
 * @param {object} options - Additional options for verification
 */
exports.command = function(saveButtonSelector, successUrl, options = {}) {
  const timeout = options.timeout || 10000;
  
  this
    .click(saveButtonSelector)
    .waitForLoadingComplete(timeout);
  
  // Check for success indicators
  if (options.successMessage) {
    this.waitForElementVisible(options.successMessage, 5000);
  }
  
  // Verify URL if provided
  if (successUrl) {
    this.assert.urlContains(successUrl);
  }
  
  // Wait for any specified element to appear after save
  if (options.waitForElement) {
    this.waitForElementVisible(options.waitForElement, timeout);
  }
  
  return this;
};