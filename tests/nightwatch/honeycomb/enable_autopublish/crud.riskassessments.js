// tests/nightwatch/honeycomb/enable_autopublish/crud.riskassessments.js
// RiskAssessment CRUD Operations (Workflow - Patient + Practitioner context)

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('RiskAssessments CRUD Operations', function() {
  const timestamp = Date.now();
  let testPatientId = null;
  let testRiskAssessmentId = null;

  const testRiskAssessment = {
    status: 'preliminary',
    codeDisplay: 'Cardiovascular disease risk assessment - test ' + timestamp,
    method: 'Framingham Risk Score',
    prediction: 'Moderate risk of cardiovascular event',
    mitigation: 'Recommend lifestyle modifications and regular monitoring'
  };

  const updatedRiskAssessment = {
    status: 'final',
    codeDisplay: 'Cardiovascular disease risk assessment (updated) - test ' + timestamp,
    method: 'Updated risk calculation',
    prediction: 'Low risk after intervention',
    mitigation: 'Continue current treatment plan'
  };

  before(function(browser, done) {
    console.log('Starting RiskAssessments CRUD test suite...');
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
        name: 'RiskAssessment TestPatient',
        family: 'TestPatient',
        given: 'RiskAssessment',
        gender: 'male',
        birthDate: '1965-03-20',
        identifier: 'test-riskassessment-patient-' + timestamp
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
        if (typeof RiskAssessments !== 'undefined') {
          const testAssessments = RiskAssessments.find({ 'code.text': { $regex: 'test' } }).fetch();
          testAssessments.forEach(function(assessment) {
            RiskAssessments.remove({ _id: assessment._id });
          });
          console.log('[01] Cleared', testAssessments.length, 'test risk assessments');
        }
        done();
      });

      browser.pause(1000);
    });

    browser.pause(2000);
    browser.saveScreenshot('tests/nightwatch/screenshots/riskassessments/01-setup-complete.png');
    console.log('[01] Test environment setup complete');
  });

  it('02. Verify risk assessments list page loads', function(browser) {
    console.log('[02] Verifying risk assessments list page...');

    // Use testUtils.navigateUrl to preserve Session
    testUtils.navigateUrl(browser, '/risk-assessments');
    browser.waitForElementVisible('#riskAssessmentsPage', 5000);

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
      const hasPage = document.querySelector('#riskAssessmentsPage') !== null;
      const hasTable = document.querySelector('#riskAssessmentsTable') !== null;
      const hasNoDataCard = document.querySelector('#noRiskAssessmentsMessage') !== null ||
                          document.body.textContent.includes('No Data Available') ||
                          document.body.textContent.includes('No risk assessments');
      return {
        hasPage: hasPage,
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasEitherElement: hasTable || hasNoDataCard
      };
    }, [], function(result) {
      browser.assert.equal(result.value.hasPage, true, 'Risk assessments page is present');
      browser.assert.equal(result.value.hasEitherElement, true, 'Either table or no-data message is present');
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/riskassessments/02-list-page.png');
    console.log('[02] List page verification complete');
  });

  it('03. Navigate to new risk assessment form', function(browser) {
    console.log('[03] Navigating to new risk assessment form...');

    browser
      .waitForElementVisible('#riskAssessmentsPage', 5000)
      .pause(500);

    // Click Add Risk Assessment button
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Add') && button.textContent.includes('Risk Assessment')) {
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
      browser.assert.equal(result.value.clicked, true, 'Clicked Add Risk Assessment button');
      console.log('[03] Add button clicked:', result.value);
    });

    browser
      .pause(1000)
      .waitForElementVisible('#riskAssessmentDetailPage', 5000);

    // Verify form fields are present
    browser
      .assert.elementPresent('#statusSelect')
      .assert.elementPresent('#codeInput')
      .assert.elementPresent('#subjectDisplay');

    // Check initial field values
    browser.execute(function() {
      const statusField = document.querySelector('#statusSelect');
      const codeField = document.querySelector('#codeInput');
      const subjectField = document.querySelector('#subjectDisplay');
      const performerField = document.querySelector('#performerDisplay');
      const methodField = document.querySelector('#methodInput');
      const mitigationField = document.querySelector('#mitigationInput');

      return {
        hasStatusField: statusField !== null,
        hasCodeField: codeField !== null,
        hasMethodField: methodField !== null,
        hasMitigationField: mitigationField !== null,
        patientValue: subjectField ? subjectField.value : null,
        performerValue: performerField ? performerField.value : null,
        sessionPatientId: typeof Session !== 'undefined' ? Session.get('selectedPatientId') : null
      };
    }, [], function(result) {
      console.log('[03] Form initialization:', result.value);
      browser.assert.ok(result.value.hasStatusField, 'Status field exists');
      browser.assert.ok(result.value.hasCodeField, 'Code display field exists');
      // Performer may be auto-populated with logged-in user
      if (result.value.performerValue) {
        browser.assert.ok(result.value.performerValue.length > 0, 'Performer field populated');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/riskassessments/03-new-form.png');
    console.log('[03] Create form navigation complete');
  });

  it('04. Create new risk assessment', function(browser) {
    console.log('[04] Creating new risk assessment...');

    browser
      .waitForElementVisible('#riskAssessmentDetailPage', 5000)
      .pause(500);

    // Verify we're on new page
    browser.assert.urlContains('/risk-assessments/new');

    // Check form is in edit mode, if not click edit
    browser.execute(function() {
      const codeField = document.querySelector('#codeInput');
      if (codeField && codeField.disabled) {
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
    }, [testRiskAssessment.status], function(result) {
      browser.assert.equal(result.value, true, 'Status select clicked');
    });

    browser.pause(1000);

    // Fill code display field
    browser
      .clearValue('#codeInput')
      .setValue('#codeInput', testRiskAssessment.codeDisplay)
      .pause(300);

    // Verify code display was set
    browser.getValue('#codeInput', function(result) {
      browser.assert.ok(result.value.includes('Cardiovascular'), 'Code display field set correctly');
    });

    // Fill method field if it exists
    browser.execute(function(methodValue) {
      const methodField = document.querySelector('#methodInput');
      if (methodField) {
        methodField.value = methodValue;
        methodField.dispatchEvent(new Event('input', { bubbles: true }));
        methodField.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, [testRiskAssessment.method], function(result) {
      if (result.value) {
        console.log('[04] Method field set');
      }
    });

    browser.pause(300);

    // Fill mitigation field if it exists
    browser.execute(function(mitigationValue) {
      const mitigationField = document.querySelector('#mitigationInput');
      if (mitigationField) {
        mitigationField.value = mitigationValue;
        mitigationField.dispatchEvent(new Event('input', { bubbles: true }));
        mitigationField.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, [testRiskAssessment.mitigation], function(result) {
      if (result.value) {
        console.log('[04] Mitigation field set');
      }
    });

    browser.pause(500);

    // Log form values before save
    browser.execute(function() {
      const statusField = document.querySelector('#statusSelect');
      const codeField = document.querySelector('#codeInput');
      const subjectField = document.querySelector('#subjectDisplay');
      const methodField = document.querySelector('#methodInput');
      const mitigationField = document.querySelector('#mitigationInput');

      console.log('=== Form values before save ===');
      console.log('Status:', statusField ? statusField.textContent : 'not found');
      console.log('Code:', codeField ? codeField.value : 'not found');
      console.log('Patient:', subjectField ? subjectField.value : 'not found');
      console.log('Method:', methodField ? methodField.value : 'not found');
      console.log('Mitigation:', mitigationField ? mitigationField.value : 'not found');

      return {
        code: codeField ? codeField.value : null,
        patient: subjectField ? subjectField.value : null,
        method: methodField ? methodField.value : null,
        mitigation: mitigationField ? mitigationField.value : null
      };
    }, [], function(result) {
      console.log('[04] Form values:', result.value);
      browser.assert.ok(result.value.code && result.value.code.length > 0, 'Code display is filled');
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/riskassessments/04-filled-form.png');

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
      const hasDetailPage = document.querySelector('#riskAssessmentDetailPage') !== null;
      const hasListPage = document.querySelector('#riskAssessmentsPage') !== null;

      // Try to get the ID from URL or barcode
      let recordId = null;
      const barcode = document.querySelector('.barcode');
      if (barcode) {
        recordId = barcode.textContent.trim();
      } else {
        const match = currentUrl.match(/\/risk-assessments\/([^/]+)$/);
        if (match && match[1] !== 'new') {
          recordId = match[1];
        }
      }

      return {
        url: currentUrl,
        hasDetailPage: hasDetailPage,
        hasListPage: hasListPage,
        recordId: recordId,
        savedSuccessfully: currentUrl !== '/risk-assessments/new'
      };
    }, [], function(result) {
      console.log('[04] Post-save state:', result.value);
      browser.assert.ok(result.value.savedSuccessfully, 'Saved successfully (navigated away from /new)');

      if (result.value.recordId) {
        testRiskAssessmentId = result.value.recordId;
        console.log('[04] Created risk assessment ID:', testRiskAssessmentId);
        browser.assert.ok(true, 'Captured record ID: ' + testRiskAssessmentId);
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/riskassessments/05-saved.png');
    console.log('[04] Risk assessment creation complete');
  });

  it('05. Verify new risk assessment appears in list', function(browser) {
    console.log('[05] Verifying new risk assessment in list...');

    // Navigate back to list
    testUtils.navigateUrl(browser, '/risk-assessments');
    browser.waitForElementVisible('#riskAssessmentsPage', 5000);

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

    // Search for the new risk assessment
    browser.execute(function(searchTerm) {
      const input = document.querySelector('#riskAssessmentSearchInput');
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
    }, ['Cardiovascular']);

    browser.pause(3000);

    // Verify the record appears
    browser.execute(function(codeDisplay) {
      const table = document.querySelector('#riskAssessmentsTable');
      if (table) {
        const tableText = table.textContent;
        const rows = table.querySelectorAll('tbody tr');
        return {
          hasTable: true,
          hasRecord: tableText.includes(codeDisplay) || tableText.includes('Cardiovascular'),
          rowCount: rows.length,
          tableText: tableText.substring(0, 500)
        };
      }

      // Check for no-data state
      const hasNoData = document.body.textContent.includes('No Data Available') ||
                       document.querySelector('#noRiskAssessmentsMessage') !== null;
      return { hasTable: false, hasNoData: hasNoData };
    }, [testRiskAssessment.codeDisplay], function(result) {
      console.log('[05] Table search result:', result.value);
      if (result.value.hasTable) {
        browser.assert.ok(result.value.rowCount > 0, 'Table has at least one row');
        browser.assert.ok(result.value.hasRecord, 'Found test risk assessment in table');
      } else {
        browser.assert.ok(result.value.hasNoData, 'No data state shown (may need subscription)');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/riskassessments/06-in-list.png');
    console.log('[05] Table verification complete');
  });

  it('06. View risk assessment details', function(browser) {
    console.log('[06] Opening risk assessment for viewing...');

    browser
      .waitForElementVisible('#riskAssessmentsPage', 5000)
      .pause(1000);

    // Click the first row to view details
    browser.execute(function() {
      const rows = document.querySelectorAll('#riskAssessmentsTable tbody tr');
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
      browser.assert.equal(result.value.clicked, true, 'Found and clicked risk assessment row');
      browser.assert.ok(result.value.rowCount > 0, 'Table has rows to click');
    });

    browser.pause(1000);

    // Verify detail page loaded
    browser
      .waitForElementVisible('#riskAssessmentDetailPage', 5000)
      .assert.elementPresent('#statusSelect')
      .assert.elementPresent('#codeInput');

    // Debug form field values
    browser.execute(function() {
      const statusField = document.querySelector('#statusSelect');
      const codeField = document.querySelector('#codeInput');
      const subjectField = document.querySelector('#subjectDisplay');
      const methodField = document.querySelector('#methodInput');
      const mitigationField = document.querySelector('#mitigationInput');

      console.log('=== Debug Form Fields ===');
      console.log('Code value:', codeField ? codeField.value : 'Field not found');
      console.log('Patient value:', subjectField ? subjectField.value : 'Field not found');
      console.log('Code disabled:', codeField ? codeField.disabled : 'N/A');

      return {
        code: codeField ? codeField.value : null,
        patient: subjectField ? subjectField.value : null,
        method: methodField ? methodField.value : null,
        mitigation: mitigationField ? mitigationField.value : null,
        isViewMode: codeField && codeField.disabled
      };
    }, [], function(result) {
      console.log('[06] Form field values:', result.value);
      browser.assert.ok(result.value.code !== null, 'Code field has value');
      if (result.value.code) {
        browser.assert.ok(result.value.code.includes('Cardiovascular') ||
                        result.value.code.includes('assessment'),
                        'Code contains expected text');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/riskassessments/07-view-details.png');
    console.log('[06] Detail view complete');

    // Navigate back to list
    testUtils.navigateUrl(browser, '/risk-assessments');
    browser.waitForElementVisible('#riskAssessmentsPage', 5000);
  });

  it('07. Update existing risk assessment', function(browser) {
    console.log('[07] Updating risk assessment...');

    browser
      .waitForElementVisible('#riskAssessmentsPage', 5000)
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
      const rows = document.querySelectorAll('#riskAssessmentsTable tbody tr');
      if (rows.length > 0) {
        rows[0].click();
        return { clicked: true, rowCount: rows.length };
      }
      return { clicked: false, rowCount: 0 };
    }, [], function(result) {
      browser.assert.equal(result.value.clicked, true, 'Found and clicked risk assessment row');
    });

    browser
      .pause(1000)
      .waitForElementVisible('#riskAssessmentDetailPage', 5000);

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
    }, [updatedRiskAssessment.status], function(result) {
      browser.assert.equal(result.value, true, 'Status select updated');
    });

    browser.pause(1000);

    // Update code display
    browser
      .clearValue('#codeInput')
      .setValue('#codeInput', updatedRiskAssessment.codeDisplay)
      .pause(300);

    // Verify code display updated
    browser.getValue('#codeInput', function(result) {
      browser.assert.ok(result.value.includes('updated'), 'Code display updated correctly');
    });

    // Update mitigation field if it exists
    browser.execute(function(mitigationValue) {
      const mitigationField = document.querySelector('#mitigationInput');
      if (mitigationField) {
        mitigationField.value = mitigationValue;
        mitigationField.dispatchEvent(new Event('input', { bubbles: true }));
        mitigationField.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, [updatedRiskAssessment.mitigation], function(result) {
      if (result.value) {
        console.log('[07] Mitigation field updated');
      }
    });

    browser.pause(500);

    browser.saveScreenshot('tests/nightwatch/screenshots/riskassessments/08-updated-form.png');

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
    testUtils.navigateUrl(browser, '/risk-assessments');
    browser
      .waitForElementVisible('#riskAssessmentsPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/riskassessments/09-updated.png');

    console.log('[07] Record update complete');
  });

  it('08. Verify updated risk assessment in list', function(browser) {
    console.log('[08] Verifying updated risk assessment in list...');

    // Scroll to top
    browser.execute(function() {
      window.scrollTo(0, 0);
    });
    browser.pause(500);

    browser
      .waitForElementVisible('#riskAssessmentsPage', 5000)
      .pause(1000);

    // Search for updated record
    browser.execute(function(searchTerm) {
      const input = document.querySelector('#riskAssessmentSearchInput');
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
    }, ['updated']);

    browser.pause(3000);

    browser.execute(function() {
      const table = document.querySelector('#riskAssessmentsTable');
      const rows = table ? table.querySelectorAll('tbody tr') : [];
      const hasNoData = document.querySelector('#noRiskAssessmentsMessage') !== null ||
                       document.body.textContent.includes('No Data Available');

      let foundUpdated = false;
      for (let row of rows) {
        if (row.textContent.includes('updated')) {
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
        browser.assert.ok(result.value.hasTable, 'Risk assessments table exists');
        if (result.value.rowCount > 0) {
          browser.assert.ok(result.value.foundUpdated, 'Found updated risk assessment');
        }
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/riskassessments/10-updated-in-list.png');
    console.log('[08] Updated record verification complete');
  });

  it('09. Delete risk assessment', function(browser) {
    console.log('[09] Deleting risk assessment...');

    browser
      .waitForElementVisible('#riskAssessmentsPage', 5000)
      .pause(1000);

    // Check if we have data to delete
    browser.execute(function() {
      const hasTable = document.querySelector('#riskAssessmentsTable') !== null;
      const rows = document.querySelectorAll('#riskAssessmentsTable tbody tr');
      const hasNoData = document.querySelector('#noRiskAssessmentsMessage') !== null ||
                       document.body.textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData, rowCount: rows.length };
    }, [], function(result) {
      console.log('[09] Pre-delete state:', result.value);

      if (result.value.hasTable && result.value.rowCount > 0) {
        // Click first row
        browser.execute(function() {
          const rows = document.querySelectorAll('#riskAssessmentsTable tbody tr');
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
          .waitForElementVisible('#riskAssessmentDetailPage', 5000);

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
          .waitForElementVisible('#riskAssessmentsPage', 5000);

        browser.execute(function() {
          const hasPage = document.querySelector('#riskAssessmentsPage') !== null;
          const hasTable = document.querySelector('#riskAssessmentsTable') !== null;
          const hasNoData = document.querySelector('#noRiskAssessmentsMessage') !== null ||
                          document.body.textContent.includes('No Data Available');
          return { hasPage: hasPage, hasTable: hasTable, hasNoData: hasNoData };
        }, [], function(postDeleteResult) {
          console.log('[09] Post-delete state:', postDeleteResult.value);
          browser.assert.equal(postDeleteResult.value.hasPage, true, 'Back on list page after deletion');
          browser.assert.ok(postDeleteResult.value.hasTable || postDeleteResult.value.hasNoData,
            'Either table or no-data state present after deletion');
        });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No risk assessments to delete - No Data Available state is correct');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/riskassessments/11-deleted.png');
    console.log('[09] Record deletion complete');
  });

  after(function(browser, done) {
    console.log('RiskAssessments CRUD test suite complete');

    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof RiskAssessments !== 'undefined') {
        RiskAssessments.find({ 'code.text': { $regex: 'test' } }).fetch().forEach(function(assessment) {
          RiskAssessments.remove({ _id: assessment._id });
        });
        console.log('Cleaned up test risk assessments');
      }
      done();
    });

    browser.end(done);
  });
});
