// tests/nightwatch/honeycomb/crud.conditions.js

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
          } else {
            browser.assert.fail('Setup failed: ' + result.value.error);
          }
        });
        
        browser.pause(1000); // Wait for login to settle
      } else {
        browser.assert.ok(true, 'Already logged in (autologin enabled)');
        console.log('Already logged in as:', result.value.username, 'userId:', result.value.userId);
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
    });
  });

  it('02. Verify conditions list page loads', browser => {
    browser
      .url('http://localhost:3000/conditions')
      .waitForElementVisible('#conditionsPage', 5000)
      .pause(500)
      .execute(function() {
        // Check if we have either the table or the no-data card
        const hasTable = document.querySelector('#conditionsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-available') !== null ||
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
      .clearValue('#asserterDisplay')
      .setValue('#asserterDisplay', testCondition.asserterName)
      .clearValue('#snomedCode')
      .setValue('#snomedCode', testCondition.snomedCode)
      .clearValue('#snomedDisplay')
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
      .clearValue('#recordedDate')
      .setValue('#recordedDate', testCondition.recordedDate)
      .clearValue('#onsetDate')
      .setValue('#onsetDate', testCondition.onsetDate)
      .clearValue('#notesTextarea')
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
      .assert.containsText('#conditionsTable', testCondition.clinicalStatus)
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
        return {
          clinicalStatus: document.querySelector('#clinicalStatus').value,
          verificationStatus: document.querySelector('#verificationStatus').value,
          notes: document.querySelector('#notesTextarea').value
        };
      }, [], function(result) {
        browser.assert.equal(result.value.clinicalStatus, testCondition.clinicalStatus, 'Clinical status matches');
        browser.assert.equal(result.value.verificationStatus, testCondition.verificationStatus, 'Verification status matches');
        browser.assert.ok(result.value.notes.includes(testCondition.notes), 'Notes contain expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/conditions/07-view-condition-details.png');
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

    // Update condition details
    browser
      .clearValue('#asserterDisplay')
      .setValue('#asserterDisplay', updatedCondition.asserterName)
      .click('#clinicalStatus')
      .pause(300)
      .click(`option[value="${updatedCondition.clinicalStatus}"]`)
      .click('#verificationStatus')
      .pause(300)
      .click(`option[value="${updatedCondition.verificationStatus}"]`)
      .clearValue('#notesTextarea')
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
      .waitForElementVisible('#conditionsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/conditions/09-condition-updated.png');
  });

  it('08. Verify updated condition in list', browser => {
    browser
      .waitForElementVisible('#conditionsTable', 5000)
      .pause(1000)
      .assert.containsText('#conditionsTable', updatedCondition.asserterName)
      .assert.containsText('#conditionsTable', updatedCondition.clinicalStatus)
      .saveScreenshot('tests/nightwatch/screenshots/conditions/10-updated-condition-in-list.png');
  });

  it('09. Delete condition', browser => {
    browser
      .waitForElementVisible('#conditionsTable', 5000)
      .pause(1000);

    // Click on the condition to delete
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
      }, [updatedCondition.asserterName], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked condition row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#conditionDetailPage', 5000);

    // Click the Delete button
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Delete')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Delete button');
      });

    browser
      .pause(500);

    // Handle confirmation dialog if present
    browser.acceptAlert(function() {
      console.log('Alert accepted');
    });

    browser
      .pause(2000)
      .waitForElementVisible('#conditionsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/conditions/11-condition-deleted.png');
  });

  it('10. Verify condition removed from list', browser => {
    browser
      .waitForElementVisible('#conditionsTable', 5000)
      .pause(1000)
      .execute(function(asserterName) {
        const rows = document.querySelectorAll('#conditionsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(asserterName)) {
            return true;
          }
        }
        return false;
      }, [updatedCondition.asserterName], function(result) {
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

    // Check for validation - the form should still be visible if validation failed
    browser
      .assert.elementPresent('#conditionDetailPage', 'Form still visible after validation failure')
      .execute(function() {
        const snomedCodeInput = document.querySelector('#snomedCode');
        const snomedDisplayInput = document.querySelector('#snomedDisplay');
        return {
          snomedCodeValue: snomedCodeInput ? snomedCodeInput.value : '',
          snomedDisplayValue: snomedDisplayInput ? snomedDisplayInput.value : '',
          formStillVisible: document.querySelector('#conditionDetailPage') !== null
        };
      }, [], function(result) {
        browser.assert.equal(result.value.formStillVisible, true, 'Form validation prevented submission');
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