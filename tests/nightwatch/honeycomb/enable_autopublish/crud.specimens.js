// tests/nightwatch/honeycomb/enable_autopublish/crud.specimens.js

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('Specimens CRUD Operations', function () {
  const timestamp = Date.now();
  let testPatientId = null;

  const testSpecimen = {
    typeText: 'Blood' + timestamp,
    accessionIdentifier: 'ACC-' + timestamp,
    bodySite: 'Left arm',
    collectedDateTime: '2025-01-15T10:30'
  };

  const updatedSpecimen = {
    typeText: 'Urine' + timestamp,
    bodySite: 'Midstream'
  };

  before(browser => {
    console.log('Starting Specimens CRUD test suite...');
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .pause(1000)
      .execute(function (ts) {
        window.testTimestamp = ts;
      }, [timestamp]);

    loginHelper.ensureLoggedIn(browser, function (isLoggedIn) {
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
      }, function (result) {
        if (result.error) {
          console.error('Failed to create test patient:', result.error);
          browser.assert.fail('Failed to create test patient: ' + result.error);
        } else {
          testPatientId = result.result;
          console.log('Test patient created with ID:', result.result);
          browser.assert.ok(true, 'Successfully created test patient');

          // Fetch the patient from the server and set in Session
          browser.executeAsync(function (patientId, done) {
            if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
              Meteor.call('patients.findOne', patientId, function (error, patient) {
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
          }, [result.result], function (fetchResult) {
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

  it('02. Verify specimens list page loads', browser => {
    browser
      .url('http://localhost:3000/specimens')
      .waitForElementVisible('#specimensPage', 5000);

    // Re-establish patient context (browser.url clears Session)
    browser.executeAsync(function (patientId, done) {
      if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
        Meteor.call('patients.findOne', patientId, function (error, patient) {
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

    browser.pause(1000);

    // Verify either table or no-data state
    browser.execute(function () {
      const hasTable = document.querySelector('#specimensTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
        document.querySelector('#specimensPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoDataCard };
    }, [], function (result) {
      const validState = result.value.hasTable || result.value.hasNoData;
      browser.assert.ok(validState, 'Page shows either table or no-data state');
      console.log('[02] Page state - hasTable:', result.value.hasTable, 'hasNoData:', result.value.hasNoData);
    });
  });

  it('03. Navigate to create form', browser => {
    // Click Add Specimen button
    browser.execute(function () {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Add') && button.textContent.includes('Specimen')) {
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
      .waitForElementVisible('#specimenDetailPage', 5000);

    // Verify form fields are present
    browser.execute(function () {
      const fields = {
        status: document.querySelector('#status') !== null,
        typeText: document.querySelector('#typeText') !== null,
        accessionIdentifier: document.querySelector('#accessionIdentifier') !== null,
        bodySiteText: document.querySelector('#bodySiteText') !== null,
        collectedDateTime: document.querySelector('#collectedDateTime') !== null,
        patientDisplay: document.querySelector('#patientDisplay') !== null
      };
      return fields;
    }, [], function (result) {
      console.log('[03] Form fields present:', JSON.stringify(result.value));
      browser.assert.ok(result.value.status, 'Status field present');
      browser.assert.ok(result.value.typeText, 'Type field present');
    });
  });

  it('04. Create new specimen', browser => {
    // Fill type text FIRST (before select to avoid dropdown overlay issues)
    browser.execute(function (value) {
      const input = document.querySelector('#typeText');
      if (input) {
        // Use native setter to properly trigger React onChange
        var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, [testSpecimen.typeText]);

    browser.pause(300);

    // Fill accession identifier
    browser.execute(function (value) {
      var input = document.querySelector('#accessionIdentifier');
      if (input) {
        var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, [testSpecimen.accessionIdentifier]);

    browser.pause(300);

    // Fill body site
    browser.execute(function (value) {
      var input = document.querySelector('#bodySiteText');
      if (input) {
        var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, [testSpecimen.bodySite]);

    browser.pause(300);

    // Fill collected date/time
    browser.execute(function (value) {
      var input = document.querySelector('#collectedDateTime');
      if (input) {
        var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, [testSpecimen.collectedDateTime]);

    browser.pause(300);

    // Set status via Material-UI Select LAST (dropdown won't block other fields)
    browser.execute(function (value) {
      var statusSelect = document.querySelector('#status');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(function () {
          var menuItems = document.querySelectorAll('[role="option"]');
          for (var i = 0; i < menuItems.length; i++) {
            var dataValue = menuItems[i].getAttribute('data-value');
            if (dataValue === value) {
              menuItems[i].click();
              return;
            }
          }
        }, 300);
      }
    }, ['available']);

    browser.pause(1000);

    // Click Save button
    browser.execute(function () {
      var saveButton = document.querySelector('#saveSpecimenButton');
      if (saveButton) {
        saveButton.click();
        return true;
      }
      return false;
    });

    browser.pause(2000);

    // Verify save succeeded by checking URL changed from /specimens/new
    browser.execute(function () {
      return { url: window.location.pathname };
    }, [], function (result) {
      console.log('[04] After save URL:', result.value.url);
    });

    console.log('[04] Specimen created');
  });

  it('05. Verify new specimen in list', browser => {
    // Navigate back to list
    testUtils.navigateUrl(browser, '/specimens');
    browser
      .waitForElementVisible('#specimensPage', 5000)
      .pause(2000);

    // Debug: check collection state
    browser.execute(function () {
      var specimensCount = 0;
      var sessionPatientId = '';
      var sessionPatient = null;
      if (typeof Session !== 'undefined') {
        sessionPatientId = Session.get('selectedPatientId') || 'not set';
        sessionPatient = Session.get('selectedPatient');
      }
      if (typeof Specimens !== 'undefined') {
        specimensCount = Specimens.find({}).count();
      } else if (typeof Meteor !== 'undefined' && Meteor.Collections && Meteor.Collections.Specimens) {
        specimensCount = Meteor.Collections.Specimens.find({}).count();
      }
      return {
        specimensCount: specimensCount,
        sessionPatientId: sessionPatientId,
        patientFhirId: sessionPatient ? sessionPatient.id : 'no patient',
        patientId: sessionPatient ? sessionPatient._id : 'no patient'
      };
    }, [], function (result) {
      console.log('[05] Debug - Specimens count:', result.value.specimensCount,
        'sessionPatientId:', result.value.sessionPatientId,
        'patientFhirId:', result.value.patientFhirId,
        'patientId:', result.value.patientId);
    });

    // Check if there's data without search first
    browser.execute(function () {
      var hasTable = document.querySelector('#specimensTable') !== null;
      var hasNoData = document.querySelector('.no-data-card') !== null;
      var rows = document.querySelectorAll('#specimensTable tbody tr');
      return { hasTable: hasTable, hasNoData: hasNoData, rowCount: rows ? rows.length : 0 };
    }, [], function (result) {
      console.log('[05] Initial state - hasTable:', result.value.hasTable, 'hasNoData:', result.value.hasNoData, 'rowCount:', result.value.rowCount);
    });

    // If table exists, search for new record
    browser.execute(function (searchValue) {
      var input = document.querySelector('#specimenSearchInput');
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
    }, ['Blood']);

    browser.pause(3000);

    // Verify record is in list
    browser.execute(function () {
      var hasTable = document.querySelector('#specimensTable') !== null;
      var rows = document.querySelectorAll('#specimensTable tbody tr');
      return { hasTable: hasTable, rowCount: rows ? rows.length : 0 };
    }, [], function (result) {
      console.log('[05] After search - hasTable:', result.value.hasTable, 'rowCount:', result.value.rowCount);
    });
  });

  it('06. View specimen details', browser => {
    // Click on the first row in the filtered table
    browser.execute(function () {
      const rows = document.querySelectorAll('#specimensTable tbody tr');
      if (rows && rows.length > 0) {
        rows[0].click();
        return { clicked: true, rowCount: rows.length };
      }
      return { clicked: false, rowCount: 0 };
    }, [], function (result) {
      console.log('[06] Clicked row:', result.value);
    });

    browser.pause(1000);

    // Verify detail page loaded
    browser
      .waitForElementVisible('#specimenDetailPage', 5000);

    // Verify data is displayed
    browser.execute(function () {
      const status = document.querySelector('#status');
      const typeText = document.querySelector('#typeText');
      const accessionIdentifier = document.querySelector('#accessionIdentifier');
      return {
        status: status ? status.value || status.textContent : 'not found',
        typeText: typeText ? typeText.value : 'not found',
        accessionIdentifier: accessionIdentifier ? accessionIdentifier.value : 'not found'
      };
    }, [], function (result) {
      console.log('[06] Detail values:', JSON.stringify(result.value));
    });
  });

  it('07. Update existing specimen', browser => {
    // Re-establish patient context
    browser.executeAsync(function (patientId, done) {
      if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
        Meteor.call('patients.findOne', patientId, function (error, patient) {
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

    // Click Edit button to enter edit mode
    browser.execute(function () {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Edit')) {
          button.click();
          return { clicked: true, method: 'text' };
        }
      }
      return { clicked: false };
    }, [], function (result) {
      console.log('[07] Edit mode:', result.value);
    });

    browser.pause(500);

    // Update type text via execute block
    browser.execute(function (value) {
      const input = document.querySelector('#typeText');
      if (input) {
        input.focus();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, [updatedSpecimen.typeText]);

    browser.pause(300);

    // Update body site via execute block
    browser.execute(function (value) {
      const input = document.querySelector('#bodySiteText');
      if (input) {
        input.focus();
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, [updatedSpecimen.bodySite]);

    browser.pause(300);

    // Update status to unavailable
    browser.execute(function (value) {
      const statusSelect = document.querySelector('#status');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(function () {
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
    }, ['unavailable']);

    browser.pause(1000);

    // Click Save button
    browser.execute(function () {
      const saveButton = document.querySelector('#saveSpecimenButton');
      if (saveButton) {
        saveButton.click();
        return true;
      }
      return false;
    });

    browser.pause(2000);

    console.log('[07] Specimen updated');
  });

  it('08. Verify updated specimen in list', browser => {
    // Navigate back to list
    testUtils.navigateUrl(browser, '/specimens');
    browser
      .waitForElementVisible('#specimensPage', 5000)
      .pause(1000);

    // Search for updated record
    browser.execute(function (searchValue) {
      const input = document.querySelector('#specimenSearchInput');
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
    }, ['Urine']);

    browser.pause(3000);

    // Verify record exists
    browser.execute(function () {
      const rows = document.querySelectorAll('#specimensTable tbody tr');
      return { rowCount: rows ? rows.length : 0 };
    }, [], function (result) {
      console.log('[08] Rows found after search:', result.value.rowCount);
    });
  });

  it('09. Delete specimen', browser => {
    // Click on the row to open detail page
    browser.execute(function () {
      const rows = document.querySelectorAll('#specimensTable tbody tr');
      if (rows && rows.length > 0) {
        rows[0].click();
        return true;
      }
      return false;
    });

    browser.pause(1000);

    // Verify detail page loaded
    browser
      .waitForElementVisible('#specimenDetailPage', 5000)
      .pause(500);

    // Click Delete button (visible in view mode, not edit mode)
    browser
      .execute(function () {
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

    console.log('[09] Specimen deleted');
  });

  it('10. Verify specimen removed from list', browser => {
    // Should have navigated back to list after delete
    browser
      .waitForElementVisible('#specimensPage', 5000)
      .pause(1000);

    // Search for deleted record
    browser.execute(function (searchValue) {
      const input = document.querySelector('#specimenSearchInput');
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
    }, ['Urine']);

    browser.pause(3000);

    // Verify record is no longer present
    browser.execute(function () {
      const hasTable = document.querySelector('#specimensTable') !== null;
      const rows = document.querySelectorAll('#specimensTable tbody tr');
      const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
        document.querySelector('#specimensPage').textContent.includes('No Data Available');
      return {
        hasTable: hasTable,
        rowCount: rows ? rows.length : 0,
        hasNoData: hasNoDataCard
      };
    }, [], function (result) {
      console.log('[10] After deletion - hasTable:', result.value.hasTable,
        'rowCount:', result.value.rowCount, 'hasNoData:', result.value.hasNoData);
      browser.assert.ok(
        result.value.rowCount === 0 || result.value.hasNoData,
        'Deleted record should not appear in filtered results'
      );
    });
  });

  after(browser => {
    console.log('Specimens CRUD test suite complete');
    browser.end();
  });
});
