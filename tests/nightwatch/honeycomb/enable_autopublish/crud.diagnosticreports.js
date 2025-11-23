// tests/nightwatch/honeycomb/enable_autopublish/crud.diagnosticreports.js

const testUtils = require('./shared-test-utils');
const saveNavigationHelper = require('../../helpers/save-navigation-helper');
const loginHelper = require('../../helpers/login-helper');

describe('DiagnosticReports CRUD Operations', function() {
  const timestamp = Date.now();
  const dateString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  let createdReportId; // Store the ID of created report
  
  // Generate a random 5-digit number for the LOINC code to ensure uniqueness
  const randomCode = Math.floor(10000 + Math.random() * 90000);
  
  const testDiagnosticReport = {
    status: 'final',
    code: `${randomCode}-8`, // Random LOINC-style code (e.g., "24323-8")
    effectiveDateTime: dateString,
    conclusion: `Test diagnostic report conclusion ${timestamp}`,
    patientName: 'John Doe',
    category: 'Laboratory' // Laboratory category
  };

  const updatedDiagnosticReport = {
    status: 'amended',
    code: `${randomCode}-8`, // Keep same random code
    conclusion: `Updated test diagnostic report conclusion ${timestamp}`
  };

  before(browser => {
    console.log('Starting DiagnosticReports CRUD test suite...');
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
        if (typeof DiagnosticReports !== 'undefined') {
          const testReports = DiagnosticReports.find({
            $or: [
              { 'code.text': { $regex: '.*Lab Report.*' } },
              { 'conclusion': { $regex: 'Test diagnostic report.*' } },
              { 'performer.0.display': { $regex: 'Dr\\..*' } }
            ]
          }).fetch();
          testReports.forEach(function(report) {
            DiagnosticReports.remove({ _id: report._id });
          });
          console.log('Cleared', testReports.length, 'test diagnostic reports');
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

  it('02. Verify diagnostic reports list page loads', browser => {
    browser
      .url('http://localhost:3000/diagnostic-reports')
      .waitForElementVisible('#diagnosticReportsPage', 5000)
      .pause(2000);
      
    // Re-establish patient context after navigation
    browser.execute(function(testIdentifier) {
      console.log('Re-establishing patient context after navigation...');
      
      if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
        // First check if patient is already set
        const currentPatientId = Session.get('selectedPatientId');
        const currentPatient = Session.get('selectedPatient');
        
        if (currentPatient && currentPatientId) {
          console.log('Patient already set:', currentPatientId);
          return { success: true, patientId: currentPatientId, patientName: currentPatient.name?.[0]?.text };
        }
        
        // If not set, find and set the patient
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
        
        if (!patient) {
          patient = Patients.findOne({}, { sort: { _id: -1 } });
        }
        
        if (patient) {
          console.log('Setting patient in Session:', patient._id, patient.name?.[0]?.text);
          Session.set('selectedPatientId', patient._id);
          Session.set('selectedPatient', patient);
          return { success: true, patientId: patient._id, patientName: patient.name?.[0]?.text };
        } else {
          console.error('No patients found');
          return { success: false, error: 'No patients found' };
        }
      }
      return { success: false, error: 'Session or Patients not available' };
    }, ['test-patient-' + timestamp], function(result) {
      console.log('Patient context check:', result.value);
    });
    
    browser
      .pause(1000)
      .execute(function() {
        const hasTable = document.querySelector('#diagnosticReportsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#diagnosticReportsPage') && 
                             document.querySelector('#diagnosticReportsPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either diagnostic reports table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/diagnostic-reports/02-diagnostic-reports-list.png');
  });

  it('03. Navigate to new diagnostic report form', browser => {
    browser
      .waitForElementVisible('#diagnosticReportsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        const buttonTexts = [];
        
        // Debug: Log all button texts
        for (let button of buttons) {
          buttonTexts.push(button.textContent.trim());
        }
        console.log('Available buttons:', buttonTexts);
        
        // Try multiple variations of the button text
        for (let button of buttons) {
          const buttonText = button.textContent.trim();
          if (buttonText === 'Add Report' || 
              buttonText === 'Add Your First Diagnostic Report') {
            console.log('Clicking button with text:', buttonText);
            button.click();
            return true;
          }
        }
        
        // Try looking for FAB (Floating Action Button) or icon buttons
        const fabButtons = document.querySelectorAll('[aria-label*="add" i], [aria-label*="Add" i], button[title*="add" i], button[title*="Add" i]');
        for (let fab of fabButtons) {
          console.log('Found FAB/icon button, clicking it');
          fab.click();
          return true;
        }
        
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Diagnostic Report button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#diagnosticReportDetailPage', 5000)
      .assert.elementPresent('#statusSelect')
      .assert.elementPresent('#codeInput')
      .assert.elementPresent('#categoryInput')
      .assert.elementPresent('#effectiveDateTimeInput')
      .assert.elementPresent('#subjectInput')
      .assert.elementPresent('#conclusionInput')
      .pause(1000)
      .execute(function() {
        const subjectField = document.querySelector('#subjectInput');
        return {
          subjectValue: subjectField ? subjectField.value : null,
          sessionPatientId: typeof Session !== 'undefined' ? Session.get('selectedPatientId') : null,
          sessionPatient: typeof Session !== 'undefined' ? Session.get('selectedPatient') : null
        };
      }, [], function(result) {
        console.log('Form initialization check:', result.value);
      })
      .saveScreenshot('tests/nightwatch/screenshots/diagnostic-reports/03-new-diagnostic-report-form.png');
  });

  it('04. Create new diagnostic report', browser => {
    browser
      .waitForElementVisible('#diagnosticReportDetailPage', 5000)
      .pause(500);

    // Check if we're on the new diagnostic report page
    browser.assert.urlContains('/diagnostic-reports/new');

    // Subject field should be auto-populated from Session
    browser.execute(function() {
      const subjectField = document.querySelector('#subjectInput');
      if (!subjectField) {
        return { error: 'Subject field not found' };
      }
      
      // The field should be disabled and auto-populated
      return {
        subjectFieldValue: subjectField.value,
        isDisabled: subjectField.disabled,
        subjectFieldId: subjectField.id
      };
    }, [], function(result) {
      console.log('Subject field check:', result.value);
      if (result.value.subjectFieldValue) {
        browser.assert.ok(true, 'Subject field is populated: ' + result.value.subjectFieldValue);
      }
    });

    // Check if form is in edit mode
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
      console.log('Edit mode check:', result.value);
    });

    // Fill form fields
    browser
      .pause(500)
      .clearValue('#codeInput')
      .setValue('#codeInput', testDiagnosticReport.code)
      .clearValue('#categoryInput')
      .setValue('#categoryInput', 'Laboratory')
      .clearValue('#effectiveDateTimeInput')
      .setValue('#effectiveDateTimeInput', testDiagnosticReport.effectiveDateTime)
      .clearValue('#conclusionInput')
      .setValue('#conclusionInput', testDiagnosticReport.conclusion)
      .pause(500);

    // Also use execute method as fallback
    browser.execute(function(report) {
      const results = {};
      
      // Simple field setter without native descriptor access
      function setFieldValue(selector, value) {
        try {
          const field = document.querySelector(selector);
          if (field) {
            field.value = value;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`Set ${selector} to:`, value);
            return true;
          }
          console.warn(`Field ${selector} not found`);
          return false;
        } catch (e) {
          console.error(`Error setting ${selector}:`, e);
          return false;
        }
      }
      
      // Subject field should already be populated and is disabled
      const subjectField = document.querySelector('#subjectInput');
      if (subjectField) {
        console.log('Subject field value:', subjectField.value);
        console.log('Subject field disabled:', subjectField.disabled);
      }
      
      results.code = setFieldValue('#codeInput', report.code);
      results.category = setFieldValue('#categoryInput', report.category); // Use LAB from test data
      results.conclusion = setFieldValue('#conclusionInput', report.conclusion);
      
      return { filled: true, results: results };
    }, [testDiagnosticReport], function(result) {
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
    }, [testDiagnosticReport.status]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/diagnostic-reports/04-filled-diagnostic-report-form.png');

    // Log form values before save
    browser.execute(function() {
      const subjectField = document.querySelector('#subjectInput');
      const codeField = document.querySelector('#codeInput');
      const categoryField = document.querySelector('#categoryInput');
      const conclusionField = document.querySelector('#conclusionInput');
      
      console.log('=== Form values before save ===');
      console.log('Subject:', subjectField ? subjectField.value : 'not found');
      console.log('Code:', codeField ? codeField.value : 'not found');
      console.log('Category:', categoryField ? categoryField.value : 'not found');
      console.log('Conclusion:', conclusionField ? conclusionField.value : 'not found');
      
      const statusSelect = document.querySelector('#statusSelect');
      console.log('Status value:', statusSelect ? statusSelect.value : 'not found');
      
      // Also check what's actually in the database
      if (typeof DiagnosticReports !== 'undefined' && window.testTimestamp) {
        const savedReports = DiagnosticReports.find().fetch();
        const testReport = savedReports.find(r => r.code && 
          r.code.text && 
          r.code.text.includes(window.testTimestamp));
        if (testReport) {
          console.log('Found test report in database:', testReport);
        } else {
          console.log('Test report not found in database');
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

    // Save the diagnostic report
    // Use save-navigation-helper to handle save and navigation
    saveNavigationHelper.saveAndNavigate(
      browser, 
      'diagnostic-reports', 
      '#diagnosticReportsPage',
      function() {
        browser.saveScreenshot('tests/nightwatch/screenshots/diagnostic-reports/05-diagnostic-report-saved.png');
      }
    );
  });

  it('05. Verify new diagnostic report appears in list', browser => {
    browser
      .waitForElementVisible('#diagnosticReportsPage', 5000)
      .pause(1000);
    
    // Search for our specific test report by conclusion (contains timestamp)
    browser
      .waitForElementVisible('#diagnosticReportSearchInput', 5000)
      .clearValue('#diagnosticReportSearchInput')
      .setValue('#diagnosticReportSearchInput', testDiagnosticReport.conclusion.substring(0, 30))
      .pause(1000);
    
    // Wait for loading to complete by checking multiple times
    let attempts = 0;
    const maxAttempts = 10;
    
    function waitForDataToLoad() {
      browser.execute(function() {
        // Check if page is showing loading message
        const pageContent = document.body.textContent || '';
        const isLoading = pageContent.includes('Loading diagnostic reports...');
        const hasTable = document.querySelector('#diagnosticReportsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null;
        
        if (isLoading) {
          return { isLoading: true };
        }
        
        // Get table rows if table exists
        let rowCount = 0;
        let firstRowText = '';
        if (hasTable) {
          const rows = document.querySelectorAll('#diagnosticReportsTable tbody tr');
          rowCount = rows.length;
          firstRowText = rows.length > 0 ? rows[0].textContent : '';
        }
        
        return {
          isLoading: false,
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          rowCount: rowCount,
          firstRowText: firstRowText
        };
      }, [], function(result) {
        console.log(`Loading check attempt ${attempts + 1}:`, result.value);
        
        if (result.value.isLoading && attempts < maxAttempts) {
          // Still loading, wait and try again
          attempts++;
          browser.pause(1000);
          waitForDataToLoad();
        } else if (result.value.hasTable && result.value.rowCount > 0) {
          // Data loaded successfully
          browser.assert.ok(true, `Found ${result.value.rowCount} diagnostic report(s) in table`);
          
          // Additional verification of the content
          browser.execute(function() {
            const hasTable = document.querySelector('#diagnosticReportsTable') !== null;
            const hasNoDataCard = document.querySelector('.no-data-card') !== null;
            const pageText = document.querySelector('#diagnosticReportsPage')?.textContent || '';
            
            let totalReports = 0;
            let selectedPatientId = null;
            let selectedPatient = null;
            
            if (typeof DiagnosticReports !== 'undefined') {
              totalReports = DiagnosticReports.find({}).count();
              console.log('Total diagnostic reports in database:', totalReports);
              
              const testReport = DiagnosticReports.findOne({
                'code.text': { $regex: 'Lab Report.*' }
              });
              console.log('Found test report:', testReport);
              
              if (testReport) {
                console.log('Test report subject:', JSON.stringify(testReport.subject, null, 2));
                console.log('Test report subject reference:', testReport.subject?.reference);
                console.log('Test report subject display:', testReport.subject?.display);
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
              totalReports: totalReports,
              hasSelectedPatient: !!selectedPatientId,
              selectedPatientId: selectedPatientId
            };
          }, [], function(result) {
            console.log('Page state after loading:', result.value);
          });
        } else if (attempts >= maxAttempts) {
          browser.assert.fail('Timed out waiting for diagnostic reports to load');
        } else {
          // No data found
          browser.assert.fail('No diagnostic reports table found or table is empty after loading');
        }
      });
    }
    
    waitForDataToLoad();
    
    browser
      .saveScreenshot('tests/nightwatch/screenshots/diagnostic-reports/06-diagnostic-report-in-list.png');
  });

  it('06. View diagnostic report details', browser => {
    browser
      .waitForElementVisible('#diagnosticReportsPage', 5000)
      .pause(1000);

    // Clear any previous search and search for our specific report
    browser
      .waitForElementVisible('#diagnosticReportSearchInput', 5000)
      .clearValue('#diagnosticReportSearchInput')
      .pause(500) // Let the clear take effect
      .setValue('#diagnosticReportSearchInput', testDiagnosticReport.conclusion.substring(0, 20)) // Use conclusion like test 05 
      .pause(1000);

    // Now click on the report row
    browser
      .waitForElementVisible('#diagnosticReportsTable', 5000)
      .pause(1000) // Wait for search results to update
      .execute(function(timestamp, code) {
        const rows = document.querySelectorAll('#diagnosticReportsTable tbody tr');
        console.log('Found', rows.length, 'rows in diagnostic reports table');
        
        // Look for our test report by timestamp or code
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowText = row.textContent;
          if (rowText.includes(timestamp) || rowText.includes(code)) {
            console.log('Clicking row', i, 'with text:', rowText);
            row.click();
            return { clicked: true, rowText: rowText, rowIndex: i };
          }
        }
        
        // If not found, click the first row if available
        if (rows.length > 0) {
          console.log('Test report not found by timestamp/code, clicking first row');
          rows[0].click();
          return { clicked: true, rowText: rows[0].textContent, rowIndex: 0 };
        }
        
        return { clicked: false, error: 'No rows found' };
      }, [timestamp.toString(), testDiagnosticReport.code], function(result) {
        console.log('Click result:', result.value);
        browser.assert.equal(result.value.clicked, true, 'Found and clicked diagnostic report row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#diagnosticReportDetailPage', 5000)
      .execute(function() {
        // Capture the report ID from the barcode display
        const barcode = document.querySelector('.barcode');
        if (barcode) {
          window.createdReportId = barcode.textContent.trim();
          console.log('Captured report ID:', window.createdReportId);
          return { id: window.createdReportId };
        }
        return { id: null };
      }, [], function(result) {
        if (result.value.id) {
          createdReportId = result.value.id;
          console.log('Stored report ID for later use:', createdReportId);
        }
      })
      .assert.valueContains('#codeInput', testDiagnosticReport.code)
      .assert.valueContains('#categoryInput', testDiagnosticReport.category)
      .assert.valueContains('#conclusionInput', testDiagnosticReport.conclusion)
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
          statusDisplay: getSelectDisplay('#statusSelect') || 
                        document.querySelector('[aria-labelledby*="status"]')?.textContent || 
                        document.querySelector('#statusSelect')?.parentElement?.textContent
        };
      }, [], function(result) {
        console.log('View diagnostic report details - form values:', result.value);
        console.log('Expected status:', testDiagnosticReport.status);
        console.log('Actual status value:', result.value.status);
        console.log('Status display:', result.value.statusDisplay);
        
        const statusOk = result.value.status === testDiagnosticReport.status || 
                       (result.value.statusDisplay && result.value.statusDisplay.includes('Final'));
        
        browser.assert.ok(statusOk, 'Status matches');
      })
      .saveScreenshot('tests/nightwatch/screenshots/diagnostic-reports/07-view-diagnostic-report-details.png');
    
    // Navigate back to diagnostic reports list
    testUtils.navigateUrl(browser, '/diagnostic-reports');
    browser
      .waitForElementVisible('#diagnosticReportsPage', 5000);
  });

  it('07. Update existing diagnostic report', browser => {
    browser
      .waitForElementVisible('#diagnosticReportsTable', 5000)
      .pause(1000);

    // First check what diagnostic reports exist
    browser.execute(function() {
      if (typeof DiagnosticReports !== 'undefined') {
        const allReports = DiagnosticReports.find({}).fetch();
        console.log('Total diagnostic reports in collection:', allReports.length);
        
        // Show first few reports with ID type info
        allReports.slice(0, 5).forEach((report, index) => {
          const idType = typeof report._id === 'string' && report._id.length === 24 ? 'ObjectID' : 'Meteor ID';
          console.log(`Report ${index} (${idType}):`, {
            _id: report._id,
            _idLength: report._id ? report._id.length : 0,
            id: report.id,
            code: report.code?.text,
            subject: report.subject,
            status: report.status
          });
        });
        
        // Check session
        const selectedPatient = Session.get('selectedPatient');
        const selectedPatientId = Session.get('selectedPatientId');
        console.log('Selected patient:', selectedPatient?.id, selectedPatientId);
        
        // Check if USE_MONGO_OBJECTID is being used
        console.log('Environment USE_MONGO_OBJECTID:', process.env.USE_MONGO_OBJECTID);
        
        return {
          totalReports: allReports.length,
          hasSelectedPatient: !!selectedPatient,
          usingObjectId: process.env.USE_MONGO_OBJECTID
        };
      }
      return { error: 'DiagnosticReports not available' };
    });

    // Search for our specific test report by conclusion (contains timestamp)
    browser
      .waitForElementVisible('#diagnosticReportSearchInput', 5000)
      .clearValue('#diagnosticReportSearchInput')
      .setValue('#diagnosticReportSearchInput', testDiagnosticReport.conclusion.substring(0, 30))
      .pause(1000);

    // Now click on the report to edit
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#diagnosticReportsTable tbody tr');
        console.log('Looking for report with timestamp:', timestamp);
        console.log('Found', rows.length, 'rows in table');
        
        // Also check the raw collection
        if (typeof DiagnosticReports !== 'undefined') {
          const testReports = DiagnosticReports.find({
            'code.text': { $regex: '.*' + timestamp + '.*' }
          }).fetch();
          console.log('Test reports in collection with timestamp:', testReports.length);
          testReports.forEach(report => {
            console.log('Test report in DB:', {
              _id: report._id,
              code: report.code?.text,
              subject: report.subject?.reference
            });
          });
        }
        
        for (let i = 0; i < rows.length; i++) {
          console.log('Row', i, ':', rows[i].textContent.substring(0, 100));
          if (rows[i].textContent.includes(timestamp)) {
            console.log('Found test report in row', i);
            rows[i].click();
            return { success: true, found: true, rowIndex: i };
          }
        }
        
        console.error('Test report not found in table!');
        return { success: false, found: false, error: 'Test report not in table' };
      }, [timestamp.toString()], function(result) {
        if (!result.value.found) {
          browser.assert.fail('Test report not found in table - cannot update.');
        }
      });

    browser
      .pause(1000)
      .waitForElementVisible('#diagnosticReportDetailPage', 5000)
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

    // Update report details
    browser
      .click('#codeInput')
      .clearValue('#codeInput')
      .setValue('#codeInput', updatedDiagnosticReport.code)
      .click('#conclusionInput')
      .clearValue('#conclusionInput')
      .setValue('#conclusionInput', updatedDiagnosticReport.conclusion)
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
      }, [updatedDiagnosticReport.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/diagnostic-reports/08-updated-diagnostic-report-form.png');

    // Save the updated report
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
      .pause(2000);

    testUtils.navigateUrl(browser, '/diagnostic-reports');

    browser
      .waitForElementVisible('#diagnosticReportsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/diagnostic-reports/09-diagnostic-report-updated.png');
  });

  it('08. Verify updated diagnostic report in list', browser => {
    browser
      .waitForElementVisible('#diagnosticReportsTable', 5000)
      .waitForElementVisible('#diagnosticReportSearchInput', 5000)
      .clearValue('#diagnosticReportSearchInput')
      .setValue('#diagnosticReportSearchInput', updatedDiagnosticReport.code.substring(0, 20))
      .pause(1000)
      .execute(function(expectedCode) {
        const table = document.querySelector('#diagnosticReportsTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const reportCodes = [];
        
        for (let row of rows) {
          const cells = row.querySelectorAll('td');
          for (let cell of cells) {
            if (cell.textContent.includes('Report')) {
              reportCodes.push(cell.textContent);
            }
          }
        }
        
        return {
          rowCount: rows.length,
          reportCodes: reportCodes,
          tableText: table ? table.textContent : 'Table not found',
          foundExpected: table ? table.textContent.includes(expectedCode) : false
        };
      }, [updatedDiagnosticReport.code], function(result) {
        console.log('Table debug info:', result.value);
        browser.assert.ok(result.value.foundExpected, 
          `Updated report '${updatedDiagnosticReport.code}' should be in table. Found reports: ${result.value.reportCodes.join(', ')}`);
      })
      .saveScreenshot('tests/nightwatch/screenshots/diagnostic-reports/10-updated-diagnostic-report-in-list.png');
  });

  it('09. Delete diagnostic report', browser => {
    browser
      .waitForElementVisible('#diagnosticReportsPage', 5000)
      .pause(1000);

    browser.execute(function() {
      const hasTable = document.querySelector('#diagnosticReportsTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#diagnosticReportsPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#diagnosticReportsTable tbody tr');
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked diagnostic report row');
          });

        browser
          .pause(1000)
          .waitForElementVisible('#diagnosticReportDetailPage', 5000);

        // Click Delete button (in read mode, not edit mode)
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
          .pause(3000) // Increased pause after deletion
          .execute(function() {
            return {
              url: window.location.pathname,
              hasPage: document.querySelector('#diagnosticReportsPage') !== null,
              bodyId: document.body.id,
              pageTitle: document.title
            };
          }, [], function(result) {
            console.log('After delete navigation check:', result.value);
            // If not on diagnostic reports page, navigate there
            if (!result.value.url.includes('/diagnostic-reports')) {
              testUtils.navigateUrl(browser, '/diagnostic-reports');
            }
          })
          .waitForElementVisible('#diagnosticReportsPage', 10000) // Increased timeout
          .execute(function() {
            const hasTable = document.querySelector('#diagnosticReportsTable') !== null;
            const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                                document.querySelector('.no-data-available') !== null ||
                                document.querySelector('[id*="no-data"]') !== null ||
                                (document.querySelector('#diagnosticReportsPage') && 
                                 document.querySelector('#diagnosticReportsPage').textContent.includes('No Data Available'));
            return {
              hasTable: hasTable,
              hasNoDataCard: hasNoDataCard,
              hasEitherElement: hasTable || hasNoDataCard
            };
          }, [], function(result) {
            browser.assert.equal(result.value.hasEitherElement, true, 'Either diagnostic reports table or no-data message is present after deletion');
          });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No diagnostic reports to delete - No Data Available state is correct');
      }
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/diagnostic-reports/11-diagnostic-report-deleted.png');
  });

  it('10. Verify diagnostic report removed from list', browser => {
    browser
      .pause(1000) // Give time for any navigation to settle
      .execute(function() {
        return {
          url: window.location.pathname,
          hasPage: document.querySelector('#diagnosticReportsPage') !== null
        };
      }, [], function(result) {
        console.log('Test 10 start - Current location:', result.value);
        if (!result.value.url.includes('/diagnostic-reports')) {
          testUtils.navigateUrl(browser, '/diagnostic-reports');
        }
      })
      .waitForElementVisible('#diagnosticReportsPage', 10000)
      .pause(1000)
      .execute(function(timestamp) {
        const table = document.querySelector('#diagnosticReportsTable');
        if (table) {
          const rows = document.querySelectorAll('#diagnosticReportsTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#diagnosticReportsPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Diagnostic report no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (diagnostic report was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/diagnostic-reports/12-diagnostic-report-not-in-list.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof DiagnosticReports !== 'undefined') {
        DiagnosticReports.find({ 
          $or: [
            { 'code.text': { $regex: '.*Lab Report.*' } },
            { 'conclusion': { $regex: 'Test diagnostic report.*' } },
            { 'performer.0.display': { $regex: 'Dr\\..*' } }
          ]
        }).fetch().forEach(function(report) {
          DiagnosticReports.remove({ _id: report._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});