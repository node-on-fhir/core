// tests/nightwatch/honeycomb/enable_autopublish/crud.immunizations.js

const testUtils = require('./shared-test-utils');
const saveNavigationHelper = require('../../helpers/save-navigation-helper');
const loginHelper = require('../../helpers/login-helper');

describe('Immunizations CRUD Operations', function() {
  const timestamp = Date.now();
  let testPatientId = null; // Store patient ID for cross-test access
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
    // Removed unnecessary pause
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .pause(1000)
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
          console.log('Test patient created with ID:', result.result);
          browser.assert.ok(true, 'Successfully created test patient');
          testPatientId = result.result; // Store for later tests

          // Set the patient in Session - use server method to fetch
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

      browser.pause(1000);

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

  it('02. Verify immunizations list page loads', browser => {
    browser
      .url('http://localhost:3000/immunizations')
      .waitForElementVisible('#immunizationsPage', 5000);

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

    browser.pause(500); // Let subscription update
    
    browser
      .pause(1000)
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

    // Re-establish patient context before clicking Add button
    browser.execute(function(testIdentifier) {
      console.log('Re-establishing patient context before creating new immunization');
      
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
          console.log('Patient found:', patient._id, patient.name?.[0]?.text);
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          return { success: true, patientId: patient._id };
        }
      }
      return { success: false };
    }, ['test-patient-' + timestamp]);

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
      .assert.elementPresent('#vaccineCode')
      .assert.elementPresent('#vaccineDisplay')
      .assert.elementPresent('#occurrenceDateTime')
      .assert.elementPresent('#primarySource')
      .assert.elementPresent('#lotNumber')
      .assert.elementPresent('#expirationDate')
      .assert.elementPresent('#siteSelect')
      .assert.elementPresent('#routeSelect')
      .assert.elementPresent('#doseQuantityValue')
      .assert.elementPresent('#doseQuantityUnit')
      .assert.elementPresent('#performerDisplay')
      .assert.elementPresent('#subjectDisplay')
      .assert.elementPresent('#noteText')
      .pause(1000)
      .execute(function() {
        const patientField = document.querySelector('#subjectDisplay');
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

    // Fill in patient field if empty
    browser
      .pause(500)
      .execute(function() {
        const patientField = document.querySelector('#subjectDisplay');
        const selectedPatient = Session.get('selectedPatient');
        
        if (patientField && selectedPatient) {
          let patientName = '';
          if (selectedPatient.name) {
            if (typeof selectedPatient.name === 'string') {
              patientName = selectedPatient.name;
            } else if (Array.isArray(selectedPatient.name) && selectedPatient.name[0]) {
              patientName = selectedPatient.name[0].text || 
                          `${selectedPatient.name[0].given?.join(' ') || ''} ${selectedPatient.name[0].family || ''}`.trim();
            }
          }
          
          if (patientName && !patientField.value) {
            patientField.value = patientName;
            patientField.dispatchEvent(new Event('input', { bubbles: true }));
            patientField.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Set patient field to:', patientName);
            return { success: true, patientName: patientName };
          }
          return { success: false, reason: 'Patient field already has value or no patient name', currentValue: patientField.value };
        }
        return { success: false, reason: 'No patient field or no selected patient' };
      }, [], function(result) {
        console.log('Patient field setup result:', result.value);
      });

    // Check if form is in edit mode
    browser.execute(function() {
      const vaccineCodeField = document.querySelector('#vaccineCode');
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
      .clearValue('#vaccineCode')
      .setValue('#vaccineCode', testImmunization.vaccineCodeCode)
      .clearValue('#vaccineDisplay')
      .setValue('#vaccineDisplay', testImmunization.vaccineCodeDisplay)
      .clearValue('#occurrenceDateTime')
      .setValue('#occurrenceDateTime', testImmunization.occurrenceDateTime)
      .clearValue('#lotNumber')
      .setValue('#lotNumber', testImmunization.lotNumber)
      .clearValue('#expirationDate')
      .setValue('#expirationDate', testImmunization.expirationDate)
      .clearValue('#doseQuantityValue')
      .setValue('#doseQuantityValue', testImmunization.doseQuantity)
      .clearValue('#doseQuantityUnit')
      .setValue('#doseQuantityUnit', testImmunization.doseUnit)
      .clearValue('#performerDisplay')
      .setValue('#performerDisplay', testImmunization.performer)
      .clearValue('#noteText')
      .setValue('#noteText', testImmunization.notes)
      .pause(500);

    // Handle checkbox separately
    browser.execute(function(isPrimarySource) {
      const primarySourceCheckbox = document.querySelector('#primarySource');
      if (primarySourceCheckbox && primarySourceCheckbox.checked !== isPrimarySource) {
        primarySourceCheckbox.click();
        return true;
      }
      return false;
    }, [testImmunization.primarySource], function(result) {
      console.log('Primary source checkbox set:', result.value);
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

    // Handle site Select
    browser.execute(function(site) {
      console.log('Trying to set site to:', site);
      const siteSelect = document.querySelector('#siteSelect');
      if (siteSelect) {
        siteSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          let found = false;
          for (let option of options) {
            if (option.getAttribute('data-value') === site || 
                option.textContent.includes(site)) {
              console.log('Clicking site option:', option.textContent);
              option.click();
              found = true;
              break;
            }
          }
          if (!found) {
            console.error('Could not find option for site:', site);
          }
        }, 300);
      }
    }, [testImmunization.siteCode]);

    // Handle route Select
    browser.execute(function(route) {
      console.log('Trying to set route to:', route);
      const routeSelect = document.querySelector('#routeSelect');
      if (routeSelect) {
        routeSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          let found = false;
          for (let option of options) {
            if (option.getAttribute('data-value') === route || 
                option.textContent.includes(route)) {
              console.log('Clicking route option:', option.textContent);
              option.click();
              found = true;
              break;
            }
          }
          if (!found) {
            console.error('Could not find option for route:', route);
          }
        }, 300);
      }
    }, [testImmunization.routeCode]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/04-filled-immunization-form.png');

    // Log form values before save
    browser.execute(function() {
      const patientField = document.querySelector('#subjectDisplay');
      const vaccineCodeField = document.querySelector('#vaccineCode');
      const lotNumberField = document.querySelector('#lotNumber');
      const performerField = document.querySelector('#performerDisplay');
      
      console.log('=== Form values before save ===');
      console.log('Patient display:', patientField ? patientField.value : 'not found');
      console.log('Vaccine code:', vaccineCodeField ? vaccineCodeField.value : 'not found');
      console.log('Lot number:', lotNumberField ? lotNumberField.value : 'not found');
      console.log('Performer:', performerField ? performerField.value : 'not found');
      
      const statusSelect = document.querySelector('#statusSelect');
      const primarySourceCheckbox = document.querySelector('#primarySource');
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
    // Use save-navigation-helper to handle save and navigation
    saveNavigationHelper.saveAndNavigate(
      browser, 
      'immunizations', 
      '#immunizationsPage',
      function() {
        browser.saveScreenshot('tests/nightwatch/screenshots/immunizations/05-immunization-saved.png');
      }
    );
  });

  it('05. Verify new immunization appears in list', browser => {
    browser
      .waitForElementVisible('#immunizationsPage', 5000)
      .pause(1000);
    
    // Scroll to top to ensure search input is visible
    browser.execute(function() {
      window.scrollTo(0, 0);
    });
    
    browser.pause(500);
    
    // Re-establish patient context after navigation
    browser.execute(function(testIdentifier) {
      console.log('Re-establishing patient context in test 05');
      
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
          console.log('Patient found:', patient._id, patient.name?.[0]?.text);
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          return { success: true, patientId: patient._id, patientName: patient.name?.[0]?.text };
        }
      }
      return { success: false };
    }, ['test-patient-' + timestamp]);
    
    // Search by patient name as requested
    browser
      .waitForElementVisible('#immunizationSearchInput', 5000)
      .clearValue('#immunizationSearchInput')
      .setValue('#immunizationSearchInput', 'John Doe')
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
    // Navigate to immunizations page (preserves Session)
    testUtils.navigateUrl(browser, '/immunizations');
    browser
      .waitForElementVisible('#immunizationsPage', 5000)
      .pause(1000);

    // Scroll to top to ensure search input is visible
    browser.execute(function() {
      window.scrollTo(0, 0);
    });

    browser.pause(500);

    // Re-establish patient context using server-side fetch (handles subscription limits)
    browser.executeAsync(function(patientId, done) {
      console.log('[Test 06] Re-establishing patient context with ID:', patientId);

      if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
        Meteor.call('patients.findOne', patientId, function(error, patient) {
          if (error) {
            console.error('[Test 06] Error fetching patient:', error);
            done({ success: false, error: error.message });
          } else if (patient) {
            Session.set('selectedPatientId', patient._id);
            Session.set('selectedPatient', patient);
            console.log('[Test 06] Re-established patient context:', patient._id, patient.name?.[0]?.text);
            done({ success: true, patientId: patient._id });
          } else {
            console.error('[Test 06] Patient not found:', patientId);
            done({ success: false, error: 'Patient not found' });
          }
        });
      } else {
        done({ success: false, error: 'Meteor or Session not available' });
      }
    }, [testPatientId], function(result) {
      if (result.value && result.value.success) {
        console.log('[Test 06] Successfully re-established patient context');
      } else {
        console.error('[Test 06] Failed to re-establish patient context:', result.value?.error);
      }
    });

    browser.pause(500); // Let subscription update

    // Search for our specific immunization by lot number
    browser
      .waitForElementVisible('#immunizationSearchInput', 5000)
      .clearValue('#immunizationSearchInput')
      .setValue('#immunizationSearchInput', `LOT-${timestamp}`)
      .pause(1500); // Give time for search results to update

    // Check if we have the table after searching
    browser.execute(function() {
      const hasTable = document.querySelector('#immunizationsTable') !== null;
      const rows = hasTable ? document.querySelectorAll('#immunizationsTable tbody tr') : [];
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageContent = document.querySelector('#immunizationsPage')?.textContent || '';
      
      return {
        hasTable: hasTable,
        rowCount: rows.length,
        firstRowText: rows.length > 0 ? rows[0].textContent : '',
        hasNoDataCard: hasNoDataCard,
        hasNoData: pageContent.includes('No Data')
      };
    }, [], function(result) {
      console.log('Table state after search:', result.value);
      
      if (!result.value.hasTable && result.value.hasNoData) {
        // If search resulted in no data, clear the search to show all immunizations
        browser
          .clearValue('#immunizationSearchInput')
          .pause(1000);
      }
    });

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
      .assert.valueContains('#vaccineDisplay', testImmunization.vaccineCodeDisplay)
      .assert.valueContains('#lotNumber', testImmunization.lotNumber)
      // Note: performer field is auto-populated with current user (janedoe)
      .assert.valueContains('#performerDisplay', 'janedoe')  // Auto-populated with current user
      .execute(function() {
        const statusInput = document.querySelector('#statusSelect');
        const primarySourceCheckbox = document.querySelector('#primarySource');
        
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
          notes: document.querySelector('#noteText').value,
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

    // Navigate back to immunizations list using client-side routing
    testUtils.navigateUrl(browser, '/immunizations');

    browser
      .waitForElementVisible('#immunizationsPage', 10000);
  });

  it('07. Update existing immunization', browser => {
    // Re-establish patient context using server-side fetch
    browser.executeAsync(function(patientId, done) {
      console.log('[Test 07] Re-establishing patient context with ID:', patientId);

      if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
        Meteor.call('patients.findOne', patientId, function(error, patient) {
          if (error) {
            console.error('[Test 07] Error fetching patient:', error);
            done({ success: false, error: error.message });
          } else if (patient) {
            Session.set('selectedPatientId', patient._id);
            Session.set('selectedPatient', patient);
            console.log('[Test 07] Re-established patient context:', patient._id);
            done({ success: true });
          } else {
            console.error('[Test 07] Patient not found:', patientId);
            done({ success: false, error: 'Patient not found' });
          }
        });
      } else {
        done({ success: false, error: 'Meteor or Session not available' });
      }
    }, [testPatientId]);

    browser
      .pause(1000)
      .waitForElementVisible('#immunizationsTable', 10000)
      .pause(1000);

    // Scroll to top to ensure search input is visible
    browser.execute(function() {
      window.scrollTo(0, 0);
    });

    browser.pause(500);

    // Search by patient name
    browser
      .waitForElementVisible('#immunizationSearchInput', 5000)
      .clearValue('#immunizationSearchInput')
      .setValue('#immunizationSearchInput', 'John Doe')
      .pause(1500);

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
      .clearValue('#vaccineDisplay')
      .setValue('#vaccineDisplay', updatedImmunization.vaccineCode)
      .pause(100)
      .clearValue('#lotNumber')
      .setValue('#lotNumber', updatedImmunization.lotNumber)
      .pause(100)
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
      .pause(300);
    
    // Scroll to make notes field visible before clicking
    browser.execute(function() {
      const noteField = document.querySelector('#noteText');
      if (noteField) {
        noteField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    browser
      .pause(500)
      .clearValue('#noteText')
      .setValue('#noteText', updatedImmunization.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/08-updated-immunization-form.png');

    // Save the updated immunization - look for "Update" or "Save"
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Save') || button.textContent.includes('Update')) {
            console.log('Found save/update button:', button.textContent);
            button.click();
            return true;
          }
        }
        console.error('No Save or Update button found');
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Save/Update button');
      });

    browser.pause(1000);

    // Navigate back using client-side routing
    testUtils.navigateUrl(browser, '/immunizations');

    browser
      .waitForElementVisible('#immunizationsTable', 10000)
      .saveScreenshot('tests/nightwatch/screenshots/immunizations/09-immunization-updated.png');
  });

  it('08. Verify updated immunization in list', browser => {
    browser
      .waitForElementVisible('#immunizationsTable', 5000)
      .pause(500);
    
    // Scroll to top to ensure search input is visible
    browser.execute(function() {
      window.scrollTo(0, 0);
    });
    
    browser.pause(500);
    
    // Re-establish patient context after navigation
    browser.execute(function(testIdentifier) {
      console.log('Re-establishing patient context in test 08');
      
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
          console.log('Patient found:', patient._id, patient.name?.[0]?.text);
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          return { success: true, patientId: patient._id, patientName: patient.name?.[0]?.text };
        }
      }
      return { success: false };
    }, ['test-patient-' + timestamp]);
    
    // Search by patient name
    browser
      .waitForElementVisible('#immunizationSearchInput', 5000)
      .clearValue('#immunizationSearchInput')
      .setValue('#immunizationSearchInput', 'John Doe')
      .pause(1000)
      .execute(function(updatedLotNumber, expectedStatus) {
        const table = document.querySelector('#immunizationsTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const immunizationData = [];
        let foundUpdated = false;
        
        for (let row of rows) {
          const rowText = row.textContent;
          // Check if this row contains our updated lot number
          if (rowText.includes(updatedLotNumber)) {
            foundUpdated = true;
            console.log('Found row with updated lot number:', rowText);
          }
          
          // Also check for status change
          if (rowText.includes('entered-in-error')) {
            console.log('Found row with updated status:', rowText);
          }
          
          immunizationData.push(rowText);
        }
        
        return {
          rowCount: rows.length,
          immunizationData: immunizationData,
          tableText: table ? table.textContent : 'Table not found',
          foundUpdatedLotNumber: foundUpdated,
          foundUpdatedStatus: table ? table.textContent.includes(expectedStatus) : false
        };
      }, [updatedImmunization.lotNumber, updatedImmunization.status], function(result) {
        console.log('Table debug info:', result.value);
        // Check for either the updated lot number or updated status
        const updateFound = result.value.foundUpdatedLotNumber || result.value.foundUpdatedStatus;
        browser.assert.ok(updateFound, 
          `Updated immunization with lot number '${updatedImmunization.lotNumber}' or status '${updatedImmunization.status}' should be in table`);
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

        // DO NOT enter edit mode - delete button is only visible in view mode
        // First check what state we're in
        browser.execute(function() {
          const buttons = document.querySelectorAll('button');
          const buttonTexts = [];
          buttons.forEach(button => {
            buttonTexts.push(button.textContent.trim());
          });
          
          // Check if we're in edit mode by looking for specific buttons
          const hasEditButton = buttonTexts.some(text => text.includes('Edit'));
          const hasSaveButton = buttonTexts.some(text => text.includes('Save') || text.includes('Update'));
          
          // Also check the immunization ID from the URL
          const currentUrl = window.location.pathname;
          const isNewImmunization = currentUrl.includes('/new');
          
          return {
            buttonTexts: buttonTexts,
            hasEditButton: hasEditButton,
            hasSaveButton: hasSaveButton,
            isNewImmunization: isNewImmunization,
            currentUrl: currentUrl
          };
        }, [], function(result) {
          console.log('Current state:', result.value);
        });
        
        // Click Delete button - simplified approach without callback
        console.log('TEST 09: Using simplified delete approach');
        browser
          .pause(500)
          .execute(function() {
            console.log('DELETE: Looking for Delete button');
            const buttons = document.querySelectorAll('button');
            console.log('DELETE: Found', buttons.length, 'buttons');
            for (let i = 0; i < buttons.length; i++) {
              const button = buttons[i];
              const text = button.textContent;
              console.log(`DELETE: Button ${i}: "${text}"`);
              if (text && text.includes('Delete')) {
                console.log('DELETE: Found Delete button, clicking it');
                button.click();
                return true;
              }
            }
            console.log('DELETE: Delete button not found');
            return false;
          })
          .pause(500) // Wait for alert to appear
          .acceptAlert() // Accept the confirmation dialog
          .pause(1000); // Wait for deletion to complete

        browser
          .pause(1000)
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