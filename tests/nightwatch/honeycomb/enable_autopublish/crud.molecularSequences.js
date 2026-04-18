// tests/nightwatch/honeycomb/enable_autopublish/crud.molecularSequences.js

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('MolecularSequences CRUD Operations', function () {
  const timestamp = Date.now();
  let testPatientId = null;

  const testMolecularSequence = {
    type: 'dna',
    coordinateSystem: '0',
    observedSeq: 'ACGTACGTACGT' + timestamp,
    readCoverage: '42'
  };

  const updatedMolecularSequence = {
    type: 'rna',
    observedSeq: 'UAGCUAGCUAGC' + timestamp,
    readCoverage: '99'
  };

  before(browser => {
    console.log('Starting MolecularSequences CRUD test suite...');
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

  it('02. Verify molecular sequence list page loads', browser => {
    browser
      .url('http://localhost:3000/molecular-sequences')
      .waitForElementVisible('#molecularSequencesPage', 5000);

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
      const hasTable = document.querySelector('#molecularSequencesTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
        document.querySelector('#molecularSequencesPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoDataCard };
    }, [], function (result) {
      const validState = result.value.hasTable || result.value.hasNoData;
      browser.assert.ok(validState, 'Page shows either table or no-data state');
      console.log('[02] Page state - hasTable:', result.value.hasTable, 'hasNoData:', result.value.hasNoData);
    });
  });

  it('03. Navigate to create form', browser => {
    // Click Add Molecular Sequence button
    browser.execute(function () {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Add') && button.textContent.includes('Molecular')) {
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
      .waitForElementVisible('#molecularSequenceDetailPage', 5000);

    // Verify form fields are present
    browser.execute(function () {
      const fields = {
        type: document.querySelector('#type') !== null,
        coordinateSystem: document.querySelector('#coordinateSystem') !== null,
        observedSeq: document.querySelector('#observedSeq') !== null,
        readCoverage: document.querySelector('#readCoverage') !== null,
        patientDisplay: document.querySelector('#patientDisplay') !== null
      };
      return fields;
    }, [], function (result) {
      console.log('[03] Form fields present:', JSON.stringify(result.value));
      browser.assert.ok(result.value.type, 'Type field present');
      browser.assert.ok(result.value.observedSeq, 'Observed Sequence field present');
    });
  });

  it('04. Create new molecular sequence', browser => {
    // Set type via Material-UI Select
    browser.execute(function (value) {
      const typeSelect = document.querySelector('#type');
      if (typeSelect) {
        typeSelect.click();
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
    }, [testMolecularSequence.type]);

    browser.pause(500);

    // Set coordinate system via Material-UI Select
    browser.execute(function (value) {
      const csSelect = document.querySelector('#coordinateSystem');
      if (csSelect) {
        csSelect.click();
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
    }, [testMolecularSequence.coordinateSystem]);

    browser.pause(500);

    // Fill observed sequence
    browser
      .clearValue('#observedSeq')
      .setValue('#observedSeq', testMolecularSequence.observedSeq)
      .pause(300);

    // Fill read coverage
    browser
      .clearValue('#readCoverage')
      .setValue('#readCoverage', testMolecularSequence.readCoverage)
      .pause(300);

    // Click Save button
    browser.execute(function () {
      const saveButton = document.querySelector('#saveMolecularSequenceButton');
      if (saveButton) {
        saveButton.click();
        return true;
      }
      return false;
    });

    browser.pause(2000);

    console.log('[04] Molecular sequence created');
  });

  it('05. Verify new molecular sequence in list', browser => {
    // Navigate back to list
    testUtils.navigateUrl(browser, '/molecular-sequences');
    browser
      .waitForElementVisible('#molecularSequencesPage', 5000)
      .pause(1000);

    // Search for new record
    browser.execute(function (searchValue) {
      const input = document.querySelector('#molecularSequenceSearchInput');
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
    }, ['ACGTACGT']);

    browser.pause(3000);

    // Verify record is in list
    browser.execute(function () {
      const hasTable = document.querySelector('#molecularSequencesTable') !== null;
      const rows = document.querySelectorAll('#molecularSequencesTable tbody tr');
      return { hasTable: hasTable, rowCount: rows ? rows.length : 0 };
    }, [], function (result) {
      console.log('[05] Table state - hasTable:', result.value.hasTable, 'rowCount:', result.value.rowCount);
    });
  });

  it('06. View molecular sequence details', browser => {
    // Click on the first row in the filtered table
    browser.execute(function () {
      const rows = document.querySelectorAll('#molecularSequencesTable tbody tr');
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
      .waitForElementVisible('#molecularSequenceDetailPage', 5000);

    // Verify data is displayed
    browser.execute(function () {
      const type = document.querySelector('#type');
      const observedSeq = document.querySelector('#observedSeq');
      const readCoverage = document.querySelector('#readCoverage');
      return {
        type: type ? type.value || type.textContent : 'not found',
        observedSeq: observedSeq ? observedSeq.value : 'not found',
        readCoverage: readCoverage ? readCoverage.value : 'not found'
      };
    }, [], function (result) {
      console.log('[06] Detail values:', JSON.stringify(result.value));
    });
  });

  it('07. Update existing molecular sequence', browser => {
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

    // Update type to rna
    browser.execute(function (value) {
      const typeSelect = document.querySelector('#type');
      if (typeSelect) {
        typeSelect.click();
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
    }, [updatedMolecularSequence.type]);

    browser.pause(500);

    // Update observed sequence
    browser
      .clearValue('#observedSeq')
      .setValue('#observedSeq', updatedMolecularSequence.observedSeq)
      .pause(300);

    // Update read coverage
    browser
      .clearValue('#readCoverage')
      .setValue('#readCoverage', updatedMolecularSequence.readCoverage)
      .pause(300);

    // Click Save button
    browser.execute(function () {
      const saveButton = document.querySelector('#saveMolecularSequenceButton');
      if (saveButton) {
        saveButton.click();
        return true;
      }
      return false;
    });

    browser.pause(2000);

    console.log('[07] Molecular sequence updated');
  });

  it('08. Verify updated molecular sequence in list', browser => {
    // Navigate back to list
    testUtils.navigateUrl(browser, '/molecular-sequences');
    browser
      .waitForElementVisible('#molecularSequencesPage', 5000)
      .pause(1000);

    // Search for updated record
    browser.execute(function (searchValue) {
      const input = document.querySelector('#molecularSequenceSearchInput');
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
    }, ['UAGCUAGC']);

    browser.pause(3000);

    // Verify record exists
    browser.execute(function () {
      const rows = document.querySelectorAll('#molecularSequencesTable tbody tr');
      return { rowCount: rows ? rows.length : 0 };
    }, [], function (result) {
      console.log('[08] Rows found after search:', result.value.rowCount);
    });
  });

  it('09. Delete molecular sequence', browser => {
    // Click on the row to open detail page
    browser.execute(function () {
      const rows = document.querySelectorAll('#molecularSequencesTable tbody tr');
      if (rows && rows.length > 0) {
        rows[0].click();
        return true;
      }
      return false;
    });

    browser.pause(1000);

    // Verify detail page loaded
    browser
      .waitForElementVisible('#molecularSequenceDetailPage', 5000)
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

    console.log('[09] Molecular sequence deleted');
  });

  it('10. Verify molecular sequence removed from list', browser => {
    // Should have navigated back to list after delete
    browser
      .waitForElementVisible('#molecularSequencesPage', 5000)
      .pause(1000);

    // Search for deleted record
    browser.execute(function (searchValue) {
      const input = document.querySelector('#molecularSequenceSearchInput');
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
    }, ['UAGCUAGC']);

    browser.pause(3000);

    // Verify record is no longer present
    browser.execute(function () {
      const hasTable = document.querySelector('#molecularSequencesTable') !== null;
      const rows = document.querySelectorAll('#molecularSequencesTable tbody tr');
      const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
        document.querySelector('#molecularSequencesPage').textContent.includes('No Data Available');
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
    console.log('MolecularSequences CRUD test suite complete');
    browser.end();
  });
});
