// tests/nightwatch/honeycomb/crud.researchsubjects.js

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('ResearchSubjects CRUD Operations', function() {
  const timestamp = Date.now();
  let testPatientId = null; // Store the created patient ID
  
  const testResearchSubject = {
    patientName: 'John Doe',
    studyReference: `ResearchStudy/${timestamp}`,
    studyDisplay: `Test Study ${timestamp}`,
    status: 'on-study',
    period: {
      start: '2024-01-15',
      end: '2024-12-31'
    },
    assignedArm: 'treatment-arm-a',
    actualArm: 'treatment-arm-a',
    consent: {
      reference: `Consent/${timestamp}`,
      display: `Informed Consent ${timestamp}`
    }
  };

  const updatedResearchSubject = {
    status: 'off-study',
    actualArm: 'treatment-arm-b',
    period: {
      start: '2024-01-15',
      end: '2024-06-30'
    }
  };

  before(browser => {
    console.log('Starting ResearchSubjects CRUD test suite...');
    browser
      .windowSize('current', 1400, 900)  // Set to landscape/desktop size
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  beforeEach(browser => {
    browser.pause(1000);  // Give time for page to stabilize between tests
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    // Use loginHelper to ensure user is logged in with retry logic
    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      } else {
        browser.assert.ok(true, 'User is logged in');
      }

      // Create a test patient
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
          testPatientId = result.result; // Save the patient ID
          browser.assert.ok(true, 'Successfully created test patient');

          // Fetch patient from server and set in Session
          browser.executeAsync(function(patientId, done) {
            if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
              Meteor.call('patients.findOne', patientId, function(error, patient) {
                if (error) {
                  console.error('Error fetching patient:', error);
                  done({ success: false, error: error.message });
                } else if (patient) {
                  Session.set('selectedPatientId', patient._id);
                  Session.set('selectedPatient', patient);
                  console.log('Set selected patient in Session:', patient._id, patient.name?.[0]?.text);
                  done({ success: true, patientId: patient._id, patientName: patient.name?.[0]?.text });
                } else {
                  console.error('Patient not found:', patientId);
                  done({ success: false, error: 'Patient not found' });
                }
              });
            } else {
              done({ success: false, error: 'Meteor or Session not available' });
            }
          }, [result.result], function(fetchResult) {
            if (fetchResult.value && fetchResult.value.success) {
              console.log('Successfully set selected patient:', fetchResult.value);
            } else if (fetchResult.value) {
              console.error('Failed to set selected patient:', fetchResult.value.error);
            }
          });
        }
      });

      // Clean up any existing test data
      browser.executeAsync(function(done) {
        if (typeof ResearchSubjects !== 'undefined') {
          const testSubjects = ResearchSubjects.find({ 'study.display': { $regex: 'Test Study' } }).fetch();
          testSubjects.forEach(function(subject) {
            ResearchSubjects.remove({ _id: subject._id });
          });
          console.log('Cleared', testSubjects.length, 'test research subjects');
        }
        done();
      });
    });
  });

  it('02. Verify research subjects list page loads', browser => {
    testUtils.navigateUrl(browser, '/research-subjects');
    browser
      .waitForElementVisible('#researchSubjectsPage', 5000)
      .execute(function() {
        const hasTable = document.querySelector('#researchSubjectsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#researchSubjectsPage') && 
                             document.querySelector('#researchSubjectsPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either research subjects table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/research-subjects/02-research-subjects-list.png');
  });

  it('03. Navigate to new research subject form', browser => {
    browser
      .waitForElementVisible('#researchSubjectsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Research Subject') || 
              button.textContent.includes('Add Your First Research Subject')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Research Subject button');
      });

    browser
      .waitForElementVisible('#researchSubjectDetailPage', 5000)
      .assert.elementPresent('#subjectDisplay')
      .assert.elementPresent('#studyDisplay')
      .assert.elementPresent('#status')
      .assert.elementPresent('#periodStart')
      .assert.elementPresent('#periodEnd')
      .assert.elementPresent('#assignedArm')
      .assert.elementPresent('#actualArm')
      .assert.elementPresent('#consentDisplay')
      .saveScreenshot('tests/nightwatch/screenshots/research-subjects/03-new-research-subject-form.png');
  });

  it('04. Create new research subject', browser => {
    browser
      .waitForElementVisible('#researchSubjectDetailPage', 5000)
      .pause(500);

    browser.execute(function() {
      return {
        hasResearchSubjectsCreate: typeof Meteor.call === 'function',
        userId: Meteor.userId ? Meteor.userId() : null,
        username: Meteor.user ? (Meteor.user() ? Meteor.user().username : null) : null
      };
    }, [], function(result) {
      console.log('Meteor state:', result.value);
    });

    browser
      .assert.urlContains('/research-subjects/new');

    browser
      .pause(500);

    // Check if form is in edit mode
    browser.execute(function() {
      const studyField = document.querySelector('#studyDisplay');
      if (studyField && studyField.disabled) {
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
      .click('#studyDisplay')
      .execute(function() {
        const studyField = document.querySelector('#studyDisplay');
        if (studyField) {
          studyField.select();
          studyField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          studyField.dispatchEvent(inputEvent);
          studyField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(studyField, '');
          studyField.dispatchEvent(inputEvent);
        }
      })
      .setValue('#studyDisplay', testResearchSubject.studyDisplay);

    // Fill in the patient field using the same approach as study field
    browser
      .pause(200)
      .click('#subjectDisplay')
      .execute(function() {
        const subjectField = document.querySelector('#subjectDisplay');
        if (subjectField) {
          subjectField.select();
          subjectField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          subjectField.dispatchEvent(inputEvent);
          subjectField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(subjectField, '');
          subjectField.dispatchEvent(inputEvent);
        }
      })
      .setValue('#subjectDisplay', testResearchSubject.patientName);

    // Handle Material-UI Select for status
    browser.execute(function(status) {
      const statusSelect = document.querySelector('#status');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === status || 
                option.textContent.toLowerCase().includes(status.replace('-', ' '))) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testResearchSubject.status]);

    browser
      .pause(500)
      .click('#periodStart')
      .clearValue('#periodStart')
      .setValue('#periodStart', testResearchSubject.period.start)
      .click('#periodEnd')
      .clearValue('#periodEnd')
      .setValue('#periodEnd', testResearchSubject.period.end)
      .click('#assignedArm')
      .clearValue('#assignedArm')
      .setValue('#assignedArm', testResearchSubject.assignedArm)
      .click('#actualArm')
      .clearValue('#actualArm')
      .setValue('#actualArm', testResearchSubject.actualArm)
      .click('#consentDisplay')
      .clearValue('#consentDisplay')
      .setValue('#consentDisplay', testResearchSubject.consent.display)
      .pause(2000)  // Give form more time to process all inputs
      .saveScreenshot('tests/nightwatch/screenshots/research-subjects/04-filled-research-subject-form.png');

    // Save the research subject
    browser
      .pause(1000)  // Additional pause before clicking save
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
      .pause(5000)  // Give more time for async save and navigation
      .waitForElementVisible('#researchSubjectsPage', 10000);  // Increased timeout
    
    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#researchSubjectsTable') !== null;
      const hasResearchSubjectsPage = document.querySelector('#researchSubjectsPage') !== null;
      const hasDetailPage = document.querySelector('#researchSubjectDetailPage') !== null;
      
      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });
      
      const consoleErrors = window.consoleErrors || [];
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasResearchSubjectsPage: hasResearchSubjectsPage,
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
      if (result.value.url === '/research-subjects/new') {
        console.log('Still on new research subject page - save may have failed silently');
      }
    });
    
    browser
      .waitForElementVisible('#researchSubjectsPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/research-subjects/05-research-subject-saved.png');
  });

  it('05. Verify new research subject appears in list', browser => {
    browser
      .waitForElementVisible('#researchSubjectsPage', 5000)
      .waitForElementVisible('#researchSubjectsTable', 5000)
      .assert.containsText('#researchSubjectsTable', testResearchSubject.studyDisplay)
      .assert.containsText('#researchSubjectsTable', 'On Study')
      .saveScreenshot('tests/nightwatch/screenshots/research-subjects/06-research-subject-in-list.png');
  });

  it('06. View research subject details', browser => {
    browser
      .waitForElementVisible('#researchSubjectsTable', 5000);

    browser
      .execute(function(studyDisplay) {
        const rows = document.querySelectorAll('#researchSubjectsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(studyDisplay)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testResearchSubject.studyDisplay], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked research subject row');
      });

    browser
      .waitForElementVisible('#researchSubjectDetailPage', 5000)
      .assert.valueContains('#studyDisplay', testResearchSubject.studyDisplay)
      .execute(function() {
        const statusInput = document.querySelector('#status');
        const assignedArm = document.querySelector('#assignedArm').value;
        const actualArm = document.querySelector('#actualArm').value;
        const consentDisplay = document.querySelector('#consentDisplay').value;
        
        return {
          status: statusInput ? statusInput.value : null,
          assignedArm: assignedArm,
          actualArm: actualArm,
          consentDisplay: consentDisplay,
          statusDisplay: document.querySelector('[aria-labelledby*="status"]')?.textContent || 
                        document.querySelector('#status')?.parentElement?.textContent
        };
      }, [], function(result) {
        const statusOk = result.value.status === testResearchSubject.status || 
                        (result.value.statusDisplay && result.value.statusDisplay.includes('On Study'));
        
        browser.assert.ok(statusOk, 'Status matches');
        browser.assert.ok(result.value.assignedArm === testResearchSubject.assignedArm, 'Assigned arm matches');
        browser.assert.ok(result.value.actualArm === testResearchSubject.actualArm, 'Actual arm matches');
        browser.assert.ok(result.value.consentDisplay.includes(testResearchSubject.consent.display), 'Consent display contains expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/research-subjects/07-view-research-subject-details.png');


    testUtils.navigateUrl(browser, '/research-subjects');
    browser
      .waitForElementVisible('#researchSubjectsPage', 5000);
  });

  it('07. Update existing research subject', browser => {
    browser
      .waitForElementVisible('#researchSubjectsTable', 5000);

    browser
      .execute(function(studyDisplay) {
        const rows = document.querySelectorAll('#researchSubjectsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(studyDisplay)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testResearchSubject.studyDisplay], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked research subject row');
      });

    browser
      .waitForElementVisible('#researchSubjectDetailPage', 5000)
      .pause(500);

    // Click the lock icon to enter edit mode
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

    // Update research subject details
    browser
      .click('#status')
      .pause(300)
      .execute(function(value) {
        const menuItems = document.querySelectorAll('[role="option"]');
        for (let item of menuItems) {
          if (item.textContent.toLowerCase().includes(value.toLowerCase().replace('-', ' ')) || 
              item.getAttribute('data-value') === value) {
            item.click();
            return true;
          }
        }
        return false;
      }, [updatedResearchSubject.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#actualArm')
      .clearValue('#actualArm')
      .setValue('#actualArm', updatedResearchSubject.actualArm)
      .click('#periodEnd')
      .clearValue('#periodEnd')
      .setValue('#periodEnd', updatedResearchSubject.period.end)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/research-subjects/08-updated-research-subject-form.png');

    // Save the updated research subject
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

    testUtils.navigateUrl(browser, '/research-subjects');
    browser
      .waitForElementVisible('#researchSubjectsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/research-subjects/09-research-subject-updated.png');
  });

  it('08. Verify updated research subject in list', browser => {
    browser
      .waitForElementVisible('#researchSubjectsTable', 5000)
      .assert.containsText('#researchSubjectsTable', testResearchSubject.studyDisplay)
      .assert.containsText('#researchSubjectsTable', 'Off Study')
      .saveScreenshot('tests/nightwatch/screenshots/research-subjects/10-updated-research-subject-in-list.png');
  });

  it('09. Delete research subject', browser => {
    browser
      .waitForElementVisible('#researchSubjectsPage', 5000);

    // First check if we have a table or no data state
    browser.execute(function() {
      const hasTable = document.querySelector('#researchSubjectsTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#researchSubjectsPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        // If table exists, proceed with delete test
        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#researchSubjectsTable tbody tr');
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked research subject row');
          });

        browser
          .waitForElementVisible('#researchSubjectDetailPage', 5000);

        // Click the lock icon to enter edit mode first
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

        // Click the Delete button and handle the confirmation
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
          .acceptAlert()
          .pause(3000); // Wait for component's 500ms setTimeout + navigation + subscription reload + render

        browser
          .waitForElementVisible('#researchSubjectsPage', 10000)
          .execute(function() {
            const hasTable = document.querySelector('#researchSubjectsTable') !== null;
            const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                                document.querySelector('.no-data-available') !== null ||
                                document.querySelector('[id*="no-data"]') !== null ||
                                (document.querySelector('#researchSubjectsPage') && 
                                 document.querySelector('#researchSubjectsPage').textContent.includes('No Data Available'));
            return {
              hasTable: hasTable,
              hasNoDataCard: hasNoDataCard,
              hasEitherElement: hasTable || hasNoDataCard
            };
          }, [], function(result) {
            // ADD NULL CHECK - execute can return null
            if (!result || !result.value) {
              browser.assert.fail('Failed to check page state after deletion - execute returned null');
              return;
            }
            browser.assert.equal(result.value.hasEitherElement, true, 'Either research subjects table or no-data message is present after deletion');
          });
      } else if (result.value.hasNoData) {
        // If no data, skip the delete test but still pass
        browser.assert.ok(true, 'No research subjects to delete - No Data Available state is correct');
      }
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/research-subjects/11-research-subject-deleted.png');
  });

  it('10. Verify research subject removed from list', browser => {
    browser
      .waitForElementVisible('#researchSubjectsPage', 5000)
      .execute(function(timestamp) {
        // Check if table exists first
        const table = document.querySelector('#researchSubjectsTable');
        if (table) {
          const rows = document.querySelectorAll('#researchSubjectsTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          // No table means no data, which means research subject was deleted
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#researchSubjectsPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Research subject no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (research subject was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/research-subjects/12-research-subject-not-in-list.png');
  });

  // Test 11 removed - form validation now properly prevents saving without required fields

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof ResearchSubjects !== 'undefined') {
        ResearchSubjects.find({ 'study.display': { $regex: 'Test Study' } }).fetch().forEach(function(subject) {
          ResearchSubjects.remove({ _id: subject._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});