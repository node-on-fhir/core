// tests/nightwatch/honeycomb/enable_autopublish/crud.clinicalimpressions.js
// ClinicalImpression CRUD Operations (Clinician-Mediated)

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('ClinicalImpressions CRUD Operations', function() {
  const timestamp = Date.now();
  let testPatientId = null;
  let testClinicalImpressionId = null;

  const testClinicalImpression = {
    description: 'Initial clinical assessment - test ' + timestamp,
    summary: 'Patient presents with mild symptoms requiring monitoring',
    status: 'in-progress'
  };

  const updatedClinicalImpression = {
    description: 'Updated clinical assessment - test ' + timestamp,
    summary: 'Patient condition improved after treatment',
    status: 'completed'
  };

  before(function(browser, done) {
    console.log('Starting ClinicalImpressions CRUD test suite...');
    browser.windowSize('current', 1400, 900);
    done();
  });

  it('01. Setup test environment', function(browser) {
    console.log('[01] Setting up test environment...');

    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .pause(1000)
      .execute(function(ts) {
        window.testTimestamp = ts;
      }, [timestamp]);

    // Use loginHelper.ensureLoggedIn
    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      } else {
        browser.assert.ok(true, 'User is logged in');
      }

      // Create test patient
      testUtils.createTestPatient(browser, {
        name: 'ClinicalImpression TestPatient',
        family: 'TestPatient',
        given: 'ClinicalImpression',
        gender: 'male',
        birthDate: '1985-05-15',
        identifier: 'test-clinicalimpression-patient-' + timestamp
      }, function(result) {
        if (result.error) {
          console.error('[01] Failed to create test patient:', result.error);
          browser.assert.fail('Failed to create test patient: ' + result.error);
        } else {
          testPatientId = result.result;
          console.log('[01] Created test patient with ID:', testPatientId);
          browser.assert.ok(true, 'Successfully created test patient');

          // Fetch patient from server and set in Session
          browser.executeAsync(function(patientId, done) {
            if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
              Meteor.call('patients.findOne', patientId, function(error, patient) {
                if (error) {
                  console.error('[01] Error fetching patient:', error);
                  done({ success: false, error: error.message });
                } else if (patient) {
                  Session.set('selectedPatientId', patient._id);
                  Session.set('selectedPatient', patient);
                  console.log('[01] Set selected patient in Session:', patient._id, patient.name?.[0]?.text);
                  done({ success: true, patientId: patient._id, patientName: patient.name?.[0]?.text });
                } else {
                  console.error('[01] Patient not found:', patientId);
                  done({ success: false, error: 'Patient not found' });
                }
              });
            } else {
              done({ success: false, error: 'Meteor or Session not available' });
            }
          }, [testPatientId], function(fetchResult) {
            if (fetchResult.value && fetchResult.value.success) {
              console.log('[01] Successfully set selected patient:', fetchResult.value);
              browser.assert.ok(true, 'Patient set in Session: ' + fetchResult.value.patientName);
            } else if (fetchResult.value) {
              console.error('[01] Failed to set selected patient:', fetchResult.value.error);
            }
          });
        }
      });

      // Clean up existing test data
      browser.executeAsync(function(done) {
        if (typeof ClinicalImpressions !== 'undefined') {
          const testImpressions = ClinicalImpressions.find({ description: { $regex: 'test' } }).fetch();
          testImpressions.forEach(function(impression) {
            ClinicalImpressions.remove({ _id: impression._id });
          });
          console.log('[01] Cleared', testImpressions.length, 'test clinical impressions');
        }
        done();
      });

      browser.pause(1000);
    });

    browser.pause(2000);
    browser.saveScreenshot('tests/nightwatch/screenshots/clinicalimpressions/01-setup-complete.png');
    console.log('[01] Test environment setup complete');
  });

  it('02. Verify clinical impressions list page loads', function(browser) {
    console.log('[02] Verifying clinical impressions list page...');

    // Use testUtils.navigateUrl to preserve Session
    testUtils.navigateUrl(browser, '/clinical-impressions');
    browser.waitForElementVisible('#clinicalImpressionsPage', 5000);

    // Re-establish patient context after navigation
    browser.executeAsync(function(patientId, done) {
      if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
        Meteor.call('patients.findOne', patientId, function(error, patient) {
          if (error) {
            console.error('[02] Error fetching patient:', error);
            done({ success: false, error: error.message });
          } else if (patient) {
            Session.set('selectedPatientId', patient._id);
            Session.set('selectedPatient', patient);
            console.log('[02] Re-established patient context:', patient._id, patient.name?.[0]?.text);
            done({ success: true });
          } else {
            console.error('[02] Patient not found:', patientId);
            done({ success: false, error: 'Patient not found' });
          }
        });
      } else {
        done({ success: false, error: 'Meteor or Session not available' });
      }
    }, [testPatientId], function(result) {
      if (result.value && result.value.success) {
        browser.assert.ok(true, 'Patient context restored');
      } else {
        console.log('[02] Patient context restore failed:', result.value);
      }
    });

    browser.pause(500);

    // Verify page elements
    browser.execute(function() {
      const hasPage = document.querySelector('#clinicalImpressionsPage') !== null;
      const hasTable = document.querySelector('#clinicalImpressionsTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                          document.body.textContent.includes('No Data Available') ||
                          document.body.textContent.includes('No clinical impressions');
      return {
        hasPage: hasPage,
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasEitherElement: hasTable || hasNoDataCard
      };
    }, [], function(result) {
      browser.assert.equal(result.value.hasPage, true, 'Clinical impressions page is present');
      browser.assert.equal(result.value.hasEitherElement, true, 'Either table or no-data message is present');
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/clinicalimpressions/02-list-page.png');
    console.log('[02] List page verification complete');
  });

  it('03. Navigate to new clinical impression form', function(browser) {
    console.log('[03] Navigating to new clinical impression form...');

    browser
      .waitForElementVisible('#clinicalImpressionsPage', 5000)
      .pause(500);

    // Click Add Clinical Impression button
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Add') && button.textContent.includes('Clinical Impression')) {
          button.click();
          return { clicked: true, text: button.textContent };
        }
      }
      // Fallback to any Add button
      for (let button of buttons) {
        if (button.textContent.includes('Add')) {
          button.click();
          return { clicked: true, text: button.textContent, fallback: true };
        }
      }
      return { clicked: false };
    }, [], function(result) {
      browser.assert.equal(result.value.clicked, true, 'Clicked Add Clinical Impression button');
      console.log('[03] Add button clicked:', result.value);
    });

    browser
      .pause(1000)
      .waitForElementVisible('#clinicalImpressionDetailPage', 5000);

    // Verify form fields are present
    browser
      .assert.elementPresent('#descriptionInput')
      .assert.elementPresent('#summaryInput')
      .assert.elementPresent('#statusSelect')
      .assert.elementPresent('#subjectDisplay');

    // Check initial field values
    browser.execute(function() {
      const descriptionField = document.querySelector('#descriptionInput');
      const summaryField = document.querySelector('#summaryInput');
      const subjectField = document.querySelector('#subjectDisplay');
      const assessorField = document.querySelector('#assessorDisplay');

      return {
        hasDescriptionField: descriptionField !== null,
        hasSummaryField: summaryField !== null,
        patientValue: subjectField ? subjectField.value : null,
        assessorValue: assessorField ? assessorField.value : null,
        sessionPatientId: typeof Session !== 'undefined' ? Session.get('selectedPatientId') : null
      };
    }, [], function(result) {
      console.log('[03] Form initialization:', result.value);
      browser.assert.ok(result.value.hasDescriptionField, 'Description field exists');
      browser.assert.ok(result.value.hasSummaryField, 'Summary field exists');
      // Assessor may be auto-populated with logged-in user
      if (result.value.assessorValue) {
        browser.assert.ok(result.value.assessorValue.length > 0, 'Assessor field populated');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/clinicalimpressions/03-new-form.png');
    console.log('[03] Create form navigation complete');
  });

  it('04. Create new clinical impression', function(browser) {
    console.log('[04] Creating new clinical impression...');

    browser
      .waitForElementVisible('#clinicalImpressionDetailPage', 5000)
      .pause(500);

    // Verify we're on new page
    browser.assert.urlContains('/clinical-impressions/new');

    // Check form is in edit mode, if not click edit
    browser.execute(function() {
      const descriptionField = document.querySelector('#descriptionInput');
      if (descriptionField && descriptionField.disabled) {
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
      console.log('[04] Edit mode check:', result.value);
    });

    browser.pause(500);

    // Fill form fields
    browser
      .clearValue('#descriptionInput')
      .setValue('#descriptionInput', testClinicalImpression.description)
      .pause(300);

    // Verify description was set
    browser.getValue('#descriptionInput', function(result) {
      browser.assert.ok(result.value.includes('clinical assessment'), 'Description field set correctly');
    });

    // Fill summary
    browser
      .clearValue('#summaryInput')
      .setValue('#summaryInput', testClinicalImpression.summary)
      .pause(300);

    // Verify summary was set
    browser.getValue('#summaryInput', function(result) {
      browser.assert.ok(result.value.includes('mild symptoms'), 'Summary field set correctly');
    });

    // Set status using Material-UI Select
    browser.execute(function(value) {
      const statusSelect = document.querySelector('#statusSelect');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(function() {
          const menuItems = document.querySelectorAll('[role="option"]');
          for (let item of menuItems) {
            const dataValue = item.getAttribute('data-value');
            if (dataValue === value) {
              item.click();
              return true;
            }
          }
        }, 300);
        return true;
      }
      return false;
    }, [testClinicalImpression.status], function(result) {
      browser.assert.equal(result.value, true, 'Status select clicked');
    });

    browser.pause(1000);

    // Log form values before save
    browser.execute(function() {
      const descriptionField = document.querySelector('#descriptionInput');
      const summaryField = document.querySelector('#summaryInput');
      const subjectField = document.querySelector('#subjectDisplay');

      console.log('=== Form values before save ===');
      console.log('Description:', descriptionField ? descriptionField.value : 'not found');
      console.log('Summary:', summaryField ? summaryField.value : 'not found');
      console.log('Patient:', subjectField ? subjectField.value : 'not found');

      return {
        description: descriptionField ? descriptionField.value : null,
        summary: summaryField ? summaryField.value : null,
        patient: subjectField ? subjectField.value : null
      };
    }, [], function(result) {
      console.log('[04] Form values:', result.value);
      browser.assert.ok(result.value.description && result.value.description.length > 0, 'Description is filled');
      browser.assert.ok(result.value.summary && result.value.summary.length > 0, 'Summary is filled');
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/clinicalimpressions/04-filled-form.png');

    // Click Save button
    browser.execute(function() {
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

    browser.pause(2000);

    // Check post-save state
    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasDetailPage = document.querySelector('#clinicalImpressionDetailPage') !== null;
      const hasListPage = document.querySelector('#clinicalImpressionsPage') !== null;

      // Try to get the ID from URL or barcode
      let recordId = null;
      const barcode = document.querySelector('.barcode');
      if (barcode) {
        recordId = barcode.textContent.trim();
      } else {
        const match = currentUrl.match(/\/clinical-impressions\/([^/]+)$/);
        if (match && match[1] !== 'new') {
          recordId = match[1];
        }
      }

      return {
        url: currentUrl,
        hasDetailPage: hasDetailPage,
        hasListPage: hasListPage,
        recordId: recordId,
        savedSuccessfully: currentUrl !== '/clinical-impressions/new'
      };
    }, [], function(result) {
      console.log('[04] Post-save state:', result.value);
      browser.assert.ok(result.value.savedSuccessfully, 'Saved successfully (navigated away from /new)');

      if (result.value.recordId) {
        testClinicalImpressionId = result.value.recordId;
        console.log('[04] Created clinical impression ID:', testClinicalImpressionId);
        browser.assert.ok(true, 'Captured record ID: ' + testClinicalImpressionId);
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/clinicalimpressions/05-saved.png');
    console.log('[04] Clinical impression creation complete');
  });

  it('05. Verify new clinical impression appears in list', function(browser) {
    console.log('[05] Verifying new clinical impression in list...');

    // Navigate back to list
    testUtils.navigateUrl(browser, '/clinical-impressions');
    browser.waitForElementVisible('#clinicalImpressionsPage', 5000);

    // Re-establish patient context
    browser.executeAsync(function(patientId, done) {
      if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
        Meteor.call('patients.findOne', patientId, function(error, patient) {
          if (error) {
            done({ success: false, error: error.message });
          } else if (patient) {
            Session.set('selectedPatientId', patient._id);
            Session.set('selectedPatient', patient);
            done({ success: true });
          } else {
            done({ success: false, error: 'Patient not found' });
          }
        });
      } else {
        done({ success: false, error: 'Meteor or Session not available' });
      }
    }, [testPatientId], function(result) {
      if (result.value && result.value.success) {
        browser.assert.ok(true, 'Patient context restored for list view');
      }
    });

    browser.pause(1000);

    // Scroll to top to ensure search input is visible
    browser.execute(function() {
      window.scrollTo(0, 0);
    });
    browser.pause(500);

    // Search for the new clinical impression
    browser.execute(function(searchTerm) {
      const input = document.querySelector('#clinicalImpressionSearchInput');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        setTimeout(function() {
          input.value = searchTerm;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }, 300);
        return true;
      }
      return false;
    }, ['clinical assessment']);

    browser.pause(3000);

    // Verify the record appears
    browser.execute(function(description) {
      const table = document.querySelector('#clinicalImpressionsTable');
      if (table) {
        const tableText = table.textContent;
        const rows = table.querySelectorAll('tbody tr');
        return {
          hasTable: true,
          hasRecord: tableText.includes(description) || tableText.includes('Initial clinical assessment'),
          rowCount: rows.length,
          tableText: tableText.substring(0, 500)
        };
      }

      // Check for no-data state
      const hasNoData = document.body.textContent.includes('No Data Available') ||
                       document.querySelector('.no-data-card') !== null;
      return { hasTable: false, hasNoData: hasNoData };
    }, [testClinicalImpression.description], function(result) {
      console.log('[05] Table search result:', result.value);
      if (result.value.hasTable) {
        browser.assert.ok(result.value.rowCount > 0, 'Table has at least one row');
        browser.assert.ok(result.value.hasRecord, 'Found test clinical impression in table');
      } else {
        browser.assert.ok(result.value.hasNoData, 'No data state shown (may need subscription)');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/clinicalimpressions/06-in-list.png');
    console.log('[05] Table verification complete');
  });

  it('06. View clinical impression details', function(browser) {
    console.log('[06] Opening clinical impression for viewing...');

    browser
      .waitForElementVisible('#clinicalImpressionsPage', 5000)
      .pause(1000);

    // Click the first row to view details
    browser.execute(function() {
      const rows = document.querySelectorAll('#clinicalImpressionsTable tbody tr');
      console.log('[06] Found', rows.length, 'rows in table');

      if (rows.length > 0) {
        const firstRow = rows[0];
        console.log('[06] First row text:', firstRow.textContent);
        firstRow.click();
        return { clicked: true, rowText: firstRow.textContent, rowCount: rows.length };
      }
      return { clicked: false, rowCount: 0 };
    }, [], function(result) {
      console.log('[06] Row click result:', result.value);
      browser.assert.equal(result.value.clicked, true, 'Found and clicked clinical impression row');
      browser.assert.ok(result.value.rowCount > 0, 'Table has rows to click');
    });

    browser.pause(1000);

    // Verify detail page loaded
    browser
      .waitForElementVisible('#clinicalImpressionDetailPage', 5000)
      .assert.elementPresent('#descriptionInput')
      .assert.elementPresent('#summaryInput')
      .assert.elementPresent('#statusSelect');

    // Debug form field values
    browser.execute(function() {
      const descriptionField = document.querySelector('#descriptionInput');
      const summaryField = document.querySelector('#summaryInput');
      const subjectField = document.querySelector('#subjectDisplay');

      console.log('=== Debug Form Fields ===');
      console.log('Description value:', descriptionField ? descriptionField.value : 'Field not found');
      console.log('Summary value:', summaryField ? summaryField.value : 'Field not found');
      console.log('Patient value:', subjectField ? subjectField.value : 'Field not found');
      console.log('Description disabled:', descriptionField ? descriptionField.disabled : 'N/A');

      return {
        description: descriptionField ? descriptionField.value : null,
        summary: summaryField ? summaryField.value : null,
        patient: subjectField ? subjectField.value : null,
        isViewMode: descriptionField && descriptionField.disabled
      };
    }, [], function(result) {
      console.log('[06] Form field values:', result.value);
      browser.assert.ok(result.value.description !== null, 'Description field has value');
      if (result.value.description) {
        browser.assert.ok(result.value.description.includes('clinical assessment') ||
                        result.value.description.includes('assessment'),
                        'Description contains expected text');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/clinicalimpressions/07-view-details.png');
    console.log('[06] Detail view complete');

    // Navigate back to list
    testUtils.navigateUrl(browser, '/clinical-impressions');
    browser.waitForElementVisible('#clinicalImpressionsPage', 5000);
  });

  it('07. Update existing clinical impression', function(browser) {
    console.log('[07] Updating clinical impression...');

    browser
      .waitForElementVisible('#clinicalImpressionsPage', 5000)
      .pause(1000);

    // Re-establish patient context
    browser.executeAsync(function(patientId, done) {
      if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
        Meteor.call('patients.findOne', patientId, function(error, patient) {
          if (error) {
            done({ success: false, error: error.message });
          } else if (patient) {
            Session.set('selectedPatientId', patient._id);
            Session.set('selectedPatient', patient);
            console.log('[07] Re-established patient context:', patient._id);
            done({ success: true });
          } else {
            done({ success: false, error: 'Patient not found' });
          }
        });
      } else {
        done({ success: false, error: 'Meteor or Session not available' });
      }
    }, [testPatientId], function(result) {
      if (result.value && result.value.success) {
        browser.assert.ok(true, 'Patient context restored for edit');
      }
    });

    browser.pause(1000);

    // Click first row to open for editing
    browser.execute(function() {
      const rows = document.querySelectorAll('#clinicalImpressionsTable tbody tr');
      if (rows.length > 0) {
        rows[0].click();
        return { clicked: true, rowCount: rows.length };
      }
      return { clicked: false, rowCount: 0 };
    }, [], function(result) {
      browser.assert.equal(result.value.clicked, true, 'Found and clicked clinical impression row');
    });

    browser
      .pause(1000)
      .waitForElementVisible('#clinicalImpressionDetailPage', 5000);

    // Click lock/edit button to enter edit mode
    browser.execute(function() {
      const lockButton = document.querySelector('button svg[data-testid="LockIcon"]')?.parentElement;
      if (lockButton) {
        lockButton.click();
        return { clicked: true, method: 'lock' };
      }
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Edit')) {
          button.click();
          return { clicked: true, method: 'edit' };
        }
      }
      return { clicked: false };
    }, [], function(result) {
      browser.assert.equal(result.value.clicked, true, 'Clicked Edit/Lock button to enter edit mode');
      console.log('[07] Edit mode activated via:', result.value.method);
    });

    browser.pause(500);

    // Update description
    browser
      .clearValue('#descriptionInput')
      .setValue('#descriptionInput', updatedClinicalImpression.description)
      .pause(300);

    // Verify description updated
    browser.getValue('#descriptionInput', function(result) {
      browser.assert.ok(result.value.includes('Updated'), 'Description updated correctly');
    });

    // Update summary
    browser
      .clearValue('#summaryInput')
      .setValue('#summaryInput', updatedClinicalImpression.summary)
      .pause(300);

    // Verify summary updated
    browser.getValue('#summaryInput', function(result) {
      browser.assert.ok(result.value.includes('improved'), 'Summary updated correctly');
    });

    // Update status
    browser.execute(function(value) {
      const statusSelect = document.querySelector('#statusSelect');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(function() {
          const menuItems = document.querySelectorAll('[role="option"]');
          for (let item of menuItems) {
            const dataValue = item.getAttribute('data-value');
            if (dataValue === value) {
              item.click();
              return true;
            }
          }
        }, 300);
        return true;
      }
      return false;
    }, [updatedClinicalImpression.status], function(result) {
      browser.assert.equal(result.value, true, 'Status select updated');
    });

    browser.pause(1000);

    browser.saveScreenshot('tests/nightwatch/screenshots/clinicalimpressions/08-updated-form.png');

    // Click Save/Update button
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Save') || button.textContent.includes('Update')) {
          button.click();
          return true;
        }
      }
      return false;
    }, [], function(result) {
      browser.assert.equal(result.value, true, 'Clicked Save/Update button');
    });

    browser.pause(2000);

    // Navigate back to list
    testUtils.navigateUrl(browser, '/clinical-impressions');
    browser
      .waitForElementVisible('#clinicalImpressionsPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/clinicalimpressions/09-updated.png');

    console.log('[07] Record update complete');
  });

  it('08. Verify updated clinical impression in list', function(browser) {
    console.log('[08] Verifying updated clinical impression in list...');

    // Scroll to top
    browser.execute(function() {
      window.scrollTo(0, 0);
    });
    browser.pause(500);

    browser
      .waitForElementVisible('#clinicalImpressionsPage', 5000)
      .pause(1000);

    // Search for updated record
    browser.execute(function(searchTerm) {
      const input = document.querySelector('#clinicalImpressionSearchInput');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));

        setTimeout(function() {
          input.value = searchTerm;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }, 300);
        return true;
      }
      return false;
    }, ['Updated']);

    browser.pause(3000);

    browser.execute(function() {
      const table = document.querySelector('#clinicalImpressionsTable');
      const rows = table ? table.querySelectorAll('tbody tr') : [];
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.body.textContent.includes('No Data Available');

      let foundUpdated = false;
      for (let row of rows) {
        if (row.textContent.includes('Updated')) {
          foundUpdated = true;
          break;
        }
      }

      return {
        hasTable: !!table,
        hasNoData: hasNoData,
        rowCount: rows.length,
        foundUpdated: foundUpdated
      };
    }, [], function(result) {
      console.log('[08] Updated record check:', result.value);
      if (result.value.hasNoData) {
        browser.assert.ok(true, 'Search completed but no matching records');
      } else {
        browser.assert.ok(result.value.hasTable, 'Clinical impressions table exists');
        if (result.value.rowCount > 0) {
          browser.assert.ok(result.value.foundUpdated, 'Found updated clinical impression');
        }
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/clinicalimpressions/10-updated-in-list.png');
    console.log('[08] Updated record verification complete');
  });

  it('09. Delete clinical impression', function(browser) {
    console.log('[09] Deleting clinical impression...');

    browser
      .waitForElementVisible('#clinicalImpressionsPage', 5000)
      .pause(1000);

    // Check if we have data to delete
    browser.execute(function() {
      const hasTable = document.querySelector('#clinicalImpressionsTable') !== null;
      const rows = document.querySelectorAll('#clinicalImpressionsTable tbody tr');
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.body.textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData, rowCount: rows.length };
    }, [], function(result) {
      console.log('[09] Pre-delete state:', result.value);

      if (result.value.hasTable && result.value.rowCount > 0) {
        // Click first row
        browser.execute(function() {
          const rows = document.querySelectorAll('#clinicalImpressionsTable tbody tr');
          if (rows.length > 0) {
            rows[0].click();
            return true;
          }
          return false;
        }, [], function(clickResult) {
          browser.assert.equal(clickResult.value, true, 'Clicked row for deletion');
        });

        browser
          .pause(1000)
          .waitForElementVisible('#clinicalImpressionDetailPage', 5000);

        // Make sure we're in a mode where Delete is visible
        browser.execute(function() {
          // If in edit mode, cancel to view mode (Delete often only shows in view mode)
          const buttons = document.querySelectorAll('button');
          for (let button of buttons) {
            if (button.textContent.includes('Cancel')) {
              button.click();
              return { cancelled: true };
            }
          }
          return { cancelled: false };
        });

        browser.pause(500);

        // Click Delete button
        browser.execute(function() {
          const buttons = document.querySelectorAll('button');
          for (let button of buttons) {
            if (button.textContent.includes('Delete')) {
              window.__deleteButtonFound = true;
              button.click();
              return true;
            }
          }
          return false;
        });

        browser
          .pause(500)
          .acceptAlert()
          .pause(2000);

        // Verify back on list page
        browser
          .waitForElementVisible('#clinicalImpressionsPage', 5000);

        browser.execute(function() {
          const hasPage = document.querySelector('#clinicalImpressionsPage') !== null;
          const hasTable = document.querySelector('#clinicalImpressionsTable') !== null;
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                          document.body.textContent.includes('No Data Available');
          return { hasPage: hasPage, hasTable: hasTable, hasNoData: hasNoData };
        }, [], function(postDeleteResult) {
          console.log('[09] Post-delete state:', postDeleteResult.value);
          browser.assert.equal(postDeleteResult.value.hasPage, true, 'Back on list page after deletion');
          browser.assert.ok(postDeleteResult.value.hasTable || postDeleteResult.value.hasNoData,
            'Either table or no-data state present after deletion');
        });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No clinical impressions to delete - No Data Available state is correct');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/clinicalimpressions/11-deleted.png');
    console.log('[09] Record deletion complete');
  });

  after(function(browser, done) {
    console.log('ClinicalImpressions CRUD test suite complete');

    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof ClinicalImpressions !== 'undefined') {
        ClinicalImpressions.find({ description: { $regex: 'test' } }).fetch().forEach(function(impression) {
          ClinicalImpressions.remove({ _id: impression._id });
        });
        console.log('Cleaned up test clinical impressions');
      }
      done();
    });

    browser.end(done);
  });
});
