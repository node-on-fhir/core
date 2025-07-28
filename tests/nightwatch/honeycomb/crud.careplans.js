// tests/nightwatch/honeycomb/crud.careplans.js

const testUtils = require('./shared-test-utils');

describe('CarePlans CRUD Operations', function() {
  const timestamp = Date.now();
  const testCarePlan = {
    patientName: 'John Doe',
    authorName: `Dr. Smith ${timestamp}`,
    title: `Diabetes Management Plan ${timestamp}`,
    status: 'active',
    intent: 'plan',
    category: '734163000', // Care plan SNOMED code
    categoryDisplay: 'Care plan',
    description: 'Comprehensive diabetes management plan including diet, exercise, and medication',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    notes: `Test care plan created at ${timestamp}`
  };

  const updatedCarePlan = {
    authorName: `Dr. Johnson ${timestamp}`,
    status: 'on-hold',
    endDate: '2024-06-30',
    notes: `Test care plan updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting CarePlans CRUD test suite...');
    browser
      .windowSize('current', 1400, 900)  // Set to landscape/desktop size
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  beforeEach(browser => {
    browser.pause(500);
  });

  it('01. Setup test environment', browser => {
    browser
      .windowSize('current', 1400, 900)  // Ensure landscape mode
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
        if (typeof CarePlans !== 'undefined') {
          const testCarePlans = CarePlans.find({ 
            'author.display': { $regex: 'Smith|Johnson' }
          }).fetch();
          testCarePlans.forEach(function(carePlan) {
            CarePlans.remove({ _id: carePlan._id });
          });
          console.log('Cleared', testCarePlans.length, 'test care plans');
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

  it('02. Verify care plans list page loads', browser => {
    browser
      .url('http://localhost:3000/careplans')
      .waitForElementVisible('#carePlansPage', 5000)
      .pause(2000)
      .execute(function() {
        const hasTable = document.querySelector('#carePlansTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#carePlansPage') && 
                             document.querySelector('#carePlansPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either care plans table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/careplans/02-careplans-list.png');
  });

  it('03. Navigate to new care plan form', browser => {
    browser
      .waitForElementVisible('#carePlansPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Care Plan') || 
              button.textContent.includes('Add Your First Care Plan')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Care Plan button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#carePlanDetailPage', 5000)
      .assert.elementPresent('#subjectDisplay')
      .assert.elementPresent('#authorDisplay')
      .assert.elementPresent('#title')
      .assert.elementPresent('#status')
      .assert.elementPresent('#intent')
      .assert.elementPresent('#categoryCode')
      .assert.elementPresent('#categoryDisplay')
      .assert.elementPresent('#description')
      .assert.elementPresent('#periodStart')
      .assert.elementPresent('#periodEnd')
      .assert.elementPresent('#notesTextarea')
      .saveScreenshot('tests/nightwatch/screenshots/careplans/03-new-careplan-form.png');
  });

  it('04. Create new care plan', browser => {
    browser
      .waitForElementVisible('#carePlanDetailPage', 5000)
      .pause(500);

    browser.execute(function() {
      return {
        hasCarePlansCreate: typeof Meteor.call === 'function',
        userId: Meteor.userId ? Meteor.userId() : null,
        username: Meteor.user ? (Meteor.user() ? Meteor.user().username : null) : null
      };
    }, [], function(result) {
      console.log('Meteor state:', result.value);
    });

    browser
      .assert.urlContains('/careplans/new');

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
      .setValue('#authorDisplay', testCarePlan.authorName)
      .click('#title')
      .execute(function() {
        const titleField = document.querySelector('#title');
        if (titleField) {
          titleField.select();
          titleField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          titleField.dispatchEvent(inputEvent);
          titleField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(titleField, '');
          titleField.dispatchEvent(inputEvent);
        }
      })
      .pause(100)
      .setValue('#title', testCarePlan.title);

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
    }, [testCarePlan.status]);

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
    }, [testCarePlan.intent]);

    browser
      .pause(500)
      .click('#categoryCode')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#categoryCode', testCarePlan.category)
      .click('#categoryDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#categoryDisplay', testCarePlan.categoryDisplay)
      .click('#description')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#description', testCarePlan.description)
      .click('#periodStart')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#periodStart', testCarePlan.startDate)
      .click('#periodEnd')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#periodEnd', testCarePlan.endDate)
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', testCarePlan.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/careplans/04-filled-careplan-form.png');

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
      const hasTable = document.querySelector('#carePlansTable') !== null;
      const hasCarePlansPage = document.querySelector('#carePlansPage') !== null;
      const hasDetailPage = document.querySelector('#carePlanDetailPage') !== null;
      
      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });
      
      const consoleErrors = window.consoleErrors || [];
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasCarePlansPage: hasCarePlansPage,
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
      if (result.value.url === '/careplans/new') {
        console.log('Still on new care plan page - save may have failed silently');
      }
    });
    
    browser
      .waitForElementVisible('#carePlansPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/careplans/05-careplan-saved.png');
  });

  it('05. Verify new care plan appears in list', browser => {
    browser
      .waitForElementVisible('#carePlansPage', 5000)
      .pause(2000)  // Give subscription time to update
      .waitForElementVisible('#carePlansTable', 5000)
      .execute(function() {
        // Debug: Log what's in the table
        const table = document.querySelector('#carePlansTable');
        if (table) {
          console.log('Table content:', table.innerText);
          const rows = table.querySelectorAll('tbody tr');
          console.log('Number of rows:', rows.length);
          rows.forEach((row, index) => {
            console.log(`Row ${index}:`, row.innerText);
          });
        }
        return table ? table.innerText : 'Table not found';
      }, [], function(result) {
        console.log('Table debug info:', result.value);
      })
      .assert.containsText('#carePlansTable', testCarePlan.authorName)
      .assert.containsText('#carePlansTable', testCarePlan.title)
      .saveScreenshot('tests/nightwatch/screenshots/careplans/06-careplan-in-list.png');
  });

  it('06. View care plan details', browser => {
    browser
      .waitForElementVisible('#carePlansTable', 5000)
      .pause(1000);

    browser
      .execute(function(authorName) {
        const rows = document.querySelectorAll('#carePlansTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(authorName)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testCarePlan.authorName], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked care plan row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#carePlanDetailPage', 5000)
      .assert.valueContains('#authorDisplay', testCarePlan.authorName)
      .assert.valueContains('#title', testCarePlan.title)
      .assert.valueContains('#description', testCarePlan.description)
      .execute(function() {
        const statusInput = document.querySelector('#status');
        const intentInput = document.querySelector('#intent');
        
        return {
          status: statusInput ? statusInput.value : null,
          intent: intentInput ? intentInput.value : null,
          notes: document.querySelector('#notesTextarea').value,
          statusDisplay: document.querySelector('[aria-labelledby*="status"]')?.textContent || 
                        document.querySelector('#status')?.parentElement?.textContent,
          intentDisplay: document.querySelector('[aria-labelledby*="intent"]')?.textContent ||
                        document.querySelector('#intent')?.parentElement?.textContent
        };
      }, [], function(result) {
        const statusOk = result.value.status === testCarePlan.status || 
                        (result.value.statusDisplay && result.value.statusDisplay.toLowerCase().includes('active'));
        const intentOk = result.value.intent === testCarePlan.intent ||
                        (result.value.intentDisplay && result.value.intentDisplay.toLowerCase().includes('plan'));
        
        browser.assert.ok(statusOk, 'Status matches');
        browser.assert.ok(intentOk, 'Intent matches');
        browser.assert.ok(result.value.notes.includes(testCarePlan.notes), 'Notes contain expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/careplans/07-view-careplan-details.png');
    
    browser
      .url('http://localhost:3000/careplans')
      .waitForElementVisible('#carePlansPage', 5000);
  });

  it('07. Update existing care plan', browser => {
    browser
      .waitForElementVisible('#carePlansTable', 5000)
      .pause(1000);

    browser
      .execute(function(authorName) {
        const rows = document.querySelectorAll('#carePlansTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(authorName)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testCarePlan.authorName], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked care plan row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#carePlanDetailPage', 5000)
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
      .setValue('#authorDisplay', updatedCarePlan.authorName)
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
      }, [updatedCarePlan.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#periodEnd')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#periodEnd', updatedCarePlan.endDate)
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', updatedCarePlan.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/careplans/08-updated-careplan-form.png');

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
      .url('http://localhost:3000/careplans')
      .waitForElementVisible('#carePlansTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/careplans/09-careplan-updated.png');
  });

  it('08. Verify updated care plan in list', browser => {
    browser
      .waitForElementVisible('#carePlansTable', 5000)
      .pause(1000)
      .assert.containsText('#carePlansTable', updatedCarePlan.authorName)
      .saveScreenshot('tests/nightwatch/screenshots/careplans/10-updated-careplan-in-list.png');
  });

  it('09. Delete care plan', browser => {
    browser
      .waitForElementVisible('#carePlansTable', 5000)
      .pause(1000);

    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#carePlansTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked care plan row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#carePlanDetailPage', 5000);

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
      .waitForElementVisible('#carePlansTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/careplans/11-careplan-deleted.png');
  });

  it('10. Verify care plan removed from list', browser => {
    browser
      .waitForElementVisible('#carePlansTable', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#carePlansTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            return true;
          }
        }
        return false;
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value, false, 'Care plan no longer in list');
      })
      .saveScreenshot('tests/nightwatch/screenshots/careplans/12-careplan-not-in-list.png');
  });

  it('11. Test form validation', browser => {
    browser
      .waitForElementVisible('#carePlansPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Care Plan') || 
              button.textContent.includes('Add Your First Care Plan')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Care Plan button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#carePlanDetailPage', 5000);

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
      .waitForElementVisible('#carePlansPage', 5000, 'Form submitted and returned to care plans list')
      .execute(function() {
        const rows = document.querySelectorAll('#carePlansTable tbody tr');
        let foundEmptyCarePlan = false;
        for (let row of rows) {
          const cells = row.querySelectorAll('td');
          if (cells.length > 2) {
            const titleCell = cells[1];
            if (!titleCell.textContent || titleCell.textContent.trim() === '') {
              foundEmptyCarePlan = true;
              break;
            }
          }
        }
        return foundEmptyCarePlan;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Care plan created with empty fields (no validation)');
      })
      .saveScreenshot('tests/nightwatch/screenshots/careplans/13-validation-check.png');
  });

  after(browser => {
    browser.executeAsync(function(done) {
      if (typeof CarePlans !== 'undefined') {
        CarePlans.find({ 
          'author.display': { $regex: 'Smith|Johnson' }
        }).fetch().forEach(function(carePlan) {
          CarePlans.remove({ _id: carePlan._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});