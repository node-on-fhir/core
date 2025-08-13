// tests/nightwatch/honeycomb/crud.questionnaires.js

const testUtils = require('./shared-test-utils');

describe('Questionnaires CRUD Operations', function() {
  const timestamp = Date.now();
  const testQuestionnaire = {
    title: `Health Assessment Form ${timestamp}`,
    name: `health-assessment-${timestamp}`,
    publisher: `Test Publisher ${timestamp}`,
    status: 'active',
    version: '1.0.0',
    description: 'A comprehensive health assessment questionnaire',
    purpose: 'To collect patient health information for clinical assessment',
    approvalDate: '2024-01-01',
    lastReviewDate: '2024-01-10',
    effectiveStart: '2024-01-15',
    effectiveEnd: '2024-12-31',
    subjectType: 'Patient',
    code: '74468-0', // LOINQ code for questionnaire
    codeDisplay: 'Questionnaire form definition Document',
    notes: `Test questionnaire created at ${timestamp}`
  };

  const updatedQuestionnaire = {
    title: `Updated Health Assessment ${timestamp}`,
    status: 'retired',
    version: '1.0.1',
    lastReviewDate: '2024-01-20',
    notes: `Test questionnaire updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting Questionnaires CRUD test suite...');
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  beforeEach(browser => {
    // Removed unnecessary pause - use explicit waits instead
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

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
          } else {
            browser.assert.fail('Setup failed: ' + result.value.error);
          }
        });
      } else {
        console.log('Already logged in as:', result.value.username);
      }
    });

    // Clean up any test questionnaires from previous runs
    browser.executeAsync(function(done) {
      if (typeof Questionnaires !== 'undefined') {
        const testQuestionnaires = Questionnaires.find({ 
          'publisher': { $regex: 'Test Publisher' }
        }).fetch();
        testQuestionnaires.forEach(function(questionnaire) {
          Questionnaires.remove({ _id: questionnaire._id });
        });
        console.log('Cleared', testQuestionnaires.length, 'test questionnaires');
      }
      done();
    });
  });

  it('02. Verify questionnaires list page loads', browser => {
    browser
      .url('http://localhost:3000/questionnaires')
      .waitForElementVisible('#questionnairesPage', 5000)
      .execute(function() {
        const hasTable = document.querySelector('#questionnairesTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#questionnairesPage') && 
                             document.querySelector('#questionnairesPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either questionnaires table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/questionnaires/02-questionnaires-list.png');
  });

  it('03. Navigate to new questionnaire form', browser => {
    browser
      .waitForElementVisible('#questionnairesPage', 5000)
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Questionnaire') || 
              button.textContent.includes('Add Your First Questionnaire')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Questionnaire button');
      });

    browser
      .waitForElementVisible('#questionnaireDetailPage', 5000)
      .assert.elementPresent('#title')
      .assert.elementPresent('#name')
      .assert.elementPresent('#publisher')
      .assert.elementPresent('#status')
      .assert.elementPresent('#version')
      .assert.elementPresent('#description')
      .assert.elementPresent('#purpose')
      .assert.elementPresent('#approvalDate')
      .assert.elementPresent('#lastReviewDate')
      .assert.elementPresent('#effectivePeriodStart')
      .assert.elementPresent('#effectivePeriodEnd')
      .assert.elementPresent('#subjectType')
      .assert.elementPresent('#codeCode')
      .assert.elementPresent('#codeDisplay')
      .assert.elementPresent('#notesTextarea')
      .saveScreenshot('tests/nightwatch/screenshots/questionnaires/03-new-questionnaire-form.png');
  });

  it('04. Create new questionnaire', browser => {
    browser
      .waitForElementVisible('#questionnaireDetailPage', 5000);

    browser.execute(function() {
      return {
        hasQuestionnairesCreate: typeof Meteor.call === 'function',
        userId: Meteor.userId ? Meteor.userId() : null,
        username: Meteor.user ? (Meteor.user() ? Meteor.user().username : null) : null
      };
    }, [], function(result) {
      console.log('Meteor state:', result.value);
    });

    browser
      .assert.urlContains('/questionnaires/new');

    // Check if form is in edit mode and click edit if needed
    browser.execute(function() {
      const titleField = document.querySelector('#title');
      if (titleField && titleField.disabled) {
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

    // Fill form fields directly
    browser
      .clearValue('#title')
      .setValue('#title', testQuestionnaire.title)
      .clearValue('#name')
      .setValue('#name', testQuestionnaire.name)
      .clearValue('#publisher')
      .setValue('#publisher', testQuestionnaire.publisher)
      .click('#status')
      .pause(100)
      .click(`option[value="${testQuestionnaire.status}"]`)
      .clearValue('#version')
      .setValue('#version', testQuestionnaire.version)
      .clearValue('#description')
      .setValue('#description', testQuestionnaire.description)
      .clearValue('#purpose')
      .setValue('#purpose', testQuestionnaire.purpose)
      .clearValue('#approvalDate')
      .setValue('#approvalDate', testQuestionnaire.approvalDate)
      .clearValue('#lastReviewDate')
      .setValue('#lastReviewDate', testQuestionnaire.lastReviewDate)
      .clearValue('#effectivePeriodStart')
      .setValue('#effectivePeriodStart', testQuestionnaire.effectiveStart)
      .clearValue('#effectivePeriodEnd')
      .setValue('#effectivePeriodEnd', testQuestionnaire.effectiveEnd)
      .clearValue('#subjectType')
      .setValue('#subjectType', testQuestionnaire.subjectType)
      .clearValue('#codeCode')
      .setValue('#codeCode', testQuestionnaire.code)
      .clearValue('#codeDisplay')
      .setValue('#codeDisplay', testQuestionnaire.codeDisplay)
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', testQuestionnaire.notes)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaires/04-questionnaire-form-filled.png');

    // Click Save button
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Save')) {
            console.log('Found Save button, clicking...');
            button.click();
            return true;
          }
        }
        console.log('Save button not found');
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Save button');
      });

    browser
      .pause(2000)
      .waitForElementVisible('#questionnairesTable', 10000)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaires/05-questionnaire-created.png');
  });

  it('05. Verify new questionnaire appears in list', browser => {
    browser
      .waitForElementVisible('#questionnairesTable', 5000)
      .assert.containsText('#questionnairesTable', testQuestionnaire.title)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaires/06-new-questionnaire-in-list.png');
  });

  it('06. View questionnaire details', browser => {
    browser
      .waitForElementVisible('#questionnairesTable', 5000)
      .execute(function(title) {
        const rows = document.querySelectorAll('#questionnairesTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(title)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [testQuestionnaire.title], function(result) {
        browser.assert.equal(result.value, true, 'Clicked on questionnaire row');
      });

    browser
      .waitForElementVisible('#questionnaireDetailPage', 5000)
      .assert.valueContains('#title', testQuestionnaire.title)
      .assert.valueContains('#name', testQuestionnaire.name)
      .assert.valueContains('#publisher', testQuestionnaire.publisher)
      .assert.valueContains('#version', testQuestionnaire.version)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaires/07-questionnaire-details.png');
  });

  it('07. Edit questionnaire', browser => {
    browser
      .waitForElementVisible('#questionnaireDetailPage', 5000);

    // Navigate to the questionnaire if not already there
    if (!browser.currentTest.results.errors) {
      browser
        .url('http://localhost:3000/questionnaires')
        .waitForElementVisible('#questionnairesTable', 5000)
        .execute(function(title) {
          const rows = document.querySelectorAll('#questionnairesTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(title)) {
              row.click();
              return true;
            }
          }
          return false;
        }, [testQuestionnaire.title]);
    }

    browser
      .waitForElementVisible('#questionnaireDetailPage', 5000)
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
      });

    browser
      .clearValue('#title')
      .setValue('#title', updatedQuestionnaire.title)
      .click('#status')
      .pause(100)
      .click(`option[value="${updatedQuestionnaire.status}"]`)
      .clearValue('#version')
      .setValue('#version', updatedQuestionnaire.version)
      .clearValue('#lastReviewDate')
      .setValue('#lastReviewDate', updatedQuestionnaire.lastReviewDate)
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', updatedQuestionnaire.notes)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaires/08-updated-questionnaire-form.png');

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
      .url('http://localhost:3000/questionnaires')
      .waitForElementVisible('#questionnairesTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaires/09-questionnaire-updated.png');
  });

  it('08. Verify updated questionnaire in list', browser => {
    browser
      .waitForElementVisible('#questionnairesTable', 5000)
      .assert.containsText('#questionnairesTable', updatedQuestionnaire.title)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaires/10-updated-questionnaire-in-list.png');
  });

  it('09. Delete questionnaire', browser => {
    browser
      .waitForElementVisible('#questionnairesPage', 5000)
      .execute(function(title) {
        const rows = document.querySelectorAll('#questionnairesTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(title)) {
            row.click();
            return true;
          }
        }
        return false;
      }, [updatedQuestionnaire.title], function(result) {
        browser.assert.equal(result.value, true, 'Clicked on updated questionnaire row');
      });

    browser
      .waitForElementVisible('#questionnaireDetailPage', 5000)
      .execute(function() {
        // Debug: log all available buttons
        const buttons = document.querySelectorAll('button');
        const buttonTexts = Array.from(buttons).map(b => b.textContent.trim());
        console.log('Available buttons on detail page:', buttonTexts);
        
        // Check if we need to enter edit mode first
        const lockButton = document.querySelector('button svg[data-testid="LockIcon"]')?.parentElement;
        const editButton = Array.from(buttons).find(b => b.textContent.includes('Edit'));
        
        if (lockButton || editButton) {
          console.log('Page is in view mode, need to enter edit mode first');
          if (lockButton) {
            lockButton.click();
          } else if (editButton) {
            editButton.click();
          }
          return 'need_edit_mode';
        }
        
        // Look for delete button directly
        const deleteButton = Array.from(buttons).find(b => b.textContent.includes('Delete'));
        if (deleteButton) {
          console.log('Found delete button, clicking...');
          deleteButton.click();
          return true;
        }
        
        console.log('Delete button not found in current mode');
        return false;
      }, [], function(result) {
        if (result.value === 'need_edit_mode') {
          // We entered edit mode, now look for delete button
          browser
            .waitForElementVisible('button', 1000) // Wait for UI to update
            .execute(function() {
              const buttons = document.querySelectorAll('button');
              const deleteButton = Array.from(buttons).find(b => b.textContent.includes('Delete'));
              if (deleteButton) {
                console.log('Found delete button after entering edit mode');
                deleteButton.click();
                return true;
              }
              // Log what buttons we do see
              const buttonTexts = Array.from(buttons).map(b => b.textContent.trim());
              console.log('Buttons after edit mode:', buttonTexts);
              return false;
            });
        }
      });

    // Accept the delete confirmation alert
    // Accept the delete confirmation alert
    browser
      .acceptAlert()
      .pause(2000);

    // Navigate back to list if we're still on detail page
    browser.execute(function() {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/questionnaires/') && currentPath !== '/questionnaires/') {
        window.location.href = '/questionnaires';
        return true;
      }
      return false;
    }, [], function(result) {
      if (result.value) {
        // We navigated, wait for the page to load
        browser.waitForElementVisible('#questionnairesPage', 5000);
      }
    });

    browser
      .waitForElementVisible('#questionnairesPage', 5000)
      .execute(function() {
        const hasTable = document.querySelector('#questionnairesTable') !== null;
        const hasNoData = document.querySelector('.no-data-card') !== null ||
                         document.querySelector('.no-data-available') !== null;
        return { hasTable, hasNoData };
      }, [], function(result) {
        browser.assert.ok(
          result.value.hasTable || result.value.hasNoData, 
          'Either table or no-data state present after deletion'
        );
      })
      .saveScreenshot('tests/nightwatch/screenshots/questionnaires/11-questionnaire-deleted.png');
  });

  after(browser => {
    console.log('Questionnaires CRUD test suite completed');
    browser.end();
  });
});