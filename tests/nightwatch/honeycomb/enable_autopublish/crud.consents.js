// tests/nightwatch/honeycomb/enable_autopublish/crud.consents.js

const testUtils = require('./shared-test-utils');

describe('Consents CRUD Operations', function() {
  const timestamp = Date.now();
  const testConsent = {
    status: 'active',
    category: `Privacy Consent ${timestamp}`,
    categoryCode: 'INFA',
    categoryDisplay: 'Information Access',
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
    category: `Updated Privacy Consent ${timestamp}`,
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

  it('02. Verify consents list page loads', browser => {
    browser
      .url('http://localhost:3000/consents')
      .waitForElementVisible('#consentsPage', 5000)
      .pause(2000)
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
      .waitForElementVisible('#consentDetailPage', 5000)
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

    // Fill form fields
    browser
      .pause(500)
      .clearValue('#categoryInput')
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

    // Also use execute method as fallback
    browser.execute(function(consent) {
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
        } else {
          console.warn(`Field ${selector} not found`);
          return false;
        }
      }
      
      const results = {};
      
      // Ensure patient display is set
      const patientField = document.querySelector('#patientDisplay');
      if (patientField && !patientField.value) {
        const selectedPatient = Session.get('selectedPatient');
        if (selectedPatient && selectedPatient.name) {
          let patientName = '';
          if (typeof selectedPatient.name === 'string') {
            patientName = selectedPatient.name;
          } else if (Array.isArray(selectedPatient.name) && selectedPatient.name[0]) {
            patientName = selectedPatient.name[0].text || 
                        `${selectedPatient.name[0].given?.join(' ') || ''} ${selectedPatient.name[0].family || ''}`.trim();
          }
          if (patientName) {
            results.patientDisplay = setFieldValue('#patientDisplay', patientName);
          }
        }
      }
      
      results.category = setFieldValue('#categoryInput', consent.category);
      results.policyRule = setFieldValue('#policyRuleInput', consent.policyRule);
      results.sourceReference = setFieldValue('#sourceReferenceInput', consent.sourceReference);
      results.sourceDisplay = setFieldValue('#sourceDisplayInput', consent.sourceDisplay);
      results.notes = setFieldValue('#notesTextarea', consent.notes);
      
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

    // Save the consent
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
    
    // Check if we're back on the consents list page
    browser.execute(function() {
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
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasConsentsPage: hasConsentsPage,
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
    
    // Search for our specific test consent since there may be many Synthea consents
    browser
      .waitForElementVisible('#consentSearchInput', 5000)
      .clearValue('#consentSearchInput')
      .setValue('#consentSearchInput', testConsent.category.substring(0, 20))
      .pause(1000);
    
    browser.execute(function() {
      const hasTable = document.querySelector('#consentsTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageText = document.querySelector('#consentsPage')?.textContent || '';
      
      let totalConsents = 0;
      let selectedPatientId = null;
      let selectedPatient = null;
      
      if (typeof Consents !== 'undefined') {
        totalConsents = Consents.find({}).count();
        console.log('Total consents in database:', totalConsents);
        
        const testConsent = Consents.findOne({
          'category.0.text': { $regex: 'Privacy Consent.*' }
        });
        console.log('Found test consent:', testConsent);
        
        if (testConsent) {
          console.log('Test consent patient:', JSON.stringify(testConsent.patient, null, 2));
          console.log('Test consent patient reference:', testConsent.patient?.reference);
          console.log('Test consent patient display:', testConsent.patient?.display);
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
        totalConsents: totalConsents,
        hasSelectedPatient: !!selectedPatientId,
        selectedPatientId: selectedPatientId
      };
    }, [], function(result) {
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
    browser
      .waitForElementVisible('#consentsPage', 5000)
      .pause(1000);

    // Search for our specific consent
    browser
      .waitForElementVisible('#consentSearchInput', 5000)
      .clearValue('#consentSearchInput')
      .setValue('#consentSearchInput', testConsent.category.substring(0, 20))
      .pause(1000);

    // Now click on the consent row
    browser
      .waitForElementVisible('#consentsTable', 5000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#consentsTable tbody tr');
        console.log('Found', rows.length, 'rows in consents table');
        
        // Look for our test consent
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
        browser.assert.equal(result.value.clicked, true, 'Found and clicked consent row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#consentDetailPage', 5000)
      .assert.valueContains('#categoryInput', testConsent.category)
      .assert.valueContains('#policyRuleInput', testConsent.policyRule)
      .assert.valueContains('#sourceDisplayInput', testConsent.sourceDisplay)
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
      .saveScreenshot('tests/nightwatch/screenshots/consents/07-view-consent-details.png');
    
    // Navigate back to consents list
    browser
      .url('http://localhost:3000/consents')
      .waitForElementVisible('#consentsPage', 5000);
  });

  it('07. Update existing consent', browser => {
    browser
      .waitForElementVisible('#consentsTable', 5000)
      .pause(1000);

    // Search for our specific test consent first
    browser
      .waitForElementVisible('#consentSearchInput', 5000)
      .clearValue('#consentSearchInput')
      .setValue('#consentSearchInput', testConsent.category.substring(0, 20))
      .pause(1000);

    // Now click on the consent to edit
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#consentsTable tbody tr');
        console.log('Looking for consent with timestamp:', timestamp);
        console.log('Found', rows.length, 'rows in table');
        
        for (let i = 0; i < rows.length; i++) {
          console.log('Row', i, ':', rows[i].textContent.substring(0, 100));
          if (rows[i].textContent.includes(timestamp)) {
            console.log('Found test consent in row', i);
            rows[i].click();
            return { success: true, found: true, rowIndex: i };
          }
        }
        
        console.error('Test consent not found in table! Table only contains Synthea consents.');
        return { success: false, found: false, error: 'Test consent not in table' };
      }, [timestamp.toString()], function(result) {
        if (!result.value.found) {
          browser.assert.fail('Test consent not found in table - cannot update. Only Synthea consents are visible.');
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
      .click('#categoryInput')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#categoryInput', updatedConsent.category)
      .click('#policyRuleInput')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#policyRuleInput', updatedConsent.policyRule)
      .click('#statusSelect')
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
      }, [updatedConsent.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', updatedConsent.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/consents/08-updated-consent-form.png');

    // Save the updated consent
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
      .url('http://localhost:3000/consents')
      .waitForElementVisible('#consentsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/consents/09-consent-updated.png');
  });

  it('08. Verify updated consent in list', browser => {
    browser
      .waitForElementVisible('#consentsTable', 5000)
      .waitForElementVisible('#consentSearchInput', 5000)
      .clearValue('#consentSearchInput')
      .setValue('#consentSearchInput', updatedConsent.category.substring(0, 20))
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
      }, [updatedConsent.category], function(result) {
        console.log('Table debug info:', result.value);
        browser.assert.ok(result.value.foundExpected, 
          `Updated consent '${updatedConsent.category}' should be in table. Found consents: ${result.value.consentCategories.join(', ')}`);
      })
      .saveScreenshot('tests/nightwatch/screenshots/consents/10-updated-consent-in-list.png');
  });

  it('09. Delete consent', browser => {
    browser
      .waitForElementVisible('#consentsPage', 5000)
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
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked consent row');
          });

        browser
          .pause(1000)
          .waitForElementVisible('#consentDetailPage', 5000);

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