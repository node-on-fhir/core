// /tests/nightwatch/honeycomb/crud-test-template.js

/**
 * Template for CRUD tests with CircleCI-compatible patterns
 * 
 * To use this template:
 * 1. Copy this file to crud.{resourceType}.js
 * 2. Replace all instances of {ResourceType} with your resource (e.g., Observation)
 * 3. Replace all instances of {resourceTypes} with plural lowercase (e.g., observations)
 * 4. Update test data fields to match your resource schema
 */

const loginHelper = require('../helpers/login-helper');
const circleHelper = require('../helpers/circleci-helper');

describe('{ResourceType} CRUD Operations', function() {
  const timestamp = Date.now();
  const test{ResourceType} = {
    // Add your test data fields here
    identifier: `TEST-{RESOURCETYPE}-${timestamp}`,
    status: 'active',
    // ... other fields
  };

  const updated{ResourceType} = {
    // Add your update data fields here
    status: 'inactive',
    // ... other fields
  };

  before(browser => {
    console.log('Starting {ResourceType} CRUD test suite...');
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', circleHelper.TIMEOUTS.EXTRA_LONG);
    
    // Wait for app to be fully ready
    circleHelper.waitForAppReady(browser, function(isReady) {
      if (!isReady) {
        browser.assert.fail('Application failed to become ready');
      }
    });
  });

  beforeEach(browser => {
    // Removed unnecessary pause
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', circleHelper.TIMEOUTS.LONG)
      .pause(circleHelper.TIMEOUTS.SHORT)
      .execute(function(ts) {
        window.testTimestamp = ts;
      }, [timestamp]);

    // Use the login helper for robust login handling
    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      } else {
        browser.assert.ok(true, 'User is logged in');
      }
      
      // Clean up any existing test data
      browser.executeAsync(function(done) {
        if (typeof {ResourceTypes} !== 'undefined') {
          const testRecords = {ResourceTypes}.find({ 
            $or: [
              { 'identifier.0.value': { $regex: 'TEST-{RESOURCETYPE}.*' } },
              // Add other cleanup queries specific to your resource
            ]
          }).fetch();
          testRecords.forEach(function(record) {
            {ResourceTypes}.remove({ _id: record._id });
          });
          console.log('Cleared', testRecords.length, 'test {resourceTypes}');
        }
        done();
      });
      
      browser.pause(circleHelper.TIMEOUTS.SHORT);
    });
  });

  it('02. Verify {resourceTypes} list page loads', browser => {
    circleHelper.navigateWithRetry(
      browser,
      'http://localhost:3000/{resourceTypes}',
      '#{resourceTypes}Page',
      function(success) {
        if (!success) {
          browser.assert.fail('Failed to navigate to {resourceTypes} page');
        }
      }
    );
      
    browser.execute(function() {
      const hasTable = document.querySelector('#{resourceTypes}Table') !== null;
      const hasNoDataMessage = document.querySelector('#{resourceTypes}Page') && 
                              document.querySelector('#{resourceTypes}Page').textContent.includes('No {ResourceTypes} Found');
      return {
        hasTable: hasTable,
        hasNoDataMessage: hasNoDataMessage,
        hasEitherElement: hasTable || hasNoDataMessage
      };
    }, [], function(result) {
      console.log('{ResourceTypes} page state:', result.value);
      browser.assert.ok(result.value.hasEitherElement, 
        'Either {resourceTypes} table or no-data message is present');
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/{resourceTypes}/01-{resourceTypes}-list.png');
  });

  it('03. Navigate to create new {resourceType}', browser => {
    browser
      .url('http://localhost:3000/{resourceTypes}')
      .waitForElementVisible('#{resourceTypes}Page', circleHelper.TIMEOUTS.LONG);
    
    // Click add button
    circleHelper.clickElementWithRetry(browser, '#add{ResourceType}Button', function(clicked) {
      if (!clicked) {
        // Try alternate method
        browser.execute(function() {
          const buttons = document.querySelectorAll('button');
          for (let button of buttons) {
            if (button.textContent.includes('Add') || button.textContent.includes('New')) {
              button.click();
              return true;
            }
          }
          return false;
        });
      }
    });
    
    browser
      .pause(circleHelper.TIMEOUTS.SHORT)
      .waitForElementVisible('#{resourceType}DetailPage', circleHelper.TIMEOUTS.LONG)
      .saveScreenshot('tests/nightwatch/screenshots/{resourceTypes}/02-new-{resourceType}-form.png');
  });

  it('04. Create new {resourceType} and save', browser => {
    browser
      .url('http://localhost:3000/{resourceTypes}/new')
      .waitForElementVisible('#{resourceType}DetailPage', circleHelper.TIMEOUTS.LONG);

    // Fill form fields
    browser
      .waitForElementVisible('#identifierInput', circleHelper.TIMEOUTS.LONG)
      .clearValue('#identifierInput')
      .setValue('#identifierInput', test{ResourceType}.identifier)
      // Add more fields as needed
      .pause(circleHelper.TIMEOUTS.SHORT);

    // Save with enhanced navigation handling
    circleHelper.saveWithNavigation(
      browser,
      'Save',
      '/{resourceTypes}',
      '#{resourceTypes}Page'
    );
    
    browser.saveScreenshot('tests/nightwatch/screenshots/{resourceTypes}/03-{resourceType}-saved.png');
  });

  it('05. Verify new {resourceType} appears in list', browser => {
    circleHelper.navigateWithRetry(
      browser,
      'http://localhost:3000/{resourceTypes}',
      '#{resourceTypes}Page',
      function(success) {
        if (!success) {
          browser.assert.fail('Failed to navigate to {resourceTypes} page');
        }
      }
    );
    
    // Search for our specific test record
    browser
      .waitForElementVisible('#{resourceType}SearchInput', circleHelper.TIMEOUTS.LONG)
      .clearValue('#{resourceType}SearchInput')
      .setValue('#{resourceType}SearchInput', test{ResourceType}.identifier)
      .pause(circleHelper.TIMEOUTS.SHORT);
    
    browser.execute(function(identifier) {
      const tableRows = document.querySelectorAll('#{resourceTypes}Table tbody tr');
      let found = false;
      tableRows.forEach(row => {
        if (row.textContent.includes(identifier)) {
          found = true;
        }
      });
      return found;
    }, [test{ResourceType}.identifier], function(result) {
      browser.assert.ok(result.value, 'New {resourceType} appears in the list');
    });
  });

  it('06. Edit {resourceType}', browser => {
    // Search and click the test record
    browser
      .setValue('#{resourceType}SearchInput', test{ResourceType}.identifier)
      .pause(circleHelper.TIMEOUTS.SHORT);
    
    browser.execute(function() {
      const rows = document.querySelectorAll('#{resourceTypes}Table tbody tr');
      if (rows.length > 0) {
        rows[0].click();
        return { clicked: true };
      }
      return { clicked: false };
    }, [], function(result) {
      browser.assert.ok(result.value.clicked, 'Clicked on {resourceType} row');
    });
    
    browser
      .waitForElementVisible('#{resourceType}DetailPage', circleHelper.TIMEOUTS.LONG)
      .pause(circleHelper.TIMEOUTS.SHORT);
    
    // Enter edit mode if needed
    browser.execute(function() {
      const identifierField = document.querySelector('#identifierInput');
      if (identifierField && identifierField.disabled) {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Edit')) {
            button.click();
            return 'clicked_edit';
          }
        }
      }
      return 'already_editable';
    });
    
    // Update fields
    browser
      .pause(circleHelper.TIMEOUTS.SHORT)
      // Update your fields here
      .pause(circleHelper.TIMEOUTS.SHORT);
    
    // Save changes
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Update') || button.textContent.includes('Save')) {
          button.click();
          return true;
        }
      }
      return false;
    });
    
    browser
      .pause(circleHelper.TIMEOUTS.MEDIUM)
      .saveScreenshot('tests/nightwatch/screenshots/{resourceTypes}/04-{resourceType}-updated.png');
  });

  it('07. Delete {resourceType}', browser => {
    // Navigate back to list if needed
    browser
      .url('http://localhost:3000/{resourceTypes}')
      .waitForElementVisible('#{resourceTypes}Page', circleHelper.TIMEOUTS.LONG);
    
    // Search and click the test record
    browser
      .setValue('#{resourceType}SearchInput', test{ResourceType}.identifier)
      .pause(circleHelper.TIMEOUTS.SHORT);
    
    browser.execute(function() {
      const rows = document.querySelectorAll('#{resourceTypes}Table tbody tr');
      if (rows.length > 0) {
        rows[0].click();
        return { clicked: true };
      }
      return { clicked: false };
    });
    
    browser
      .waitForElementVisible('#{resourceType}DetailPage', circleHelper.TIMEOUTS.LONG)
      .pause(circleHelper.TIMEOUTS.SHORT);
    
    // Click delete button
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Delete')) {
          button.click();
          return true;
        }
      }
      return false;
    });
    
    browser
      .pause(500)
      .acceptAlert()
      .pause(circleHelper.TIMEOUTS.MEDIUM);
    
    // Verify deletion
    browser
      .waitForElementVisible('#{resourceTypes}Page', circleHelper.TIMEOUTS.LONG)
      .execute(function(identifier) {
        const hasTable = document.querySelector('#{resourceTypes}Table') !== null;
        const hasNoData = document.querySelector('#{resourceTypes}Page').textContent.includes('No {ResourceTypes} Found');
        let stillExists = false;
        
        if (hasTable) {
          const rows = document.querySelectorAll('#{resourceTypes}Table tbody tr');
          rows.forEach(row => {
            if (row.textContent.includes(identifier)) {
              stillExists = true;
            }
          });
        }
        
        return {
          hasTable: hasTable,
          hasNoData: hasNoData,
          stillExists: stillExists
        };
      }, [test{ResourceType}.identifier], function(result) {
        browser.assert.ok(!result.value.stillExists, 
          '{ResourceType} was successfully deleted');
      });
  });

  after(browser => {
    browser.end();
  });
});