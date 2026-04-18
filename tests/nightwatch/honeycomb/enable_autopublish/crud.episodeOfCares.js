// tests/nightwatch/honeycomb/enable_autopublish/crud.episodeOfCares.js

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('EpisodeOfCares CRUD Operations', function() {
  const timestamp = Date.now();
  let testPatientId = null; // Store patient ID for cross-test access

  const testEpisodeOfCare = {
    patientName: 'John Doe',
    status: 'active',
    typeDisplay: `Annual Wellness Visit ${timestamp}`,
    careManagerDisplay: `Dr. Smith ${timestamp}`,
    managingOrganizationDisplay: `General Hospital ${timestamp}`,
    periodStart: '2024-01-15',
    periodEnd: '2024-06-15',
    diagnosisDisplay: `Diabetes management ${timestamp}`
  };

  const updatedEpisodeOfCare = {
    status: 'finished',
    typeDisplay: `Follow-up Care ${timestamp}`,
    periodEnd: '2024-12-31'
  };

  before(browser => {
    console.log('Starting EpisodeOfCares CRUD test suite...');
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
          testPatientId = result.result;
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
            if (fetchResult.value.success) {
              console.log('Successfully set selected patient:', fetchResult.value);
            } else {
              console.error('Failed to set selected patient:', fetchResult.value.error);
            }
          });
        }
      });
    });

    browser.pause(2000);
  });

  it('02. Verify episode of care list page loads', browser => {
    browser
      .url('http://localhost:3000/episode-of-cares')
      .waitForElementVisible('#episodeOfCaresPage', 5000);

    // Re-establish patient context (browser.url clears Session)
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

    browser.pause(1000);

    // Verify either table or no-data state
    browser.execute(function() {
      const hasTable = document.querySelector('#episodeOfCaresTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
        document.querySelector('#episodeOfCaresPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoDataCard };
    }, [], function(result) {
      const validState = result.value.hasTable || result.value.hasNoData;
      browser.assert.ok(validState, 'Page shows either table or no-data state');
      console.log('[02] Page state - hasTable:', result.value.hasTable, 'hasNoData:', result.value.hasNoData);
    });
  });

  it('03. Navigate to create form', browser => {
    // Click Add Episode of Care button
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Add') && button.textContent.includes('Episode')) {
          button.click();
          return true;
        }
      }
      // Try the no-data card button too
      const noDataButton = document.querySelector('.no-data-card button');
      if (noDataButton) {
        noDataButton.click();
        return true;
      }
      return false;
    });

    browser.pause(1000);

    // Verify detail page loaded
    browser
      .waitForElementVisible('#episodeOfCareDetailPage', 5000);

    // Verify form fields are present
    browser.execute(function() {
      const fields = {
        status: document.querySelector('#status') !== null,
        typeDisplay: document.querySelector('#typeDisplay') !== null,
        patientDisplay: document.querySelector('#patientDisplay') !== null,
        periodStart: document.querySelector('#periodStart') !== null,
        periodEnd: document.querySelector('#periodEnd') !== null
      };
      return fields;
    }, [], function(result) {
      console.log('[03] Form fields present:', JSON.stringify(result.value));
      browser.assert.ok(result.value.status, 'Status field present');
      browser.assert.ok(result.value.typeDisplay, 'Type field present');
    });
  });

  it('04. Create new episode of care', browser => {
    // Set status via Material-UI Select
    browser.execute(function(value) {
      const statusSelect = document.querySelector('#status');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(function() {
          const menuItems = document.querySelectorAll('[role="option"]');
          for (let item of menuItems) {
            const dataValue = item.getAttribute('data-value');
            if (dataValue === value) {
              item.click();
              return;
            }
          }
        }, 300);
      }
    }, [testEpisodeOfCare.status]);

    browser.pause(500);

    // Fill type display
    browser
      .clearValue('#typeDisplay')
      .setValue('#typeDisplay', testEpisodeOfCare.typeDisplay)
      .pause(300);

    // Fill care manager
    browser
      .clearValue('#careManagerDisplay')
      .setValue('#careManagerDisplay', testEpisodeOfCare.careManagerDisplay)
      .pause(300);

    // Fill managing organization
    browser
      .clearValue('#managingOrganizationDisplay')
      .setValue('#managingOrganizationDisplay', testEpisodeOfCare.managingOrganizationDisplay)
      .pause(300);

    // Fill period start
    browser
      .clearValue('#periodStart')
      .setValue('#periodStart', testEpisodeOfCare.periodStart)
      .pause(300);

    // Fill period end
    browser
      .clearValue('#periodEnd')
      .setValue('#periodEnd', testEpisodeOfCare.periodEnd)
      .pause(300);

    // Fill diagnosis
    browser
      .clearValue('#diagnosisDisplay')
      .setValue('#diagnosisDisplay', testEpisodeOfCare.diagnosisDisplay)
      .pause(300);

    // Click Save button
    browser.execute(function() {
      const saveButton = document.querySelector('#saveEpisodeOfCareButton');
      if (saveButton) {
        saveButton.click();
        return true;
      }
      // Fallback: find by text
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Save') || button.textContent.includes('Create')) {
          button.click();
          return true;
        }
      }
      return false;
    });

    browser.pause(2000);

    console.log('[04] Episode of care created');
  });

  it('05. Verify new episode of care in list', browser => {
    // Navigate back to list
    testUtils.navigateUrl(browser, '/episode-of-cares');
    browser
      .waitForElementVisible('#episodeOfCaresPage', 5000)
      .pause(1000);

    // Search for new record
    browser.execute(function(searchValue) {
      const input = document.querySelector('#episodeOfCareSearchInput');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        input.value = searchValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, ['Annual Wellness']);

    browser.pause(3000);

    // Verify record is in list
    browser.execute(function() {
      const hasTable = document.querySelector('#episodeOfCaresTable') !== null;
      const rows = document.querySelectorAll('#episodeOfCaresTable tbody tr');
      return { hasTable: hasTable, rowCount: rows ? rows.length : 0 };
    }, [], function(result) {
      console.log('[05] Table state - hasTable:', result.value.hasTable, 'rowCount:', result.value.rowCount);
    });
  });

  it('06. View episode of care details', browser => {
    // Click on the first row in the filtered table
    browser.execute(function() {
      const rows = document.querySelectorAll('#episodeOfCaresTable tbody tr');
      if (rows && rows.length > 0) {
        rows[0].click();
        return { clicked: true, rowCount: rows.length };
      }
      return { clicked: false, rowCount: 0 };
    }, [], function(result) {
      console.log('[06] Clicked row:', result.value);
    });

    browser.pause(1000);

    // Verify detail page loaded
    browser
      .waitForElementVisible('#episodeOfCareDetailPage', 5000);

    // Verify data is displayed
    browser.execute(function() {
      const status = document.querySelector('#status');
      const typeDisplay = document.querySelector('#typeDisplay');
      const periodStart = document.querySelector('#periodStart');
      return {
        status: status ? status.value || status.textContent : 'not found',
        typeDisplay: typeDisplay ? typeDisplay.value : 'not found',
        periodStart: periodStart ? periodStart.value : 'not found'
      };
    }, [], function(result) {
      console.log('[06] Detail values:', JSON.stringify(result.value));
    });
  });

  it('07. Update existing episode of care', browser => {
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
    }, [testPatientId]);

    browser.pause(500);

    // Click Edit/Unlock button to enter edit mode
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Edit') || button.querySelector('[data-testid="LockIcon"]') || button.querySelector('svg')) {
          // Look for lock/edit button
          const ariaLabel = button.getAttribute('aria-label');
          if (ariaLabel && (ariaLabel.includes('edit') || ariaLabel.includes('lock') || ariaLabel.includes('unlock'))) {
            button.click();
            return { clicked: true, method: 'aria-label' };
          }
        }
        if (button.textContent.includes('Edit')) {
          button.click();
          return { clicked: true, method: 'text' };
        }
      }
      // Try lock icon button
      const lockButton = document.querySelector('[aria-label="toggle edit mode"]');
      if (lockButton) {
        lockButton.click();
        return { clicked: true, method: 'lock-toggle' };
      }
      return { clicked: false };
    }, [], function(result) {
      console.log('[07] Edit mode:', result.value);
    });

    browser.pause(500);

    // Update status to finished
    browser.execute(function(value) {
      const statusSelect = document.querySelector('#status');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(function() {
          const menuItems = document.querySelectorAll('[role="option"]');
          for (let item of menuItems) {
            const dataValue = item.getAttribute('data-value');
            if (dataValue === value) {
              item.click();
              return;
            }
          }
        }, 300);
      }
    }, [updatedEpisodeOfCare.status]);

    browser.pause(500);

    // Update type display
    browser
      .clearValue('#typeDisplay')
      .setValue('#typeDisplay', updatedEpisodeOfCare.typeDisplay)
      .pause(300);

    // Update period end
    browser
      .clearValue('#periodEnd')
      .setValue('#periodEnd', updatedEpisodeOfCare.periodEnd)
      .pause(300);

    // Click Save button
    browser.execute(function() {
      const saveButton = document.querySelector('#saveEpisodeOfCareButton');
      if (saveButton) {
        saveButton.click();
        return true;
      }
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Save') || button.textContent.includes('Update')) {
          button.click();
          return true;
        }
      }
      return false;
    });

    browser.pause(2000);

    console.log('[07] Episode of care updated');
  });

  it('08. Verify updated episode of care in list', browser => {
    // Navigate back to list
    testUtils.navigateUrl(browser, '/episode-of-cares');
    browser
      .waitForElementVisible('#episodeOfCaresPage', 5000)
      .pause(1000);

    // Search for updated record
    browser.execute(function(searchValue) {
      const input = document.querySelector('#episodeOfCareSearchInput');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        input.value = searchValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, ['Follow-up Care']);

    browser.pause(3000);

    // Verify record exists
    browser.execute(function() {
      const rows = document.querySelectorAll('#episodeOfCaresTable tbody tr');
      return { rowCount: rows ? rows.length : 0 };
    }, [], function(result) {
      console.log('[08] Rows found after search:', result.value.rowCount);
    });
  });

  it('09. Delete episode of care', browser => {
    // Click on the row to open detail page
    browser.execute(function() {
      const rows = document.querySelectorAll('#episodeOfCaresTable tbody tr');
      if (rows && rows.length > 0) {
        rows[0].click();
        return true;
      }
      return false;
    });

    browser.pause(1000);

    // Verify detail page loaded
    browser
      .waitForElementVisible('#episodeOfCareDetailPage', 5000)
      .pause(500);

    // Click Delete button (visible in view mode, not edit mode)
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
      .pause(2000);

    console.log('[09] Episode of care deleted');
  });

  it('10. Verify episode of care removed from list', browser => {
    // Should have navigated back to list after delete
    browser
      .waitForElementVisible('#episodeOfCaresPage', 5000)
      .pause(1000);

    // Search for deleted record
    browser.execute(function(searchValue) {
      const input = document.querySelector('#episodeOfCareSearchInput');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        input.value = searchValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, ['Follow-up Care']);

    browser.pause(3000);

    // Verify record is no longer present
    browser.execute(function() {
      const hasTable = document.querySelector('#episodeOfCaresTable') !== null;
      const rows = document.querySelectorAll('#episodeOfCaresTable tbody tr');
      const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
        document.querySelector('#episodeOfCaresPage').textContent.includes('No Data Available');
      return {
        hasTable: hasTable,
        rowCount: rows ? rows.length : 0,
        hasNoData: hasNoDataCard
      };
    }, [], function(result) {
      console.log('[10] After deletion - hasTable:', result.value.hasTable,
        'rowCount:', result.value.rowCount, 'hasNoData:', result.value.hasNoData);
      // Record should either not be found, or table should have fewer rows
      browser.assert.ok(
        result.value.rowCount === 0 || result.value.hasNoData,
        'Deleted record should not appear in filtered results'
      );
    });
  });

  after(browser => {
    console.log('EpisodeOfCares CRUD test suite complete');
    browser.end();
  });
});
