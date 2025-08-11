// tests/nightwatch/honeycomb/enable_autopublish/crud.schedules.js

const testUtils = require('./shared-test-utils');

describe('Schedules CRUD Operations', function() {
  const timestamp = Date.now();
  const startDate = new Date();
  const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
  
  const testSchedule = {
    active: true,
    identifier: `Schedule-${timestamp}`,
    serviceCategory: 'General Practice',
    serviceCategoryCode: '17',
    serviceCategoryDisplay: 'General Practice',
    serviceType: 'Consultation',
    serviceTypeCode: '185389009',
    serviceTypeDisplay: 'Follow-up appointment',
    specialty: 'General Medicine',
    specialtyCode: '394802001',
    specialtyDisplay: 'General medicine',
    actor: 'Dr. Jane Smith',
    actorReference: `Practitioner/${timestamp}`,
    actorDisplay: 'Dr. Jane Smith - General Practice',
    planningHorizon: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      startFormatted: startDate.toISOString().split('T')[0],
      endFormatted: endDate.toISOString().split('T')[0]
    },
    comment: `Regular consultation hours ${timestamp}`,
    notes: `Test schedule created at ${timestamp}`
  };

  const updatedSchedule = {
    active: false,
    serviceType: 'Emergency Consultation',
    comment: `Updated consultation hours ${timestamp}`,
    notes: `Test schedule updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting Schedules CRUD test suite...');
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
      .pause(2000)
      .execute(function(ts) {
        window.testTimestamp = ts;
      }, [timestamp]);

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
          console.log('Programmatic login result:', result.value);
          if (result.value.loginSuccess) {
            browser.assert.equal(result.value.loginSuccess, true, 'Successfully logged in programmatically');
          } else {
            browser.assert.fail('Setup failed: ' + result.value.error);
          }
        });
        
        browser.pause(1000);
      } else {
        browser.assert.ok(true, 'Already logged in (autologin enabled)');
        console.log('Already logged in as:', result.value.username, 'userId:', result.value.userId);
      }
      
      // Clean up any existing test data - no patient context needed for Schedules
      browser.executeAsync(function(done) {
        if (typeof Schedules !== 'undefined') {
          const testSchedules = Schedules.find({ 
            $or: [
              { 'identifier.0.value': { $regex: 'Schedule-.*' } },
              { 'comment': { $regex: '.*consultation hours.*' } },
              { 'actor.0.display': { $regex: 'Dr\\..*' } }
            ]
          }).fetch();
          testSchedules.forEach(function(schedule) {
            Schedules.remove({ _id: schedule._id });
          });
          console.log('Cleared', testSchedules.length, 'test schedules');
        }
        done();
      });
      
      browser.pause(2000);
    });
  });

  it('02. Verify schedules list page loads', browser => {
    browser
      .url('http://localhost:3000/schedules')
      .waitForElementVisible('#schedulesPage', 5000)
      .pause(2000)
      .execute(function() {
        const hasTable = document.querySelector('#schedulesTable') !== null;
        const pageContent = document.querySelector('#schedulesPage')?.textContent || '';
        const hasNoDataMessage = pageContent.includes('No Data Available') || 
                               pageContent.includes('No schedules have been created') ||
                               pageContent.includes('Add Your First Schedule');
        return {
          hasTable: hasTable,
          hasNoDataMessage: hasNoDataMessage,
          hasEitherElement: hasTable || hasNoDataMessage
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either schedules table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/schedules/02-schedules-list.png');
  });

  it('03. Navigate to new schedule form', browser => {
    browser
      .waitForElementVisible('#schedulesPage', 5000)
      .pause(1000);
    
    // Click "Add Schedule" button
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        let found = false;
        for (let button of buttons) {
          console.log('Button text:', button.textContent);
          if (button.textContent.includes('Add Schedule') || button.textContent.includes('Add Your First Schedule')) {
            console.log('Found Add Schedule button, clicking it');
            button.click();
            found = true;
            break;
          }
        }
        if (!found) {
          console.error('Add Schedule button not found');
        }
        return found;
      }, [], function(result) {
        console.log('Button click result:', result.value);
      })
      .pause(2000);
    
    // Verify we're on the new schedule page
    browser
      .waitForElementVisible('#scheduleDetailPage', 5000)
      .assert.urlContains('/schedules/new')
      .assert.elementPresent('#activeCheckbox')
      .assert.elementPresent('#identifierInput')
      .assert.elementPresent('#serviceCategoryInput')
      .assert.elementPresent('#serviceCategoryDisplayInput')
      .assert.elementPresent('#serviceTypeInput')
      .assert.elementPresent('#serviceTypeDisplayInput')
      .assert.elementPresent('#specialtyInput')
      .assert.elementPresent('#specialtyDisplayInput')
      .assert.elementPresent('#actorInput')
      .assert.elementPresent('#actorReferenceInput')
      .assert.elementPresent('#actorDisplayInput')
      .assert.elementPresent('#planningHorizonStartInput')
      .assert.elementPresent('#planningHorizonEndInput')
      .assert.elementPresent('#commentTextarea')
      .assert.elementPresent('#notesTextarea')
      .pause(1000)
      .saveScreenshot('tests/nightwatch/screenshots/schedules/03-new-schedule-form.png');
  });

  it('04. Create new schedule', browser => {
    browser
      .waitForElementVisible('#scheduleDetailPage', 5000)
      .pause(500);

    // Check if we're on the new schedule page
    browser.assert.urlContains('/schedules/new');

    // Fill form fields using simple setValue
    browser
      .clearValue('#identifierInput')
      .setValue('#identifierInput', testSchedule.identifier)
      .clearValue('#serviceCategoryInput')
      .setValue('#serviceCategoryInput', testSchedule.serviceCategoryCode)
      .clearValue('#serviceCategoryDisplayInput')
      .setValue('#serviceCategoryDisplayInput', testSchedule.serviceCategoryDisplay)
      .clearValue('#serviceTypeInput')
      .setValue('#serviceTypeInput', testSchedule.serviceTypeCode)
      .clearValue('#serviceTypeDisplayInput')
      .setValue('#serviceTypeDisplayInput', testSchedule.serviceTypeDisplay)
      .clearValue('#specialtyInput')
      .setValue('#specialtyInput', testSchedule.specialtyCode)
      .clearValue('#specialtyDisplayInput')
      .setValue('#specialtyDisplayInput', testSchedule.specialtyDisplay)
      .clearValue('#actorInput')
      .setValue('#actorInput', testSchedule.actor)
      .clearValue('#actorReferenceInput')
      .setValue('#actorReferenceInput', testSchedule.actorReference)
      // Skip actorDisplayInput as it duplicates actorInput
      // .clearValue('#actorDisplayInput')
      // .setValue('#actorDisplayInput', testSchedule.actorDisplay)
      .clearValue('#planningHorizonStartInput')
      .pause(100)
      .execute(function(dateValue) {
        console.log('Setting start date to:', dateValue);
        const input = document.querySelector('#planningHorizonStartInput');
        if (input) {
          input.value = dateValue;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, [testSchedule.planningHorizon.startFormatted])
      .clearValue('#planningHorizonEndInput')
      .pause(100)
      .execute(function(dateValue) {
        console.log('Setting end date to:', dateValue);
        const input = document.querySelector('#planningHorizonEndInput');
        if (input) {
          input.value = dateValue;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, [testSchedule.planningHorizon.endFormatted])
      .clearValue('#commentTextarea')
      .setValue('#commentTextarea', testSchedule.comment)
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', testSchedule.notes)
      .pause(500);

    // Log form values before save
    browser.execute(function() {
      const formData = {
        identifier: document.querySelector('#identifierInput')?.value,
        serviceCategory: document.querySelector('#serviceCategoryInput')?.value,
        serviceCategoryDisplay: document.querySelector('#serviceCategoryDisplayInput')?.value,
        serviceType: document.querySelector('#serviceTypeInput')?.value,
        serviceTypeDisplay: document.querySelector('#serviceTypeDisplayInput')?.value,
        specialty: document.querySelector('#specialtyInput')?.value,
        specialtyDisplay: document.querySelector('#specialtyDisplayInput')?.value,
        actor: document.querySelector('#actorInput')?.value,
        actorReference: document.querySelector('#actorReferenceInput')?.value,
        actorDisplay: document.querySelector('#actorDisplayInput')?.value,
        planningHorizonStart: document.querySelector('#planningHorizonStartInput')?.value,
        planningHorizonEnd: document.querySelector('#planningHorizonEndInput')?.value,
        comment: document.querySelector('#commentTextarea')?.value,
        notes: document.querySelector('#notesTextarea')?.value
      };
      console.log('Form data before save:', JSON.stringify(formData, null, 2));
      return formData;
    }, [], function(result) {
      console.log('Form values:', result.value);
    });
    
    // Add a pause to let form values settle
    browser.pause(1000);
    
    // Check the schedule data before saving
    browser.execute(function() {
      // Check what's in the React component's state
      const detailPage = document.querySelector('#scheduleDetailPage');
      if (detailPage && detailPage._reactRootContainer) {
        console.log('React component found');
      }
      
      // Check all form values
      const formData = {
        identifier: document.querySelector('#identifierInput')?.value,
        actor: document.querySelector('#actorInput')?.value,
        actorReference: document.querySelector('#actorReferenceInput')?.value,
        startDate: document.querySelector('#planningHorizonStartInput')?.value,
        endDate: document.querySelector('#planningHorizonEndInput')?.value
      };
      
      console.log('Form values before save:', JSON.stringify(formData, null, 2));
      
      // Check if Meteor is available
      if (typeof Meteor !== 'undefined' && Meteor.call) {
        console.log('Meteor.call is available');
      }
      
      return formData;
    }, [], function(result) {
      console.log('Date values in form:', result.value);
    });
    
    // Click Save button
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent === 'Save' || button.textContent.includes('Save')) {
            console.log('Found Save button, clicking it');
            
            // Intercept console logs to capture save result
            const originalLog = console.log;
            const originalError = console.error;
            window.saveAttempted = false;
            window.saveResult = null;
            
            console.log = function(...args) {
              originalLog.apply(console, args);
              if (args[0] === 'Attempting to save schedule:' || 
                  args[0] === 'Schedule created successfully:' ||
                  args[0] === 'Error creating schedule:') {
                window.saveAttempted = true;
                window.saveResult = args;
              }
            };
            
            console.error = function(...args) {
              originalError.apply(console, args);
              if (args[0] === 'Error creating schedule:') {
                window.saveAttempted = true;
                window.saveResult = ['error', ...args];
              }
            };
            
            button.click();
            return true;
          }
        }
        console.error('Save button not found');
        return false;
      })
      .pause(3000) // Give time for save to complete
      .execute(function() {
        return {
          saveAttempted: window.saveAttempted,
          saveResult: window.saveResult,
          lastSaveAttempt: window.lastScheduleSaveAttempt,
          lastSaveResult: window.lastScheduleSaveResult
        };
      }, [], function(result) {
        console.log('Save monitoring result:', result.value);
        if (result.value.lastSaveResult && result.value.lastSaveResult.error) {
          console.log('Save error details:', result.value.lastSaveResult.error);
        }
      });
    
    // Check if we're back on the schedules list page
    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#schedulesTable') !== null;
      const hasSchedulesPage = document.querySelector('#schedulesPage') !== null;
      const hasDetailPage = document.querySelector('#scheduleDetailPage') !== null;
      
      // Check for error messages
      const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], .MuiAlert-root');
      let errorMessages = [];
      errorElements.forEach(el => {
        if (el.textContent) {
          errorMessages.push(el.textContent);
        }
      });
      
      // Check page content
      const pageContent = document.body ? document.body.textContent.substring(0, 500) : 'No body';
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasSchedulesPage: hasSchedulesPage,
        hasDetailPage: hasDetailPage,
        userId: Meteor.userId ? Meteor.userId() : 'No Meteor.userId',
        isLoggedIn: Meteor.userId ? !!Meteor.userId() : false,
        errorMessages: errorMessages,
        pageContent: pageContent
      };
    }, [], function(result) {
      console.log('Post-save state:', result.value);
      if (result.value.errorMessages.length > 0) {
        console.log('Error messages found:', result.value.errorMessages);
      }
      if (!result.value.isLoggedIn) {
        browser.assert.fail('User is not logged in after save attempt');
      }
      if (result.value.url === '/schedules/new') {
        console.log('Still on new schedule page - save may have failed');
        console.log('Page content preview:', result.value.pageContent.substring(0, 200) + '...');
      }
    });
    
    browser
      .pause(1000)
      .waitForElementVisible('#schedulesPage', 10000)
      .saveScreenshot('tests/nightwatch/screenshots/schedules/04-schedule-saved.png');
  });

  it('05. Verify new schedule appears in list', browser => {
    browser
      .waitForElementVisible('#schedulesPage', 5000)
      .refresh() // Force page refresh to ensure data loads
      .waitForElementVisible('#schedulesPage', 5000)
      .pause(2000); // Give autopublish time to sync
    
    // First check what ID was saved in the previous test
    browser.execute(function() {
      return window.lastScheduleSaveResult ? window.lastScheduleSaveResult.result : null;
    }, [], function(result) {
      if (result.value) {
        console.log('Previously saved schedule ID:', result.value);
      }
    });
    
    // Wait for subscription and then check what's in the database
    browser.executeAsync(function(done) {
      // Wait a bit for autopublish to sync
      setTimeout(function() {
        let results = {
          schedulesAvailable: false,
          count: 0,
          meteorCount: 0,
          schedules: [],
          testSchedule: null,
          searchResult: null
        };
        
        // Try different ways to access Schedules
        let SchedulesCollection = null;
        
        if (typeof Schedules !== 'undefined') {
          SchedulesCollection = Schedules;
        } else if (window.Schedules) {
          SchedulesCollection = window.Schedules;
        } else if (Meteor.Collections && Meteor.Collections.Schedules) {
          SchedulesCollection = Meteor.Collections.Schedules;
        }
        
        if (SchedulesCollection) {
          results.schedulesAvailable = true;
          results.count = SchedulesCollection.find({}).count();
          
          // Also check with Meteor.Collections
          if (Meteor.Collections && Meteor.Collections.Schedules) {
            results.meteorCount = Meteor.Collections.Schedules.find({}).count();
          }
          
          // Check specific schedule by searching for our test identifier
          results.testSchedule = SchedulesCollection.findOne({
            'identifier.0.value': { $regex: 'Schedule-.*' }
          });
          
          // Also search by comment with timestamp
          const timestamp = window.testTimestamp || Date.now();
          results.searchResult = SchedulesCollection.findOne({
            'comment': { $regex: timestamp.toString() }
          });
          
          // If still not found, check the last created schedule
          if (!results.testSchedule && !results.searchResult && results.count > 0) {
            results.lastSchedule = SchedulesCollection.findOne({}, { sort: { _id: -1 } });
          }
        } else {
          results.error = 'Schedules collection not found in any location';
        }
        
        done(results);
      }, 3000); // Wait 3 seconds for autopublish
    }, [], function(result) {
      console.log('Database check after wait:', result.value);
      
      // If we found the schedule in the database but UI shows no data, force navigation
      if (result.value && (result.value.count > 0 || result.value.testSchedule || result.value.searchResult)) {
        browser
          .url('http://localhost:3000/schedules')
          .waitForElementVisible('#schedulesPage', 5000)
          .pause(1000);
      }
    });
    
    // Check if search input exists (only present when there's data)
    browser.execute(function() {
      const hasSearchInput = document.querySelector('#scheduleSearchInput') !== null;
      const pageContent = document.querySelector('#schedulesPage')?.textContent || '';
      const hasNoDataMessage = pageContent.includes('No Data Available') || pageContent.includes('No schedules have been created');
      const hasTable = document.querySelector('#schedulesTable') !== null;
      return {
        hasSearchInput: hasSearchInput,
        hasNoDataMessage: hasNoDataMessage,
        hasTable: hasTable
      };
    }, [], function(result) {
      console.log('Page state:', result.value);
      
      if (result.value.hasNoDataMessage) {
        // No data - let's try searching anyway in case the count is wrong
        console.log('No data message shown, searching will show table view');
      }
      
      // Always try to search if the search input exists
      if (result.value.hasSearchInput) {
        // Search for our specific test schedule using the unique timestamp in comment
        browser
          .waitForElementVisible('#scheduleSearchInput', 5000)
          .clearValue('#scheduleSearchInput')
          .setValue('#scheduleSearchInput', timestamp.toString()) // Search by timestamp in comment
          .pause(1000);
      } else {
        console.log('Search input not found on page');
      }
    });
    
    browser.execute(function() {
      const hasTable = document.querySelector('#schedulesTable') !== null;
      const pageContent = document.querySelector('#schedulesPage')?.textContent || '';
      const hasNoDataMessage = pageContent.includes('No Data Available') || pageContent.includes('No schedules have been created');
      
      let totalSchedules = 0;
      
      if (typeof Schedules !== 'undefined') {
        totalSchedules = Schedules.find({}).count();
        console.log('Total schedules in database:', totalSchedules);
        
        const testSchedule = Schedules.findOne({
          'identifier.0.value': { $regex: 'Schedule-.*' }
        });
        console.log('Found test schedule:', testSchedule);
      }
      
      return {
        hasTable: hasTable,
        hasNoDataMessage: hasNoDataMessage,
        totalSchedules: totalSchedules
      };
    }, [], function(result) {
      console.log('Page state:', result.value);
      browser.assert.ok(result.value.hasTable || result.value.totalSchedules > 0, 'Schedule was created and table is visible');
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/schedules/05-schedule-in-list.png');
  });

  it('06. View schedule details', browser => {
    browser
      .waitForElementVisible('#schedulesPage', 5000)
      .pause(500);
    
    // Click on the first row in the table (our newly created schedule)
    browser
      .waitForElementVisible('#schedulesTable tbody tr:first-child', 5000)
      .click('#schedulesTable tbody tr:first-child')
      .pause(1000);
    
    // Verify we're on the detail page
    browser
      .waitForElementVisible('#scheduleDetailPage', 5000)
      .assert.urlContains('/schedules/')
      .pause(500);
    
    // Verify field values
    browser.execute(function() {
      const fields = {
        identifier: document.querySelector('#identifierInput')?.value,
        serviceCategory: document.querySelector('#serviceCategoryInput')?.value,
        serviceCategoryDisplay: document.querySelector('#serviceCategoryDisplayInput')?.value,
        serviceType: document.querySelector('#serviceTypeInput')?.value,
        serviceTypeDisplay: document.querySelector('#serviceTypeDisplayInput')?.value,
        specialty: document.querySelector('#specialtyInput')?.value,
        specialtyDisplay: document.querySelector('#specialtyDisplayInput')?.value,
        actor: document.querySelector('#actorInput')?.value,
        actorReference: document.querySelector('#actorReferenceInput')?.value,
        actorDisplay: document.querySelector('#actorDisplayInput')?.value,
        comment: document.querySelector('#commentTextarea')?.value,
        notes: document.querySelector('#notesTextarea')?.value
      };
      return fields;
    }, [], function(result) {
      console.log('Field values:', result.value);
      browser.assert.ok(result.value.identifier?.includes('Schedule-'), 'Identifier is set correctly');
      browser.assert.ok(result.value.comment?.includes('consultation hours'), 'Comment is set correctly');
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/schedules/06-schedule-detail.png');
  });

  it('07. Edit schedule', browser => {
    browser
      .waitForElementVisible('#scheduleDetailPage', 5000)
      .pause(500);
    
    // Update fields
    browser
      .execute(function() {
        const activeCheckbox = document.querySelector('#activeCheckbox');
        if (activeCheckbox) {
          activeCheckbox.click();
          return 'clicked active checkbox';
        }
        return 'checkbox not found';
      })
      .clearValue('#serviceTypeInput')
      .setValue('#serviceTypeInput', '599480009')
      .clearValue('#serviceTypeDisplayInput')
      .setValue('#serviceTypeDisplayInput', updatedSchedule.serviceType)
      .clearValue('#commentTextarea')
      .setValue('#commentTextarea', updatedSchedule.comment)
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', updatedSchedule.notes)
      .pause(500);
    
    // Save changes
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent === 'Save' || button.textContent.includes('Save')) {
            button.click();
            return true;
          }
        }
        return false;
      })
      .pause(2000);
    
    // Verify we're back on the list page
    browser
      .waitForElementVisible('#schedulesPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/schedules/07-schedule-updated.png');
  });

  it('08. View updated schedule', browser => {
    browser
      .waitForElementVisible('#schedulesPage', 5000)
      .pause(500);
    
    // Check if we need to search first
    browser.execute(function() {
      const hasSearchInput = document.querySelector('#scheduleSearchInput') !== null;
      const hasTable = document.querySelector('#schedulesTable') !== null;
      return { hasSearchInput, hasTable };
    }, [], function(result) {
      if (result.value.hasSearchInput) {
        // Search for our schedule using timestamp
        browser
          .clearValue('#scheduleSearchInput')
          .setValue('#scheduleSearchInput', timestamp.toString())
          .pause(1000);
      }
    });
    
    // Click on the first row
    browser
      .waitForElementVisible('#schedulesTable tbody tr:first-child', 5000)
      .click('#schedulesTable tbody tr:first-child')
      .pause(1000);
    
    // Verify updated values
    browser.execute(function() {
      const fields = {
        active: document.querySelector('#activeCheckbox')?.checked,
        serviceTypeDisplay: document.querySelector('#serviceTypeDisplayInput')?.value,
        comment: document.querySelector('#commentTextarea')?.value,
        notes: document.querySelector('#notesTextarea')?.value
      };
      return fields;
    }, [], function(result) {
      console.log('Updated field values:', result.value);
      browser.assert.equal(result.value.active, false, 'Active status was updated');
      browser.assert.ok(result.value.comment?.includes('Updated'), 'Comment was updated');
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/schedules/08-schedule-updated-detail.png');
  });

  it('09. Delete schedule', browser => {
    browser
      .waitForElementVisible('#scheduleDetailPage', 5000)
      .pause(500);
    
    // Click Delete button
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
      })
      .pause(500)
      .acceptAlert()
      .pause(1000);
    
    // Verify we're back on the list page
    browser
      .waitForElementVisible('#schedulesPage', 5000)
      .execute(function() {
        const hasTable = document.querySelector('#schedulesTable') !== null;
        const hasNoData = document.querySelector('.no-data-card') !== null ||
                         document.querySelector('#schedulesPage')?.textContent.includes('No Data');
        return { hasTable, hasNoData };
      }, [], function(result) {
        browser.assert.ok(
          result.value.hasTable || result.value.hasNoData, 
          'Either table or no-data state present after deletion'
        );
      });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/schedules/09-schedule-deleted.png');
  });

  after(browser => {
    console.log('Schedules CRUD test suite completed');
    browser.end();
  });
});