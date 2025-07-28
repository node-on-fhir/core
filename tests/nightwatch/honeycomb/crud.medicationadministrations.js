// tests/nightwatch/honeycomb/crud.medicationadministrations.js

const testUtils = require('./shared-test-utils');

describe('MedicationAdministrations CRUD Operations', function() {
  const timestamp = Date.now();
  const testMedicationAdministration = {
    patientName: 'John Doe',
    performerName: `Nurse Smith ${timestamp}`,
    medicationCode: '387458008', // Aspirin SNOMED code
    medicationDisplay: 'Aspirin 325mg',
    status: 'in-progress',
    category: 'inpatient',
    effectiveDateTime: '2024-01-15T10:30:00',
    dosageText: '325mg',
    dosageRoute: '26643006', // Oral route
    dosageRouteDisplay: 'Oral',
    dosageMethod: '421521009', // Swallow
    dosageMethodDisplay: 'Swallow',
    dosageDose: '325',
    dosageDoseUnit: 'mg',
    requestReference: `MedicationRequest/${timestamp}`,
    reasonCode: '59621000',
    reasonDisplay: 'Hypertension',
    notes: `Test medication administration created at ${timestamp}`
  };

  const updatedMedicationAdministration = {
    performerName: `Nurse Johnson ${timestamp}`,
    status: 'completed',
    effectiveDateTime: '2024-01-15T11:00:00',
    notes: `Test medication administration updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting MedicationAdministrations CRUD test suite...');
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
        if (typeof MedicationAdministrations !== 'undefined') {
          const testMedicationAdministrations = MedicationAdministrations.find({ 
            'performer': { 
              $elemMatch: { 
                'actor.display': { $regex: 'Nurse Smith|Nurse Johnson' } 
              } 
            }
          }).fetch();
          testMedicationAdministrations.forEach(function(medicationAdministration) {
            MedicationAdministrations.remove({ _id: medicationAdministration._id });
          });
          console.log('Cleared', testMedicationAdministrations.length, 'test medication administrations');
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

  it('02. Verify medication administrations list page loads', browser => {
    browser
      .url('http://localhost:3000/medicationadministrations')
      .waitForElementVisible('#medicationAdministrationsPage', 5000)
      .pause(2000)
      .execute(function() {
        const hasTable = document.querySelector('#medicationAdministrationsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#medicationAdministrationsPage') && 
                             document.querySelector('#medicationAdministrationsPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either medication administrations table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/02-medicationadministrations-list.png');
  });

  it('03. Navigate to new medication administration form', browser => {
    browser
      .waitForElementVisible('#medicationAdministrationsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Medication Administration') || 
              button.textContent.includes('Add Your First Medication Administration')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Medication Administration button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationAdministrationDetailPage', 5000)
      .assert.elementPresent('#subjectDisplay')
      .assert.elementPresent('#performerDisplay')
      .assert.elementPresent('#medicationCode')
      .assert.elementPresent('#medicationDisplay')
      .assert.elementPresent('#status')
      .assert.elementPresent('#category')
      .assert.elementPresent('#effectiveDateTime')
      .assert.elementPresent('#dosageText')
      .assert.elementPresent('#dosageRouteCode')
      .assert.elementPresent('#dosageRouteDisplay')
      .assert.elementPresent('#dosageMethodCode')
      .assert.elementPresent('#dosageMethodDisplay')
      .assert.elementPresent('#dosageDose')
      .assert.elementPresent('#dosageDoseUnit')
      .assert.elementPresent('#requestReference')
      .assert.elementPresent('#reasonCode')
      .assert.elementPresent('#reasonDisplay')
      .assert.elementPresent('#notesTextarea')
      .saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/03-new-medicationadministration-form.png');
  });

  it('04. Create new medication administration', browser => {
    browser
      .waitForElementVisible('#medicationAdministrationDetailPage', 5000)
      .pause(500);

    browser.execute(function() {
      return {
        hasMedicationAdministrationsCreate: typeof Meteor.call === 'function',
        userId: Meteor.userId ? Meteor.userId() : null,
        username: Meteor.user ? (Meteor.user() ? Meteor.user().username : null) : null
      };
    }, [], function(result) {
      console.log('Meteor state:', result.value);
    });

    browser
      .assert.urlContains('/medicationadministrations/new');

    browser
      .pause(1000);

    browser.execute(function() {
      const performerField = document.querySelector('#performerDisplay');
      if (performerField && performerField.disabled) {
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
      .click('#performerDisplay')
      .execute(function() {
        const performerField = document.querySelector('#performerDisplay');
        if (performerField) {
          performerField.select();
          performerField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          performerField.dispatchEvent(inputEvent);
          performerField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(performerField, '');
          performerField.dispatchEvent(inputEvent);
        }
      })
      .pause(100)
      .setValue('#performerDisplay', testMedicationAdministration.performerName)
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
      .setValue('#medicationCode', testMedicationAdministration.medicationCode)
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
      .setValue('#medicationDisplay', testMedicationAdministration.medicationDisplay);

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
    }, [testMedicationAdministration.status]);

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
    }, [testMedicationAdministration.category]);

    browser
      .pause(500)
      .click('#effectiveDateTime')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#effectiveDateTime', testMedicationAdministration.effectiveDateTime)
      .click('#dosageText')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dosageText', testMedicationAdministration.dosageText)
      .click('#dosageRouteCode')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dosageRouteCode', testMedicationAdministration.dosageRoute)
      .click('#dosageRouteDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dosageRouteDisplay', testMedicationAdministration.dosageRouteDisplay)
      .click('#dosageMethodCode')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dosageMethodCode', testMedicationAdministration.dosageMethod)
      .click('#dosageMethodDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dosageMethodDisplay', testMedicationAdministration.dosageMethodDisplay)
      .click('#dosageDose')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dosageDose', testMedicationAdministration.dosageDose)
      .click('#dosageDoseUnit')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#dosageDoseUnit', testMedicationAdministration.dosageDoseUnit)
      .click('#requestReference')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#requestReference', testMedicationAdministration.requestReference)
      .click('#reasonCode')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#reasonCode', testMedicationAdministration.reasonCode)
      .click('#reasonDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#reasonDisplay', testMedicationAdministration.reasonDisplay)
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', testMedicationAdministration.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/04-filled-medicationadministration-form.png');

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
      const hasTable = document.querySelector('#medicationAdministrationsTable') !== null;
      const hasMedicationAdministrationsPage = document.querySelector('#medicationAdministrationsPage') !== null;
      const hasDetailPage = document.querySelector('#medicationAdministrationDetailPage') !== null;
      
      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });
      
      const consoleErrors = window.consoleErrors || [];
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasMedicationAdministrationsPage: hasMedicationAdministrationsPage,
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
      if (result.value.url === '/medicationadministrations/new') {
        console.log('Still on new medication administration page - save may have failed silently');
      }
    });
    
    browser
      .waitForElementVisible('#medicationAdministrationsPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/05-medicationadministration-saved.png');
  });

  it('05. Verify new medication administration appears in list', browser => {
    browser
      .waitForElementVisible('#medicationAdministrationsPage', 5000)
      .pause(1000)
      .waitForElementVisible('#medicationAdministrationsTable', 5000)
      .assert.containsText('#medicationAdministrationsTable', testMedicationAdministration.performerName)
      .assert.containsText('#medicationAdministrationsTable', testMedicationAdministration.medicationDisplay)
      .saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/06-medicationadministration-in-list.png');
  });

  it('06. View medication administration details', browser => {
    browser
      .waitForElementVisible('#medicationAdministrationsTable', 5000)
      .pause(1000);

    browser
      .execute(function(performerName) {
        const rows = document.querySelectorAll('#medicationAdministrationsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(performerName)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testMedicationAdministration.performerName], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked medication administration row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationAdministrationDetailPage', 5000)
      .assert.valueContains('#performerDisplay', testMedicationAdministration.performerName)
      .assert.valueContains('#medicationCode', testMedicationAdministration.medicationCode)
      .assert.valueContains('#medicationDisplay', testMedicationAdministration.medicationDisplay)
      .assert.valueContains('#dosageText', testMedicationAdministration.dosageText)
      .execute(function() {
        const statusInput = document.querySelector('#status');
        const categoryInput = document.querySelector('#category');
        
        return {
          status: statusInput ? statusInput.value : null,
          category: categoryInput ? categoryInput.value : null,
          notes: document.querySelector('#notesTextarea').value,
          statusDisplay: document.querySelector('[aria-labelledby*="status"]')?.textContent || 
                        document.querySelector('#status')?.parentElement?.textContent,
          categoryDisplay: document.querySelector('[aria-labelledby*="category"]')?.textContent ||
                          document.querySelector('#category')?.parentElement?.textContent
        };
      }, [], function(result) {
        const statusOk = result.value.status === testMedicationAdministration.status || 
                        (result.value.statusDisplay && result.value.statusDisplay.toLowerCase().includes('progress'));
        const categoryOk = result.value.category === testMedicationAdministration.category ||
                          (result.value.categoryDisplay && result.value.categoryDisplay.toLowerCase().includes('inpatient'));
        
        browser.assert.ok(statusOk, 'Status matches');
        browser.assert.ok(categoryOk, 'Category matches');
        browser.assert.ok(result.value.notes.includes(testMedicationAdministration.notes), 'Notes contain expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/07-view-medicationadministration-details.png');
    
    browser
      .url('http://localhost:3000/medicationadministrations')
      .waitForElementVisible('#medicationAdministrationsPage', 5000);
  });

  it('07. Update existing medication administration', browser => {
    browser
      .waitForElementVisible('#medicationAdministrationsTable', 5000)
      .pause(1000);

    browser
      .execute(function(performerName) {
        const rows = document.querySelectorAll('#medicationAdministrationsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(performerName)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testMedicationAdministration.performerName], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked medication administration row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationAdministrationDetailPage', 5000)
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
      .click('#performerDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#performerDisplay', updatedMedicationAdministration.performerName)
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
      }, [updatedMedicationAdministration.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#effectiveDateTime')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#effectiveDateTime', updatedMedicationAdministration.effectiveDateTime)
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', updatedMedicationAdministration.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/08-updated-medicationadministration-form.png');

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
      .url('http://localhost:3000/medicationadministrations')
      .waitForElementVisible('#medicationAdministrationsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/09-medicationadministration-updated.png');
  });

  it('08. Verify updated medication administration in list', browser => {
    browser
      .waitForElementVisible('#medicationAdministrationsTable', 5000)
      .pause(1000)
      .assert.containsText('#medicationAdministrationsTable', updatedMedicationAdministration.performerName)
      .saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/10-updated-medicationadministration-in-list.png');
  });

  it('09. Delete medication administration', browser => {
    browser
      .waitForElementVisible('#medicationAdministrationsTable', 5000)
      .pause(1000);

    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#medicationAdministrationsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked medication administration row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationAdministrationDetailPage', 5000);

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
      .waitForElementVisible('#medicationAdministrationsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/11-medicationadministration-deleted.png');
  });

  it('10. Verify medication administration removed from list', browser => {
    browser
      .waitForElementVisible('#medicationAdministrationsTable', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#medicationAdministrationsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            return true;
          }
        }
        return false;
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value, false, 'Medication administration no longer in list');
      })
      .saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/12-medicationadministration-not-in-list.png');
  });

  it('11. Test form validation', browser => {
    browser
      .waitForElementVisible('#medicationAdministrationsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Medication Administration') || 
              button.textContent.includes('Add Your First Medication Administration')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Medication Administration button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#medicationAdministrationDetailPage', 5000);

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
      .waitForElementVisible('#medicationAdministrationsPage', 5000, 'Form submitted and returned to medication administrations list')
      .execute(function() {
        const rows = document.querySelectorAll('#medicationAdministrationsTable tbody tr');
        let foundEmptyMedicationAdministration = false;
        for (let row of rows) {
          const cells = row.querySelectorAll('td');
          if (cells.length > 2) {
            const medicationCell = cells[2];
            if (!medicationCell.textContent || medicationCell.textContent.trim() === '') {
              foundEmptyMedicationAdministration = true;
              break;
            }
          }
        }
        return foundEmptyMedicationAdministration;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Medication administration created with empty fields (no validation)');
      })
      .saveScreenshot('tests/nightwatch/screenshots/medicationadministrations/13-validation-check.png');
  });

  after(browser => {
    browser.executeAsync(function(done) {
      if (typeof MedicationAdministrations !== 'undefined') {
        MedicationAdministrations.find({ 
          'performer': { 
            $elemMatch: { 
              'actor.display': { $regex: 'Nurse Smith|Nurse Johnson' } 
            } 
          }
        }).fetch().forEach(function(medicationAdministration) {
          MedicationAdministrations.remove({ _id: medicationAdministration._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});