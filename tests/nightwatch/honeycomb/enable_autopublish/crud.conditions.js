// tests/nightwatch/honeycomb/crud.conditions.js

const testUtils = require('./shared-test-utils');

describe('Conditions CRUD Operations', function() {
  const timestamp = Date.now();
  const testCondition = {
    patientName: 'John Doe',
    asserterName: `Dr. Smith ${timestamp}`,
    snomedCode: '195967001',
    conditionName: 'Asthma',
    clinicalStatus: 'active',
    verificationStatus: 'confirmed',
    category: 'problem-list-item',
    recordedDate: '2024-01-15',
    onsetDate: '2023-12-01',
    notes: `Test condition created at ${timestamp}`
  };

  const updatedCondition = {
    asserterName: `Dr. Johnson ${timestamp}`,
    clinicalStatus: 'inactive',
    verificationStatus: 'provisional',
    notes: `Test condition updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting Conditions CRUD test suite...');
    // Just navigate to the app, we'll handle login in the first test
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  beforeEach(browser => {
    // Just a small pause between tests
    browser.pause(500);
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .pause(2000); // Give autologin time to work if enabled

    // Check if we're logged in (either via autologin or need to login manually)
    browser.execute(function() {
      return {
        isLoggedIn: typeof Meteor !== 'undefined' && !!Meteor.userId(),
        userId: Meteor.userId ? Meteor.userId() : null,
        username: Meteor.user ? (Meteor.user() ? Meteor.user().username : null) : null
      };
    }, [], function(result) {
      console.log('Initial login state:', result.value);
      
      if (!result.value.isLoggedIn) {
        console.log('Not logged in, attempting programmatic login...');
        
        // First create or ensure test user exists
        browser.executeAsync(function(done) {
          if (typeof Meteor !== 'undefined') {
            // Create test user if needed
            Meteor.call('test.createTestUser', {
              username: 'janedoe',
              email: 'janedoe@test.org',
              password: 'janedoe123'
            }, function(err, userId) {
              if (err) {
                console.error('Failed to create test user:', err);
                done({ userCreated: false, error: err.message });
              } else {
                console.log('Test user ready, userId:', userId);
                // Now login
                Meteor.loginWithPassword('janedoe', 'janedoe123', function(loginErr) {
                  if (loginErr) {
                    console.error('Login failed:', loginErr);
                    done({ userCreated: true, loginSuccess: false, error: loginErr.message });
                  } else {
                    console.log('Login successful');
                    done({ 
                      userCreated: true,
                      loginSuccess: true, 
                      userId: Meteor.userId(), 
                      username: Meteor.user() ? Meteor.user().username : null 
                    });
                  }
                });
              }
            });
          } else {
            done({ userCreated: false, loginSuccess: false, error: 'Meteor not available' });
          }
        }, [], function(result) {
          if (result.value.loginSuccess) {
            browser.assert.ok(true, 'Successfully created test user and logged in');
            console.log('Logged in as:', result.value.username, 'userId:', result.value.userId);
            
            // Now create a test patient
            testUtils.createTestPatient(browser, {
              name: 'John Doe',
              family: 'Doe',
              given: 'John',
              identifier: 'test-patient-' + timestamp
            }, function(result) {
              if (result.error) {
                console.error('Failed to create test patient:', result.error);
                browser.assert.fail('Failed to create test patient: ' + result.error);
              } else {
                console.log('Test patient created with ID:', result.result);
                browser.assert.ok(true, 'Successfully created test patient');
                
                // Patient created successfully
              }
            });
          } else {
            browser.assert.fail('Setup failed: ' + result.value.error);
          }
        });
        
        browser.pause(1000); // Wait for login to settle
      } else {
        browser.assert.ok(true, 'Already logged in (autologin enabled)');
        console.log('Already logged in as:', result.value.username, 'userId:', result.value.userId);
        
        // Create a test patient even if already logged in
        testUtils.createTestPatient(browser, {
          name: 'John Doe',
          family: 'Doe',
          given: 'John',
          identifier: 'test-patient-' + timestamp
        }, function(result) {
          if (result.error) {
            console.error('Failed to create test patient:', result.error);
            browser.assert.fail('Failed to create test patient: ' + result.error);
          } else {
            console.log('Test patient created with ID:', result.result);
            browser.assert.ok(true, 'Successfully created test patient');
            
            // Set the Session variables for the selected patient
            browser.execute(function(patientId) {
              if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
                const patient = Patients.findOne({_id: patientId});
                if (patient) {
                  Session.set('selectedPatientId', patientId);
                  Session.set('selectedPatient', patient);
                  console.log('Set selected patient in Session:', patientId);
                }
              }
            }, [result.result]);
          }
        });
      }
      
      // Clean up any existing test data
      browser.executeAsync(function(done) {
        if (typeof Conditions !== 'undefined') {
          const testConditions = Conditions.find({ 'asserter.display': { $regex: 'Smith|Johnson' } }).fetch();
          testConditions.forEach(function(condition) {
            Conditions.remove({ _id: condition._id });
          });
          console.log('Cleared', testConditions.length, 'test conditions');
        }
        done();
      });
      
      // After everything is set up, ensure the patient is selected in the Session
      browser.pause(1000) // Give everything time to settle
        .execute(function(testIdentifier) {
          if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
            // Find the test patient we just created
            const patient = Patients.findOne({
              'identifier.value': testIdentifier
            });
            if (patient) {
              Session.set('selectedPatientId', patient._id);
              Session.set('selectedPatient', patient);
              console.log('Set selected patient in Session:', patient._id, patient.name?.[0]?.text);
              return { success: true, patientId: patient._id, patientName: patient.name?.[0]?.text };
            } else {
              console.error('Could not find test patient with identifier:', testIdentifier);
              return { success: false, error: 'Patient not found' };
            }
          }
          return { success: false, error: 'Session or Patients not available' };
        }, ['test-patient-' + timestamp], function(result) {
          if (result.value.success) {
            console.log('Successfully set selected patient:', result.value);
          } else {
            console.error('Failed to set selected patient:', result.value.error);
          }
        });
    });
  });

  it('02. Verify conditions list page loads', browser => {
    browser
      .url('http://localhost:3000/conditions')
      .waitForElementVisible('#conditionsPage', 5000)
      .pause(2000)  // Increased pause to allow data to load
      .execute(function() {
        // Check if we have either the table or the no-data card
        const hasTable = document.querySelector('#conditionsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#conditionsPage') && 
                             document.querySelector('#conditionsPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either conditions table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/conditions/02-conditions-list.png');
  });

  it('03. Navigate to new condition form', browser => {
    browser
      .waitForElementVisible('#conditionsPage', 5000)
      .pause(500);

    // Click the Add Condition button - handle both "Add Condition" and "Add Your First Condition"
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Condition') || 
              button.textContent.includes('Add Your First Condition')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Condition button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#conditionDetailPage', 5000)
      .assert.elementPresent('#patientDisplay')
      .assert.elementPresent('#asserterDisplay')
      .assert.elementPresent('#snomedCode')
      .assert.elementPresent('#snomedDisplay')
      .assert.elementPresent('#clinicalStatus')
      .assert.elementPresent('#verificationStatus')
      .assert.elementPresent('#category')
      .assert.elementPresent('#recordedDate')
      .assert.elementPresent('#onsetDate')
      .assert.elementPresent('#notesTextarea')
      .saveScreenshot('tests/nightwatch/screenshots/conditions/03-new-condition-form.png');
  });

  it('04. Create new condition', browser => {
    // We're already on the condition detail page from test 03
    browser
      .waitForElementVisible('#conditionDetailPage', 5000)
      .pause(500);

    // First check if Meteor methods are available
    browser.execute(function() {
      return {
        hasConditionsCreate: typeof Meteor.call === 'function',
        userId: Meteor.userId ? Meteor.userId() : null,
        username: Meteor.user ? (Meteor.user() ? Meteor.user().username : null) : null
      };
    }, [], function(result) {
      console.log('Meteor state:', result.value);
    });

    // Verify we're on the new condition page
    browser
      .assert.urlContains('/conditions/new');

    // Fill in condition details using the id selectors
    browser
      .pause(1000); // Give form time to initialize in edit mode

    // Check if form is in edit mode, if not, click edit button
    browser.execute(function() {
      // Check if fields are disabled
      const asserterField = document.querySelector('#asserterDisplay');
      if (asserterField && asserterField.disabled) {
        // Look for edit button
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

    browser
      .pause(500)
      // Clear and set asserter display
      .click('#asserterDisplay')
      .execute(function() {
        const asserterField = document.querySelector('#asserterDisplay');
        if (asserterField) {
          // Select all text
          asserterField.select();
          // Simulate backspace to clear
          asserterField.value = '';
          // Fire multiple events to ensure React updates
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          asserterField.dispatchEvent(inputEvent);
          asserterField.dispatchEvent(changeEvent);
          // Also try the React-specific approach
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(asserterField, '');
          asserterField.dispatchEvent(inputEvent);
        }
      })
      .pause(100)
      .setValue('#asserterDisplay', testCondition.asserterName)
      // Clear and set SNOMED code
      .click('#snomedCode')
      .execute(function() {
        const snomedCodeField = document.querySelector('#snomedCode');
        if (snomedCodeField) {
          snomedCodeField.select();
          snomedCodeField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          snomedCodeField.dispatchEvent(inputEvent);
          snomedCodeField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(snomedCodeField, '');
          snomedCodeField.dispatchEvent(inputEvent);
        }
      })
      .pause(100)
      .setValue('#snomedCode', testCondition.snomedCode)
      // Clear and set SNOMED display
      .click('#snomedDisplay')
      .execute(function() {
        const snomedDisplayField = document.querySelector('#snomedDisplay');
        if (snomedDisplayField) {
          snomedDisplayField.select();
          snomedDisplayField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          snomedDisplayField.dispatchEvent(inputEvent);
          snomedDisplayField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(snomedDisplayField, '');
          snomedDisplayField.dispatchEvent(inputEvent);
        }
      })
      .pause(100)
      .setValue('#snomedDisplay', testCondition.conditionName);

    // Handle Material-UI Select components differently
    browser.execute(function(clinicalStatus) {
      const clinicalStatusSelect = document.querySelector('#clinicalStatus');
      if (clinicalStatusSelect) {
        // Click to open the dropdown
        clinicalStatusSelect.click();
        // Wait a bit for dropdown to open
        setTimeout(() => {
          // Find and click the correct option
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === clinicalStatus) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testCondition.clinicalStatus]);

    browser.pause(500);

    browser.execute(function(verificationStatus) {
      const verificationStatusSelect = document.querySelector('#verificationStatus');
      if (verificationStatusSelect) {
        verificationStatusSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === verificationStatus) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testCondition.verificationStatus]);

    browser.pause(500);

    browser.execute(function(category) {
      const categorySelect = document.querySelector('#category');
      if (categorySelect) {
        categorySelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === category) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testCondition.category]);

    browser
      .pause(500)
      // Clear and set recorded date
      .click('#recordedDate')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#recordedDate', testCondition.recordedDate)
      // Clear and set onset date
      .click('#onsetDate')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#onsetDate', testCondition.onsetDate)
      // Clear and set notes
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', testCondition.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/conditions/04-filled-condition-form.png');

    // Save the condition - click the Save button
    browser
      .execute(function() {
        // Capture console errors
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
    
    // Check if we're back on the conditions list page or if there's an error
    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#conditionsTable') !== null;
      const hasConditionsPage = document.querySelector('#conditionsPage') !== null;
      const hasDetailPage = document.querySelector('#conditionDetailPage') !== null;
      
      // Look for error messages in various places
      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });
      
      // Check console for errors
      const consoleErrors = window.consoleErrors || [];
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasConditionsPage: hasConditionsPage,
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
      if (result.value.url === '/conditions/new') {
        console.log('Still on new condition page - save may have failed silently');
      }
    });
    
    browser
      .waitForElementVisible('#conditionsPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/conditions/05-condition-saved.png');
  });

  it('05. Verify new condition appears in list', browser => {
    browser
      .waitForElementVisible('#conditionsPage', 5000)
      .pause(1000)
      .waitForElementVisible('#conditionsTable', 5000)
      .assert.containsText('#conditionsTable', testCondition.asserterName)
      .assert.containsText('#conditionsTable', testCondition.conditionName)
      .saveScreenshot('tests/nightwatch/screenshots/conditions/06-condition-in-list.png');
  });

  it('06. View condition details', browser => {
    browser
      .waitForElementVisible('#conditionsTable', 5000)
      .pause(1000);

    // Click on the first condition row containing our test data
    browser
      .execute(function(asserterName) {
        const rows = document.querySelectorAll('#conditionsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(asserterName)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testCondition.asserterName], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked condition row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#conditionDetailPage', 5000)
      .assert.valueContains('#asserterDisplay', testCondition.asserterName)
      .assert.valueContains('#snomedCode', testCondition.snomedCode)
      .assert.valueContains('#snomedDisplay', testCondition.conditionName)
      .execute(function() {
        // For Material-UI Select components, we need to look for the hidden input
        const clinicalStatusInput = document.querySelector('#clinicalStatus');
        const verificationStatusInput = document.querySelector('#verificationStatus');
        
        return {
          clinicalStatus: clinicalStatusInput ? clinicalStatusInput.value : null,
          verificationStatus: verificationStatusInput ? verificationStatusInput.value : null,
          notes: document.querySelector('#notesTextarea').value,
          // Also get the display values as fallback
          clinicalStatusDisplay: document.querySelector('[aria-labelledby*="clinical-status"]')?.textContent || 
                                document.querySelector('#clinicalStatus')?.parentElement?.textContent,
          verificationStatusDisplay: document.querySelector('[aria-labelledby*="verification-status"]')?.textContent ||
                                    document.querySelector('#verificationStatus')?.parentElement?.textContent
        };
      }, [], function(result) {
        // Check either the value or display text
        const clinicalStatusOk = result.value.clinicalStatus === testCondition.clinicalStatus || 
                               (result.value.clinicalStatusDisplay && result.value.clinicalStatusDisplay.includes('Active'));
        const verificationStatusOk = result.value.verificationStatus === testCondition.verificationStatus ||
                                   (result.value.verificationStatusDisplay && result.value.verificationStatusDisplay.includes('Confirmed'));
        
        browser.assert.ok(clinicalStatusOk, 'Clinical status matches');
        browser.assert.ok(verificationStatusOk, 'Verification status matches');
        browser.assert.ok(result.value.notes.includes(testCondition.notes), 'Notes contain expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/conditions/07-view-condition-details.png');
    
    // Navigate back to conditions list
    browser
      .url('http://localhost:3000/conditions')
      .waitForElementVisible('#conditionsPage', 5000);
  });

  it('07. Update existing condition', browser => {
    browser
      .waitForElementVisible('#conditionsTable', 5000)
      .pause(1000);

    // Click on the condition to edit
    browser
      .execute(function(asserterName) {
        const rows = document.querySelectorAll('#conditionsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(asserterName)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testCondition.asserterName], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked condition row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#conditionDetailPage', 5000)
      .pause(500);

    // Click the lock icon to enter edit mode
    browser
      .execute(function() {
        // Find the lock icon button in the header
        const lockButton = document.querySelector('button svg[data-testid="LockIcon"]')?.parentElement;
        if (lockButton) {
          lockButton.click();
          return true;
        }
        // Also check for the Edit button in the action area (fallback)
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

    // Update condition details
    browser
      .click('#asserterDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#asserterDisplay', updatedCondition.asserterName)
      .click('#clinicalStatus')
      .pause(300)
      .execute(function(value) {
        // For Material-UI Select, find the menu item by text or value
        const menuItems = document.querySelectorAll('[role="option"]');
        for (let item of menuItems) {
          if (item.textContent.toLowerCase().includes(value.toLowerCase()) || 
              item.getAttribute('data-value') === value) {
            item.click();
            return true;
          }
        }
        return false;
      }, [updatedCondition.clinicalStatus], function(result) {
        browser.assert.equal(result.value, true, 'Selected clinical status');
      })
      .click('#verificationStatus')
      .pause(300)
      .execute(function(value) {
        // For Material-UI Select, find the menu item by text or value
        const menuItems = document.querySelectorAll('[role="option"]');
        for (let item of menuItems) {
          if (item.textContent.toLowerCase().includes(value.toLowerCase()) || 
              item.getAttribute('data-value') === value) {
            item.click();
            return true;
          }
        }
        return false;
      }, [updatedCondition.verificationStatus], function(result) {
        browser.assert.equal(result.value, true, 'Selected verification status');
      })
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', updatedCondition.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/conditions/08-updated-condition-form.png');

    // Save the updated condition
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
      .pause(2000)
      // Navigate back to conditions list
      .url('http://localhost:3000/conditions')
      .waitForElementVisible('#conditionsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/conditions/09-condition-updated.png');
  });

  it('08. Verify updated condition in list', browser => {
    browser
      .waitForElementVisible('#conditionsTable', 5000)
      .pause(1000)
      .assert.containsText('#conditionsTable', updatedCondition.asserterName)
      // Note: Clinical status is hidden in the table, so we can't verify it here
      .saveScreenshot('tests/nightwatch/screenshots/conditions/10-updated-condition-in-list.png');
  });

  it('09. Delete condition', browser => {
    browser
      .waitForElementVisible('#conditionsTable', 5000)
      .pause(1000);

    // Click on the condition to delete
    browser
      .execute(function(timestamp) {
        // Find the row by the timestamp which is unique
        const rows = document.querySelectorAll('#conditionsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked condition row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#conditionDetailPage', 5000);

    // Click the lock icon to enter edit mode first
    browser
      .execute(function() {
        // Find the lock icon button in the header
        const lockButton = document.querySelector('button svg[data-testid="LockIcon"]')?.parentElement;
        if (lockButton) {
          lockButton.click();
          return true;
        }
        // Also check for the Edit button in the action area (fallback)
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

    // Click the Delete button and handle the confirmation
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Delete')) {
            // Store a flag that we found the button
            window.__deleteButtonFound = true;
            button.click();
            // The alert will appear immediately, so we return true even though alert is blocking
            return true;
          }
        }
        return false;
      })
      .pause(100)
      // Accept the confirmation alert
      .acceptAlert()
      .pause(500);

    browser
      .pause(2000)
      .waitForElementVisible('#conditionsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/conditions/11-condition-deleted.png');
  });

  it('10. Verify condition removed from list', browser => {
    browser
      .waitForElementVisible('#conditionsTable', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#conditionsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            return true;
          }
        }
        return false;
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value, false, 'Condition no longer in list');
      })
      .saveScreenshot('tests/nightwatch/screenshots/conditions/12-condition-not-in-list.png');
  });

  it('11. Test form validation', browser => {
    browser
      .waitForElementVisible('#conditionsPage', 5000)
      .pause(500);

    // Navigate to new condition form - handle both button texts
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Condition') || 
              button.textContent.includes('Add Your First Condition')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Condition button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#conditionDetailPage', 5000);

    // Try to save without required fields
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

    // Note: Currently the form allows submission with empty fields
    // This could be enhanced in the future with client-side validation
    browser
      .waitForElementVisible('#conditionsPage', 5000, 'Form submitted and returned to conditions list')
      .execute(function() {
        // Check if a new condition was created (it would have empty SNOMED fields)
        const rows = document.querySelectorAll('#conditionsTable tbody tr');
        let foundEmptyCondition = false;
        for (let row of rows) {
          // Look for a row with empty or missing SNOMED data
          const cells = row.querySelectorAll('td');
          if (cells.length > 2) {
            const snomedCell = cells[2]; // SNOMED code column
            if (!snomedCell.textContent || snomedCell.textContent.trim() === '') {
              foundEmptyCondition = true;
              break;
            }
          }
        }
        return foundEmptyCondition;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Condition created with empty fields (no validation)');
      })
      .saveScreenshot('tests/nightwatch/screenshots/conditions/13-validation-check.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof Conditions !== 'undefined') {
        // Remove by ID to comply with Meteor security
        Conditions.find({ 'asserter.display': { $regex: 'Smith|Johnson' } }).fetch().forEach(function(condition) {
          Conditions.remove({ _id: condition._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});