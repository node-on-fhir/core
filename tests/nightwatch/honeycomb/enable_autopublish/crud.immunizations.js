// tests/nightwatch/honeycomb/enable_autopublish/crud.immunizations.js

const testUtils = require('./shared-test-utils');

describe('Immunizations CRUD Operations', function() {
  const timestamp = Date.now();
  const testImmunization = {
    status: 'completed',
    vaccineCode: `COVID-19 Vaccine ${timestamp}`,
    vaccineCodeSystem: 'http://hl7.org/fhir/sid/cvx',
    vaccineCodeCode: '208',
    vaccineCodeDisplay: 'COVID-19, mRNA, LNP-S, PF, 30 mcg/0.3 mL dose',
    occurrenceDateTime: new Date().toISOString().split('T')[0],
    primarySource: true,
    lotNumber: `LOT-${timestamp}`,
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
    site: 'Left arm',
    siteCode: 'LA',
    route: 'Intramuscular',
    routeCode: 'IM',
    doseQuantity: '0.3',
    doseUnit: 'mL',
    performer: 'Dr. Jane Smith',
    performerReference: `Practitioner/${timestamp}`,
    patientName: 'John Doe',
    notes: `Test immunization created at ${timestamp}`
  };

  const updatedImmunization = {
    status: 'entered-in-error',
    vaccineCode: `Updated COVID-19 Vaccine ${timestamp}`,
    lotNumber: `UPDATED-LOT-${timestamp}`,
    notes: `Test immunization updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting Immunizations CRUD test suite...');
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
        if (typeof Immunizations !== 'undefined') {
          const testImmunizations = Immunizations.find({ 
            $or: [
              { 'vaccineCode.text': { $regex: '.*COVID-19 Vaccine.*' } },
              { 'lotNumber': { $regex: '.*LOT-.*' } },
              { 'performer.0.actor.display': { $regex: 'Dr\\..*' } }
            ]
          }).fetch();
          testImmunizations.forEach(function(immunization) {
            Immunizations.remove({ _id: immunization._id });
          });
          console.log('Cleared', testImmunizations.length, 'test immunizations');
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

  it('02. Verify immunizations list page loads', browser => {
    browser
      .url('http://localhost:3000/immunizations')
      .waitForElementVisible('#immunizationsPage', 5000)
      .pause(2000)
      .execute(function() {
        const hasTable = document.querySelector('#immunizationsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#immunizationsPage') && 
                             document.querySelector('#immunizationsPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either immunizations table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/02-immunizations-list.png');
  });

  it('03. Navigate to new immunization form', browser => {
    browser
      .waitForElementVisible('#immunizationsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Immunization') || 
              button.textContent.includes('Add Your First Immunization')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Immunization button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#immunizationDetailPage', 5000)
      .assert.elementPresent('#statusSelect')
      .assert.elementPresent('#vaccineCodeInput')
      .assert.elementPresent('#vaccineCodeDisplayInput')
      .assert.elementPresent('#occurrenceDateTimeInput')
      .assert.elementPresent('#primarySourceCheckbox')
      .assert.elementPresent('#lotNumberInput')
      .assert.elementPresent('#expirationDateInput')
      .assert.elementPresent('#siteInput')
      .assert.elementPresent('#routeInput')
      .assert.elementPresent('#doseQuantityInput')
      .assert.elementPresent('#doseUnitInput')
      .assert.elementPresent('#performerInput')
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
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/03-new-immunization-form.png');
  });

  it('04. Create new immunization', browser => {
    browser
      .waitForElementVisible('#immunizationDetailPage', 5000)
      .pause(500);

    // Check if we're on the new immunization page
    browser.assert.urlContains('/immunizations/new');

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
      const vaccineCodeField = document.querySelector('#vaccineCodeInput');
      if (vaccineCodeField && vaccineCodeField.disabled) {
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
      .clearValue('#vaccineCodeInput')
      .setValue('#vaccineCodeInput', testImmunization.vaccineCode)
      .clearValue('#vaccineCodeDisplayInput')
      .setValue('#vaccineCodeDisplayInput', testImmunization.vaccineCodeDisplay)
      .clearValue('#occurrenceDateTimeInput')
      .setValue('#occurrenceDateTimeInput', testImmunization.occurrenceDateTime)
      .clearValue('#lotNumberInput')
      .setValue('#lotNumberInput', testImmunization.lotNumber)
      .clearValue('#expirationDateInput')
      .setValue('#expirationDateInput', testImmunization.expirationDate)
      .clearValue('#siteInput')
      .setValue('#siteInput', testImmunization.site)
      .clearValue('#routeInput')
      .setValue('#routeInput', testImmunization.route)
      .clearValue('#doseQuantityInput')
      .setValue('#doseQuantityInput', testImmunization.doseQuantity)
      .clearValue('#doseUnitInput')
      .setValue('#doseUnitInput', testImmunization.doseUnit)
      .clearValue('#performerInput')
      .setValue('#performerInput', testImmunization.performer)
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', testImmunization.notes)
      .pause(500);

    // Also use execute method as fallback
    browser.execute(function(immunization) {
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
      
      results.vaccineCode = setFieldValue('#vaccineCodeInput', immunization.vaccineCode);
      results.vaccineCodeDisplay = setFieldValue('#vaccineCodeDisplayInput', immunization.vaccineCodeDisplay);
      results.lotNumber = setFieldValue('#lotNumberInput', immunization.lotNumber);
      results.site = setFieldValue('#siteInput', immunization.site);
      results.route = setFieldValue('#routeInput', immunization.route);
      results.doseQuantity = setFieldValue('#doseQuantityInput', immunization.doseQuantity);
      results.doseUnit = setFieldValue('#doseUnitInput', immunization.doseUnit);
      results.performer = setFieldValue('#performerInput', immunization.performer);
      results.notes = setFieldValue('#notesTextarea', immunization.notes);
      
      // Handle checkbox
      const primarySourceCheckbox = document.querySelector('#primarySourceCheckbox');
      if (primarySourceCheckbox && primarySourceCheckbox.checked !== immunization.primarySource) {
        primarySourceCheckbox.click();
        results.primarySource = true;
      }
      
      return { filled: true, results: results };
    }, [testImmunization], function(result) {
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
    }, [testImmunization.status]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/04-filled-immunization-form.png');

    // Log form values before save
    browser.execute(function() {
      const patientField = document.querySelector('#patientDisplay');
      const vaccineCodeField = document.querySelector('#vaccineCodeInput');
      const lotNumberField = document.querySelector('#lotNumberInput');
      const performerField = document.querySelector('#performerInput');
      
      console.log('=== Form values before save ===');
      console.log('Patient display:', patientField ? patientField.value : 'not found');
      console.log('Vaccine code:', vaccineCodeField ? vaccineCodeField.value : 'not found');
      console.log('Lot number:', lotNumberField ? lotNumberField.value : 'not found');
      console.log('Performer:', performerField ? performerField.value : 'not found');
      
      const statusSelect = document.querySelector('#statusSelect');
      const primarySourceCheckbox = document.querySelector('#primarySourceCheckbox');
      console.log('Status value:', statusSelect ? statusSelect.value : 'not found');
      console.log('Primary source checked:', primarySourceCheckbox ? primarySourceCheckbox.checked : 'not found');
      
      // Also check what's actually in the database
      if (typeof Immunizations !== 'undefined' && window.testTimestamp) {
        const savedImmunizations = Immunizations.find().fetch();
        const testImmunization = savedImmunizations.find(i => i.vaccineCode && 
          i.vaccineCode.text && 
          i.vaccineCode.text.includes(window.testTimestamp));
        if (testImmunization) {
          console.log('Found test immunization in database:', testImmunization);
        } else {
          console.log('Test immunization not found in database');
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

    // Save the immunization
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
    
    // Check if we're back on the immunizations list page
    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#immunizationsTable') !== null;
      const hasImmunizationsPage = document.querySelector('#immunizationsPage') !== null;
      const hasDetailPage = document.querySelector('#immunizationDetailPage') !== null;
      
      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });
      
      const consoleErrors = window.consoleErrors || [];
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasImmunizationsPage: hasImmunizationsPage,
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
      if (result.value.url === '/immunizations/new') {
        console.log('Still on new immunization page - save may have failed silently');
      }
    });
    
    browser
      .waitForElementVisible('#immunizationsPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/05-immunization-saved.png');
  });

  it('05. Verify new immunization appears in list', browser => {
    browser
      .waitForElementVisible('#immunizationsPage', 5000)
      .pause(1000);
    
    // Search for our specific test immunization since there may be many Synthea immunizations
    browser
      .waitForElementVisible('#immunizationSearchInput', 5000)
      .clearValue('#immunizationSearchInput')
      .setValue('#immunizationSearchInput', testImmunization.vaccineCode.substring(0, 20))
      .pause(1000);
    
    browser.execute(function() {
      const hasTable = document.querySelector('#immunizationsTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageText = document.querySelector('#immunizationsPage')?.textContent || '';
      
      let totalImmunizations = 0;
      let selectedPatientId = null;
      let selectedPatient = null;
      
      if (typeof Immunizations !== 'undefined') {
        totalImmunizations = Immunizations.find({}).count();
        console.log('Total immunizations in database:', totalImmunizations);
        
        const testImmunization = Immunizations.findOne({
          'vaccineCode.text': { $regex: 'COVID-19 Vaccine.*' }
        });
        console.log('Found test immunization:', testImmunization);
        
        if (testImmunization) {
          console.log('Test immunization patient:', JSON.stringify(testImmunization.patient, null, 2));
          console.log('Test immunization patient reference:', testImmunization.patient?.reference);
          console.log('Test immunization patient display:', testImmunization.patient?.display);
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
        totalImmunizations: totalImmunizations,
        hasSelectedPatient: !!selectedPatientId,
        selectedPatientId: selectedPatientId
      };
    }, [], function(result) {
      console.log('Page state:', result.value);
      
      if (result.value.totalImmunizations > 0 && (result.value.hasNoData || result.value.hasNoDataCard)) {
        browser.assert.fail(`Immunizations exist (${result.value.totalImmunizations}) but are filtered out - patient reference may not be set correctly`);
      } else if (result.value.hasNoData || result.value.hasNoDataCard) {
        browser.assert.fail('No immunizations found - save operation may have failed');
      }
    });
    
    browser.execute(function() {
      const table = document.querySelector('#immunizationsTable');
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
        browser.assert.ok(true, `Found ${result.value.rowCount} immunization(s) in table`);
      } else {
        browser.assert.fail('No immunizations table found or table is empty');
      }
    });
    
    browser
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/06-immunization-in-list.png');
  });

  it('06. View immunization details', browser => {
    browser
      .waitForElementVisible('#immunizationsPage', 5000)
      .pause(1000);

    // Search for our specific immunization
    browser
      .waitForElementVisible('#immunizationSearchInput', 5000)
      .clearValue('#immunizationSearchInput')
      .setValue('#immunizationSearchInput', testImmunization.vaccineCode.substring(0, 20))
      .pause(1000);

    // Now click on the immunization row
    browser
      .waitForElementVisible('#immunizationsTable', 5000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#immunizationsTable tbody tr');
        console.log('Found', rows.length, 'rows in immunizations table');
        
        // Look for our test immunization
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
        browser.assert.equal(result.value.clicked, true, 'Found and clicked immunization row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#immunizationDetailPage', 5000)
      .assert.valueContains('#vaccineCodeInput', testImmunization.vaccineCode)
      .assert.valueContains('#lotNumberInput', testImmunization.lotNumber)
      .assert.valueContains('#performerInput', testImmunization.performer)
      .execute(function() {
        const statusInput = document.querySelector('#statusSelect');
        const primarySourceCheckbox = document.querySelector('#primarySourceCheckbox');
        
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
          primarySource: primarySourceCheckbox ? primarySourceCheckbox.checked : null,
          notes: document.querySelector('#notesTextarea').value,
          statusDisplay: getSelectDisplay('#statusSelect') || 
                        document.querySelector('[aria-labelledby*="status"]')?.textContent || 
                        document.querySelector('#statusSelect')?.parentElement?.textContent
        };
      }, [], function(result) {
        console.log('View immunization details - form values:', result.value);
        console.log('Expected status:', testImmunization.status);
        console.log('Actual status value:', result.value.status);
        console.log('Status display:', result.value.statusDisplay);
        
        const statusOk = result.value.status === testImmunization.status || 
                       (result.value.statusDisplay && result.value.statusDisplay.includes('Completed'));
        
        browser.assert.ok(statusOk, 'Status matches');
        browser.assert.ok(result.value.primarySource === testImmunization.primarySource, 'Primary source matches');
        browser.assert.ok(result.value.notes.includes(testImmunization.notes), 'Notes contain expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/07-view-immunization-details.png');
    
    // Navigate back to immunizations list
    browser
      .url('http://localhost:3000/immunizations')
      .waitForElementVisible('#immunizationsPage', 5000);
  });

  it('07. Update existing immunization', browser => {
    browser
      .waitForElementVisible('#immunizationsTable', 5000)
      .pause(1000);

    // Search for our specific test immunization first
    browser
      .waitForElementVisible('#immunizationSearchInput', 5000)
      .clearValue('#immunizationSearchInput')
      .setValue('#immunizationSearchInput', testImmunization.vaccineCode.substring(0, 20))
      .pause(1000);

    // Now click on the immunization to edit
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#immunizationsTable tbody tr');
        console.log('Looking for immunization with timestamp:', timestamp);
        console.log('Found', rows.length, 'rows in table');
        
        for (let i = 0; i < rows.length; i++) {
          console.log('Row', i, ':', rows[i].textContent.substring(0, 100));
          if (rows[i].textContent.includes(timestamp)) {
            console.log('Found test immunization in row', i);
            rows[i].click();
            return { success: true, found: true, rowIndex: i };
          }
        }
        
        console.error('Test immunization not found in table! Table only contains Synthea immunizations.');
        return { success: false, found: false, error: 'Test immunization not in table' };
      }, [timestamp.toString()], function(result) {
        if (!result.value.found) {
          browser.assert.fail('Test immunization not found in table - cannot update. Only Synthea immunizations are visible.');
        }
      });

    browser
      .pause(1000)
      .waitForElementVisible('#immunizationDetailPage', 5000)
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

    // Update immunization details
    browser
      .click('#vaccineCodeInput')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#vaccineCodeInput', updatedImmunization.vaccineCode)
      .click('#lotNumberInput')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#lotNumberInput', updatedImmunization.lotNumber)
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
      }, [updatedImmunization.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', updatedImmunization.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/08-updated-immunization-form.png');

    // Save the updated immunization
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
      .url('http://localhost:3000/immunizations')
      .waitForElementVisible('#immunizationsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/09-immunization-updated.png');
  });

  it('08. Verify updated immunization in list', browser => {
    browser
      .waitForElementVisible('#immunizationsTable', 5000)
      .waitForElementVisible('#immunizationSearchInput', 5000)
      .clearValue('#immunizationSearchInput')
      .setValue('#immunizationSearchInput', updatedImmunization.vaccineCode.substring(0, 20))
      .pause(1000)
      .execute(function(expectedCode) {
        const table = document.querySelector('#immunizationsTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const vaccineCodes = [];
        
        for (let row of rows) {
          const cells = row.querySelectorAll('td');
          for (let cell of cells) {
            if (cell.textContent.includes('COVID')) {
              vaccineCodes.push(cell.textContent);
            }
          }
        }
        
        return {
          rowCount: rows.length,
          vaccineCodes: vaccineCodes,
          tableText: table ? table.textContent : 'Table not found',
          foundExpected: table ? table.textContent.includes(expectedCode) : false
        };
      }, [updatedImmunization.vaccineCode], function(result) {
        console.log('Table debug info:', result.value);
        browser.assert.ok(result.value.foundExpected, 
          `Updated immunization '${updatedImmunization.vaccineCode}' should be in table. Found vaccines: ${result.value.vaccineCodes.join(', ')}`);
      })
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/10-updated-immunization-in-list.png');
  });

  it('09. Delete immunization', browser => {
    browser
      .waitForElementVisible('#immunizationsPage', 5000)
      .pause(1000);

    browser.execute(function() {
      const hasTable = document.querySelector('#immunizationsTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#immunizationsPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#immunizationsTable tbody tr');
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked immunization row');
          });

        browser
          .pause(1000)
          .waitForElementVisible('#immunizationDetailPage', 5000);

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
          .waitForElementVisible('#immunizationsPage', 5000)
          .execute(function() {
            const hasTable = document.querySelector('#immunizationsTable') !== null;
            const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                                document.querySelector('.no-data-available') !== null ||
                                document.querySelector('[id*="no-data"]') !== null ||
                                (document.querySelector('#immunizationsPage') && 
                                 document.querySelector('#immunizationsPage').textContent.includes('No Data Available'));
            return {
              hasTable: hasTable,
              hasNoDataCard: hasNoDataCard,
              hasEitherElement: hasTable || hasNoDataCard
            };
          }, [], function(result) {
            browser.assert.equal(result.value.hasEitherElement, true, 'Either immunizations table or no-data message is present after deletion');
          });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No immunizations to delete - No Data Available state is correct');
      }
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/immunizations/11-immunization-deleted.png');
  });

  it('10. Verify immunization removed from list', browser => {
    browser
      .waitForElementVisible('#immunizationsPage', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const table = document.querySelector('#immunizationsTable');
        if (table) {
          const rows = document.querySelectorAll('#immunizationsTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#immunizationsPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Immunization no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (immunization was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/12-immunization-not-in-list.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof Immunizations !== 'undefined') {
        Immunizations.find({ 
          $or: [
            { 'vaccineCode.text': { $regex: '.*COVID-19 Vaccine.*' } },
            { 'lotNumber': { $regex: '.*LOT-.*' } },
            { 'performer.0.actor.display': { $regex: 'Dr\\..*' } }
          ]
        }).fetch().forEach(function(immunization) {
          Immunizations.remove({ _id: immunization._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});