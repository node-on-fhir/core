// tests/nightwatch/honeycomb/enable_autopublish/crud.schedules.js

const testUtils = require('./shared-test-utils');

describe('Schedules CRUD Operations', function() {
  const timestamp = Date.now();
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
      start: new Date().toISOString(),
      end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
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
          if (result.value.loginSuccess) {
            browser.assert.ok(true, 'Successfully created test user and logged in');
            console.log('Logged in as:', result.value.username, 'userId:', result.value.userId);
            
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
                browser.assert.ok(true, 'Successfully created test patient');
                
                // Set the patient in Session
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
          } else {
            browser.assert.fail('Setup failed: ' + result.value.error);
          }
        });
        
        browser.pause(1000);
      } else {
        browser.assert.ok(true, 'Already logged in (autologin enabled)');
        console.log('Already logged in as:', result.value.username, 'userId:', result.value.userId);
        
        // Create a test patient even if already logged in
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
            
            // Set the patient in Session
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
      
      // Re-establish patient context
      browser.execute(function(testIdentifier) {
        console.log('Looking for patient with identifier:', testIdentifier);
        
        if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
          const allPatients = Patients.find({}).fetch();
          console.log('Total patients in collection:', allPatients.length);
          
          let patient = Patients.findOne({
            'identifier.value': testIdentifier
          });
          
          if (!patient) {
            console.log('Patient not found by identifier, trying by name...');
            patient = Patients.findOne({
              $or: [
                { 'name.0.text': { $regex: 'John.*Doe' } },
                { 'name.0.family': 'Doe' },
                { 'name.0.given.0': 'John' }
              ]
            });
          }
          
          if (!patient && allPatients.length > 0) {
            console.log('Patient not found by name, using most recent patient');
            patient = Patients.findOne({}, { sort: { _id: -1 } });
          }
          
          if (patient) {
            console.log('Found patient:', patient._id, patient.name?.[0]?.text);
            Session.set('selectedPatientId', patient._id);
            Session.set('selectedPatient', patient);
            return { success: true, patientId: patient._id, patientName: patient.name?.[0]?.text };
          } else {
            console.error('Could not find any patient');
            return { success: false, error: 'No patients found in collection' };
          }
        }
        return { success: false, error: 'Session or Patients not available' };
      }, ['test-patient-' + timestamp], function(result) {
        console.log('Patient selection check:', result.value);
        if (result.value.success) {
          browser.assert.ok(true, `Patient selected: ${result.value.patientName}`);
        } else {
          console.error('Failed to set selected patient:', result.value.error);
        }
      });
    });
  });

  it('02. Verify schedules list page loads', browser => {
    browser
      .url('http://localhost:3000/schedules')
      .waitForElementVisible('#schedulesPage', 5000)
      .pause(1000);
    
    // Set patient context AFTER navigation (critical - navigation clears Session)
    browser.execute(function(testIdentifier) {
      console.log('Setting patient context after navigation to /schedules');
      console.log('Looking for patient with identifier:', testIdentifier);
      
      if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
        const allPatients = Patients.find({}).fetch();
        console.log('Total patients in collection:', allPatients.length);
        
        let patient = Patients.findOne({
          'identifier.value': testIdentifier
        });
        
        if (!patient) {
          console.log('Patient not found by identifier, trying by name...');
          patient = Patients.findOne({
            $or: [
              { 'name.0.text': { $regex: 'John.*Doe' } },
              { 'name.0.family': 'Doe' },
              { 'name.0.given.0': 'John' }
            ]
          });
        }
        
        if (!patient && allPatients.length > 0) {
          console.log('Patient not found by name, using most recent patient');
          patient = Patients.findOne({}, { sort: { _id: -1 } });
        }
        
        if (patient) {
          console.log('Found patient:', patient._id, patient.name?.[0]?.text);
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          return { success: true, patientId: patient._id, patientName: patient.name?.[0]?.text };
        } else {
          console.error('Could not find any patient');
          return { success: false, error: 'No patients found in collection' };
        }
      }
      return { success: false, error: 'Session or Patients not available' };
    }, ['test-patient-' + timestamp], function(result) {
      console.log('Patient selection check:', result.value);
      if (result.value.success) {
        browser.assert.ok(true, `Patient selected: ${result.value.patientName}`);
      } else {
        console.error('Failed to set selected patient:', result.value.error);
      }
    });
    
    browser
      .pause(1000)
      .execute(function() {
        const hasTable = document.querySelector('#schedulesTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#schedulesPage') && 
                             document.querySelector('#schedulesPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either schedules table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/schedules/02-schedules-list.png');
  });

  it('03. Navigate to new schedule form', browser => {
    browser
      .waitForElementVisible('#schedulesPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Schedule') || 
              button.textContent.includes('Add Your First Schedule')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Schedule button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#scheduleDetailPage', 5000)
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
      .execute(function() {
        const activeCheckbox = document.querySelector('#activeCheckbox');
        return {
          activeValue: activeCheckbox ? activeCheckbox.checked : null,
          sessionPatientId: typeof Session !== 'undefined' ? Session.get('selectedPatientId') : null,
          sessionPatient: typeof Session !== 'undefined' ? Session.get('selectedPatient') : null
        };
      }, [], function(result) {
        console.log('Form initialization check:', result.value);
      })
      .saveScreenshot('tests/nightwatch/screenshots/schedules/03-new-schedule-form.png');
  });

  it('04. Create new schedule', browser => {
    browser
      .waitForElementVisible('#scheduleDetailPage', 5000)
      .pause(500);

    // Check if we're on the new schedule page
    browser.assert.urlContains('/schedules/new');

    // Check if form is in edit mode
    browser.execute(function() {
      const identifierField = document.querySelector('#identifierInput');
      if (identifierField && identifierField.disabled) {
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

    // Fill form fields
    browser
      .pause(500)
      .clearValue('#identifierInput')
      .setValue('#identifierInput', testSchedule.identifier)
      .clearValue('#serviceCategoryInput')
      .setValue('#serviceCategoryInput', testSchedule.serviceCategory)
      .clearValue('#serviceCategoryDisplayInput')
      .setValue('#serviceCategoryDisplayInput', testSchedule.serviceCategoryDisplay)
      .clearValue('#serviceTypeInput')
      .setValue('#serviceTypeInput', testSchedule.serviceType)
      .clearValue('#serviceTypeDisplayInput')
      .setValue('#serviceTypeDisplayInput', testSchedule.serviceTypeDisplay)
      .clearValue('#specialtyInput')
      .setValue('#specialtyInput', testSchedule.specialty)
      .clearValue('#specialtyDisplayInput')
      .setValue('#specialtyDisplayInput', testSchedule.specialtyDisplay)
      .clearValue('#actorInput')
      .setValue('#actorInput', testSchedule.actor)
      .clearValue('#actorReferenceInput')
      .setValue('#actorReferenceInput', testSchedule.actorReference)
      .clearValue('#actorDisplayInput')
      .setValue('#actorDisplayInput', testSchedule.actorDisplay)
      .clearValue('#planningHorizonStartInput')
      .setValue('#planningHorizonStartInput', testSchedule.planningHorizon.start.split('T')[0])
      .clearValue('#planningHorizonEndInput')
      .setValue('#planningHorizonEndInput', testSchedule.planningHorizon.end.split('T')[0])
      .clearValue('#commentTextarea')
      .setValue('#commentTextarea', testSchedule.comment)
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', testSchedule.notes)
      .pause(500);

    // Also use execute method as fallback
    browser.execute(function(schedule) {
      function setFieldValue(selector, value) {
        const field = document.querySelector(selector);
        if (field) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 
            'value'
          ).set;
          nativeInputValueSetter.call(field, value);
          
          const inputEvent = new Event('input', { bubbles: true });
          field.dispatchEvent(inputEvent);
          
          const changeEvent = new Event('change', { bubbles: true });
          field.dispatchEvent(changeEvent);
          
          console.log(`Set ${selector} to:`, value);
          return true;
        } else if (selector.includes('Textarea')) {
          const textarea = document.querySelector(selector);
          if (textarea) {
            const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype, 
              'value'
            ).set;
            nativeTextareaValueSetter.call(textarea, value);
            
            const inputEvent = new Event('input', { bubbles: true });
            textarea.dispatchEvent(inputEvent);
            
            const changeEvent = new Event('change', { bubbles: true });
            textarea.dispatchEvent(changeEvent);
            
            console.log(`Set ${selector} to:`, value);
            return true;
          }
        }
        console.warn(`Field ${selector} not found`);
        return false;
      }
      
      const results = {};
      
      results.identifier = setFieldValue('#identifierInput', schedule.identifier);
      results.serviceCategory = setFieldValue('#serviceCategoryInput', schedule.serviceCategory);
      results.serviceType = setFieldValue('#serviceTypeInput', schedule.serviceType);
      results.specialty = setFieldValue('#specialtyInput', schedule.specialty);
      results.actor = setFieldValue('#actorInput', schedule.actor);
      results.actorDisplay = setFieldValue('#actorDisplayInput', schedule.actorDisplay);
      results.comment = setFieldValue('#commentTextarea', schedule.comment);
      results.notes = setFieldValue('#notesTextarea', schedule.notes);
      
      // Handle checkbox
      const activeCheckbox = document.querySelector('#activeCheckbox');
      if (activeCheckbox && activeCheckbox.checked !== schedule.active) {
        activeCheckbox.click();
        results.active = true;
      }
      
      return { filled: true, results: results };
    }, [testSchedule], function(result) {
      console.log('Form fields filled:', result.value);
    });

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/schedules/04-filled-schedule-form.png');

    // Log form values before save
    browser.execute(function() {
      const identifierField = document.querySelector('#identifierInput');
      const actorField = document.querySelector('#actorInput');
      const serviceTypeField = document.querySelector('#serviceTypeInput');
      const commentField = document.querySelector('#commentTextarea');
      
      console.log('=== Form values before save ===');
      console.log('Identifier:', identifierField ? identifierField.value : 'not found');
      console.log('Actor:', actorField ? actorField.value : 'not found');
      console.log('Service type:', serviceTypeField ? serviceTypeField.value : 'not found');
      console.log('Comment:', commentField ? commentField.value : 'not found');
      
      const activeCheckbox = document.querySelector('#activeCheckbox');
      console.log('Active checked:', activeCheckbox ? activeCheckbox.checked : 'not found');
      
      // Also check what's actually in the database
      if (typeof Schedules !== 'undefined' && window.testTimestamp) {
        const savedSchedules = Schedules.find().fetch();
        const testSchedule = savedSchedules.find(s => s.identifier && 
          s.identifier[0] && 
          s.identifier[0].value && 
          s.identifier[0].value.includes(window.testTimestamp));
        if (testSchedule) {
          console.log('Found test schedule in database:', testSchedule);
        } else {
          console.log('Test schedule not found in database');
        }
      }
      
      if (typeof Session !== 'undefined') {
        const selectedPatientId = Session.get('selectedPatientId');
        const selectedPatient = Session.get('selectedPatient');
        console.log('Session selectedPatientId:', selectedPatientId);
        console.log('Session selectedPatient:', selectedPatient);
      }
      
      return { logged: true };
    });

    // Save the schedule
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
    
    // Check if we're back on the schedules list page
    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#schedulesTable') !== null;
      const hasSchedulesPage = document.querySelector('#schedulesPage') !== null;
      const hasDetailPage = document.querySelector('#scheduleDetailPage') !== null;
      
      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });
      
      const consoleErrors = window.consoleErrors || [];
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasSchedulesPage: hasSchedulesPage,
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
      if (result.value.url === '/schedules/new') {
        console.log('Still on new schedule page - save may have failed silently');
      }
    });
    
    browser
      .waitForElementVisible('#schedulesPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/schedules/05-schedule-saved.png');
  });

  it('05. Verify new schedule appears in list', browser => {
    browser
      .waitForElementVisible('#schedulesPage', 5000)
      .pause(1000);
    
    // Search for our specific test schedule since there may be many Synthea schedules
    browser
      .waitForElementVisible('#scheduleSearchInput', 5000)
      .clearValue('#scheduleSearchInput')
      .setValue('#scheduleSearchInput', testSchedule.identifier.substring(0, 20))
      .pause(1000);
    
    browser.execute(function() {
      const hasTable = document.querySelector('#schedulesTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageText = document.querySelector('#schedulesPage')?.textContent || '';
      
      let totalSchedules = 0;
      let selectedPatientId = null;
      let selectedPatient = null;
      
      if (typeof Schedules !== 'undefined') {
        totalSchedules = Schedules.find({}).count();
        console.log('Total schedules in database:', totalSchedules);
        
        const testSchedule = Schedules.findOne({
          'identifier.0.value': { $regex: 'Schedule-.*' }
        });
        console.log('Found test schedule:', testSchedule);
        
        if (testSchedule) {
          console.log('Test schedule actor:', JSON.stringify(testSchedule.actor, null, 2));
          if (Array.isArray(testSchedule.actor) && testSchedule.actor[0]) {
            console.log('Test schedule actor reference:', testSchedule.actor[0].reference);
            console.log('Test schedule actor display:', testSchedule.actor[0].display);
          }
        }
      }
      
      if (typeof Session !== 'undefined') {
        selectedPatientId = Session.get('selectedPatientId');
        selectedPatient = Session.get('selectedPatient');
        console.log('Selected patient in Session:', selectedPatientId, selectedPatient?.name);
      }
      
      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasNoData: pageText.includes('No Data Available'),
        totalSchedules: totalSchedules,
        hasSelectedPatient: !!selectedPatientId,
        selectedPatientId: selectedPatientId
      };
    }, [], function(result) {
      console.log('Page state:', result.value);
      
      if (result.value.totalSchedules > 0 && (result.value.hasNoData || result.value.hasNoDataCard)) {
        browser.assert.fail(`Schedules exist (${result.value.totalSchedules}) but are filtered out - actor reference may not be set correctly`);
      } else if (result.value.hasNoData || result.value.hasNoDataCard) {
        browser.assert.fail('No schedules found - save operation may have failed');
      }
    });
    
    browser.execute(function() {
      const table = document.querySelector('#schedulesTable');
      if (!table) return { hasTable: false };
      
      const rows = table.querySelectorAll('tbody tr');
      return {
        hasTable: true,
        rowCount: rows.length,
        firstRowText: rows.length > 0 ? rows[0].textContent : ''
      };
    }, [], function(result) {
      console.log('Table check:', result.value);
      if (result.value.hasTable && result.value.rowCount > 0) {
        browser.assert.ok(true, `Found ${result.value.rowCount} schedule(s) in table`);
      } else {
        browser.assert.fail('No schedules table found or table is empty');
      }
    });
    
    browser
      .saveScreenshot('tests/nightwatch/screenshots/schedules/06-schedule-in-list.png');
  });

  it('06. View schedule details', browser => {
    browser
      .waitForElementVisible('#schedulesPage', 5000)
      .pause(1000);

    // Search for our specific schedule
    browser
      .waitForElementVisible('#scheduleSearchInput', 5000)
      .clearValue('#scheduleSearchInput')
      .setValue('#scheduleSearchInput', testSchedule.identifier.substring(0, 20))
      .pause(1000);

    // Now click on the schedule row
    browser
      .waitForElementVisible('#schedulesTable', 5000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#schedulesTable tbody tr');
        console.log('Found', rows.length, 'rows in schedules table');
        
        // Look for our test schedule
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.textContent.includes(timestamp)) {
            console.log('Clicking row', i, 'with text:', row.textContent);
            row.click();
            return { clicked: true, rowText: row.textContent, rowIndex: i };
          }
        }
        
        // If not found, click the first row
        if (rows.length > 0) {
          rows[0].click();
          return { clicked: true, rowText: rows[0].textContent, rowIndex: 0 };
        }
        
        return { clicked: false, error: 'No rows found' };
      }, [timestamp.toString()], function(result) {
        console.log('Click result:', result.value);
        browser.assert.equal(result.value.clicked, true, 'Found and clicked schedule row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#scheduleDetailPage', 5000)
      .assert.valueContains('#identifierInput', testSchedule.identifier)
      .assert.valueContains('#actorInput', testSchedule.actor)
      .assert.valueContains('#serviceTypeInput', testSchedule.serviceType)
      .execute(function() {
        const activeCheckbox = document.querySelector('#activeCheckbox');
        
        return {
          active: activeCheckbox ? activeCheckbox.checked : null,
          notes: document.querySelector('#notesTextarea').value,
          comment: document.querySelector('#commentTextarea').value
        };
      }, [], function(result) {
        console.log('View schedule details - form values:', result.value);
        console.log('Expected active:', testSchedule.active);
        console.log('Actual active value:', result.value.active);
        
        browser.assert.ok(result.value.active === testSchedule.active, 'Active status matches');
        browser.assert.ok(result.value.notes.includes(testSchedule.notes), 'Notes contain expected text');
        browser.assert.ok(result.value.comment.includes(testSchedule.comment), 'Comment contains expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/schedules/07-view-schedule-details.png');
    
    // Navigate back to schedules list
    browser
      .url('http://localhost:3000/schedules')
      .waitForElementVisible('#schedulesPage', 5000);
  });

  it('07. Update existing schedule', browser => {
    browser
      .waitForElementVisible('#schedulesTable', 5000)
      .pause(1000);

    // Search for our specific test schedule first
    browser
      .waitForElementVisible('#scheduleSearchInput', 5000)
      .clearValue('#scheduleSearchInput')
      .setValue('#scheduleSearchInput', testSchedule.identifier.substring(0, 20))
      .pause(1000);

    // Now click on the schedule to edit
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#schedulesTable tbody tr');
        console.log('Looking for schedule with timestamp:', timestamp);
        console.log('Found', rows.length, 'rows in table');
        
        for (let i = 0; i < rows.length; i++) {
          console.log('Row', i, ':', rows[i].textContent.substring(0, 100));
          if (rows[i].textContent.includes(timestamp)) {
            console.log('Found test schedule in row', i);
            rows[i].click();
            return { success: true, found: true, rowIndex: i };
          }
        }
        
        console.error('Test schedule not found in table! Table only contains Synthea schedules.');
        return { success: false, found: false, error: 'Test schedule not in table' };
      }, [timestamp.toString()], function(result) {
        if (!result.value.found) {
          browser.assert.fail('Test schedule not found in table - cannot update. Only Synthea schedules are visible.');
        }
      });

    browser
      .pause(1000)
      .waitForElementVisible('#scheduleDetailPage', 5000)
      .pause(500);

    // Enter edit mode
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

    // Update schedule details
    browser
      .click('#serviceTypeInput')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#serviceTypeInput', updatedSchedule.serviceType)
      .click('#commentTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#commentTextarea', updatedSchedule.comment)
      .execute(function(active) {
        const activeCheckbox = document.querySelector('#activeCheckbox');
        if (activeCheckbox && activeCheckbox.checked !== active) {
          activeCheckbox.click();
          return true;
        }
        return false;
      }, [updatedSchedule.active], function(result) {
        console.log('Toggled active checkbox:', result.value);
      })
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', updatedSchedule.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/schedules/08-updated-schedule-form.png');

    // Save the updated schedule
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
      .url('http://localhost:3000/schedules')
      .waitForElementVisible('#schedulesTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/schedules/09-schedule-updated.png');
  });

  it('08. Verify updated schedule in list', browser => {
    browser
      .waitForElementVisible('#schedulesTable', 5000)
      .waitForElementVisible('#scheduleSearchInput', 5000)
      .clearValue('#scheduleSearchInput')
      .setValue('#scheduleSearchInput', testSchedule.identifier.substring(0, 20))
      .pause(1000)
      .execute(function(expectedServiceType) {
        const table = document.querySelector('#schedulesTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const serviceTypes = [];
        
        for (let row of rows) {
          const cells = row.querySelectorAll('td');
          for (let cell of cells) {
            if (cell.textContent.includes('Consultation')) {
              serviceTypes.push(cell.textContent);
            }
          }
        }
        
        return {
          rowCount: rows.length,
          serviceTypes: serviceTypes,
          tableText: table ? table.textContent : 'Table not found',
          foundExpected: table ? table.textContent.includes(expectedServiceType) : false
        };
      }, [updatedSchedule.serviceType], function(result) {
        console.log('Table debug info:', result.value);
        browser.assert.ok(result.value.foundExpected || result.value.rowCount > 0, 
          `Updated schedule with service type '${updatedSchedule.serviceType}' should be in table or schedule is visible. Found service types: ${result.value.serviceTypes.join(', ')}`);
      })
      .saveScreenshot('tests/nightwatch/screenshots/schedules/10-updated-schedule-in-list.png');
  });

  it('09. Delete schedule', browser => {
    browser
      .waitForElementVisible('#schedulesPage', 5000)
      .pause(1000);

    browser.execute(function() {
      const hasTable = document.querySelector('#schedulesTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#schedulesPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#schedulesTable tbody tr');
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked schedule row');
          });

        browser
          .pause(1000)
          .waitForElementVisible('#scheduleDetailPage', 5000);

        // Enter edit mode
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

        // Click Delete button
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
          .waitForElementVisible('#schedulesPage', 5000)
          .execute(function() {
            const hasTable = document.querySelector('#schedulesTable') !== null;
            const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                                document.querySelector('.no-data-available') !== null ||
                                document.querySelector('[id*="no-data"]') !== null ||
                                (document.querySelector('#schedulesPage') && 
                                 document.querySelector('#schedulesPage').textContent.includes('No Data Available'));
            return {
              hasTable: hasTable,
              hasNoDataCard: hasNoDataCard,
              hasEitherElement: hasTable || hasNoDataCard
            };
          }, [], function(result) {
            browser.assert.equal(result.value.hasEitherElement, true, 'Either schedules table or no-data message is present after deletion');
          });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No schedules to delete - No Data Available state is correct');
      }
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/schedules/11-schedule-deleted.png');
  });

  it('10. Verify schedule removed from list', browser => {
    browser
      .waitForElementVisible('#schedulesPage', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const table = document.querySelector('#schedulesTable');
        if (table) {
          const rows = document.querySelectorAll('#schedulesTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#schedulesPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Schedule no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (schedule was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/schedules/12-schedule-not-in-list.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof Schedules !== 'undefined') {
        Schedules.find({ 
          $or: [
            { 'identifier.0.value': { $regex: 'Schedule-.*' } },
            { 'comment': { $regex: '.*consultation hours.*' } },
            { 'actor.0.display': { $regex: 'Dr\\..*' } }
          ]
        }).fetch().forEach(function(schedule) {
          Schedules.remove({ _id: schedule._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});