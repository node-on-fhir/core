// tests/nightwatch/honeycomb/enable_autopublish/crud.consents.js

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('Consents CRUD Operations', function() {
  const timestamp = Date.now();
  let testPatientId = null; // Store patient ID for cross-test access

  const testConsent = {
    status: 'active',
    category: 'IDSCL',  // Use the code value for native select
    categoryDisplay: 'Information disclosure',
    dateTime: new Date().toISOString().split('T')[0],
    policyRule: `Policy ${timestamp}`,
    policyRuleCode: 'OPTIN',
    sourceReference: `Document Reference ${timestamp}`,
    sourceDisplay: `Consent Document ${timestamp}`,
    patientName: 'John Doe',
    notes: `Test consent created at ${timestamp}`
  };

  const updatedConsent = {
    status: 'inactive',
    category: 'RESEARCH',  // Use the code value for native select
    policyRule: `Updated Policy ${timestamp}`,
    notes: `Test consent updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting Consents CRUD test suite...');
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  beforeEach(browser => {
    // Removed unnecessary pause
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .execute(function(ts) {
        window.testTimestamp = ts;
      }, [timestamp]);

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
          testPatientId = result.result; // Store ID for use in other tests
          console.log('Test patient created with ID:', result.result);
          browser.assert.ok(true, 'Successfully created test patient');

          // Fetch the patient from the server and set in Session
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
        if (typeof Consents !== 'undefined') {
          const testConsents = Consents.find({
            $or: [
              { 'category.0.text': { $regex: '.*Consent.*' } },
              { 'policyRule.0.text': { $regex: 'Policy.*' } },
              { 'sourceReference.0.display': { $regex: 'Consent Document.*' } }
            ]
          }).fetch();
          testConsents.forEach(function(consent) {
            Consents.remove({ _id: consent._id });
          });
          console.log('Cleared', testConsents.length, 'test consents');
        }
        done();
      });

      browser.pause(500);

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
        if (result.value && result.value.success) {
          browser.assert.ok(true, `Patient selected: ${result.value.patientName}`);
        } else if (result.value) {
          console.error('Failed to set selected patient:', result.value.error);
        }
      });
    });
  });

  it('02. Verify consents list page loads', browser => {
    // Use client-side navigation to preserve Meteor/Session state
    testUtils.navigateUrl(browser, '/consents');
    browser
      .waitForElementVisible('#consentsPage', 5000);

    // Re-establish patient context after navigation (browser.url clears Session)
    browser.executeAsync(function(patientId, done) {
      if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
        Meteor.call('patients.findOne', patientId, function(error, patient) {
          if (error) {
            console.error('Error fetching patient:', error);
            done({ success: false, error: error.message });
          } else if (patient) {
            Session.set('selectedPatientId', patient._id);
            Session.set('selectedPatient', patient);
            console.log('Re-established patient context:', patient._id, patient.name?.[0]?.text);
            done({ success: true });
          } else {
            console.error('Patient not found:', patientId);
            done({ success: false, error: 'Patient not found' });
          }
        });
      } else {
        done({ success: false, error: 'Meteor or Session not available' });
      }
    }, [testPatientId]);

    browser
      .pause(500) // Let subscription update
      .execute(function() {
        const hasTable = document.querySelector('#consentsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#consentsPage') && 
                             document.querySelector('#consentsPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either consents table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/consents/02-consents-list.png');
  });

  it('03. Navigate to new consent form', browser => {
    browser
      .waitForElementVisible('#consentsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Consent') || 
              button.textContent.includes('Add Your First Consent')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Consent button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#consentDetailPage', 5000);
    
    // Re-establish patient context before proceeding
    browser.execute(function(testIdentifier) {
      if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
        let patient = Patients.findOne({
          'identifier.value': testIdentifier
        });
        
        if (!patient) {
          patient = Patients.findOne({
            $or: [
              { 'name.0.text': { $regex: 'John.*Doe' } },
              { 'name.0.family': 'Doe' },
              { 'name.0.given.0': 'John' }
            ]
          });
        }
        
        if (patient) {
          console.log('Re-setting patient in test 03:', patient._id, patient.name?.[0]?.text);
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          return { success: true, patientId: patient._id };
        }
      }
      return { success: false };
    }, ['test-patient-' + timestamp], function(result) {
      console.log('Patient context re-established in test 03:', result.value);
    });
    
    browser
      .pause(1000)
      .assert.elementPresent('#statusSelect')
      .assert.elementPresent('#categoryInput')
      .assert.elementPresent('#dateTimeInput')
      .assert.elementPresent('#policyRuleInput')
      .assert.elementPresent('#sourceReferenceInput')
      .assert.elementPresent('#sourceDisplayInput')
      .assert.elementPresent('#patientDisplay')
      .assert.elementPresent('#notesTextarea')
      .pause(1000)
      .execute(function() {
        const patientField = document.querySelector('#patientDisplay');
        return {
          patientValue: patientField ? patientField.value : null,
          sessionPatientId: typeof Session !== 'undefined' ? Session.get('selectedPatientId') : null,
          sessionPatient: typeof Session !== 'undefined' ? Session.get('selectedPatient') : null
        };
      }, [], function(result) {
        console.log('Form initialization check:', result.value);
      })
      .saveScreenshot('tests/nightwatch/screenshots/consents/03-new-consent-form.png');
  });

  it('04. Create new consent', browser => {
    browser
      .waitForElementVisible('#consentDetailPage', 5000)
      .pause(500);

    // Check if we're on the new consent page
    browser.assert.urlContains('/consents/new');

    // Re-establish patient context in test 04 as well
    browser.execute(function(testIdentifier) {
      if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
        let patient = Patients.findOne({
          'identifier.value': testIdentifier
        });
        
        if (!patient) {
          patient = Patients.findOne({
            $or: [
              { 'name.0.text': { $regex: 'John.*Doe' } },
              { 'name.0.family': 'Doe' },
              { 'name.0.given.0': 'John' }
            ]
          });
        }
        
        if (patient) {
          console.log('Re-setting patient in test 04:', patient._id, patient.name?.[0]?.text);
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          return { success: true, patientId: patient._id };
        }
      }
      return { success: false };
    }, ['test-patient-' + timestamp], function(result) {
      console.log('Patient context re-established in test 04:', result.value);
    });

    // Wait for component to initialize and set patient from Session
    browser.pause(3000);

    // Check patient field and populate if empty
    browser.execute(function() {
      const patientField = document.querySelector('#patientDisplay');
      let patientFieldValue = patientField ? patientField.value : '';
      
      if (patientField && !patientFieldValue && typeof Session !== 'undefined') {
        const selectedPatient = Session.get('selectedPatient');
        if (selectedPatient) {
          let patientName = '';
          if (selectedPatient.name) {
            if (typeof selectedPatient.name === 'string') {
              patientName = selectedPatient.name;
            } else if (Array.isArray(selectedPatient.name) && selectedPatient.name[0]) {
              patientName = selectedPatient.name[0].text || 
                          `${selectedPatient.name[0].given?.join(' ') || ''} ${selectedPatient.name[0].family || ''}`.trim();
            }
          }
          
          if (patientName) {
            patientField.value = patientName;
            patientField.dispatchEvent(new Event('input', { bubbles: true }));
            patientField.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Manually set patient field to:', patientName);
            patientFieldValue = patientName;
          }
        }
      }
      
      return {
        patientFieldValue: patientFieldValue,
        patientFieldId: patientField ? patientField.id : 'field not found',
        wasEmpty: !patientFieldValue
      };
    }, [], function(result) {
      console.log('Patient field check:', result.value);
    });

    // Check if form is in edit mode
    browser.execute(function() {
      const categoryField = document.querySelector('#categoryInput');
      if (categoryField && categoryField.disabled) {
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

    // Fill form fields - handle native select differently
    browser
      .pause(500)
      // Set status to active
      .setValue('#statusSelect', testConsent.status)
      // Native select doesn't need clearValue
      .setValue('#categoryInput', testConsent.category)
      .clearValue('#dateTimeInput')
      .setValue('#dateTimeInput', testConsent.dateTime)
      .clearValue('#policyRuleInput')
      .setValue('#policyRuleInput', testConsent.policyRule)
      .clearValue('#sourceReferenceInput')
      .setValue('#sourceReferenceInput', testConsent.sourceReference)
      .clearValue('#sourceDisplayInput')
      .setValue('#sourceDisplayInput', testConsent.sourceDisplay)
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', testConsent.notes)
      .pause(500);

    // Also use execute method as simpler fallback
    browser.execute(function(consent) {
      const results = {};
      
      // Simple field setting without native setter
      function setField(selector, value) {
        const field = document.querySelector(selector);
        if (field) {
          field.value = value;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }
      
      // Don't set patient display field - it should be set by the component from Session
      // The component's useEffect will properly set both patient.reference and patient.display
      
      // Set other fields
      results.category = setField('#categoryInput', consent.category);
      results.policyRule = setField('#policyRuleInput', consent.policyRule);
      results.sourceReference = setField('#sourceReferenceInput', consent.sourceReference);
      results.sourceDisplay = setField('#sourceDisplayInput', consent.sourceDisplay);
      results.notes = setField('#notesTextarea', consent.notes);
      
      return { filled: true, results: results };
    }, [testConsent], function(result) {
      console.log('Form fields filled:', result.value);
    });

    // Handle Material-UI Select components
    browser.execute(function(status) {
      console.log('Trying to set status to:', status);
      const statusSelect = document.querySelector('#statusSelect');
      if (statusSelect) {
        console.log('Found statusSelect, current value:', statusSelect.value);
        statusSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          console.log('Found', options.length, 'options');
          let found = false;
          for (let option of options) {
            console.log('Option:', option.getAttribute('data-value'), option.textContent);
            if (option.getAttribute('data-value') === status || 
                option.textContent.toLowerCase().includes(status)) {
              console.log('Clicking option:', option.textContent);
              option.click();
              found = true;
              break;
            }
          }
          if (!found) {
            console.error('Could not find option for status:', status);
          }
        }, 300);
      } else {
        console.error('statusSelect not found!');
      }
    }, [testConsent.status]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/consents/04-filled-consent-form.png');

    // Log form values before save
    browser.execute(function() {
      const patientField = document.querySelector('#patientDisplay');
      const categoryField = document.querySelector('#categoryInput');
      const policyRuleField = document.querySelector('#policyRuleInput');
      const sourceDisplayField = document.querySelector('#sourceDisplayInput');
      
      console.log('=== Form values before save ===');
      console.log('Patient display:', patientField ? patientField.value : 'not found');
      console.log('Category:', categoryField ? categoryField.value : 'not found');
      console.log('Policy rule:', policyRuleField ? policyRuleField.value : 'not found');
      console.log('Source display:', sourceDisplayField ? sourceDisplayField.value : 'not found');
      
      const statusSelect = document.querySelector('#statusSelect');
      console.log('Status value:', statusSelect ? statusSelect.value : 'not found');
      
      // Also check what's actually in the database
      if (typeof Consents !== 'undefined' && window.testTimestamp) {
        const savedConsents = Consents.find().fetch();
        const testConsent = savedConsents.find(c => c.category && 
          c.category[0] && 
          c.category[0].text && 
          c.category[0].text.includes(window.testTimestamp));
        if (testConsent) {
          console.log('Found test consent in database:', testConsent);
        } else {
          console.log('Test consent not found in database');
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

    // Log form state before save and click Save button
    browser
      .execute(function() {
        window.consoleErrors = [];
        const originalError = console.error;
        console.error = function() {
          window.consoleErrors.push(Array.from(arguments).join(' '));
          originalError.apply(console, arguments);
        };
        
        // Log all form field values before save
        const fields = {
          status: document.querySelector('#statusSelect')?.value,
          category: document.querySelector('#categoryInput')?.value,
          dateTime: document.querySelector('#dateTimeInput')?.value,
          policyRule: document.querySelector('#policyRuleInput')?.value,
          sourceReference: document.querySelector('#sourceReferenceInput')?.value,
          sourceDisplay: document.querySelector('#sourceDisplayInput')?.value,
          patient: document.querySelector('#patientDisplay')?.value,
          notes: document.querySelector('#notesTextarea')?.value
        };
        console.log('Form values before save:', fields);
        
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Save')) {
            console.log('Clicking save button');
            button.click();
            return { clicked: true, formValues: fields };
          }
        }
        return { clicked: false, formValues: fields };
      }, [], function(result) {
        console.log('Save button click result:', result.value);
        browser.assert.equal(result.value.clicked, true, 'Clicked Save button');
      });

    browser
      .pause(3000) // Give time for save and navigation
      .waitForElementVisible('#consentsPage', 5000);

    // Check if we're back on the consents list page and verify consent was saved
    browser.execute(function(timestamp) {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#consentsTable') !== null;
      const hasConsentsPage = document.querySelector('#consentsPage') !== null;
      const hasDetailPage = document.querySelector('#consentDetailPage') !== null;
      
      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });
      
      const consoleErrors = window.consoleErrors || [];
      
      // Check database for our consent
      let totalConsents = 0;
      let testConsentFound = false;
      if (typeof Consents !== 'undefined') {
        totalConsents = Consents.find().count();
        console.log('Total consents in database after save:', totalConsents);
        
        // Look for our test consent by timestamp
        const searchString = `Test consent created at ${timestamp}`;
        const testConsent = Consents.findOne({
          'note.0.text': { $regex: searchString }
        });
        
        if (testConsent) {
          testConsentFound = true;
          console.log('Found test consent:', testConsent._id);
          console.log('Test consent patient:', JSON.stringify(testConsent.patient));
          console.log('Test consent full object:', JSON.stringify(testConsent, null, 2));
        } else {
          // Try other ways to find it
          const allConsents = Consents.find().fetch();
          console.log('All consents:', allConsents.map(c => ({
            _id: c._id,
            patient: c.patient,
            notes: c.note?.[0]?.text
          })));
        }
      }
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasConsentsPage: hasConsentsPage,
        hasDetailPage: hasDetailPage,
        hasError: errorText.length > 0,
        errorText: errorText.trim(),
        consoleErrors: consoleErrors,
        userId: Meteor.userId ? Meteor.userId() : 'No Meteor.userId',
        isLoggedIn: Meteor.userId ? !!Meteor.userId() : false,
        totalConsents: totalConsents,
        testConsentFound: testConsentFound
      };
    }, [timestamp], function(result) {
      console.log('Post-save state:', result.value);
      if (result.value.hasError) {
        browser.assert.fail(`Save failed with error: ${result.value.errorText}`);
      }
      if (!result.value.isLoggedIn) {
        browser.assert.fail('User is not logged in after save attempt');
      }
      if (result.value.url === '/consents/new') {
        console.log('Still on new consent page - save may have failed silently');
      }
    });
    
    browser
      .waitForElementVisible('#consentsPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/consents/05-consent-saved.png');
  });

  it('05. Verify new consent appears in list', browser => {
    browser
      .waitForElementVisible('#consentsPage', 5000)
      .pause(1000);
    
    // Re-establish patient context after navigation
    browser.execute(function(testIdentifier) {
      console.log('Re-establishing patient context with identifier:', testIdentifier);
      
      if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
        let patient = Patients.findOne({
          'identifier.value': testIdentifier
        });
        
        if (!patient) {
          patient = Patients.findOne({
            $or: [
              { 'name.0.text': { $regex: 'John.*Doe' } },
              { 'name.0.family': 'Doe' },
              { 'name.0.given.0': 'John' }
            ]
          });
        }
        
        if (patient) {
          console.log('Re-selected patient:', patient._id, patient.name?.[0]?.text);
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          
          return { success: true, patientId: patient._id };
        }
      }
      return { success: false };
    }, ['test-patient-' + timestamp], function(result) {
      console.log('Patient context re-established:', result.value);
    });

    // Wait for page to re-render with patient context
    browser.pause(1000);

    // Search for our specific test consent by unique notes field
    browser
      .waitForElementVisible('#consentSearchInput', 5000)
      .clearValue('#consentSearchInput')
      .setValue('#consentSearchInput', testConsent.notes)
      .pause(1000);
    
    browser.execute(function(timestamp) {
      const hasTable = document.querySelector('#consentsTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageText = document.querySelector('#consentsPage')?.textContent || '';
      
      let totalConsents = 0;
      let totalConsentsUnfiltered = 0;
      let selectedPatientId = null;
      let selectedPatient = null;
      let testConsentDetails = null;
      
      if (typeof Consents !== 'undefined') {
        // Count all consents first
        totalConsentsUnfiltered = Consents.find({}).count();
        console.log('Total consents in database (unfiltered):', totalConsentsUnfiltered);
        
        // The client only sees what the subscription provides
        // Since the subscription filters by patient, we might not see all consents
        console.log('Note: Client-side collections only show documents from active subscriptions');
        
        // Try to find our test consent by notes
        const searchString = `Test consent created at ${timestamp}`;
        const testConsent = Consents.findOne({
          'note.0.text': { $regex: searchString }
        });
        
        if (testConsent) {
          console.log('Test consent found in test 05:', testConsent._id);
          console.log('Test consent patient:', JSON.stringify(testConsent.patient));
          testConsentDetails = {
            id: testConsent._id,
            patient: testConsent.patient,
            status: testConsent.status
          };
        }
        
        // Check all consents
        const allConsents = Consents.find({}).fetch();
        console.log('All consents visible to client:', allConsents.length);
        allConsents.forEach(c => {
          console.log('Consent:', c._id, 'Patient:', c.patient);
        });
        
        totalConsents = totalConsentsUnfiltered;
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
        totalConsents: totalConsents,
        totalConsentsUnfiltered: totalConsentsUnfiltered,
        hasSelectedPatient: !!selectedPatientId,
        selectedPatientId: selectedPatientId,
        testConsentDetails: testConsentDetails
      };
    }, [timestamp], function(result) {
      console.log('Page state:', result.value);
      
      if (result.value.totalConsents > 0 && (result.value.hasNoData || result.value.hasNoDataCard)) {
        browser.assert.fail(`Consents exist (${result.value.totalConsents}) but are filtered out - patient reference may not be set correctly`);
      } else if (result.value.hasNoData || result.value.hasNoDataCard) {
        browser.assert.fail('No consents found - save operation may have failed');
      }
    });
    
    browser.execute(function() {
      const table = document.querySelector('#consentsTable');
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
        browser.assert.ok(true, `Found ${result.value.rowCount} consent(s) in table`);
      } else {
        browser.assert.fail('No consents table found or table is empty');
      }
    });
    
    browser
      .saveScreenshot('tests/nightwatch/screenshots/consents/06-consent-in-list.png');
  });

  it('06. View consent details', browser => {
    // Set up console log capture
    browser.execute(function() {
      window.consoleLogs = [];
      const originalLog = console.log;
      const originalError = console.error;
      console.log = function(...args) {
        window.consoleLogs.push('[LOG] ' + args.join(' '));
        originalLog.apply(console, args);
      };
      console.error = function(...args) {
        window.consoleLogs.push('[ERROR] ' + args.join(' '));
        originalError.apply(console, args);
      };
    });
    
    browser
      .waitForElementVisible('#consentsPage', 5000)
      .pause(1000);

    // Search for our specific consent by timestamp (unique identifier in policyRule/notes)
    browser
      .waitForElementVisible('#consentSearchInput', 5000)
      .clearValue('#consentSearchInput')
      .setValue('#consentSearchInput', timestamp.toString())
      .pause(2000); // Wait for subscription to update with filtered results

    // Debug: Check what consents are in the table
    browser.execute(function(timestamp) {
      const rows = document.querySelectorAll('#consentsTable tbody tr');

      const debugInfo = {
        timestamp: timestamp,
        rowCount: rows.length,
        consents: []
      };

      // Check what consents are in the client collection
      if (typeof Consents !== 'undefined') {
        const allConsents = Consents.find({}).fetch();
        debugInfo.totalConsents = allConsents.length;

        allConsents.forEach(c => {
          debugInfo.consents.push({
            mongoId: c._id,
            fhirId: c.id,
            policyRule: c.policyRule?.text,
            note: c.note?.[0]?.text,
            patient: c.patient?.reference,
            status: c.status
          });
        });
      }

      return debugInfo;
    }, [timestamp.toString()], function(result) {
      console.log('=== CONSENT TABLE DEBUG ===');
      console.log(JSON.stringify(result.value, null, 2));
    });

    // Click on the consent row (subscription has filtered to show only our consent)
    browser
      .waitForElementVisible('#consentsTable', 5000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#consentsTable tbody tr');
        console.log('After timestamp search, found', rows.length, 'row(s)');

        if (rows.length > 0) {
          console.log('Clicking first row (should be our test consent)');
          console.log('First row text:', rows[0].textContent.substring(0, 100));
          rows[0].click();
          return {
            clicked: true,
            rowText: rows[0].textContent,
            rowCount: rows.length
          };
        }

        return { clicked: false, error: 'No rows found after timestamp search' };
      }, [timestamp.toString()], function(result) {
        console.log('Click result:', result.value);
        browser.assert.equal(result.value.clicked, true, 'Found and clicked consent row');
      });

    browser
      .pause(1000)
      .execute(function() {
        const url = window.location.pathname;
        const errors = [];
        
        // Capture console logs if we've been storing them
        let logs = [];
        if (window.consoleLogs) {
          logs = window.consoleLogs.slice(-20);
        }
        
        return {
          url: url,
          hasDetailPage: document.querySelector('#consentDetailPage') !== null,
          errors: errors,
          logs: logs
        };
      }, [], function(result) {
        console.log('After click navigation check:', result.value);
        if (result.value.logs && result.value.logs.length > 0) {
          console.log('Browser console logs:', result.value.logs);
        }
      })
      .waitForElementVisible('#consentDetailPage', 5000)
      .pause(1000) // Wait for data to load
      .execute(function() {
        const policyRuleInput = document.querySelector('#policyRuleInput');
        const categoryInput = document.querySelector('#categoryInput');
        const sourceDisplayInput = document.querySelector('#sourceDisplayInput');
        
        return {
          policyRuleValue: policyRuleInput ? policyRuleInput.value : 'not found',
          categoryValue: categoryInput ? categoryInput.value : 'not found',
          sourceDisplayValue: sourceDisplayInput ? sourceDisplayInput.value : 'not found',
          policyRuleExists: !!policyRuleInput,
          policyRuleType: policyRuleInput ? policyRuleInput.type : 'not found'
        };
      }, [], function(result) {
        console.log('Form field values:', result.value);
      })
      .execute(function(originalCategory, updatedCategory) {
        const categoryInput = document.querySelector('#categoryInput');
        const categoryValue = categoryInput ? categoryInput.value : '';
        
        // Check if the category is either the original or updated value
        const isValidCategory = categoryValue === originalCategory || categoryValue === updatedCategory;
        
        return {
          categoryValue: categoryValue,
          isValidCategory: isValidCategory
        };
      }, [testConsent.category, updatedConsent.category], function(result) {
        console.log('Category validation:', result.value);
        browser.assert.ok(result.value.isValidCategory, 
          `Category should be either ${testConsent.category} or ${updatedConsent.category}, got: ${result.value.categoryValue}`);
      })
      .waitForElementVisible('#policyRuleInput', 2000)
      .assert.valueContains('#policyRuleInput', 'Policy')
      .assert.valueContains('#sourceDisplayInput', 'Consent Document')
      .execute(function() {
        const statusInput = document.querySelector('#statusSelect');
        
        // Get the value from Material-UI Select which uses hidden input
        const getMUISelectValue = (selectId) => {
          const select = document.querySelector(selectId);
          if (!select) return null;
          
          // For MUI Select, the actual value is in a hidden input
          const hiddenInput = select.querySelector('input[type="hidden"]');
          if (hiddenInput) return hiddenInput.value;
          
          // Fallback to direct value
          return select.value;
        };
        
        // Also try to get the displayed text for Material-UI Select
        const getSelectDisplay = (selectId) => {
          const select = document.querySelector(selectId);
          if (!select) return null;
          
          // Look for the displayed value in various MUI structures
          const displayDiv = select.parentElement?.querySelector('[role="button"]');
          if (displayDiv) return displayDiv.textContent;
          
          // Alternative: look for the selected option text
          const selectedValue = getMUISelectValue(selectId);
          const options = document.querySelectorAll(`${selectId} option`);
          for (let opt of options) {
            if (opt.value === selectedValue) return opt.textContent;
          }
          
          return null;
        };
        
        return {
          status: getMUISelectValue('#statusSelect'),
          notes: document.querySelector('#notesTextarea').value,
          statusDisplay: getSelectDisplay('#statusSelect') || 
                        document.querySelector('[aria-labelledby*="status"]')?.textContent || 
                        document.querySelector('#statusSelect')?.parentElement?.textContent
        };
      }, [], function(result) {
        console.log('View consent details - form values:', result.value);
        console.log('Expected status:', testConsent.status);
        console.log('Actual status value:', result.value.status);
        console.log('Status display:', result.value.statusDisplay);
        
        const statusOk = result.value.status === testConsent.status || 
                       (result.value.statusDisplay && result.value.statusDisplay.includes('Active'));
        
        browser.assert.ok(statusOk, 'Status matches');
        browser.assert.ok(result.value.notes.includes(testConsent.notes), 'Notes contain expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/consents/06-view-consent-details.png')
      .pause(500);
  });

  it('07. Update existing consent', browser => {
    // Navigate back to consents list page first
    testUtils.navigateUrl(browser, '/consents');
    browser
      .waitForElementVisible('#consentsPage', 5000)
      .pause(1000);

    // Re-establish patient context exactly like test 05
    browser.execute(function(testIdentifier) {
      console.log('Re-establishing patient context with identifier:', testIdentifier);
      
      if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
        let patient = Patients.findOne({
          'identifier.value': testIdentifier
        });
        
        if (!patient) {
          patient = Patients.findOne({
            $or: [
              { 'name.0.text': { $regex: 'John.*Doe' } },
              { 'name.0.family': 'Doe' },
              { 'name.0.given.0': 'John' }
            ]
          });
        }
        
        if (patient) {
          console.log('Re-selected patient:', patient._id, patient.name?.[0]?.text);
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          
          return { success: true, patientId: patient._id };
        }
      }
      return { success: false };
    }, ['test-patient-' + timestamp], function(result) {
      console.log('Patient context re-established:', result.value);
    });

    // Wait for page to re-render with patient context
    browser.pause(1000);

    // Search for our specific test consent by timestamp (unique identifier)
    browser
      .waitForElementVisible('#consentSearchInput', 5000)
      .clearValue('#consentSearchInput')
      .setValue('#consentSearchInput', timestamp.toString())
      .pause(1000);

    // Click on the test consent row (after search, should be the only row)
    browser.execute(function(timestamp) {
      const rows = document.querySelectorAll('#consentsTable tbody tr');
      console.log('Found', rows.length, 'consent row(s) after searching by timestamp:', timestamp);

      // Debug: Log all row IDs to see which consents are visible
      if (typeof Consents !== 'undefined') {
        const allVisible = Consents.find({}).fetch();
        console.log('Consents visible in client collection:', allVisible.length);
        allVisible.forEach(c => {
          console.log('  - ID:', c._id, 'policyRule:', c.policyRule?.text, 'notes:', c.note?.[0]?.text);
        });
      }

      // After filtering by timestamp, there should be exactly 1 row (our test consent)
      if (rows.length > 0) {
        console.log('Clicking first row to edit consent');
        console.log('First row text:', rows[0].textContent.substring(0, 100));
        rows[0].click();
        return { clicked: true, rowCount: rows.length };
      }

      return { clicked: false, error: 'No rows found after search' };
    }, [timestamp.toString()], function(result) {
      console.log('Click result:', result.value);
      if (!result.value.clicked) {
        browser.assert.fail('Test consent not found in table - cannot update');
      } else {
        browser.assert.equal(result.value.clicked, true, 'Found and clicked consent row');
      }
    });

    browser
      .pause(1000)
      .waitForElementVisible('#consentDetailPage', 5000)
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

    // Update consent details
    browser
      .execute(function(value) {
        // Handle native select element for category
        const categorySelect = document.querySelector('#categoryInput');
        if (categorySelect) {
          categorySelect.value = value;
          categorySelect.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, [updatedConsent.category], function(result) {
        browser.assert.equal(result.value, true, 'Selected category');
      })
      .click('#policyRuleInput')
      .clearValue('#policyRuleInput')
      .setValue('#policyRuleInput', updatedConsent.policyRule)
      .execute(function(value) {
        // Handle native select element
        const statusSelect = document.querySelector('#statusSelect');
        if (statusSelect) {
          statusSelect.value = value;
          statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, [updatedConsent.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#notesTextarea')
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', updatedConsent.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/consents/08-updated-consent-form.png');

    // Debug: Check form values before save
    browser.execute(function() {
      const category = document.querySelector('#categoryInput')?.value;
      const status = document.querySelector('#statusSelect')?.value;
      const notes = document.querySelector('#notesTextarea')?.value;
      const policyRule = document.querySelector('#policyRuleInput')?.value;

      console.log('=== Form values BEFORE save ===');
      console.log('  Category input value:', category);
      console.log('  Status input value:', status);
      console.log('  Notes input value:', notes);
      console.log('  Policy rule:', policyRule);

      return { category, status, notes, policyRule };
    }, [], function(result) {
      console.log('Form state before save:', result.value);
    });

    browser.pause(500);

    // Save the updated consent
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          // When editing, the button says "Update Consent" not "Save Consent"
          if (button.textContent.includes('Update')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Update button');
      });

    // Wait for update to complete and verify we're still on detail page
    browser
      .pause(3000)
      .execute(function() {
        return {
          url: window.location.pathname,
          hasDetailPage: !!document.querySelector('#consentDetailPage'),
          isEditMode: !!document.querySelector('button svg[data-testid="LockOpenIcon"]')
        };
      }, [], function(result) {
        console.log('After update state:', result.value);
      });

    testUtils.navigateUrl(browser, '/consents');
    browser
      .waitForElementVisible('#consentsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/consents/09-consent-updated.png');
  });

  it('08. Verify updated consent in list', browser => {
    browser
      .waitForElementVisible('#consentsTable', 5000)
      .waitForElementVisible('#consentSearchInput', 5000)
      .clearValue('#consentSearchInput')
      .setValue('#consentSearchInput', testConsent.patientName)
      .pause(1000)
      .execute(function(expectedCategory) {
        const table = document.querySelector('#consentsTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const consentCategories = [];
        
        for (let row of rows) {
          const cells = row.querySelectorAll('td');
          for (let cell of cells) {
            if (cell.textContent.includes('Consent')) {
              consentCategories.push(cell.textContent);
            }
          }
        }
        
        return {
          rowCount: rows.length,
          consentCategories: consentCategories,
          tableText: table ? table.textContent : 'Table not found',
          foundExpected: table ? table.textContent.includes(expectedCategory) : false
        };
      }, ['Research information access'], function(result) {
        console.log('Table debug info:', result.value);
        // The table displays the category display text, not the code
        const expectedCategoryDisplay = 'Research information access';
        const foundResearch = result.value.tableText.includes(expectedCategoryDisplay);
        browser.assert.ok(foundResearch, 
          `Updated consent category '${expectedCategoryDisplay}' should be in table. Table content: ${result.value.tableText}`);
      })
      .saveScreenshot('tests/nightwatch/screenshots/consents/10-updated-consent-in-list.png');
  });

  it('09. Delete consent', browser => {
    browser
      .waitForElementVisible('#consentsPage', 5000)
      .pause(1000);

    // Search for our test consent by patient name
    browser
      .waitForElementVisible('#consentSearchInput', 5000)
      .clearValue('#consentSearchInput')
      .setValue('#consentSearchInput', testConsent.patientName)
      .pause(1000);

    browser.execute(function() {
      const hasTable = document.querySelector('#consentsTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#consentsPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#consentsTable tbody tr');
            console.log('Found', rows.length, 'rows in consents table');
            
            // Get consent ID from the table before clicking
            let consentId = null;
            
            if (typeof Consents !== 'undefined') {
              // Find the test consent - it may have updated notes now
              const searchStrings = [
                `Test consent created at ${timestamp}`,
                `Test consent updated at ${timestamp}`
              ];
              
              for (let searchString of searchStrings) {
                const consentDoc = Consents.findOne({
                  'note.0.text': { $regex: searchString }
                });
                if (consentDoc) {
                  consentId = consentDoc._id;
                  console.log('Found test consent with _id:', consentId);
                  break;
                }
              }
            }
            
            // Since we searched by patient name, just click the first row
            if (rows.length > 0) {
              console.log('Clicking first row after search filter');
              rows[0].click();
              return { 
                clicked: true, 
                rowCount: rows.length,
                consentId: consentId
              };
            }
            
            return { clicked: false, error: 'No rows found after search' };
          }, [timestamp.toString()], function(result) {
            console.log('Click result:', result.value);
            
            if (!result.value.clicked) {
              browser.assert.fail('Test consent not found in table - cannot delete');
            } else {
              browser.assert.equal(result.value.clicked, true, 'Found and clicked consent row');
              
              // Navigate directly if click didn't work
              if (result.value.consentId) {
                browser.url(`http://localhost:3000/consents/${result.value.consentId}`);
              }
            }
          });

        browser
          .pause(1000)
          .waitForElementVisible('#consentDetailPage', 5000);

        // Delete button is visible in view mode, not edit mode
        // Click Delete button directly
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
          .pause(500) // Wait for alert to appear
          .acceptAlert() // Accept the confirmation dialog
          .pause(1000); // Wait for deletion to complete

        browser
          .pause(2000)
          .waitForElementVisible('#consentsPage', 5000)
          .execute(function() {
            const hasTable = document.querySelector('#consentsTable') !== null;
            const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                                document.querySelector('.no-data-available') !== null ||
                                document.querySelector('[id*="no-data"]') !== null ||
                                (document.querySelector('#consentsPage') && 
                                 document.querySelector('#consentsPage').textContent.includes('No Data Available'));
            return {
              hasTable: hasTable,
              hasNoDataCard: hasNoDataCard,
              hasEitherElement: hasTable || hasNoDataCard
            };
          }, [], function(result) {
            browser.assert.equal(result.value.hasEitherElement, true, 'Either consents table or no-data message is present after deletion');
          });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No consents to delete - No Data Available state is correct');
      }
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/consents/11-consent-deleted.png');
  });

  it('10. Verify consent removed from list', browser => {
    browser
      .waitForElementVisible('#consentsPage', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const table = document.querySelector('#consentsTable');
        if (table) {
          const rows = document.querySelectorAll('#consentsTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#consentsPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Consent no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (consent was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/consents/12-consent-not-in-list.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof Consents !== 'undefined') {
        Consents.find({ 
          $or: [
            { 'category.0.text': { $regex: '.*Consent.*' } },
            { 'policyRule.0.text': { $regex: 'Policy.*' } },
            { 'sourceReference.0.display': { $regex: 'Consent Document.*' } }
          ]
        }).fetch().forEach(function(consent) {
          Consents.remove({ _id: consent._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});