// tests/nightwatch/commands/fillMaterialUIField.js

/**
 * Fill a Material-UI text field with proper clearing and setting
 * Replaces the pattern of click -> pause -> clear -> pause -> setValue -> pause
 * 
 * @param {string} selector - CSS selector for the input field
 * @param {string} value - Value to set in the field
 * @param {number} timeout - Optional timeout for element visibility (default: 5000ms)
 */
exports.command = function(selector, value, timeout = 5000) {
  const self = this;
  
  // First wait for any modal backdrop to disappear
  this.execute(function() {
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      backdrop.click();
      return true;
    }
    return false;
  });
  
  return this
    .waitForElementVisible(selector, timeout)
    .pause(100) // Small pause to ensure element is ready
    .click(selector)
    .clearValue(selector)
    .setValue(selector, value);
};