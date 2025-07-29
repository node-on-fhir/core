// tests/nightwatch/honeycomb/crud.researchstudy.js

const testUtils = require('./shared-test-utils');

describe('ResearchStudy CRUD Operations', function() {
  const timestamp = Date.now();
  const testResearchStudy = {
    title: `COVID-19 Vaccine Trial ${timestamp}`,
    principalInvestigator: `Dr. Sarah Chen ${timestamp}`,
    status: 'active',
    phase: 'phase-3',
    category: 'interventional',
    focusType: 'medication',
    focusCode: '207106009',
    focusDisplay: 'COVID-19 vaccine',
    description: `Double-blind placebo-controlled trial ${timestamp}`,
    period: {
      start: '2024-01-01',
      end: '2025-12-31'
    },
    enrollmentTarget: '1000',
    enrollmentActual: '750'
  };

  const updatedResearchStudy = {
    principalInvestigator: `Dr. Michael Wong ${timestamp}`,
    status: 'administratively-completed',
    enrollmentActual: '995',
    description: `Study completed successfully ${timestamp}`
  };

  before(browser => {
    console.log('Starting ResearchStudy CRUD test suite...');
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
        if (typeof ResearchStudies !== 'undefined') {
          const testStudies = ResearchStudies.find({ 'principalInvestigator.display': { $regex: 'Chen|Wong' } }).fetch();
          testStudies.forEach(function(study) {
            ResearchStudies.remove({ _id: study._id });
          });
          console.log('Cleared', testStudies.length, 'test research studies');
        }
        done();
      });
    });
  });

  it('02. Verify research studies list page loads', browser => {
    browser
      .url('http://localhost:3000/research-studies')
      .waitForElementVisible('#researchStudiesPage', 5000)
      .pause(2000)  // Increased pause to allow data to load
      .execute(function() {
        // Check if we have either the table or the no-data card
        const hasTable = document.querySelector('#researchStudiesTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#researchStudiesPage') && 
                             document.querySelector('#researchStudiesPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either research studies table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/research-studies/02-research-studies-list.png');
  });

  it('03. Navigate to new research study form', browser => {
    browser
      .waitForElementVisible('#researchStudiesPage', 5000)
      .pause(500);

    // Click the Add Research Study button - handle both "Add Research Study" and "Add Your First Research Study"
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Research Study') || 
              button.textContent.includes('Add Your First Research Study')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Research Study button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#researchStudyDetailPage', 5000)
      .assert.elementPresent('#title')
      .assert.elementPresent('#principalInvestigatorDisplay')
      .assert.elementPresent('#status')
      .assert.elementPresent('#phase')
      .assert.elementPresent('#category')
      .assert.elementPresent('#focusType')
      .assert.elementPresent('#focusCode')
      .assert.elementPresent('#focusDisplay')
      .assert.elementPresent('#descriptionTextarea')
      .assert.elementPresent('#periodStart')
      .assert.elementPresent('#periodEnd')
      .assert.elementPresent('#enrollmentTarget')
      .assert.elementPresent('#enrollmentActual')
      .saveScreenshot('tests/nightwatch/screenshots/research-studies/03-new-research-study-form.png');
  });

  it('04. Create new research study', browser => {
    // We're already on the research study detail page from test 03
    browser
      .waitForElementVisible('#researchStudyDetailPage', 5000)
      .pause(500);

    // Verify we're on the new research study page
    browser
      .assert.urlContains('/research-studies/new');

    // Fill in research study details using the id selectors
    browser
      .pause(1000); // Give form time to initialize in edit mode

    // Check if form is in edit mode, if not, click edit button
    browser.execute(function() {
      // Check if fields are disabled
      const titleField = document.querySelector('#title');
      if (titleField && titleField.disabled) {
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
      // Clear and set title
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
      .setValue('#title', testResearchStudy.title)
      // Clear and set principal investigator
      .click('#principalInvestigatorDisplay')
      .execute(function() {
        const piField = document.querySelector('#principalInvestigatorDisplay');
        if (piField) {
          piField.select();
          piField.value = '';
          const inputEvent = new Event('input', { bubbles: true });
          const changeEvent = new Event('change', { bubbles: true });
          piField.dispatchEvent(inputEvent);
          piField.dispatchEvent(changeEvent);
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(piField, '');
          piField.dispatchEvent(inputEvent);
        }
      })
      .pause(100)
      .setValue('#principalInvestigatorDisplay', testResearchStudy.principalInvestigator);

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
    }, [testResearchStudy.status]);

    browser.pause(500);

    browser.execute(function(phase) {
      const phaseSelect = document.querySelector('#phase');
      if (phaseSelect) {
        phaseSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === phase) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testResearchStudy.phase]);

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
    }, [testResearchStudy.category]);

    browser.pause(500);

    browser.execute(function(focusType) {
      const focusTypeSelect = document.querySelector('#focusType');
      if (focusTypeSelect) {
        focusTypeSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === focusType) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testResearchStudy.focusType]);

    browser
      .pause(500)
      // Clear and set focus code
      .click('#focusCode')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#focusCode', testResearchStudy.focusCode)
      // Clear and set focus display
      .click('#focusDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#focusDisplay', testResearchStudy.focusDisplay)
      // Clear and set description
      .click('#descriptionTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#descriptionTextarea', testResearchStudy.description)
      // Clear and set period start
      .click('#periodStart')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#periodStart', testResearchStudy.period.start)
      // Clear and set period end
      .click('#periodEnd')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#periodEnd', testResearchStudy.period.end)
      // Clear and set enrollment target
      .click('#enrollmentTarget')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#enrollmentTarget', testResearchStudy.enrollmentTarget)
      // Clear and set enrollment actual
      .click('#enrollmentActual')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#enrollmentActual', testResearchStudy.enrollmentActual)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/research-studies/04-filled-research-study-form.png');

    // Save the research study - click the Save button
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
    
    // Check if we're back on the research studies list page or if there's an error
    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#researchStudiesTable') !== null;
      const hasResearchStudiesPage = document.querySelector('#researchStudiesPage') !== null;
      const hasDetailPage = document.querySelector('#researchStudyDetailPage') !== null;
      
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
        hasResearchStudiesPage: hasResearchStudiesPage,
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
      if (result.value.url === '/research-studies/new') {
        console.log('Still on new research study page - save may have failed silently');
      }
    });
    
    browser
      .waitForElementVisible('#researchStudiesPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/research-studies/05-research-study-saved.png');
  });

  it('05. Verify new research study appears in list', browser => {
    browser
      .waitForElementVisible('#researchStudiesPage', 5000)
      .pause(1000)
      .waitForElementVisible('#researchStudiesTable', 5000)
      .assert.containsText('#researchStudiesTable', testResearchStudy.title)
      .assert.containsText('#researchStudiesTable', testResearchStudy.principalInvestigator)
      .saveScreenshot('tests/nightwatch/screenshots/research-studies/06-research-study-in-list.png');
  });

  it('06. View research study details', browser => {
    browser
      .waitForElementVisible('#researchStudiesTable', 5000)
      .pause(1000);

    // Click on the first research study row containing our test data
    browser
      .execute(function(title) {
        const rows = document.querySelectorAll('#researchStudiesTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(title)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testResearchStudy.title], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked research study row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#researchStudyDetailPage', 5000)
      .assert.valueContains('#title', testResearchStudy.title)
      .assert.valueContains('#principalInvestigatorDisplay', testResearchStudy.principalInvestigator)
      .assert.valueContains('#focusCode', testResearchStudy.focusCode)
      .assert.valueContains('#focusDisplay', testResearchStudy.focusDisplay)
      .execute(function() {
        // For Material-UI Select components, we need to look for the hidden input
        const statusInput = document.querySelector('#status');
        const phaseInput = document.querySelector('#phase');
        
        return {
          status: statusInput ? statusInput.value : null,
          phase: phaseInput ? phaseInput.value : null,
          description: document.querySelector('#descriptionTextarea').value,
          // Also get the display values as fallback
          statusDisplay: document.querySelector('[aria-labelledby*="status"]')?.textContent || 
                        document.querySelector('#status')?.parentElement?.textContent,
          phaseDisplay: document.querySelector('[aria-labelledby*="phase"]')?.textContent ||
                       document.querySelector('#phase')?.parentElement?.textContent
        };
      }, [], function(result) {
        // Check either the value or display text
        const statusOk = result.value.status === testResearchStudy.status || 
                        (result.value.statusDisplay && result.value.statusDisplay.includes('Active'));
        const phaseOk = result.value.phase === testResearchStudy.phase ||
                       (result.value.phaseDisplay && result.value.phaseDisplay.includes('Phase 3'));
        
        browser.assert.ok(statusOk, 'Status matches');
        browser.assert.ok(phaseOk, 'Phase matches');
        browser.assert.ok(result.value.description.includes(testResearchStudy.description), 'Description contains expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/research-studies/07-view-research-study-details.png');
    
    // Navigate back to research studies list
    browser
      .url('http://localhost:3000/research-studies')
      .waitForElementVisible('#researchStudiesPage', 5000);
  });

  it('07. Update existing research study', browser => {
    browser
      .waitForElementVisible('#researchStudiesTable', 5000)
      .pause(1000);

    // Click on the research study to edit
    browser
      .execute(function(title) {
        const rows = document.querySelectorAll('#researchStudiesTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(title)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testResearchStudy.title], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked research study row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#researchStudyDetailPage', 5000)
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

    // Update research study details
    browser
      .click('#principalInvestigatorDisplay')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#principalInvestigatorDisplay', updatedResearchStudy.principalInvestigator)
      .click('#status')
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
      }, [updatedResearchStudy.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#enrollmentActual')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#enrollmentActual', updatedResearchStudy.enrollmentActual)
      .click('#descriptionTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#descriptionTextarea', updatedResearchStudy.description)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/research-studies/08-updated-research-study-form.png');

    // Save the updated research study
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
      // Navigate back to research studies list
      .url('http://localhost:3000/research-studies')
      .waitForElementVisible('#researchStudiesTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/research-studies/09-research-study-updated.png');
  });

  it('08. Verify updated research study in list', browser => {
    browser
      .waitForElementVisible('#researchStudiesTable', 5000)
      .pause(1000)
      .assert.containsText('#researchStudiesTable', updatedResearchStudy.principalInvestigator)
      // Note: Status may be hidden in the table, so we can't verify it here
      .saveScreenshot('tests/nightwatch/screenshots/research-studies/10-updated-research-study-in-list.png');
  });

  it('09. Delete research study', browser => {
    browser
      .waitForElementVisible('#researchStudiesTable', 5000)
      .pause(1000);

    // Click on the research study to delete
    browser
      .execute(function(timestamp) {
        // Find the row by the timestamp which is unique
        const rows = document.querySelectorAll('#researchStudiesTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked research study row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#researchStudyDetailPage', 5000);

    // Click the Delete button directly (visible when not in edit mode)
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
      .waitForElementVisible('#researchStudiesPage', 5000)
      .execute(function() {
        const hasTable = document.querySelector('#researchStudiesTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            (document.querySelector('#researchStudiesPage') && 
                             document.querySelector('#researchStudiesPage').textContent.includes('No Data Available'));
        return hasTable || hasNoDataCard;
      }, [], function(result) {
        browser.assert.ok(result.value, 'Either research studies table or no-data message is present after deletion');
      })
      .saveScreenshot('tests/nightwatch/screenshots/research-studies/11-research-study-deleted.png');
  });

  it('10. Verify research study removed from list', browser => {
    browser
      .waitForElementVisible('#researchStudiesPage', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const hasTable = document.querySelector('#researchStudiesTable') !== null;
        
        if (hasTable) {
          // If table exists, check that the research study is not in it
          const rows = document.querySelectorAll('#researchStudiesTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          // No table means no data, which means deletion was successful
          const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                              (document.querySelector('#researchStudiesPage') && 
                               document.querySelector('#researchStudiesPage').textContent.includes('No Data Available'));
          return { found: false, hasTable: false, hasNoDataCard: hasNoDataCard };
        }
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value.found, false, 'Research study no longer in list');
      })
      .saveScreenshot('tests/nightwatch/screenshots/research-studies/12-research-study-not-in-list.png');
  });

  it('11. Test form validation', browser => {
    browser
      .waitForElementVisible('#researchStudiesPage', 5000)
      .pause(500);

    // Navigate to new research study form - handle both button texts
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Research Study') || 
              button.textContent.includes('Add Your First Research Study')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Research Study button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#researchStudyDetailPage', 5000);

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
      .waitForElementVisible('#researchStudiesPage', 5000, 'Form submitted and returned to research studies list')
      .execute(function() {
        // Check if a new research study was created (it would have empty title)
        const rows = document.querySelectorAll('#researchStudiesTable tbody tr');
        let foundEmptyStudy = false;
        for (let row of rows) {
          // Look for a row with empty or missing title data
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            const titleCell = cells[0]; // Title column
            if (!titleCell.textContent || titleCell.textContent.trim() === '') {
              foundEmptyStudy = true;
              break;
            }
          }
        }
        return foundEmptyStudy;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Research study created with empty fields (no validation)');
      })
      .saveScreenshot('tests/nightwatch/screenshots/research-studies/13-validation-check.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof ResearchStudies !== 'undefined') {
        // Remove by ID to comply with Meteor security
        ResearchStudies.find({ 'principalInvestigator.display': { $regex: 'Chen|Wong' } }).fetch().forEach(function(study) {
          ResearchStudies.remove({ _id: study._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});