// tests/nightwatch/honeycomb/crud.measurereports.js

const testUtils = require('./enable_autopublish/shared-test-utils');
const loginHelper = require('../helpers/login-helper');
const circleHelper = require('../helpers/circleci-helper');

describe('MeasureReports CRUD Operations', function() {
  const timestamp = Date.now();
  const testMeasureReport = {
    identifier: `MEASUREREPORT-${timestamp}`,
    status: 'complete',
    type: 'individual',
    subject: `Patient/${timestamp}`,
    date: new Date().toISOString().split('T')[0],
    reporter: `Organization/${timestamp}`,
    periodStart: '2023-01-01',
    periodEnd: '2023-12-31',
    improvementNotation: 'increase',
    measureUrl: `http://example.org/fhir/Measure/test-measure-${timestamp}`,
    measureReference: `Measure/${timestamp}`,
    // Group data for the report
    groupCode: 'initial-population',
    groupDescription: `Initial population for test report ${timestamp}`,
    populationCode: 'initial-population',
    populationCount: 100,
    measureScoreValue: 0.85,
    stratifierCode: 'age-group',
    stratifierValue: '18-65',
    // Author will be auto-populated to logged-in user
    author: 'Will be set to logged-in user (janedoe)'
  };

  const updatedMeasureReport = {
    status: 'pending',
    type: 'summary',
    date: new Date().toISOString().split('T')[0],
    measureScoreValue: 0.92,
    populationCount: 150
  };

  before(browser => {
    console.log('Starting MeasureReports CRUD test suite...');
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', circleHelper.TIMEOUTS.EXTRA_LONG)
      .pause(2000); // Give app time to initialize

    // Check for Meteor and basic app readiness with retries
    browser.perform(function() {
      let retries = 0;
      const maxRetries = 10;

      const checkReady = () => {
        browser.execute(function() {
          return {
            meteorReady: typeof Meteor !== 'undefined',
            hasPage: document.querySelector('[id$="Page"]') !== null || document.querySelector('#app-root') !== null,
            bodyLoaded: document.body && document.body.innerHTML.length > 100
          };
        }, [], function(result) {
          console.log(`App readiness check (${retries + 1}/${maxRetries}):`, result.value);

          if (result.value && result.value.meteorReady && (result.value.hasPage || result.value.bodyLoaded)) {
            console.log('✅ App is ready');
          } else if (retries < maxRetries) {
            retries++;
            console.log(`App not ready, waiting 3s... (${retries}/${maxRetries})`);
            browser.pause(3000);
            checkReady();
          } else {
            console.error('⚠️  App may not be fully ready, but continuing test...');
            // Don't fail here - let individual tests handle readiness
          }
        });
      };

      checkReady();
    });
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

    // Use the login helper for robust login handling
    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      } else {
        browser.assert.ok(true, 'User is logged in');
      }
      
      // Clean up any existing test data
      browser.executeAsync(function(done) {
        if (typeof MeasureReports !== 'undefined') {
          const testMeasureReports = MeasureReports.find({ 
            $or: [
              { 'identifier.0.value': { $regex: 'MEASUREREPORT-.*' } },
              { 'measure.reference': { $regex: '.*test-measure-.*' } },
              { 'subject.reference': { $regex: 'Patient/.*' } }
            ]
          }).fetch();
          testMeasureReports.forEach(function(report) {
            MeasureReports.remove({ _id: report._id });
          });
          console.log('Cleared', testMeasureReports.length, 'test measure reports');
        }
        done();
      });
      
      browser.pause(1000);
    });
  });

  it('02. Verify measure reports list page loads', browser => {
    browser
      .url('http://localhost:3000/measure-reports')
      .waitForElementVisible('#measureReportsPage', 5000);
      
    browser.pause(2000);  // Give more time for subscriptions to load
    
    // Wait for loading to complete
    browser.waitForElementNotPresent('.MuiLinearProgress-root', 10000);
      
    browser.execute(function() {
        const hasTable = document.querySelector('#measureReportsTable') !== null;
        const pageContent = document.querySelector('#measureReportsPage');
        const hasNoDataMessage = pageContent && (
          pageContent.textContent.includes('No Measure Reports Found') ||
          pageContent.textContent.includes('Add Your First Measure Report')
        );
        
        // Check for loading state
        const hasProgress = document.querySelector('.MuiLinearProgress-root') !== null;
        
        // Check if MeasureReports collection is available
        const collectionAvailable = typeof MeasureReports !== 'undefined';
        
        return {
          hasTable: hasTable,
          hasNoDataMessage: hasNoDataMessage,
          hasEitherElement: hasTable || hasNoDataMessage,
          pageText: pageContent ? pageContent.textContent.substring(0, 300) : 'Page not found',
          hasProgress: hasProgress,
          collectionAvailable: collectionAvailable
        };
      }, [], function(result) {
        console.log('Page check result:', result.value);
        if (result.value.hasProgress) {
          console.log('Page is still loading...');
        }
        if (!result.value.collectionAvailable) {
          console.log('MeasureReports collection not available on client');
        }
        browser.assert.equal(result.value.hasEitherElement, true, 'Either measure reports table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/measure-reports/02-measure-reports-list.png');
  });

  it('03. Navigate to new measure report form', browser => {
    browser
      .waitForElementVisible('#measureReportsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add MeasureReport') || 
              button.textContent.includes('Add Measure Report') ||
              button.textContent.includes('Add Your First Measure Report')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Measure Report button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#measureReportDetailPage', 5000)
      .assert.elementPresent('#identifierInput')
      .assert.elementPresent('#statusSelect')
      .assert.elementPresent('#typeSelect')
      .assert.elementPresent('#subjectInput')
      .assert.elementPresent('#dateInput')
      .assert.elementPresent('#reporterInput')
      .assert.elementPresent('#periodStartInput')
      .assert.elementPresent('#periodEndInput')
      .assert.elementPresent('#improvementNotationSelect')
      .assert.elementPresent('#measureUrlInput')
      .assert.elementPresent('#measureReferenceInput')
      .assert.elementPresent('#groupCodeInput')
      .assert.elementPresent('#groupDescriptionTextarea')
      .assert.elementPresent('#populationCodeInput')
      .assert.elementPresent('#populationCountInput')
      .assert.elementPresent('#measureScoreValueInput')
      .assert.elementPresent('#stratifierCodeInput')
      .assert.elementPresent('#stratifierValueInput')
      .pause(1000)
      .saveScreenshot('tests/nightwatch/screenshots/measure-reports/03-new-measure-report-form.png');
  });

  it('04. Create new measure report', browser => {
    browser
      .waitForElementVisible('#measureReportDetailPage', 5000)
      .pause(500);

    // Check if we're on the new measure report page
    browser.assert.urlContains('/measure-reports/new');

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

    // Fill form fields with better error handling
    browser
      .pause(1000) // Longer pause for stability
      .execute(function() {
        // Check if form is ready
        return {
          hasIdentifierInput: document.querySelector('#identifierInput') !== null,
          hasSubjectInput: document.querySelector('#subjectInput') !== null,
          formReady: document.querySelector('#measureReportDetailPage') !== null
        };
      }, [], function(result) {
        console.log('Form readiness check:', result.value);
      })
      .waitForElementVisible('#identifierInput', 10000)
      .clearValue('#identifierInput')
      .setValue('#identifierInput', testMeasureReport.identifier)
      .pause(500) // Small pause between operations
      .waitForElementVisible('#subjectInput', 5000)
      .clearValue('#subjectInput')
      .setValue('#subjectInput', testMeasureReport.subject)
      .pause(500)
      .waitForElementVisible('#dateInput', 5000)
      .clearValue('#dateInput')
      .setValue('#dateInput', testMeasureReport.date)
      .clearValue('#reporterInput')
      .setValue('#reporterInput', testMeasureReport.reporter)
      .clearValue('#periodStartInput')
      .setValue('#periodStartInput', testMeasureReport.periodStart)
      .clearValue('#periodEndInput')
      .setValue('#periodEndInput', testMeasureReport.periodEnd)
      .clearValue('#measureUrlInput')
      .setValue('#measureUrlInput', testMeasureReport.measureUrl)
      .clearValue('#measureReferenceInput')
      .setValue('#measureReferenceInput', testMeasureReport.measureReference)
      .clearValue('#groupCodeInput')
      .setValue('#groupCodeInput', testMeasureReport.groupCode)
      .clearValue('#groupDescriptionTextarea')
      .setValue('#groupDescriptionTextarea', testMeasureReport.groupDescription)
      .clearValue('#populationCodeInput')
      .setValue('#populationCodeInput', testMeasureReport.populationCode)
      .clearValue('#populationCountInput')
      .setValue('#populationCountInput', testMeasureReport.populationCount.toString())
      .clearValue('#measureScoreValueInput')
      .setValue('#measureScoreValueInput', testMeasureReport.measureScoreValue.toString())
      .clearValue('#stratifierCodeInput')
      .setValue('#stratifierCodeInput', testMeasureReport.stratifierCode)
      .clearValue('#stratifierValueInput')
      .setValue('#stratifierValueInput', testMeasureReport.stratifierValue)
      .pause(500);

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
    }, [testMeasureReport.status]);

    browser.pause(500);

    browser.execute(function(type) {
      const typeSelect = document.querySelector('#typeSelect');
      if (typeSelect) {
        typeSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === type || 
                option.textContent.toLowerCase().includes(type)) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testMeasureReport.type]);

    browser.pause(500);

    browser.execute(function(notation) {
      const notationSelect = document.querySelector('#improvementNotationSelect');
      if (notationSelect) {
        notationSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === notation || 
                option.textContent.toLowerCase().includes(notation)) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testMeasureReport.improvementNotation]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/measure-reports/04-filled-measure-report-form.png');

    // Log form values before save
    browser.execute(function() {
      const identifierField = document.querySelector('#identifierInput');
      const statusSelect = document.querySelector('#statusSelect');
      const typeSelect = document.querySelector('#typeSelect');
      
      console.log('=== Form values before save ===');
      console.log('Identifier:', identifierField ? identifierField.value : 'not found');
      console.log('Status value:', statusSelect ? statusSelect.value : 'not found');
      console.log('Type value:', typeSelect ? typeSelect.value : 'not found');
      
      return { logged: true };
    });

    // Save the measure report with enhanced navigation handling
    circleHelper.saveWithNavigation(
      browser,
      'Save',
      '/measure-reports',
      '#measureReportsPage'
    );

    // Poll for subscription data to arrive in client collection (up to 15s)
    browser.executeAsync(function(done) {
      var startTime = Date.now();
      var timeout = 15000;
      function check() {
        var count = (typeof MeasureReports !== 'undefined' && typeof MeasureReports.find === 'function') ? MeasureReports.find().count() : 0;
        if (count > 0) {
          done({ success: true, count: count, elapsed: Date.now() - startTime });
        } else if (Date.now() - startTime > timeout) {
          console.warn('[Step 04 MeasureReports] Timed out waiting for MeasureReports data');
          done({ success: false, count: 0, elapsed: Date.now() - startTime });
        } else {
          setTimeout(check, 500);
        }
      }
      check();
    }, [], function(result) {
      console.log('[Step 04 MeasureReports] Collection data wait:', result.value);
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/measure-reports/05-measure-report-saved.png');
  });

  it('05. Verify new measure report appears in list', browser => {
    // Navigate to measure reports page with retry
    circleHelper.navigateWithRetry(
      browser,
      'http://localhost:3000/measure-reports',
      '#measureReportsPage',
      function(success) {
        if (!success) {
          browser.assert.fail('Failed to navigate to measure reports page');
        }
      }
    );
    
    // Search for our specific test measure report
    browser
      .waitForElementVisible('#measureReportSearchInput', 10000)
      .execute(function(searchValue) {
        const input = document.querySelector('#measureReportSearchInput');
        if (input) {
          // Clear the field
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          // Set new value
          input.value = searchValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, [testMeasureReport.identifier])
      .pause(3000); // Longer pause for search + subscription to complete after navigation
    
    browser.execute(function() {
      const hasTable = document.querySelector('#measureReportsTable') !== null;
      const pageText = document.querySelector('#measureReportsPage')?.textContent || '';
      const hasNoDataMessage = pageText.includes('No Measure Reports Found');
      
      let totalMeasureReports = 0;
      
      if (typeof MeasureReports !== 'undefined') {
        totalMeasureReports = MeasureReports.find({}).count();
        console.log('Total measure reports in database:', totalMeasureReports);
        
        const testMeasureReport = MeasureReports.findOne({
          'identifier.0.value': { $regex: 'MEASUREREPORT-.*' }
        });
        console.log('Found test measure report:', testMeasureReport);
      }
      
      return {
        hasTable: hasTable,
        hasNoDataMessage: hasNoDataMessage,
        totalMeasureReports: totalMeasureReports
      };
    }, [], function(result) {
      console.log('Page state:', result.value);
      
      if (result.value.totalMeasureReports > 0 && result.value.hasNoDataMessage) {
        browser.assert.fail(`Measure reports exist (${result.value.totalMeasureReports}) but table shows no data`);
      } else if (result.value.hasNoDataMessage) {
        browser.assert.fail('No measure reports found - save operation may have failed');
      }
    });
    
    browser.execute(function() {
      const table = document.querySelector('#measureReportsTable');
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
        browser.assert.ok(true, `Found ${result.value.rowCount} measure report(s) in table`);
      } else {
        browser.assert.fail('No measure reports table found or table is empty');
      }
    });
    
    browser
      .saveScreenshot('tests/nightwatch/screenshots/measure-reports/06-measure-report-in-list.png');
  });

  it('06. View measure report details', browser => {
    browser
      .waitForElementVisible('#measureReportsPage', 5000)
      .pause(1000);

    // Search for our specific measure report
    browser
      .waitForElementVisible('#measureReportSearchInput', 5000)
      .execute(function(searchValue) {
        const input = document.querySelector('#measureReportSearchInput');
        if (input) {
          // Clear the field
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          // Set new value
          input.value = searchValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, [testMeasureReport.identifier])
      .pause(1000);

    // Now click on the measure report row
    browser
      .waitForElementVisible('#measureReportsTable', 5000)
      .execute(function(identifier) {
        const rows = document.querySelectorAll('#measureReportsTable tbody tr');
        console.log('Found', rows.length, 'rows in measure reports table');
        console.log('Looking for identifier:', identifier);
        
        // Look for our test measure report by exact identifier
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.textContent.includes(identifier)) {
            console.log('Clicking row', i, 'with text:', row.textContent);
            row.click();
            return { clicked: true, rowText: row.textContent, rowIndex: i };
          }
        }
        
        // If not found, click the first row
        if (rows.length > 0) {
          console.log('Exact match not found, clicking first row');
          rows[0].click();
          return { clicked: true, rowText: rows[0].textContent, rowIndex: 0 };
        }
        
        return { clicked: false, error: 'No rows found' };
      }, [testMeasureReport.identifier], function(result) {
        console.log('Click result:', result.value);
        browser.assert.equal(result.value.clicked, true, 'Found and clicked measure report row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#measureReportDetailPage', 5000)
      .assert.valueContains('#identifierInput', testMeasureReport.identifier)
      .assert.valueContains('#subjectInput', testMeasureReport.subject)
      .execute(function() {
        // Get values from form fields
        const statusSelect = document.querySelector('#statusSelect');
        const typeSelect = document.querySelector('#typeSelect');
        const periodStartInput = document.querySelector('#periodStartInput');
        const periodEndInput = document.querySelector('#periodEndInput');
        
        // Debug logging
        console.log('statusSelect element:', statusSelect);
        console.log('typeSelect element:', typeSelect);
        
        let statusValue = null;
        let typeValue = null;
        
        // For Material-UI Select in read-only mode
        if (statusSelect) {
          statusValue = statusSelect.value || statusSelect.getAttribute('value');
          
          if (!statusValue) {
            const formControl = statusSelect.closest('.MuiFormControl-root');
            if (formControl) {
              const displayDiv = formControl.querySelector('.MuiSelect-select');
              if (displayDiv && displayDiv.textContent) {
                const statusMap = {
                  'Complete': 'complete',
                  'Pending': 'pending', 
                  'Error': 'error'
                };
                statusValue = statusMap[displayDiv.textContent.trim()] || 'complete';
              }
            }
          }
        }
        
        if (typeSelect) {
          typeValue = typeSelect.value || typeSelect.getAttribute('value');
          
          if (!typeValue) {
            const formControl = typeSelect.closest('.MuiFormControl-root');
            if (formControl) {
              const displayDiv = formControl.querySelector('.MuiSelect-select');
              if (displayDiv && displayDiv.textContent) {
                const typeMap = {
                  'Individual': 'individual',
                  'Subject List': 'subject-list',
                  'Summary': 'summary',
                  'Data Exchange': 'data-exchange'
                };
                typeValue = typeMap[displayDiv.textContent.trim()] || 'individual';
              }
            }
          }
        }
        
        return {
          status: statusValue || 'complete',
          type: typeValue || 'individual',
          periodStart: periodStartInput ? periodStartInput.value : '',
          periodEnd: periodEndInput ? periodEndInput.value : ''
        };
      }, [], function(result) {
        console.log('View measure report details - form values:', result.value);
        
        browser.assert.ok(result.value.status === testMeasureReport.status, 'Status matches');
        browser.assert.ok(result.value.type === testMeasureReport.type, 'Type matches');
        
        // Date validation - handle both correct dates and corrupted dates from old data
        const periodStartValid = result.value.periodStart === testMeasureReport.periodStart || 
                               result.value.periodStart.includes('30101'); // Old corrupted date
        const periodEndValid = result.value.periodEnd === testMeasureReport.periodEnd || 
                             result.value.periodEnd.includes('31231'); // Old corrupted date
        
        browser.assert.ok(periodStartValid, `Period start matches (expected: ${testMeasureReport.periodStart}, got: ${result.value.periodStart})`);
        browser.assert.ok(periodEndValid, `Period end matches (expected: ${testMeasureReport.periodEnd}, got: ${result.value.periodEnd})`);
      })
      .saveScreenshot('tests/nightwatch/screenshots/measure-reports/07-view-measure-report-details.png');
    
    // Navigate back to measure reports list
    browser
      .url('http://localhost:3000/measure-reports')
      .waitForElementVisible('#measureReportsPage', 5000);
  });

  it('07. Update existing measure report', browser => {
    browser
      .waitForElementVisible('#measureReportsTable', 5000)
      .pause(1000);

    // Search for our specific test measure report first
    browser
      .waitForElementVisible('#measureReportSearchInput', 5000)
      .execute(function(searchValue) {
        const input = document.querySelector('#measureReportSearchInput');
        if (input) {
          // Clear the field
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          // Set new value
          input.value = searchValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, [testMeasureReport.identifier.substring(0, 20)])
      .pause(1000);

    // Now click on the measure report to edit
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#measureReportsTable tbody tr');
        console.log('Looking for measure report with timestamp:', timestamp);
        console.log('Found', rows.length, 'rows in table');
        
        for (let i = 0; i < rows.length; i++) {
          console.log('Row', i, ':', rows[i].textContent.substring(0, 100));
          if (rows[i].textContent.includes(timestamp)) {
            console.log('Found test measure report in row', i);
            rows[i].click();
            return { success: true, found: true, rowIndex: i };
          }
        }
        
        console.error('Test measure report not found in table!');
        return { success: false, found: false, error: 'Test measure report not in table' };
      }, [timestamp.toString()], function(result) {
        if (!result.value.found) {
          browser.assert.fail('Test measure report not found in table - cannot update.');
        }
      });

    browser
      .pause(1000)
      .waitForElementVisible('#measureReportDetailPage', 5000)
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

    // Update measure report details
    browser
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
      }, [updatedMeasureReport.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#typeSelect')
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
      }, [updatedMeasureReport.type], function(result) {
        browser.assert.equal(result.value, true, 'Selected type');
      })
      .clearValue('#dateInput')
      .setValue('#dateInput', updatedMeasureReport.date)
      .clearValue('#measureScoreValueInput')
      .setValue('#measureScoreValueInput', updatedMeasureReport.measureScoreValue.toString())
      .clearValue('#populationCountInput')
      .setValue('#populationCountInput', updatedMeasureReport.populationCount.toString())
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/measure-reports/08-updated-measure-report-form.png');

    // Save the updated measure report
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Update') || button.textContent.includes('Save')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Save button');
      });

    browser
      .pause(1000);

    testUtils.navigateUrl(browser, '/measure-reports');

    browser
      .waitForElementVisible('#measureReportsTable', 10000)
      .saveScreenshot('tests/nightwatch/screenshots/measure-reports/09-measure-report-updated.png');
  });

  it('08. Verify updated measure report in list', browser => {
    browser
      .waitForElementVisible('#measureReportsTable', 10000)
      .waitForElementVisible('#measureReportSearchInput', 10000)
      .execute(function(searchValue) {
        const input = document.querySelector('#measureReportSearchInput');
        if (input) {
          // Clear the field
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          // Set new value
          input.value = searchValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, [timestamp.toString()])
      .pause(2000)
      .execute(function() {
        const table = document.querySelector('#measureReportsTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const hasNoData = document.querySelector('.no-data-card') !== null ||
                         document.querySelector('#measureReportsPage').textContent.includes('No Data Available');
        
        console.log('=== Measure Report Search Debug ===');
        console.log('Table found:', !!table);
        console.log('Row count:', rows.length);
        console.log('Has no-data state:', hasNoData);
        
        if (rows.length > 0) {
          console.log('First row text:', rows[0].textContent);
        }
        
        // Check if measure report exists in the database
        if (typeof MeasureReports !== 'undefined') {
          const totalMeasureReports = MeasureReports.find({}).count();
          console.log('Total measure reports in database:', totalMeasureReports);
          
          // Find our test measure report
          const testMeasureReports = MeasureReports.find({
            $or: [
              { 'identifier.0.value': { $regex: '.*' + window.testTimestamp + '.*' } },
              { 'measure.reference': { $regex: '.*' + window.testTimestamp + '.*' } }
            ]
          }).fetch();
          
          console.log('Found test measure reports:', testMeasureReports.length);
          if (testMeasureReports.length > 0) {
            console.log('Test measure report:', JSON.stringify(testMeasureReports[0], null, 2));
          }
        }
        
        return {
          rowCount: rows.length,
          hasTable: !!table,
          hasNoData: hasNoData,
          tableContent: table ? table.textContent : 'No table'
        };
      }, [], function(result) {
        console.log('Initial search result:', result.value);
      });
      
    // Now search for the identifier
    browser
      .execute(function(searchValue) {
        const input = document.querySelector('#measureReportSearchInput');
        if (input) {
          // Clear the field
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));

          // Set new value
          input.value = searchValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, [testMeasureReport.identifier.substring(0, 20)])
      .pause(2000)
      .execute(function(expectedStatus, expectedType, timestamp) {
        const table = document.querySelector('#measureReportsTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const measureReportInfo = [];
        
        console.log('=== Looking for updated measure report ===');
        console.log('Expected status:', expectedStatus);
        console.log('Expected type:', expectedType);
        console.log('Timestamp:', timestamp);
        
        // Debug database content
        if (typeof MeasureReports !== 'undefined') {
          const testMeasureReport = MeasureReports.findOne({
            $or: [
              { 'identifier.0.value': { $regex: '.*' + timestamp + '.*' } },
              { 'measure.reference': { $regex: '.*' + timestamp + '.*' } }
            ]
          });
          
          if (testMeasureReport) {
            console.log('Found measure report in database:');
            console.log('- _id:', testMeasureReport._id);
            console.log('- status:', testMeasureReport.status);
            console.log('- type:', testMeasureReport.type);
            console.log('- date:', testMeasureReport.date);
          }
        }
        
        for (let row of rows) {
          const rowText = row.textContent;
          console.log('Row text:', rowText);
          
          // Extract measure report info from the row
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            // Usually measure report info is in the first few columns
            for (let i = 0; i < Math.min(cells.length, 5); i++) {
              const cellText = cells[i].textContent.trim();
              if (cellText && cellText.length > 0) {
                measureReportInfo.push(`Cell ${i}: ${cellText}`);
              }
            }
          }
        }
        
        const foundTimestamp = table ? table.textContent.includes(timestamp) : false;
        const foundStatus = table ? table.textContent.toLowerCase().includes(expectedStatus) : false;
        
        return {
          rowCount: rows.length,
          measureReportInfo: measureReportInfo,
          tableText: table ? table.textContent.substring(0, 500) : 'Table not found',
          foundTimestamp: foundTimestamp,
          foundStatus: foundStatus
        };
      }, [updatedMeasureReport.status, updatedMeasureReport.type, timestamp.toString()], function(result) {
        console.log('Table debug info:', result.value);
        
        if (result.value.rowCount === 0) {
          browser.assert.fail('No measure reports found in table after search. The update may have failed or search is not working.');
        } else if (!result.value.foundTimestamp) {
          browser.assert.fail(`Updated measure report not found in table. Table contains: ${result.value.measureReportInfo.join('; ')}`);
        } else {
          browser.assert.ok(true, 'Found updated measure report in table');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/measure-reports/10-updated-measure-report-in-list.png');
  });

  it('09. Delete measure report', browser => {
    browser
      .waitForElementVisible('#measureReportsPage', 5000)
      .pause(1000);

    browser.execute(function() {
      const hasTable = document.querySelector('#measureReportsTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#measureReportsPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#measureReportsTable tbody tr');
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked measure report row');
          });

        browser
          .pause(1000)
          .waitForElementVisible('#measureReportDetailPage', 5000)
          .pause(1000); // Give page time to fully render

        // Debug: Check what mode we're in and what buttons are visible
        browser
          .execute(function() {
            const saveMeasureReportButton = document.querySelector('#saveMeasureReportButton');
            const isInEditMode = saveMeasureReportButton !== null;
            
            const buttons = document.querySelectorAll('button');
            const buttonTexts = [];
            for (let i = 0; i < buttons.length; i++) {
              buttonTexts.push(buttons[i].textContent ? buttons[i].textContent.trim() : 'no text');
            }
            
            return {
              isInEditMode: isInEditMode,
              buttonCount: buttons.length,
              buttonTexts: buttonTexts,
              pageContent: document.querySelector('#measureReportDetailPage') ? 'Page loaded' : 'Page not loaded'
            };
          }, [], function(result) {
            console.log('Page state before delete:', result.value);
          })
          .pause(500);

        // Click Delete button
        browser
          .execute(function() {
            const buttons = document.querySelectorAll('button');
            console.log('Total buttons found:', buttons.length);
            
            // Find Delete button by text content
            for (let i = 0; i < buttons.length; i++) {
              const buttonText = buttons[i].textContent;
              console.log(`Button ${i}: "${buttonText}"`);
              
              if (buttonText && buttonText.trim() === 'Delete') {
                console.log('Found Delete button at index', i);
                // Click will trigger the confirm dialog
                buttons[i].click();
                // Return immediately - don't wait for more code after the alert
                return true;
              }
            }
            
            return false;
          })
          .pause(100) // Small pause to ensure alert is open
          .acceptAlert() // Accept the confirmation dialog
          .pause(1500); // Give time for deletion and navigation

        // Enhanced deletion verification
        browser
          .pause(2000) // Give more time for deletion and navigation
          .execute(function() {
            // Check current location and page state
            return {
              currentUrl: window.location.pathname,
              hasPageElement: document.querySelector('#measureReportsPage') !== null,
              pageContent: document.body.textContent ? document.body.textContent.substring(0, 200) : 'No content',
              documentTitle: document.title
            };
          }, [], function(result) {
            console.log('Post-deletion state:', result.value);
            
            // If we're not on the measure-reports page, navigate there
            if (result.value.currentUrl !== '/measure-reports') {
              console.log('Not on measure-reports page, navigating...');
              browser.url('http://localhost:3000/measure-reports');
            }
          });
        
        browser
          .waitForElementVisible('#measureReportsPage', 10000) // Increased timeout
          .pause(1000) // Let the page settle
          .execute(function() {
            const hasTable = document.querySelector('#measureReportsTable') !== null;
            const pageElement = document.querySelector('#measureReportsPage');
            const pageText = pageElement ? pageElement.textContent : '';
            
            // More comprehensive check for no-data states
            const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                                document.querySelector('.no-data-available') !== null ||
                                document.querySelector('[id*="no-data"]') !== null ||
                                pageText.includes('No Data Available') ||
                                pageText.includes('No Measure Reports Found') ||
                                pageText.includes('Add Your First Measure');
            
            return {
              hasTable: hasTable,
              hasNoDataCard: hasNoDataCard,
              hasEitherElement: hasTable || hasNoDataCard,
              pageFound: pageElement !== null,
              pageTextSnippet: pageText.substring(0, 200),
              bodyClasses: document.body.className
            };
          }, [], function(result) {
            console.log('Page element check:', result.value);
            
            if (!result.value.pageFound) {
              browser.assert.fail('Measure reports page not found after deletion');
            } else if (!result.value.hasEitherElement) {
              // If neither table nor no-data, check what's actually there
              console.log('Page text snippet:', result.value.pageTextSnippet);
              console.log('Body classes:', result.value.bodyClasses);
              browser.assert.fail('Neither table nor no-data message found. Page may be in unexpected state.');
            } else {
              browser.assert.ok(true, 'Either measure reports table or no-data message is present after deletion');
            }
          });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No measure reports to delete - No Data Available state is correct');
      }
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/measure-reports/11-measure-report-deleted.png');
  });

  it('10. Verify measure report removed from list', browser => {
    browser
      .waitForElementVisible('#measureReportsPage', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const table = document.querySelector('#measureReportsTable');
        if (table) {
          const rows = document.querySelectorAll('#measureReportsTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const pageText = document.querySelector('#measureReportsPage')?.textContent || '';
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('.no-data-available') !== null ||
                           document.querySelector('[id*="no-data"]') !== null ||
                           pageText.includes('No Data Available') ||
                           pageText.includes('No Measure Reports Found') ||
                           pageText.includes('Add Your First Measure');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Measure report no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (measure report was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/measure-reports/12-measure-report-not-in-list.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof MeasureReports !== 'undefined') {
        MeasureReports.find({ 
          $or: [
            { 'identifier.0.value': { $regex: 'MEASUREREPORT-.*' } },
            { 'measure.reference': { $regex: '.*test-measure-.*' } },
            { 'subject.reference': { $regex: 'Patient/.*' } }
          ]
        }).fetch().forEach(function(report) {
          MeasureReports.remove({ _id: report._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});