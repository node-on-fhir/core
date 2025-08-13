// tests/nightwatch/honeycomb/enable_autopublish/crud.questionnaireresponses.stable.js
// Stabilized version of questionnaireresponses CRUD tests with improved error handling

const testUtils = require('./shared-test-utils');

describe('QuestionnaireResponses CRUD Operations - Stable', function() {
  const timestamp = Date.now();
  const testQuestionnaireResponse = {
    identifier: `response-${timestamp}`,
    authorName: `Dr. Smith ${timestamp}`,
    questionnaire: `Questionnaire/health-assessment-${timestamp}`,
    questionnaireDisplay: 'Health Assessment Form',
    status: 'in-progress',
    authored: '2024-01-15T10:00:00',
    source: 'Patient',
    basedOn: `ServiceRequest/${timestamp}`,
    partOf: `Encounter/${timestamp}`,
    reasonCode: '415293003',
    reasonDisplay: 'Annual health check',
    notes: `Test questionnaire response created at ${timestamp}`
  };

  before(browser => {
    console.log('Starting QuestionnaireResponses CRUD test suite...');
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .windowSize('current', 1400, 900);
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(authorName, done) {
      if (typeof QuestionnaireResponses !== 'undefined') {
        QuestionnaireResponses.find({ 
          'author.display': { $regex: authorName }
        }).forEach(function(response) {
          QuestionnaireResponses.remove({_id: response._id});
        });
      }
      done();
    }, [testQuestionnaireResponse.authorName]);
    
    browser.end();
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .pause(1000);  // Allow page to stabilize

    // Check login state
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
              password: 'password123',
              email: 'janedoe@example.com'
            }, function(error, result) {
              if (error) {
                console.error('Failed to create test user:', error);
                done({ loginSuccess: false, error: error.message });
              } else {
                Meteor.loginWithPassword('janedoe', 'password123', function(loginError) {
                  if (loginError) {
                    console.error('Login failed:', loginError);
                    done({ loginSuccess: false, error: loginError.message });
                  } else {
                    done({ 
                      loginSuccess: true,
                      userId: Meteor.userId(),
                      username: 'janedoe'
                    });
                  }
                });
              }
            });
          } else {
            done({ loginSuccess: false, error: 'Meteor not available' });
          }
        }, [], function(loginResult) {
          if (loginResult.value.loginSuccess) {
            console.log('Logged in as:', loginResult.value.username, 'userId:', loginResult.value.userId);
          }
        });
      }
    });

    // Clean up existing test data
    browser.executeAsync(function(authorName, done) {
      if (typeof QuestionnaireResponses !== 'undefined') {
        const testResponses = QuestionnaireResponses.find({ 
          $or: [
            { 'author.display': { $regex: authorName } },
            { 'author.display': { $regex: 'Dr. Smith' } }
          ]
        }).fetch();
        
        testResponses.forEach(function(response) {
          QuestionnaireResponses.remove({_id: response._id});
        });
        
        console.log('Cleaned up', testResponses.length, 'test questionnaire responses');
      }
      done();
    }, [testQuestionnaireResponse.authorName]);
  });

  it('02. Verify questionnaire responses list page loads', browser => {
    browser
      .url('http://localhost:3000/questionnaire-responses')
      .pause(2000)  // Allow navigation to complete
      .waitForElementVisible('#questionnaireResponsesPage', 10000)
      .pause(1000)  // Allow data to load
      .execute(function() {
        const hasTable = document.querySelector('#questionnaireResponsesTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                              document.querySelector('.no-data-available') !== null ||
                              document.querySelector('[id*="no-data"]') !== null;
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either questionnaire responses table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/02-questionnaireresponses-list-stable.png');
  });

  it('03. Navigate to new questionnaire response form', browser => {
    browser
      .waitForElementVisible('#questionnaireResponsesPage', 5000)
      .pause(1000);

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
      .pause(2000)  // Allow navigation
      .waitForElementVisible('#questionnaireResponseDetailPage', 10000)
      .pause(1000)  // Allow form to render
      .assert.elementPresent('#authorDisplay')
      .assert.elementPresent('#questionnaire')
      .assert.elementPresent('#status')
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/03-new-questionnaireresponse-form-stable.png');
  });

  it('04. Create new questionnaire response with stability improvements', browser => {
    browser
      .waitForElementVisible('#questionnaireResponseDetailPage', 5000)
      .pause(1000);

    // Fill form fields using simple setValue (most reliable method)
    // Add pauses between operations for stability
    browser
      .pause(500)
      .waitForElementVisible('#authorDisplay', 5000)
      .click('#authorDisplay')
      .pause(300)
      .clearValue('#authorDisplay')
      .pause(300)
      .setValue('#authorDisplay', testQuestionnaireResponse.authorName)
      .pause(500);

    browser
      .waitForElementVisible('#questionnaire', 5000)
      .click('#questionnaire')
      .pause(300)
      .clearValue('#questionnaire')
      .pause(300)
      .setValue('#questionnaire', testQuestionnaireResponse.questionnaire)
      .pause(500);

    browser
      .waitForElementVisible('#questionnaireDisplay', 5000)
      .click('#questionnaireDisplay')
      .pause(300)
      .clearValue('#questionnaireDisplay')
      .pause(300)
      .setValue('#questionnaireDisplay', testQuestionnaireResponse.questionnaireDisplay)
      .pause(500);

    // Handle Material-UI Select for status with improved stability
    browser
      .waitForElementVisible('#status', 5000)
      .click('#status')
      .pause(800)  // Increased pause for dropdown animation
      .execute(function(status) {
        const options = document.querySelectorAll('li[role="option"]');
        for (let option of options) {
          if (option.getAttribute('data-value') === status || 
              option.textContent.includes(status)) {
            option.click();
            return true;
          }
        }
        return false;
      }, [testQuestionnaireResponse.status])
      .pause(500);

    // Continue with other fields
    browser
      .waitForElementVisible('#authored', 5000)
      .click('#authored')
      .pause(300)
      .clearValue('#authored')
      .pause(300)
      .setValue('#authored', testQuestionnaireResponse.authored)
      .pause(500);

    browser
      .waitForElementVisible('#source', 5000)
      .click('#source')
      .pause(300)
      .clearValue('#source')
      .pause(300)
      .setValue('#source', testQuestionnaireResponse.source)
      .pause(500);

    // Fill remaining fields with stability pauses
    browser
      .setValue('#basedOn', testQuestionnaireResponse.basedOn)
      .pause(300)
      .setValue('#partOf', testQuestionnaireResponse.partOf)
      .pause(300)
      .setValue('#identifier', testQuestionnaireResponse.identifier)
      .pause(300)
      .setValue('#reasonCode', testQuestionnaireResponse.reasonCode)
      .pause(300)
      .setValue('#reasonDisplay', testQuestionnaireResponse.reasonDisplay)
      .pause(300)
      .setValue('#notesTextarea', testQuestionnaireResponse.notes)
      .pause(1000);  // Final pause before save

    browser
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/04-filled-form-stable.png');

    // Save with improved error handling
    browser.execute(function() {
      window.consoleErrors = [];
      const originalError = console.error;
      console.error = function() {
        window.consoleErrors.push(Array.from(arguments).join(' '));
        originalError.apply(console, arguments);
      };
      return true;
    }, [], function(result) {
      browser.assert.equal(result.value, true, 'Console error capture setup');
    });

    // Click save button
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Save')) {
            console.log('Clicking Save button...');
            button.click();
            return true;
          }
        }
        console.error('Save button not found!');
        return false;
      })
      .pause(3000);  // Wait for save operation

    // Verify navigation
    browser
      .waitForElementVisible('#questionnaireResponsesPage', 10000)
      .execute(function() {
        const currentUrl = window.location.pathname;
        const hasTable = document.querySelector('#questionnaireResponsesTable') !== null;
        const hasError = window.consoleErrors && window.consoleErrors.length > 0;
        const errorText = window.consoleErrors ? window.consoleErrors.join('; ') : '';
        const hasQuestionnaireResponsesPage = document.querySelector('#questionnaireResponsesPage') !== null;
        const hasDetailPage = document.querySelector('#questionnaireResponseDetailPage') !== null;
        const isLoggedIn = typeof Meteor !== 'undefined' && !!Meteor.userId();
        const userId = Meteor.userId ? Meteor.userId() : null;
        
        return {
          url: currentUrl,
          hasTable: hasTable,
          hasError: hasError,
          errorText: errorText,
          hasQuestionnaireResponsesPage: hasQuestionnaireResponsesPage,
          hasDetailPage: hasDetailPage,
          isLoggedIn: isLoggedIn,
          userId: userId,
          consoleErrors: window.consoleErrors || []
        };
      }, [], function(result) {
        console.log('Post-save state:', result.value);
      });

    browser
      .waitForElementVisible('#questionnaireResponsesPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/05-saved-stable.png');
  });

  it('05. Verify new questionnaire response appears in list', browser => {
    browser
      .waitForElementVisible('#questionnaireResponsesPage', 5000)
      .waitForElementVisible('#questionnaireResponsesTable', 5000)
      .assert.containsText('#questionnaireResponsesTable', testQuestionnaireResponse.authorName.split(' ')[0])  // Check for "Dr."
      .assert.containsText('#questionnaireResponsesTable', testQuestionnaireResponse.questionnaireDisplay)
      .saveScreenshot('tests/nightwatch/screenshots/questionnaireresponses/06-in-list-stable.png');
  });
});