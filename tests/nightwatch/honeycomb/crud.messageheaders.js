// tests/nightwatch/honeycomb/crud.messageheaders.js

// MessageHeaders is an infrastructure resource - no patient tracking needed

const testUtils = require('./enable_autopublish/shared-test-utils');
const loginHelper = require('../helpers/login-helper');
const saveNavigationHelper = require('../helpers/save-navigation-helper');

describe('MessageHeaders CRUD Operations', function() {
  const timestamp = Date.now();
  const testMessageHeader = {
    eventCoding: 'diagnosticreport-provide',
    eventDisplay: 'Provide Diagnostic Report',
    eventUri: 'http://hl7.org/fhir/message-events',
    destinationName: `Test Destination ${timestamp}`,
    destinationEndpoint: `http://example.org/endpoint/${timestamp}`,
    destinationTarget: 'Device/test-device-' + timestamp,
    destinationTargetDisplay: 'Test Device ' + timestamp,
    senderEndpoint: `http://example.org/sender/${timestamp}`,
    senderTarget: 'Organization/test-org-' + timestamp,
    senderTargetDisplay: 'Test Organization ' + timestamp,
    reasonCode: 'routine-notification',
    reasonDisplay: 'Routine Notification',
    responseCode: 'ok',
    responseId: `response-${timestamp}`,
    focusTarget: 'Patient/test-patient-' + timestamp,
    focusDisplay: 'Test Patient',
    notes: `Test message header created at ${timestamp}`
  };

  const updatedMessageHeader = {
    eventDisplay: `Updated Event ${timestamp}`,
    destinationName: `Updated Destination ${timestamp}`,
    responseCode: 'transient-error',
    notes: `Test message header updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting MessageHeaders CRUD test suite...');
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  beforeEach(browser => {
    // Removed unnecessary pause
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .pause(1000)
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
        if (typeof MessageHeaders !== 'undefined') {
          const testMessageHeaders = MessageHeaders.find({ 
            $or: [
              { 'destination.0.name': { $regex: '.*Destination.*' } },
              { 'sender.endpoint': { $regex: '.*sender.*' } },
              { 'response.identifier': { $regex: 'response-.*' } }
            ]
          }).fetch();
          testMessageHeaders.forEach(function(messageHeader) {
            MessageHeaders.remove({ _id: messageHeader._id });
          });
          console.log('Cleared', testMessageHeaders.length, 'test message headers');
        }
        done();
      });
      
      browser.pause(1000);
    });
  });

  it('02. Verify message headers list page loads', browser => {
    testUtils.navigateUrl(browser, '/message-headers');
    browser
      .waitForElementVisible('#messageHeadersPage', 5000)
      .pause(1000);
      
    browser.execute(function() {
        const hasTable = document.querySelector('#messageHeadersTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#messageHeadersPage') && 
                             document.querySelector('#messageHeadersPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either message headers table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/message-headers/02-message-headers-list.png');
  });

  it('03. Navigate to new message header form', browser => {
    browser
      .waitForElementVisible('#messageHeadersPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Message Header') || 
              button.textContent.includes('Add Your First Message Header')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Message Header button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#messageHeaderDetailPage', 5000)
      .assert.elementPresent('#eventCodingInput')
      .assert.elementPresent('#eventDisplayInput')
      .assert.elementPresent('#eventUriInput')
      .assert.elementPresent('#destinationNameInput')
      .assert.elementPresent('#destinationEndpointInput')
      .assert.elementPresent('#destinationTargetInput')
      .assert.elementPresent('#destinationTargetDisplayInput')
      .assert.elementPresent('#senderEndpointInput')
      .assert.elementPresent('#senderTargetInput')
      .assert.elementPresent('#senderTargetDisplayInput')
      .assert.elementPresent('#reasonCodeInput')
      .assert.elementPresent('#reasonDisplayInput')
      .assert.elementPresent('#responseCodeSelect')
      .assert.elementPresent('#responseIdInput')
      .assert.elementPresent('#focusTargetInput')
      .assert.elementPresent('#focusDisplayInput')
      .assert.elementPresent('#notesTextarea')
      .pause(1000)
      .execute(function() {
        const focusField = document.querySelector('#focusTargetInput');
        return {
          focusValue: focusField ? focusField.value : null,
          sessionPatientId: typeof Session !== 'undefined' ? Session.get('selectedPatientId') : null,
          sessionPatient: typeof Session !== 'undefined' ? Session.get('selectedPatient') : null
        };
      }, [], function(result) {
        console.log('Form initialization check:', result.value);
      })
      .saveScreenshot('tests/nightwatch/screenshots/message-headers/03-new-message-header-form.png');
  });

  it('04. Create new message header', browser => {
    browser
      .waitForElementVisible('#messageHeaderDetailPage', 5000)
      .pause(500);

    // Check if we're on the new message header page
    browser.assert.urlContains('/message-headers/new');

    // Focus field is optional and doesn't need to be populated

    // Check if form is in edit mode
    browser.execute(function() {
      const eventCodingField = document.querySelector('#eventCodingInput');
      if (eventCodingField && eventCodingField.disabled) {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Edit')) {
            button.click();
            return 'clicked_edit';
          }
        }
      }
      return 'already_editable';
    }, [], function(result) {
      console.log('Edit mode check:', result.value);
    });

    // Fill form fields
    browser
      .pause(500);
      
    // Handle Material-UI Select for eventCoding
    browser.execute(function(eventCode) {
      console.log('Setting eventCoding to:', eventCode);
      const eventSelect = document.querySelector('#eventCodingInput');
      if (eventSelect) {
        console.log('Found eventSelect element');
        // For Material-UI Select, we need to trigger the onChange event
        // First click to open the dropdown
        eventSelect.click();
        
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          console.log('Found', options.length, 'options');
          let found = false;
          
          for (let option of options) {
            const optionValue = option.getAttribute('data-value');
            console.log('Option value:', optionValue, 'text:', option.textContent);
            
            if (optionValue === eventCode) {
              console.log('Clicking option with value:', optionValue);
              option.click();
              found = true;
              
              // Verify the selection was made
              setTimeout(() => {
                const updatedValue = eventSelect.value || eventSelect.querySelector('input')?.value;
                console.log('Event coding after selection:', updatedValue);
              }, 100);
              
              break;
            }
          }
          
          if (!found) {
            console.error('Could not find option with value:', eventCode);
          }
        }, 500);
      } else {
        console.error('Could not find eventCodingInput element!');
      }
      return true;
    }, [testMessageHeader.eventCoding]);
    
    browser
      .pause(1000)  // Wait longer for the select to complete
      .clearValue('#eventDisplayInput')
      .setValue('#eventDisplayInput', testMessageHeader.eventDisplay)
      .clearValue('#eventUriInput')
      .setValue('#eventUriInput', testMessageHeader.eventUri)
      .clearValue('#destinationNameInput')
      .setValue('#destinationNameInput', testMessageHeader.destinationName)
      .clearValue('#destinationEndpointInput')
      .setValue('#destinationEndpointInput', testMessageHeader.destinationEndpoint)
      .clearValue('#destinationTargetInput')
      .setValue('#destinationTargetInput', testMessageHeader.destinationTarget)
      .clearValue('#destinationTargetDisplayInput')
      .setValue('#destinationTargetDisplayInput', testMessageHeader.destinationTargetDisplay)
      .clearValue('#senderEndpointInput')
      .setValue('#senderEndpointInput', testMessageHeader.senderEndpoint)
      .clearValue('#senderTargetInput')
      .setValue('#senderTargetInput', testMessageHeader.senderTarget)
      .clearValue('#senderTargetDisplayInput')
      .setValue('#senderTargetDisplayInput', testMessageHeader.senderTargetDisplay)
      .pause(500);
      
    // Handle Material-UI Select for reasonCode
    browser.execute(function(reasonCode) {
      const reasonSelect = document.querySelector('#reasonCodeInput');
      if (reasonSelect) {
        reasonSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === reasonCode) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testMessageHeader.reasonCode]);
    
    browser
      .pause(1000)  // Wait longer for the select to complete
      .clearValue('#reasonDisplayInput')
      .setValue('#reasonDisplayInput', testMessageHeader.reasonDisplay)
      .clearValue('#responseIdInput')
      .setValue('#responseIdInput', testMessageHeader.responseId)
      .clearValue('#focusDisplayInput')
      .setValue('#focusDisplayInput', testMessageHeader.focusDisplay)
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', testMessageHeader.notes)
      .pause(500);

    // Verify required fields are filled correctly
    browser.execute(function(messageHeader) {
      const results = {};
      
      // Check all important fields
      const eventCodingField = document.querySelector('#eventCodingInput');
      if (eventCodingField) {
        results.eventCoding = eventCodingField.value;
        results.eventCodingType = eventCodingField.tagName;
      }
      
      const destinationNameField = document.querySelector('#destinationNameInput');
      if (destinationNameField) {
        results.destinationName = destinationNameField.value;
      }
      
      const destinationEndpointField = document.querySelector('#destinationEndpointInput');
      if (destinationEndpointField) {
        results.destinationEndpoint = destinationEndpointField.value;
      }
      
      const sourceEndpointField = document.querySelector('#senderEndpointInput');
      if (sourceEndpointField) {
        results.sourceEndpoint = sourceEndpointField.value;
        results.sourceEndpointRequired = sourceEndpointField.hasAttribute('required');
      }
      
      const responseIdField = document.querySelector('#responseIdInput');
      if (responseIdField) {
        results.responseId = responseIdField.value;
      }
      
      const notesField = document.querySelector('#notesTextarea');
      if (notesField) {
        results.notes = notesField.value;
      }
      
      return results;
    }, [testMessageHeader], function(result) {
      console.log('Form field values after setValue:', result.value);
      if (!result.value.sourceEndpoint) {
        browser.assert.fail('Required source endpoint field is empty');
      }
    });

    // Handle Material-UI Select components
    browser.execute(function(responseCode) {
      console.log('Trying to set response code to:', responseCode);
      const responseCodeSelect = document.querySelector('#responseCodeSelect');
      if (responseCodeSelect) {
        console.log('Found responseCodeSelect, current value:', responseCodeSelect.value);
        responseCodeSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          console.log('Found', options.length, 'options');
          let found = false;
          for (let option of options) {
            console.log('Option:', option.getAttribute('data-value'), option.textContent);
            if (option.getAttribute('data-value') === responseCode || 
                option.textContent.toLowerCase().includes(responseCode)) {
              console.log('Clicking option:', option.textContent);
              option.click();
              found = true;
              break;
            }
          }
          if (!found) {
            console.error('Could not find option for response code:', responseCode);
          }
        }, 300);
      } else {
        console.error('responseCodeSelect not found!');
      }
    }, [testMessageHeader.responseCode]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/message-headers/04-filled-message-header-form.png');

    // Log form values before save
    browser.execute(function() {
      const eventCodingField = document.querySelector('#eventCodingInput');
      const destinationNameField = document.querySelector('#destinationNameInput');
      const responseIdField = document.querySelector('#responseIdInput');
      
      console.log('=== Form values before save ===');
      console.log('Event coding:', eventCodingField ? eventCodingField.value : 'not found');
      console.log('Destination name:', destinationNameField ? destinationNameField.value : 'not found');
      console.log('Response ID:', responseIdField ? responseIdField.value : 'not found');
      
      const responseCodeSelect = document.querySelector('#responseCodeSelect');
      console.log('Response code value:', responseCodeSelect ? responseCodeSelect.value : 'not found');
      
      // Also check what's actually in the database
      if (typeof MessageHeaders !== 'undefined' && window.testTimestamp) {
        const savedMessageHeaders = MessageHeaders.find().fetch();
        const testMessageHeader = savedMessageHeaders.find(m => m.response && 
          m.response.identifier && 
          m.response.identifier.includes(window.testTimestamp));
        if (testMessageHeader) {
          console.log('Found test message header in database:', testMessageHeader);
          console.log('Message header response:', testMessageHeader.response);
        } else {
          console.log('Test message header not found in database');
        }
      }
      
      return { logged: true };
    });

    // Save the message header
    browser
      .execute(function() {
        window.consoleErrors = [];
        const originalError = console.error;
        console.error = function() {
          window.consoleErrors.push(Array.from(arguments).join(' '));
          originalError.apply(console, arguments);
        };
        
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Save')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Save button');
      });

    browser
      .pause(2000);
    
    // Check if we're back on the message headers list page
    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#messageHeadersTable') !== null;
      const hasMessageHeadersPage = document.querySelector('#messageHeadersPage') !== null;
      const hasDetailPage = document.querySelector('#messageHeaderDetailPage') !== null;
      
      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });
      
      const consoleErrors = window.consoleErrors || [];
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasMessageHeadersPage: hasMessageHeadersPage,
        hasDetailPage: hasDetailPage,
        hasError: errorText.length > 0,
        errorText: errorText.trim(),
        consoleErrors: consoleErrors,
        userId: Meteor.userId ? Meteor.userId() : 'No Meteor.userId',
        isLoggedIn: Meteor.userId ? !!Meteor.userId() : false
      };
    }, [], function(result) {
      console.log('Post-save state:', result.value);
      if (result.value.hasError) {
        browser.assert.fail(`Save failed with error: ${result.value.errorText}`);
      }
      if (!result.value.isLoggedIn) {
        browser.assert.fail('User is not logged in after save attempt');
      }
      if (result.value.url === '/message-headers/new') {
        console.log('Still on new message header page - save may have failed silently');
      }
    });
    
    // Wait for navigation to message headers list
    browser
      .pause(1000);
      
    // Check what page we're on and capture the created ID
    browser.execute(function() {
      // Try to find the created message header
      if (typeof MessageHeaders !== 'undefined' && window.testTimestamp) {
        const createdMessageHeader = MessageHeaders.findOne({
          'destination.0.name': { $regex: `Test Destination ${window.testTimestamp}` }
        });
        if (createdMessageHeader) {
          window.createdMessageHeaderId = createdMessageHeader._id;
          console.log('Created message header ID:', window.createdMessageHeaderId);
          console.log('Created message header eventCoding:', createdMessageHeader.eventCoding);
        }
      }
      
      return {
        url: window.location.pathname,
        hasMessageHeadersPage: document.querySelector('#messageHeadersPage') !== null,
        hasDetailPage: document.querySelector('#messageHeaderDetailPage') !== null
      };
    }, [], function(result) {
      console.log('Current page after save attempt:', result.value);
      if (result.value.url.includes('/new')) {
        browser.assert.fail('Still on new message header page - save may have failed');
      }
    });
    
    browser
      .waitForElementVisible('#messageHeadersPage', 10000)
      .saveScreenshot('tests/nightwatch/screenshots/message-headers/05-message-header-saved.png');
  });

  it('05. Verify new message header appears in list', browser => {
    browser
      .waitForElementVisible('#messageHeadersPage', 5000)
      .pause(1000);
    
    // Search for our specific test message header using the full timestamp
    browser
      .waitForElementVisible('#messageHeaderSearchInput', 5000)
      .clearValue('#messageHeaderSearchInput')
      .setValue('#messageHeaderSearchInput', timestamp.toString())
      .pause(1000);
    
    browser.execute(function() {
      const hasTable = document.querySelector('#messageHeadersTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageText = document.querySelector('#messageHeadersPage')?.textContent || '';
      
      let totalMessageHeaders = 0;
      
      if (typeof MessageHeaders !== 'undefined') {
        totalMessageHeaders = MessageHeaders.find({}).count();
        console.log('Total message headers in database:', totalMessageHeaders);
        
        const testMessageHeader = MessageHeaders.findOne({
          'destination.0.name': { $regex: 'Destination.*' }
        });
        console.log('Found test message header:', testMessageHeader);
        
        if (testMessageHeader) {
          console.log('Test message header focus:', JSON.stringify(testMessageHeader.focus, null, 2));
        }
      }
      
      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasNoData: pageText.includes('No Data Available'),
        totalMessageHeaders: totalMessageHeaders
      };
    }, [], function(result) {
      console.log('Page state:', result.value);
      
      if (result.value.totalMessageHeaders > 0 && (result.value.hasNoData || result.value.hasNoDataCard)) {
        browser.assert.fail(`Message headers exist (${result.value.totalMessageHeaders}) but showing no data - search filter may be too restrictive`);
      } else if (result.value.hasNoData || result.value.hasNoDataCard) {
        browser.assert.fail('No message headers found - save operation may have failed');
      }
    });
    
    browser.execute(function() {
      const table = document.querySelector('#messageHeadersTable');
      if (!table) return { hasTable: false };
      
      const rows = table.querySelectorAll('tbody tr');
      return {
        hasTable: true,
        rowCount: rows.length,
        firstRowText: rows.length > 0 ? rows[0].textContent : ''
      };
    }, [], function(result) {
      console.log('Table check:', result.value);
      if (result.value.hasTable && result.value.rowCount > 0) {
        browser.assert.ok(true, `Found ${result.value.rowCount} message header(s) in table`);
      } else {
        browser.assert.fail('No message headers table found or table is empty');
      }
    });
    
    browser
      .saveScreenshot('tests/nightwatch/screenshots/message-headers/06-message-header-in-list.png');
  });

  it('06. View message header details', browser => {
    browser
      .waitForElementVisible('#messageHeadersPage', 5000)
      .pause(1000);

    // Search for our specific message header using the full timestamp
    browser
      .waitForElementVisible('#messageHeaderSearchInput', 5000)
      .clearValue('#messageHeaderSearchInput')
      .setValue('#messageHeaderSearchInput', timestamp.toString())
      .pause(1000);

    // Now click on the message header row
    browser
      .waitForElementVisible('#messageHeadersTable', 5000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#messageHeadersTable tbody tr');
        console.log('Found', rows.length, 'rows in message headers table');
        
        // Look for our test message header
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.textContent.includes(timestamp)) {
            console.log('Clicking row', i, 'with text:', row.textContent);
            row.click();
            return { clicked: true, rowText: row.textContent, rowIndex: i };
          }
        }
        
        // If not found, click the first row
        if (rows.length > 0) {
          rows[0].click();
          return { clicked: true, rowText: rows[0].textContent, rowIndex: 0 };
        }
        
        return { clicked: false, error: 'No rows found' };
      }, [timestamp.toString()], function(result) {
        console.log('Click result:', result.value);
        browser.assert.equal(result.value.clicked, true, 'Found and clicked message header row');
      });

    browser
      .pause(2000);
      
    // Verify we navigated to the detail page
    browser.execute(function() {
      return {
        url: window.location.pathname,
        hasDetailPage: document.querySelector('#messageHeaderDetailPage') !== null,
        hasTable: document.querySelector('#messageHeadersTable') !== null
      };
    }, [], function(result) {
      console.log('Navigation result:', result.value);
      if (!result.value.hasDetailPage) {
        browser.assert.fail('Failed to navigate to message header detail page');
      }
    });
    
    browser
      .waitForElementVisible('#messageHeaderDetailPage', 10000);
      
    // Verify form values - handle Material-UI Select components differently
    browser.execute(function(expectedValues) {
      const results = {};
      
      // Get value from Material-UI Select or TextField
      const getMUISelectValue = (selectId) => {
        const element = document.querySelector(selectId);
        if (!element) return null;
        
        // Check if it's a TextField (in view mode)
        if (element.tagName === 'INPUT' || element.classList.contains('MuiTextField-root')) {
          // Get the data-value attribute which contains the actual code
          const input = element.tagName === 'INPUT' ? element : element.querySelector('input');
          if (input) {
            return input.getAttribute('data-value') || input.value;
          }
        }
        
        // In view mode, the select might be disabled and value displayed differently
        // First check if it's a native select
        if (element.tagName === 'SELECT') {
          return element.value;
        }
        
        // For MUI Select, check various possible structures
        // Check for hidden input (common in MUI)
        const hiddenInput = element.querySelector('input[type="hidden"]');
        if (hiddenInput && hiddenInput.value) return hiddenInput.value;
        
        // Check the main input element
        const selectInput = element.querySelector('input');
        if (selectInput && selectInput.value) return selectInput.value;
        
        // In disabled/view mode, MUI might render the value differently
        // Check for the displayed text in the input
        const inputElement = element.querySelector('input[role="combobox"]') || element.querySelector('input');
        if (inputElement) {
          // The value might be in the value attribute, data attribute, or aria attributes
          return inputElement.value || 
                 inputElement.getAttribute('value') || 
                 inputElement.getAttribute('data-value');
        }
        
        // For disabled MUI selects, the value might be in a div with the select role
        const selectDiv = element.querySelector('div[role="button"]') || element.querySelector('div[role="combobox"]');
        if (selectDiv) {
          // The display text might contain the code
          const displayText = selectDiv.textContent || selectDiv.innerText;
          // Try to match against known event codes
          const eventCodes = ['diagnosticreport-provide', 'communication-request', 'observation-provide', 
                             'patient-link', 'patient-unlink', 'valueset-expand', 'admin-notify', 'notification'];
          for (let code of eventCodes) {
            if (displayText && displayText.toLowerCase().includes(code.replace('-', ' '))) {
              return code;
            }
          }
        }
        
        // Last resort - check if the element itself has a value
        return element.value || element.getAttribute('value');
      };
      
      // Check eventCoding (Material-UI Select)
      const eventCodingSelect = document.querySelector('#eventCodingInput');
      console.log('Event coding select element:', eventCodingSelect);
      if (eventCodingSelect) {
        console.log('Select HTML:', eventCodingSelect.outerHTML.substring(0, 200));
        console.log('Select disabled:', eventCodingSelect.disabled);
        console.log('Select value:', eventCodingSelect.value);
        console.log('Select data-value:', eventCodingSelect.getAttribute('data-value'));
        console.log('Select text content:', eventCodingSelect.textContent);
      }
      
      // For eventCoding, we need the code value, not the display value
      if (eventCodingSelect) {
        const dataValue = eventCodingSelect.getAttribute('data-value');
        console.log('EventCoding data-value attribute:', dataValue);
        results.eventCoding = dataValue || getMUISelectValue('#eventCodingInput');
      } else {
        results.eventCoding = null;
      }
      
      // Debug: check what's actually in the database
      if (typeof MessageHeaders !== 'undefined' && window.createdMessageHeaderId) {
        const dbMessageHeader = MessageHeaders.findOne({_id: window.createdMessageHeaderId});
        if (dbMessageHeader) {
          console.log('Database message header eventCoding:', dbMessageHeader.eventCoding);
          results.dbEventCoding = dbMessageHeader.eventCoding;
        }
      }
      
      // Check regular text fields
      const destinationNameField = document.querySelector('#destinationNameInput');
      results.destinationName = destinationNameField ? destinationNameField.value : null;
      
      const responseIdField = document.querySelector('#responseIdInput');
      results.responseId = responseIdField ? responseIdField.value : null;
      
      // Check responseCode (Material-UI Select)
      const responseCodeSelect = document.querySelector('#responseCodeSelect');
      results.responseCode = responseCodeSelect ? responseCodeSelect.getAttribute('data-value') || getMUISelectValue('#responseCodeSelect') : null;
      
      // Check notes
      const notesField = document.querySelector('#notesTextarea');
      results.notes = notesField ? notesField.value : null;
      
      return results;
    }, [testMessageHeader], function(result) {
      console.log('Form values in detail view:', result.value);
      
      // Verify the values
      // In view mode, we see the display value, not the code
      const expectedEventDisplay = 'Provide Diagnostic Report'; // This is what's shown in view mode
      browser.assert.equal(result.value.eventCoding, expectedEventDisplay, 'Event coding display matches');
      browser.assert.ok(result.value.destinationName.includes(testMessageHeader.destinationName), 'Destination name matches');
      browser.assert.ok(result.value.responseId.includes(testMessageHeader.responseId), 'Response ID matches');
      // Response code might show either the code or display value depending on implementation
      browser.assert.equal(result.value.responseCode, testMessageHeader.responseCode, 'Response code matches');
      browser.assert.ok(result.value.notes.includes(testMessageHeader.notes), 'Notes contain expected text');
      
      // Also verify the database has the correct code value
      if (result.value.dbEventCoding) {
        browser.assert.equal(result.value.dbEventCoding.code, testMessageHeader.eventCoding, 'Database eventCoding code matches');
        browser.assert.equal(result.value.dbEventCoding.display, expectedEventDisplay, 'Database eventCoding display matches');
      }
    });
    
    browser
      .saveScreenshot('tests/nightwatch/screenshots/message-headers/07-view-message-header-details.png');

    // Navigate back to message headers list
    testUtils.navigateUrl(browser, '/message-headers');
    browser
      .waitForElementVisible('#messageHeadersPage', 5000);
  });

  it('07. Update existing message header', browser => {
    browser
      .waitForElementVisible('#messageHeadersTable', 5000)
      .pause(1000);

    // Search for our specific test message header using the full timestamp
    browser
      .waitForElementVisible('#messageHeaderSearchInput', 5000)
      .clearValue('#messageHeaderSearchInput')
      .setValue('#messageHeaderSearchInput', timestamp.toString())
      .pause(1000);

    // Now click on the message header to edit
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#messageHeadersTable tbody tr');
        console.log('Looking for message header with timestamp:', timestamp);
        console.log('Found', rows.length, 'rows in table');
        
        for (let i = 0; i < rows.length; i++) {
          console.log('Row', i, ':', rows[i].textContent.substring(0, 100));
          if (rows[i].textContent.includes(timestamp)) {
            console.log('Found test message header in row', i);
            rows[i].click();
            return { success: true, found: true, rowIndex: i };
          }
        }
        
        console.error('Test message header not found in table!');
        return { success: false, found: false, error: 'Test message header not in table' };
      }, [timestamp.toString()], function(result) {
        if (!result.value.found) {
          browser.assert.fail('Test message header not found in table - cannot update.');
        }
      });

    browser
      .pause(1000)
      .waitForElementVisible('#messageHeaderDetailPage', 5000)
      .pause(500);

    // Enter edit mode
    browser
      .execute(function() {
        const lockButton = document.querySelector('button svg[data-testid="LockIcon"]')?.parentElement;
        if (lockButton) {
          lockButton.click();
          return true;
        }
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Edit')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Edit/Lock button to enter edit mode');
      })
      .pause(500);

    // Update message header details
    browser
      .clearValue('#eventDisplayInput')
      .setValue('#eventDisplayInput', updatedMessageHeader.eventDisplay)
      .clearValue('#destinationNameInput')
      .setValue('#destinationNameInput', updatedMessageHeader.destinationName)
      .click('#responseCodeSelect')
      .pause(300)
      .execute(function(value) {
        const menuItems = document.querySelectorAll('[role="option"]');
        for (let item of menuItems) {
          if (item.textContent.toLowerCase().includes(value.toLowerCase()) || 
              item.getAttribute('data-value') === value) {
            item.click();
            return true;
          }
        }
        return false;
      }, [updatedMessageHeader.responseCode], function(result) {
        browser.assert.equal(result.value, true, 'Selected response code');
      })
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', updatedMessageHeader.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/message-headers/08-updated-message-header-form.png');

    // Save the updated message header
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Save')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Save button');
      });

    browser
      .pause(1000);

    testUtils.navigateUrl(browser, '/message-headers');

    browser
      .waitForElementVisible('#messageHeadersTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/message-headers/09-message-header-updated.png');
  });

  it('08. Verify updated message header in list', browser => {
    browser
      .waitForElementVisible('#messageHeadersTable', 5000)
      .waitForElementVisible('#messageHeaderSearchInput', 5000)
      .clearValue('#messageHeaderSearchInput')
      .pause(500);
      
    // Try searching for the timestamp first to see if any message header shows up
    browser
      .setValue('#messageHeaderSearchInput', timestamp.toString())
      .pause(1500)
      .execute(function() {
        const table = document.querySelector('#messageHeadersTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const hasNoData = document.querySelector('.no-data-card') !== null ||
                         document.querySelector('#messageHeadersPage').textContent.includes('No Data Available');
        
        console.log('=== Message Header Search Debug ===');
        console.log('Table found:', !!table);
        console.log('Row count:', rows.length);
        console.log('Has no-data state:', hasNoData);
        
        if (rows.length > 0) {
          console.log('First row text:', rows[0].textContent);
        }
        
        // Check if message header exists in the database
        if (typeof MessageHeaders !== 'undefined') {
          const totalMessageHeaders = MessageHeaders.find({}).count();
          console.log('Total message headers in database:', totalMessageHeaders);
          
          // Find our test message header
          const testMessageHeaders = MessageHeaders.find({
            $or: [
              { 'destination.0.name': { $regex: '.*' + window.testTimestamp + '.*' } },
              { 'notes': { $regex: '.*' + window.testTimestamp + '.*' } }
            ]
          }).fetch();
          
          console.log('Found test message headers:', testMessageHeaders.length);
          if (testMessageHeaders.length > 0) {
            console.log('Test message header:', JSON.stringify(testMessageHeaders[0], null, 2));
          }
        }
        
        return {
          rowCount: rows.length,
          hasTable: !!table,
          hasNoData: hasNoData,
          tableContent: table ? table.textContent : 'No table'
        };
      }, [], function(result) {
        console.log('Initial search result:', result.value);
      });
      
    // Search again using the timestamp to find our updated message header
    browser
      .clearValue('#messageHeaderSearchInput')
      .setValue('#messageHeaderSearchInput', timestamp.toString())
      .pause(1500)
      .execute(function(expectedName, timestamp) {
        const table = document.querySelector('#messageHeadersTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const messageHeaderInfo = [];
        
        console.log('=== Looking for updated message header ===');
        console.log('Expected name:', expectedName);
        console.log('Timestamp:', timestamp);
        
        // Debug database content
        if (typeof MessageHeaders !== 'undefined') {
          const testMessageHeader = MessageHeaders.findOne({
            $or: [
              { 'destination.0.name': { $regex: '.*' + timestamp + '.*' } },
              { 'notes': { $regex: '.*' + timestamp + '.*' } }
            ]
          });
          
          if (testMessageHeader) {
            console.log('Found message header in database:');
            console.log('- _id:', testMessageHeader._id);
            console.log('- destination structure:', JSON.stringify(testMessageHeader.destination, null, 2));
            console.log('- destination[0].name:', testMessageHeader.destination?.[0]?.name);
            console.log('- response code:', testMessageHeader.response?.code);
            console.log('- event display:', testMessageHeader.event?.display);
          }
        }
        
        for (let row of rows) {
          const rowText = row.textContent;
          console.log('Row text:', rowText);
          
          // Extract message header info from the row
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            // Usually message header info is in one of the first few columns
            for (let i = 0; i < Math.min(cells.length, 5); i++) {
              const cellText = cells[i].textContent.trim();
              if (cellText && cellText.length > 0) {
                messageHeaderInfo.push(`Cell ${i}: ${cellText}`);
              }
            }
          }
        }
        
        const foundExpected = table ? table.textContent.includes(expectedName) : false;
        const foundTimestamp = table ? table.textContent.includes(timestamp) : false;
        
        return {
          rowCount: rows.length,
          messageHeaderInfo: messageHeaderInfo,
          tableText: table ? table.textContent.substring(0, 500) : 'Table not found',
          foundExpected: foundExpected,
          foundTimestamp: foundTimestamp
        };
      }, [updatedMessageHeader.destinationName, timestamp.toString()], function(result) {
        console.log('Table debug info:', result.value);
        
        if (result.value.rowCount === 0) {
          browser.assert.fail('No message headers found in table after search. The update may have failed or search is not working.');
        } else if (!result.value.foundExpected && !result.value.foundTimestamp) {
          browser.assert.fail(`Updated message header '${updatedMessageHeader.destinationName}' not found in table. Table contains: ${result.value.messageHeaderInfo.join('; ')}`);
        } else {
          browser.assert.ok(true, 'Found updated message header in table');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/message-headers/10-updated-message-header-in-list.png');
  });

  it('09. Delete message header', browser => {
    browser
      .waitForElementVisible('#messageHeadersPage', 5000)
      .pause(1000);

    browser.execute(function() {
      const hasTable = document.querySelector('#messageHeadersTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#messageHeadersPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#messageHeadersTable tbody tr');
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked message header row');
          });

        browser
          .pause(1000)
          .waitForElementVisible('#messageHeaderDetailPage', 5000)
          .pause(500);

        // Click Delete button (only visible in view mode, not edit mode)
        browser
          .execute(function() {
            const buttons = document.querySelectorAll('button');
            for (let button of buttons) {
              if (button.textContent.includes('Delete')) {
                window.__deleteButtonFound = true;
                button.click();
                return true;
              }
            }
            return false;
          })
          .pause(100)
          .acceptAlert()
          .pause(500);

        browser
          .pause(1000)
          .waitForElementVisible('#messageHeadersPage', 5000)
          .execute(function() {
            const hasTable = document.querySelector('#messageHeadersTable') !== null;
            const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                                document.querySelector('.no-data-available') !== null ||
                                document.querySelector('[id*="no-data"]') !== null ||
                                (document.querySelector('#messageHeadersPage') && 
                                 document.querySelector('#messageHeadersPage').textContent.includes('No Data Available'));
            return {
              hasTable: hasTable,
              hasNoDataCard: hasNoDataCard,
              hasEitherElement: hasTable || hasNoDataCard
            };
          }, [], function(result) {
            browser.assert.equal(result.value.hasEitherElement, true, 'Either message headers table or no-data message is present after deletion');
          });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No message headers to delete - No Data Available state is correct');
      }
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/message-headers/11-message-header-deleted.png');
  });

  it('10. Verify message header removed from list', browser => {
    browser
      .waitForElementVisible('#messageHeadersPage', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const table = document.querySelector('#messageHeadersTable');
        if (table) {
          const rows = document.querySelectorAll('#messageHeadersTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#messageHeadersPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Message header no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (message header was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/message-headers/12-message-header-not-in-list.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof MessageHeaders !== 'undefined') {
        MessageHeaders.find({ 
          $or: [
            { 'destination.0.name': { $regex: '.*Destination.*' } },
            { 'sender.endpoint': { $regex: '.*sender.*' } },
            { 'response.identifier': { $regex: 'response-.*' } }
          ]
        }).fetch().forEach(function(messageHeader) {
          MessageHeaders.remove({ _id: messageHeader._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});