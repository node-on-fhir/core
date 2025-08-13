// tests/nightwatch/commands/selectMaterialUIOption.js

/**
 * Select an option from a Material-UI select dropdown
 * Handles the animation delay and option selection
 * 
 * @param {string} selectSelector - CSS selector for the select input
 * @param {string} optionText - Text of the option to select
 * @param {function} callback - Optional callback for custom option selection logic
 */
exports.command = function(selectSelector, optionText, callback) {
  const self = this;
  
  this
    .click(selectSelector)
    .waitForElementVisible('[role="listbox"]', 2000)
    .execute(function(text) {
      const options = document.querySelectorAll('[role="option"]');
      for (let option of options) {
        if (option.textContent === text || option.textContent.includes(text)) {
          option.click();
          return true;
        }
      }
      // If no exact match found, try data-value attribute
      for (let option of options) {
        if (option.getAttribute('data-value') === text) {
          option.click();
          return true;
        }
      }
      return false;
    }, [optionText], function(result) {
      if (!result.value) {
        console.error(`Option "${optionText}" not found in dropdown`);
        // Click away to close the dropdown
        self.execute(function() {
          document.body.click();
        });
      }
      if (typeof callback === 'function') {
        callback.call(self, result);
      }
    })
    .pause(300); // Wait for dropdown to close
    
  return this;
};