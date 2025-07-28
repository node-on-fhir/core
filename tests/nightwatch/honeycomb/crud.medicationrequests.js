// tests/nightwatch/honeycomb/crud.medicationrequests.js

const testUtils = require('./shared-test-utils');

describe('MedicationRequests CRUD Operations', function() {
  const timestamp = Date.now();
  const testMedicationRequest = {
    patientName: 'John Doe',
    requesterName: `Dr. Smith ${timestamp}`,
    medicationCode: '387458008', // Aspirin SNOMED code
    medicationDisplay: 'Aspirin 325mg',
    status: 'active',
    intent: 'order',
    priority: 'routine',
    dosageInstruction: 'Take 1 tablet by mouth daily',
    dosageRoute: '26643006', // Oral route
    dosageRouteDisplay: 'Oral',
    dosageTiming: '1/d', // Once daily
    dispenseQuantity: '30',
    dispenseUnit: 'tablets',
    numberOfRepeats: '3',
    authoredOn: '2024-01-15T10:00:00',
    reasonCode: '59621000',
    reasonDisplay: 'Hypertension',
    notes: `Test medication request created at ${timestamp}`
  };

  const updatedMedicationRequest = {
    requesterName: `Dr. Johnson ${timestamp}`,
    status: 'completed',
    priority: 'urgent',
    dosageInstruction: 'Take 2 tablets by mouth daily',
    notes: `Test medication request updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting MedicationRequests CRUD test suite...');
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  beforeEach(browser => {
    browser.pause(500);
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .pause(2000);

    // Check if we're logged in
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
        
        browser.executeAsync(function(done) {
          if (typeof Meteor !== 'undefined') {
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
              }
            });
          } else {
            browser.assert.fail('Setup failed: ' + result.value.error);
          }
        });
        
        browser.pause(1000);
      } else {
        browser.assert.ok(true, 'Already logged in (autologin enabled)');
        console.log('Already logged in as:', result.value.username, 'userId:', result.value.userId);
        
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
        if (typeof MedicationRequests !== 'undefined') {
          const testMedicationRequests = MedicationRequests.find({ 
            'requester.display': { $regex: 'Smith|Johnson' }
          }).fetch();
          testMedicationRequests.forEach(function(medicationRequest) {
            MedicationRequests.remove({ _id: medicationRequest._id });
          });
          console.log('Cleared', testMedicationRequests.length, 'test medication requests');
        }
        done();
      });
      
      browser.pause(1000)
        .execute(function(testIdentifier) {
          if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
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

  it('02. Verify medication requests list page loads', browser => {
    browser
      .url('http://localhost:3000/medicationrequests')
      .waitForElementVisible('#medicationRequestsPage', 5000)
      .pause(2000)
      .execute(function() {
        const hasTable = document.querySelector('#medicationRequestsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#medicationRequestsPage') && 
                             document.querySelector('#medicationRequestsPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either medication requests table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/medicationrequests/02-medicationrequests-list.png');
  });

  it('03. Navigate to new medication request form', browser => {
    browser
      .waitForElementVisible('#medicationRequestsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Medication Request') || 
              button.textContent.includes('Add Your First Medication Request')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Medication Request button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationRequestDetailPage', 5000)
      .assert.elementPresent('#subjectDisplay')
      .assert.elementPresent('#requesterDisplay')
      .assert.elementPresent('#medicationCode')
      .assert.elementPresent('#medicationDisplay')
      .assert.elementPresent('#status')
      .assert.elementPresent('#intent')
      .assert.elementPresent('#priority')
      .assert.elementPresent('#dosageInstruction')
      .assert.elementPresent('#dosageRouteCode')
      .assert.elementPresent('#dosageRouteDisplay')
      .assert.elementPresent('#dosageTiming')
      .assert.elementPresent('#dispenseQuantity')
      .assert.elementPresent('#dispenseUnit')
      .assert.elementPresent('#numberOfRepeats')
      .assert.elementPresent('#authoredOn')
      .assert.elementPresent('#reasonCode')
      .assert.elementPresent('#reasonDisplay')
      .assert.elementPresent('#notesTextarea')
      .saveScreenshot('tests/nightwatch/screenshots/medicationrequests/03-new-medicationrequest-form.png');
  });

  it('04. Create new medication request', browser => {
    browser
      .waitForElementVisible('#medicationRequestDetailPage', 5000)
      .pause(500);

    browser.execute(function() {
      return {
        hasMedicationRequestsCreate: typeof Meteor.call === 'function',
        userId: Meteor.userId ? Meteor.userId() : null,
        username: Meteor.user ? (Meteor.user() ? Meteor.user().username : null) : null
      };
    }, [], function(result) {
      console.log('Meteor state:', result.value);
    });

    browser
      .assert.urlContains('/medicationrequests/new');

    browser
      .pause(1000);

    browser.execute(function() {
      const requesterField = document.querySelector('#requesterDisplay');
      if (requesterField && requesterField.disabled) {
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
      .click('#requesterDisplay')
      .execute(function() {
        const requesterField = document.querySelector('#requesterDisplay');
        if (requesterField) {
          requesterField.select();
          requesterField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          requesterField.dispatchEvent(inputEvent);
          requesterField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(requesterField, '');
          requesterField.dispatchEvent(inputEvent);
        }
      })
      .pause(100)
      .setValue('#requesterDisplay', testMedicationRequest.requesterName)
      .click('#medicationCode')
      .execute(function() {
        const medicationCodeField = document.querySelector('#medicationCode');
        if (medicationCodeField) {
          medicationCodeField.select();
          medicationCodeField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          medicationCodeField.dispatchEvent(inputEvent);
          medicationCodeField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(medicationCodeField, '');
          medicationCodeField.dispatchEvent(inputEvent);
        }
      })
      .pause(100)
      .setValue('#medicationCode', testMedicationRequest.medicationCode)
      .click('#medicationDisplay')
      .execute(function() {
        const medicationDisplayField = document.querySelector('#medicationDisplay');
        if (medicationDisplayField) {
          medicationDisplayField.select();
          medicationDisplayField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          medicationDisplayField.dispatchEvent(inputEvent);
          medicationDisplayField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(medicationDisplayField, '');
          medicationDisplayField.dispatchEvent(inputEvent);
        }
      })
      .pause(100)
      .setValue('#medicationDisplay', testMedicationRequest.medicationDisplay);

    // Handle Material-UI Select components
    browser.execute(function(status) {
      const statusSelect = document.querySelector('#status');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === status) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testMedicationRequest.status]);

    browser.pause(500);

    browser.execute(function(intent) {
      const intentSelect = document.querySelector('#intent');
      if (intentSelect) {
        intentSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === intent) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testMedicationRequest.intent]);

    browser.pause(500);

    browser.execute(function(priority) {
      const prioritySelect = document.querySelector('#priority');
      if (prioritySelect) {
        prioritySelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === priority) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testMedicationRequest.priority]);

    browser
      .pause(500)
      .click('#dosageInstruction')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dosageInstruction', testMedicationRequest.dosageInstruction)
      .click('#dosageRouteCode')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dosageRouteCode', testMedicationRequest.dosageRoute)
      .click('#dosageRouteDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dosageRouteDisplay', testMedicationRequest.dosageRouteDisplay)
      .click('#dosageTiming')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dosageTiming', testMedicationRequest.dosageTiming)
      .click('#dispenseQuantity')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dispenseQuantity', testMedicationRequest.dispenseQuantity)
      .click('#dispenseUnit')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dispenseUnit', testMedicationRequest.dispenseUnit)
      .click('#numberOfRepeats')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#numberOfRepeats', testMedicationRequest.numberOfRepeats)
      .click('#authoredOn')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#authoredOn', testMedicationRequest.authoredOn)
      .click('#reasonCode')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#reasonCode', testMedicationRequest.reasonCode)
      .click('#reasonDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#reasonDisplay', testMedicationRequest.reasonDisplay)
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', testMedicationRequest.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/medicationrequests/04-filled-medicationrequest-form.png');

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
    
    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#medicationRequestsTable') !== null;
      const hasMedicationRequestsPage = document.querySelector('#medicationRequestsPage') !== null;
      const hasDetailPage = document.querySelector('#medicationRequestDetailPage') !== null;
      
      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });
      
      const consoleErrors = window.consoleErrors || [];
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasMedicationRequestsPage: hasMedicationRequestsPage,
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
      if (result.value.url === '/medicationrequests/new') {
        console.log('Still on new medication request page - save may have failed silently');
      }
    });
    
    browser
      .waitForElementVisible('#medicationRequestsPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/medicationrequests/05-medicationrequest-saved.png');
  });

  it('05. Verify new medication request appears in list', browser => {
    browser
      .waitForElementVisible('#medicationRequestsPage', 5000)
      .pause(1000)
      .waitForElementVisible('#medicationRequestsTable', 5000)
      .assert.containsText('#medicationRequestsTable', testMedicationRequest.requesterName)
      .assert.containsText('#medicationRequestsTable', testMedicationRequest.medicationDisplay)
      .saveScreenshot('tests/nightwatch/screenshots/medicationrequests/06-medicationrequest-in-list.png');
  });

  it('06. View medication request details', browser => {
    browser
      .waitForElementVisible('#medicationRequestsTable', 5000)
      .pause(1000);

    browser
      .execute(function(requesterName) {
        const rows = document.querySelectorAll('#medicationRequestsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(requesterName)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testMedicationRequest.requesterName], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked medication request row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationRequestDetailPage', 5000)
      .assert.valueContains('#requesterDisplay', testMedicationRequest.requesterName)
      .assert.valueContains('#medicationCode', testMedicationRequest.medicationCode)
      .assert.valueContains('#medicationDisplay', testMedicationRequest.medicationDisplay)
      .assert.valueContains('#dosageInstruction', testMedicationRequest.dosageInstruction)
      .execute(function() {
        const statusInput = document.querySelector('#status');
        const intentInput = document.querySelector('#intent');
        const priorityInput = document.querySelector('#priority');
        
        return {
          status: statusInput ? statusInput.value : null,
          intent: intentInput ? intentInput.value : null,
          priority: priorityInput ? priorityInput.value : null,
          notes: document.querySelector('#notesTextarea').value,
          statusDisplay: document.querySelector('[aria-labelledby*="status"]')?.textContent || 
                        document.querySelector('#status')?.parentElement?.textContent,
          intentDisplay: document.querySelector('[aria-labelledby*="intent"]')?.textContent ||
                        document.querySelector('#intent')?.parentElement?.textContent,
          priorityDisplay: document.querySelector('[aria-labelledby*="priority"]')?.textContent ||
                          document.querySelector('#priority')?.parentElement?.textContent
        };
      }, [], function(result) {
        const statusOk = result.value.status === testMedicationRequest.status || 
                        (result.value.statusDisplay && result.value.statusDisplay.toLowerCase().includes('active'));
        const intentOk = result.value.intent === testMedicationRequest.intent ||
                        (result.value.intentDisplay && result.value.intentDisplay.toLowerCase().includes('order'));
        const priorityOk = result.value.priority === testMedicationRequest.priority ||
                          (result.value.priorityDisplay && result.value.priorityDisplay.toLowerCase().includes('routine'));
        
        browser.assert.ok(statusOk, 'Status matches');
        browser.assert.ok(intentOk, 'Intent matches');
        browser.assert.ok(priorityOk, 'Priority matches');
        browser.assert.ok(result.value.notes.includes(testMedicationRequest.notes), 'Notes contain expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/medicationrequests/07-view-medicationrequest-details.png');
    
    browser
      .url('http://localhost:3000/medicationrequests')
      .waitForElementVisible('#medicationRequestsPage', 5000);
  });

  it('07. Update existing medication request', browser => {
    browser
      .waitForElementVisible('#medicationRequestsTable', 5000)
      .pause(1000);

    browser
      .execute(function(requesterName) {
        const rows = document.querySelectorAll('#medicationRequestsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(requesterName)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testMedicationRequest.requesterName], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked medication request row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationRequestDetailPage', 5000)
      .pause(500);

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

    browser
      .click('#requesterDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#requesterDisplay', updatedMedicationRequest.requesterName)
      .click('#status')
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
      }, [updatedMedicationRequest.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#priority')
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
      }, [updatedMedicationRequest.priority], function(result) {
        browser.assert.equal(result.value, true, 'Selected priority');
      })
      .click('#dosageInstruction')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dosageInstruction', updatedMedicationRequest.dosageInstruction)
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', updatedMedicationRequest.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/medicationrequests/08-updated-medicationrequest-form.png');

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
      .url('http://localhost:3000/medicationrequests')
      .waitForElementVisible('#medicationRequestsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/medicationrequests/09-medicationrequest-updated.png');
  });

  it('08. Verify updated medication request in list', browser => {
    browser
      .waitForElementVisible('#medicationRequestsTable', 5000)
      .pause(1000)
      .assert.containsText('#medicationRequestsTable', updatedMedicationRequest.requesterName)
      .saveScreenshot('tests/nightwatch/screenshots/medicationrequests/10-updated-medicationrequest-in-list.png');
  });

  it('09. Delete medication request', browser => {
    browser
      .waitForElementVisible('#medicationRequestsTable', 5000)
      .pause(1000);

    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#medicationRequestsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked medication request row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationRequestDetailPage', 5000);

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
      .pause(2000)
      .waitForElementVisible('#medicationRequestsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/medicationrequests/11-medicationrequest-deleted.png');
  });

  it('10. Verify medication request removed from list', browser => {
    browser
      .waitForElementVisible('#medicationRequestsTable', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#medicationRequestsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            return true;
          }
        }
        return false;
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value, false, 'Medication request no longer in list');
      })
      .saveScreenshot('tests/nightwatch/screenshots/medicationrequests/12-medicationrequest-not-in-list.png');
  });

  it('11. Test form validation', browser => {
    browser
      .waitForElementVisible('#medicationRequestsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Medication Request') || 
              button.textContent.includes('Add Your First Medication Request')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Medication Request button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationRequestDetailPage', 5000);

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

    browser
      .waitForElementVisible('#medicationRequestsPage', 5000, 'Form submitted and returned to medication requests list')
      .execute(function() {
        const rows = document.querySelectorAll('#medicationRequestsTable tbody tr');
        let foundEmptyMedicationRequest = false;
        for (let row of rows) {
          const cells = row.querySelectorAll('td');
          if (cells.length > 2) {
            const medicationCell = cells[2];
            if (!medicationCell.textContent || medicationCell.textContent.trim() === '') {
              foundEmptyMedicationRequest = true;
              break;
            }
          }
        }
        return foundEmptyMedicationRequest;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Medication request created with empty fields (no validation)');
      })
      .saveScreenshot('tests/nightwatch/screenshots/medicationrequests/13-validation-check.png');
  });

  after(browser => {
    browser.executeAsync(function(done) {
      if (typeof MedicationRequests !== 'undefined') {
        MedicationRequests.find({ 
          'requester.display': { $regex: 'Smith|Johnson' }
        }).fetch().forEach(function(medicationRequest) {
          MedicationRequests.remove({ _id: medicationRequest._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});