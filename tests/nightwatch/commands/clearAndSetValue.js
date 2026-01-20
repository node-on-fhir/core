// tests/nightwatch/commands/clearAndSetValue.js

/**
 * Clear a field and set a new value using modern WebDriver API
 * Replaces the deprecated .keys() commands
 * 
 * @param {string} selector - CSS selector for the input field
 * @param {string} value - New value to set
 */
exports.command = function(selector, value) {
  const self = this;
  
  // First ensure the element is visible and clickable
  this
    .waitForElementVisible(selector, 5000)
    .click(selector)
    .perform(function() {
      const actions = self.actions({async: true});
      return actions
        // Select all text
        .keyDown(self.Keys.CONTROL)
        .sendKeys('a')
        .keyUp(self.Keys.CONTROL)
        // Delete selected text
        .sendKeys(self.Keys.BACK_SPACE)
        // Type new value
        .sendKeys(value);
    });
    
  return this;
};