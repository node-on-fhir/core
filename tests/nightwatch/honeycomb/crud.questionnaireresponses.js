// tests/nightwatch/honeycomb/crud.questionnaireresponses.js

const testUtils = require('./shared-test-utils');

describe('QuestionnaireResponses CRUD Operations', function() {
  const timestamp = Date.now();
  const testQuestionnaireResponse = {
    patientName: 'John Doe',
    authorName: `Dr. Smith ${timestamp}`,
    questionnaire: `Questionnaire/health-assessment-${timestamp}`,
    questionnaireDisplay: 'Health Assessment Form',
    status: 'in-progress',
    authored: '2024-01-15T10:00:00',
    source: 'Patient',
    basedOn: `ServiceRequest/${timestamp}`,
    partOf: `Encounter/${timestamp}`,
    subject: 'Patient/john-doe',
    identifier: `response-${timestamp}`,
    reasonCode: '415293003',
    reasonDisplay: 'Annual health check',
    notes: `Test questionnaire response created at ${timestamp}`
  };

  const updatedQuestionnaireResponse = {
    authorName: `Dr. Johnson ${timestamp}`,
    status: 'completed',
    authored: '2024-01-15T11:00:00',
    notes: `Test questionnaire response updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting QuestionnaireResponses CRUD test suite...');
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
        if (typeof QuestionnaireResponses !== 'undefined') {
          const testQuestionnaireResponses = QuestionnaireResponses.find({ 
            'author.display': { $regex: 'Smith|Johnson' }
          }).fetch();
          testQuestionnaireResponses.forEach(function(questionnaireResponse) {
            QuestionnaireResponses.remove({ _id: questionnaireResponse._id });
          });
          console.log('Cleared', testQuestionnaireResponses.length, 'test questionnaire responses');
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

  it('02. Verify questionnaire responses list page loads', browser => {
    browser
      .url('http://localhost:3000/questionnaireresponses')
      .waitForElementVisible('#questionnaireResponsesPage', 5000)
      .pause(2000)
      .execute(function() {
        const hasTable = document.querySelector('#questionnaireResponsesTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#questionnaireResponsesPage') && 
                             document.querySelector('#questionnaireResponsesPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either questionnaire responses table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/02-questionnaireresponses-list.png');
  });

  it('03. Navigate to new questionnaire response form', browser => {
    browser
      .waitForElementVisible('#questionnaireResponsesPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Questionnaire Response') || 
              button.textContent.includes('Add Your First Questionnaire Response')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Questionnaire Response button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#questionnaireResponseDetailPage', 5000)
      .assert.elementPresent('#subjectDisplay')
      .assert.elementPresent('#authorDisplay')
      .assert.elementPresent('#questionnaire')
      .assert.elementPresent('#questionnaireDisplay')
      .assert.elementPresent('#status')
      .assert.elementPresent('#authored')
      .assert.elementPresent('#source')
      .assert.elementPresent('#basedOn')
      .assert.elementPresent('#partOf')
      .assert.elementPresent('#identifier')
      .assert.elementPresent('#reasonCode')
      .assert.elementPresent('#reasonDisplay')
      .assert.elementPresent('#notesTextarea')
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/03-new-questionnaireresponse-form.png');
  });

  it('04. Create new questionnaire response', browser => {
    browser
      .waitForElementVisible('#questionnaireResponseDetailPage', 5000)
      .pause(500);

    browser.execute(function() {
      return {
        hasQuestionnaireResponsesCreate: typeof Meteor.call === 'function',
        userId: Meteor.userId ? Meteor.userId() : null,
        username: Meteor.user ? (Meteor.user() ? Meteor.user().username : null) : null
      };
    }, [], function(result) {
      console.log('Meteor state:', result.value);
    });

    browser
      .assert.urlContains('/questionnaireresponses/new');

    browser
      .pause(1000);

    browser.execute(function() {
      const authorField = document.querySelector('#authorDisplay');
      if (authorField && authorField.disabled) {
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
      .click('#authorDisplay')
      .execute(function() {
        const authorField = document.querySelector('#authorDisplay');
        if (authorField) {
          authorField.select();
          authorField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          authorField.dispatchEvent(inputEvent);
          authorField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(authorField, '');
          authorField.dispatchEvent(inputEvent);
        }
      })
      .pause(100)
      .setValue('#authorDisplay', testQuestionnaireResponse.authorName)
      .click('#questionnaire')
      .execute(function() {
        const questionnaireField = document.querySelector('#questionnaire');
        if (questionnaireField) {
          questionnaireField.select();
          questionnaireField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          questionnaireField.dispatchEvent(inputEvent);
          questionnaireField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(questionnaireField, '');
          questionnaireField.dispatchEvent(inputEvent);
        }
      })
      .pause(100)
      .setValue('#questionnaire', testQuestionnaireResponse.questionnaire)
      .click('#questionnaireDisplay')
      .execute(function() {
        const questionnaireDisplayField = document.querySelector('#questionnaireDisplay');
        if (questionnaireDisplayField) {
          questionnaireDisplayField.select();
          questionnaireDisplayField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          questionnaireDisplayField.dispatchEvent(inputEvent);
          questionnaireDisplayField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(questionnaireDisplayField, '');
          questionnaireDisplayField.dispatchEvent(inputEvent);
        }
      })
      .pause(100)
      .setValue('#questionnaireDisplay', testQuestionnaireResponse.questionnaireDisplay);

    // Handle Material-UI Select component for status
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
    }, [testQuestionnaireResponse.status]);

    browser
      .pause(500)
      .click('#authored')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#authored', testQuestionnaireResponse.authored)
      .click('#source')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#source', testQuestionnaireResponse.source)
      .click('#basedOn')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#basedOn', testQuestionnaireResponse.basedOn)
      .click('#partOf')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#partOf', testQuestionnaireResponse.partOf)
      .click('#identifier')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#identifier', testQuestionnaireResponse.identifier)
      .click('#reasonCode')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#reasonCode', testQuestionnaireResponse.reasonCode)
      .click('#reasonDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#reasonDisplay', testQuestionnaireResponse.reasonDisplay)
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', testQuestionnaireResponse.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/04-filled-questionnaireresponse-form.png');

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
      const hasTable = document.querySelector('#questionnaireResponsesTable') !== null;
      const hasQuestionnaireResponsesPage = document.querySelector('#questionnaireResponsesPage') !== null;
      const hasDetailPage = document.querySelector('#questionnaireResponseDetailPage') !== null;
      
      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });
      
      const consoleErrors = window.consoleErrors || [];
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasQuestionnaireResponsesPage: hasQuestionnaireResponsesPage,
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
      if (result.value.url === '/questionnaireresponses/new') {
        console.log('Still on new questionnaire response page - save may have failed silently');
      }
    });
    
    browser
      .waitForElementVisible('#questionnaireResponsesPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/05-questionnaireresponse-saved.png');
  });

  it('05. Verify new questionnaire response appears in list', browser => {
    browser
      .waitForElementVisible('#questionnaireResponsesPage', 5000)
      .pause(1000)
      .waitForElementVisible('#questionnaireResponsesTable', 5000)
      .assert.containsText('#questionnaireResponsesTable', testQuestionnaireResponse.authorName)
      .assert.containsText('#questionnaireResponsesTable', testQuestionnaireResponse.questionnaireDisplay)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/06-questionnaireresponse-in-list.png');
  });

  it('06. View questionnaire response details', browser => {
    browser
      .waitForElementVisible('#questionnaireResponsesTable', 5000)
      .pause(1000);

    browser
      .execute(function(authorName) {
        const rows = document.querySelectorAll('#questionnaireResponsesTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(authorName)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testQuestionnaireResponse.authorName], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked questionnaire response row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#questionnaireResponseDetailPage', 5000)
      .assert.valueContains('#authorDisplay', testQuestionnaireResponse.authorName)
      .assert.valueContains('#questionnaire', testQuestionnaireResponse.questionnaire)
      .assert.valueContains('#questionnaireDisplay', testQuestionnaireResponse.questionnaireDisplay)
      .assert.valueContains('#identifier', testQuestionnaireResponse.identifier)
      .execute(function() {
        const statusInput = document.querySelector('#status');
        
        return {
          status: statusInput ? statusInput.value : null,
          notes: document.querySelector('#notesTextarea').value,
          statusDisplay: document.querySelector('[aria-labelledby*="status"]')?.textContent || 
                        document.querySelector('#status')?.parentElement?.textContent
        };
      }, [], function(result) {
        const statusOk = result.value.status === testQuestionnaireResponse.status || 
                        (result.value.statusDisplay && result.value.statusDisplay.toLowerCase().includes('progress'));
        
        browser.assert.ok(statusOk, 'Status matches');
        browser.assert.ok(result.value.notes.includes(testQuestionnaireResponse.notes), 'Notes contain expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/07-view-questionnaireresponse-details.png');
    
    browser
      .url('http://localhost:3000/questionnaireresponses')
      .waitForElementVisible('#questionnaireResponsesPage', 5000);
  });

  it('07. Update existing questionnaire response', browser => {
    browser
      .waitForElementVisible('#questionnaireResponsesTable', 5000)
      .pause(1000);

    browser
      .execute(function(authorName) {
        const rows = document.querySelectorAll('#questionnaireResponsesTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(authorName)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testQuestionnaireResponse.authorName], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked questionnaire response row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#questionnaireResponseDetailPage', 5000)
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
      .click('#authorDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#authorDisplay', updatedQuestionnaireResponse.authorName)
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
      }, [updatedQuestionnaireResponse.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#authored')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#authored', updatedQuestionnaireResponse.authored)
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', updatedQuestionnaireResponse.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/08-updated-questionnaireresponse-form.png');

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
      .url('http://localhost:3000/questionnaireresponses')
      .waitForElementVisible('#questionnaireResponsesTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/09-questionnaireresponse-updated.png');
  });

  it('08. Verify updated questionnaire response in list', browser => {
    browser
      .waitForElementVisible('#questionnaireResponsesTable', 5000)
      .pause(1000)
      .assert.containsText('#questionnaireResponsesTable', updatedQuestionnaireResponse.authorName)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/10-updated-questionnaireresponse-in-list.png');
  });

  it('09. Delete questionnaire response', browser => {
    browser
      .waitForElementVisible('#questionnaireResponsesTable', 5000)
      .pause(1000);

    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#questionnaireResponsesTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked questionnaire response row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#questionnaireResponseDetailPage', 5000);

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
      .waitForElementVisible('#questionnaireResponsesTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/11-questionnaireresponse-deleted.png');
  });

  it('10. Verify questionnaire response removed from list', browser => {
    browser
      .waitForElementVisible('#questionnaireResponsesTable', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#questionnaireResponsesTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            return true;
          }
        }
        return false;
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value, false, 'Questionnaire response no longer in list');
      })
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/12-questionnaireresponse-not-in-list.png');
  });

  it('11. Test form validation', browser => {
    browser
      .waitForElementVisible('#questionnaireResponsesPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Questionnaire Response') || 
              button.textContent.includes('Add Your First Questionnaire Response')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Questionnaire Response button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#questionnaireResponseDetailPage', 5000);

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
      .waitForElementVisible('#questionnaireResponsesPage', 5000, 'Form submitted and returned to questionnaire responses list')
      .execute(function() {
        const rows = document.querySelectorAll('#questionnaireResponsesTable tbody tr');
        let foundEmptyQuestionnaireResponse = false;
        for (let row of rows) {
          const cells = row.querySelectorAll('td');
          if (cells.length > 2) {
            const questionnaireCell = cells[2];
            if (!questionnaireCell.textContent || questionnaireCell.textContent.trim() === '') {
              foundEmptyQuestionnaireResponse = true;
              break;
            }
          }
        }
        return foundEmptyQuestionnaireResponse;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Questionnaire response created with empty fields (no validation)');
      })
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/13-validation-check.png');
  });

  after(browser => {
    browser.executeAsync(function(done) {
      if (typeof QuestionnaireResponses !== 'undefined') {
        QuestionnaireResponses.find({ 
          'author.display': { $regex: 'Smith|Johnson' }
        }).fetch().forEach(function(questionnaireResponse) {
          QuestionnaireResponses.remove({ _id: questionnaireResponse._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});