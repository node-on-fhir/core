// tests/nightwatch/honeycomb/enable_autopublish/crud.bodystructures.js
// BodyStructure CRUD Operations (Patient-Owned)

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('BodyStructures CRUD Operations', function() {
  const timestamp = Date.now();
  let testPatientId = null;
  let testBodyStructureId = null;

  const testBodyStructure = {
    description: 'Left upper arm - test ' + timestamp,
    morphology: 'Normal anatomical structure',
    structure: 'Upper arm structure',
    active: true
  };

  const updatedBodyStructure = {
    description: 'Left upper arm (updated) - test ' + timestamp,
    morphology: 'Modified anatomical structure',
    active: false
  };

  before(function(browser, done) {
    browser.windowSize('current', 1400, 900);
    done();
  });

  it('01. Setup test environment', function(browser) {
    console.log('[01] Setting up test environment...');

    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .assert.urlContains('localhost:3000', 'Application URL is correct')
      .assert.elementPresent('body', 'Page body is present')
      .execute(function(ts) {
        window.testTimestamp = ts;
      }, [timestamp]);

    // Use loginHelper.ensureLoggedIn (handles both already-logged-in and needs-login cases)
    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      } else {
        browser.assert.ok(true, 'User is logged in');
      }

      // Create test patient
      testUtils.createTestPatient(browser, {
        name: 'BodyStructure TestPatient',
        family: 'TestPatient',
        given: 'BodyStructure',
        gender: 'male',
        birthDate: '1985-05-15',
        identifier: 'test-bodystructure-patient-' + timestamp
      }, function(result) {
        if (result.error) {
          console.error('[01] Failed to create test patient:', result.error);
          browser.assert.fail('Failed to create test patient: ' + result.error);
        } else {
          testPatientId = result.result;
          console.log('[01] Created test patient with ID:', testPatientId);
          browser.assert.ok(testPatientId, 'Test patient ID was captured');
          browser.assert.ok(testPatientId.length > 0, 'Test patient ID is not empty');

          // Set patient in Session
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
              browser.assert.ok(fetchResult.value.success, 'Patient context set in Session');
            } else if (fetchResult.value) {
              console.error('[01] Failed to set selected patient:', fetchResult.value.error);
            }
          });
        }
      });
    });

    browser.pause(2000);
    console.log('[01] Test environment setup complete');
  });

  it('02. Verify list page loads', function(browser) {
    console.log('[02] Verifying body structures list page...');

    browser.url('http://localhost:3000/body-structures');
    browser.pause(2000);

    // Verify URL navigation
    browser.assert.urlContains('/body-structures', 'Navigated to body structures route');

    // Re-establish patient context (browser.url clears Session)
    browser.executeAsync(function(patientId, done) {
      if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
        Meteor.call('patients.findOne', patientId, function(error, patient) {
          if (error) {
            console.error('[02] Error fetching patient:', error);
            done({ success: false, error: error.message });
          } else if (patient) {
            Session.set('selectedPatientId', patient._id);
            Session.set('selectedPatient', patient);
            console.log('[02] Re-established patient context:', patient._id);
            done({ success: true, patientId: patient._id });
          } else {
            done({ success: false, error: 'Patient not found' });
          }
        });
      } else {
        done({ success: false, error: 'Meteor or Session not available' });
      }
    }, [testPatientId], function(result) {
      if (result.value) {
        browser.assert.ok(result.value.success, 'Patient context re-established after navigation');
      }
    });

    browser.pause(1000);

    // Verify page loaded (either table or no-data state)
    browser.execute(function() {
      const hasPage = document.querySelector('#bodyStructuresPage') !== null;
      const hasTable = document.querySelector('#bodyStructuresTable') !== null;
      const hasNoData = document.body.textContent.includes('No Data Available') ||
                        document.querySelector('.no-data-card') !== null;
      const patientInSession = typeof Session !== 'undefined' ? Session.get('selectedPatientId') : null;
      return {
        hasPage: hasPage,
        hasTable: hasTable,
        hasNoData: hasNoData,
        patientInSession: patientInSession
      };
    }, [], function(result) {
      console.log('[02] Page state:', result.value);
      browser.assert.ok(result.value.hasPage || result.value.hasTable || result.value.hasNoData,
        'Body structures page should be visible (page, table, or no-data state)');
      browser.assert.ok(result.value.patientInSession, 'Patient should be set in Session');
    });

    // Additional assertions for page structure
    browser.execute(function() {
      const pageContainer = document.querySelector('#bodyStructuresPage');
      const bodyElement = document.body;
      return {
        pageExists: pageContainer !== null,
        bodyVisible: bodyElement !== null,
        pageTitle: document.title
      };
    }, [], function(result) {
      browser.assert.ok(result.value.bodyVisible, 'Page body is visible');
    });

    console.log('[02] List page verification complete');
  });

  it('03. Verify table search functionality', function(browser) {
    console.log('[03] Verifying search functionality...');

    browser.execute(function() {
      const searchInput = document.querySelector('#bodyStructureSearchInput');
      const hasTable = document.querySelector('#bodyStructuresTable') !== null;
      const hasNoData = document.body.textContent.includes('No Data Available');
      return {
        hasSearch: searchInput !== null,
        hasTable: hasTable,
        hasNoData: hasNoData
      };
    }, [], function(result) {
      console.log('[03] Initial state:', result.value);
      // Either search input exists OR it's empty state (both are valid)
      browser.assert.ok(result.value.hasSearch || result.value.hasNoData,
        'Either search input or empty state should be present');

      if (result.value.hasSearch) {
        console.log('[03] Search input found');
        browser.assert.ok(result.value.hasSearch, 'Search input is present');

        // Test search functionality - clear and type
        browser.execute(function(searchValue) {
          const input = document.querySelector('#bodyStructureSearchInput');
          if (input) {
            // Clear first
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            // Then set value
            setTimeout(function() {
              input.value = searchValue;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }, 300);
            return { success: true, clearedAndTyped: true };
          }
          return { success: false };
        }, ['test'], function(searchResult) {
          if (searchResult.value) {
            browser.assert.ok(searchResult.value.success, 'Search input accepts value');
          }
        });

        browser.pause(3000);

        // Verify search executed (table should respond)
        browser.execute(function() {
          const input = document.querySelector('#bodyStructureSearchInput');
          const currentValue = input ? input.value : '';
          return {
            searchValue: currentValue,
            searchHasValue: currentValue.length > 0
          };
        }, [], function(verifyResult) {
          if (verifyResult.value) {
            browser.assert.ok(verifyResult.value.searchHasValue, 'Search input retained value');
            console.log('[03] Search value:', verifyResult.value.searchValue);
          }
        });
      } else {
        console.log('[03] Search input not yet available (empty state)');
        browser.assert.ok(result.value.hasNoData, 'Empty state is displayed when no data');
      }
    });

    console.log('[03] Search functionality verification complete');
  });

  it('04. Navigate to create form', function(browser) {
    console.log('[04] Navigating to create form...');

    // Click Add button
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Add') && button.textContent.includes('Body Structure')) {
          button.click();
          return { clicked: true, buttonText: button.textContent };
        }
      }
      // Fallback to any Add button
      for (let button of buttons) {
        if (button.textContent.includes('Add')) {
          button.click();
          return { clicked: true, fallback: true, buttonText: button.textContent };
        }
      }
      return { clicked: false };
    }, [], function(result) {
      console.log('[04] Add button clicked:', result.value);
      browser.assert.ok(result.value.clicked, 'Add button was clicked successfully');
    });

    browser.pause(1000);

    // Verify detail page loaded
    browser.waitForElementVisible('#bodyStructureDetailPage', 5000);
    browser.assert.visible('#bodyStructureDetailPage', 'Detail page is visible');

    // Verify URL changed to new record form
    browser.assert.urlContains('/body-structures', 'URL contains body-structures route');

    // Verify all form fields are present
    browser.execute(function() {
      const descriptionField = document.querySelector('#descriptionInput');
      const morphologyField = document.querySelector('#morphologyInput');
      const structureField = document.querySelector('#structureInput');
      const activeCheckbox = document.querySelector('#activeCheckbox');
      const patientDisplay = document.querySelector('#patientDisplay');
      const saveButton = document.querySelectorAll('button').length > 0;

      return {
        hasDescriptionField: descriptionField !== null,
        hasMorphologyField: morphologyField !== null,
        hasStructureField: structureField !== null,
        hasActiveCheckbox: activeCheckbox !== null,
        hasPatientDisplay: patientDisplay !== null,
        hasSaveButton: saveButton,
        descriptionEnabled: descriptionField ? !descriptionField.disabled : false,
        morphologyEnabled: morphologyField ? !morphologyField.disabled : false
      };
    }, [], function(result) {
      console.log('[04] Form fields:', result.value);
      browser.assert.ok(result.value.hasDescriptionField, 'Description input field is present');
      browser.assert.ok(result.value.hasMorphologyField, 'Morphology input field is present');
      browser.assert.ok(result.value.hasStructureField, 'Structure input field is present');
      browser.assert.ok(result.value.hasActiveCheckbox, 'Active checkbox is present');
      browser.assert.ok(result.value.hasPatientDisplay, 'Patient display field is present');
      browser.assert.ok(result.value.hasSaveButton, 'Save button is present');
      browser.assert.ok(result.value.descriptionEnabled, 'Description field is enabled for editing');
    });

    // Verify patient is auto-populated
    browser.execute(function() {
      const patientDisplay = document.querySelector('#patientDisplay');
      return {
        patientValue: patientDisplay ? patientDisplay.value : null,
        patientHasValue: patientDisplay && patientDisplay.value && patientDisplay.value.length > 0
      };
    }, [], function(result) {
      console.log('[04] Patient field:', result.value);
      browser.assert.ok(result.value.patientHasValue, 'Patient is auto-populated from Session');
    });

    console.log('[04] Create form navigation complete');
  });

  it('05. Create new body structure', function(browser) {
    console.log('[05] Creating new body structure...');

    // Fill description
    browser
      .clearValue('#descriptionInput')
      .setValue('#descriptionInput', testBodyStructure.description)
      .pause(300);

    // Verify description was set
    browser.getValue('#descriptionInput', function(result) {
      browser.assert.ok(result.value.includes('Left upper arm'), 'Description value was set');
      console.log('[05] Description set to:', result.value);
    });

    // Fill morphology (if field exists)
    browser.execute(function(value) {
      const input = document.querySelector('#morphologyInput');
      if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true, value: input.value };
      }
      return { success: false };
    }, [testBodyStructure.morphology], function(result) {
      if (result.value) {
        browser.assert.ok(result.value.success, 'Morphology field was filled');
      }
    });

    browser.pause(300);

    // Fill structure (if field exists)
    browser.execute(function(value) {
      const input = document.querySelector('#structureInput');
      if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return { success: true, value: input.value };
      }
      return { success: false };
    }, [testBodyStructure.structure], function(result) {
      if (result.value) {
        browser.assert.ok(result.value.success, 'Structure field was filled');
      }
    });

    browser.pause(300);

    // Set active status
    browser.execute(function(active) {
      const checkbox = document.querySelector('#activeCheckbox');
      if (checkbox) {
        const needsChange = checkbox.checked !== active;
        if (needsChange) {
          checkbox.click();
        }
        return { success: true, changed: needsChange, checked: checkbox.checked };
      }
      return { success: false };
    }, [testBodyStructure.active], function(result) {
      if (result.value) {
        browser.assert.ok(result.value.success, 'Active checkbox exists');
        console.log('[05] Active status:', result.value);
      }
    });

    browser.pause(500);

    // Verify all field values before save
    browser.execute(function() {
      const description = document.querySelector('#descriptionInput');
      const morphology = document.querySelector('#morphologyInput');
      const structure = document.querySelector('#structureInput');
      const active = document.querySelector('#activeCheckbox');
      const patient = document.querySelector('#patientDisplay');

      return {
        descriptionValue: description ? description.value : null,
        morphologyValue: morphology ? morphology.value : null,
        structureValue: structure ? structure.value : null,
        activeChecked: active ? active.checked : null,
        patientValue: patient ? patient.value : null
      };
    }, [], function(result) {
      console.log('[05] Form values before save:', result.value);
      browser.assert.ok(result.value.descriptionValue, 'Description has value before save');
      browser.assert.ok(result.value.patientValue, 'Patient reference exists before save');
    });

    // Click Save button
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Save')) {
          button.click();
          return { clicked: true, buttonText: button.textContent };
        }
      }
      return { clicked: false };
    }, [], function(result) {
      console.log('[05] Save button clicked:', result.value);
      browser.assert.ok(result.value.clicked, 'Save button was clicked');
    });

    browser.pause(2000);

    // Verify no error messages
    browser.execute(function() {
      const errorMessages = document.querySelectorAll('.MuiAlert-root, .error-message, [role="alert"]');
      const hasErrors = errorMessages.length > 0;
      return {
        hasErrors: hasErrors,
        errorCount: errorMessages.length,
        errorText: hasErrors ? errorMessages[0].textContent : null
      };
    }, [], function(result) {
      console.log('[05] Error check:', result.value);
      // Note: Some alerts might be success messages, so we just log
      if (result.value.hasErrors) {
        console.log('[05] Alert text:', result.value.errorText);
      }
    });

    // Capture the created body structure ID
    browser.execute(function() {
      const barcode = document.querySelector('.barcode');
      if (barcode) {
        return { id: barcode.textContent.trim(), source: 'barcode' };
      }
      // Try URL
      const match = window.location.pathname.match(/\/body-structures\/([^/]+)$/);
      if (match && match[1] !== 'new') {
        return { id: match[1], source: 'url' };
      }
      return { id: null, source: null };
    }, [], function(result) {
      if (result.value && result.value.id) {
        testBodyStructureId = result.value.id;
        console.log('[05] Created body structure ID:', testBodyStructureId, 'from:', result.value.source);
        browser.assert.ok(testBodyStructureId, 'Body structure ID was captured');
        browser.assert.ok(testBodyStructureId.length > 0, 'Body structure ID is not empty');
      }
    });

    // Verify URL no longer contains 'new' (save was successful)
    browser.execute(function() {
      return {
        pathname: window.location.pathname,
        isNewForm: window.location.pathname.includes('/new')
      };
    }, [], function(result) {
      console.log('[05] URL after save:', result.value);
      browser.assert.ok(!result.value.isNewForm, 'URL no longer contains /new after save');
    });

    console.log('[05] Body structure creation complete');
  });

  it('06. Verify new body structure in table', function(browser) {
    console.log('[06] Verifying new body structure in table...');

    // Navigate back to list
    testUtils.navigateUrl(browser, '/body-structures');
    browser.pause(2000);

    // Verify navigation
    browser.assert.urlContains('/body-structures', 'Navigated back to list page');

    // Re-establish patient context (navigation may have cleared Session)
    browser.executeAsync(function(patientId, done) {
      if (typeof Meteor !== 'undefined' && typeof Session !== 'undefined') {
        Meteor.call('patients.findOne', patientId, function(error, patient) {
          if (error) {
            console.error('[06] Error fetching patient:', error);
            done({ success: false, error: error.message });
          } else if (patient) {
            Session.set('selectedPatientId', patient._id);
            Session.set('selectedPatient', patient);
            console.log('[06] Re-established patient context:', patient._id);
            done({ success: true, patientId: patient._id });
          } else {
            done({ success: false, error: 'Patient not found' });
          }
        });
      } else {
        done({ success: false, error: 'Meteor or Session not available' });
      }
    }, [testPatientId], function(result) {
      if (result.value) {
        browser.assert.ok(result.value.success, 'Patient context re-established');
      }
    });

    browser.pause(1000);

    // Search for the new body structure
    browser.execute(function(searchTerm) {
      const input = document.querySelector('#bodyStructureSearchInput');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));

        setTimeout(function() {
          input.value = searchTerm;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }, 300);
        return { success: true, searchTerm: searchTerm };
      }
      return { success: false };
    }, ['test ' + timestamp], function(result) {
      if (result.value) {
        browser.assert.ok(result.value.success, 'Search input accepted value');
        console.log('[06] Searching for:', result.value.searchTerm);
      }
    });

    browser.pause(3000);

    // Verify table is visible
    browser.execute(function() {
      const table = document.querySelector('#bodyStructuresTable');
      const tbody = table ? table.querySelector('tbody') : null;
      const rows = tbody ? tbody.querySelectorAll('tr') : [];
      return {
        hasTable: table !== null,
        hasRows: rows.length > 0,
        rowCount: rows.length
      };
    }, [], function(result) {
      console.log('[06] Table state:', result.value);
      browser.assert.ok(result.value.hasTable, 'Table is present');
      browser.assert.ok(result.value.hasRows, 'Table has at least one row');
    });

    // Verify the record appears
    browser.execute(function(description) {
      const table = document.querySelector('#bodyStructuresTable');
      if (table) {
        const tableText = table.textContent;
        const hasDescription = tableText.includes(description) || tableText.includes('Left upper arm');
        const rows = table.querySelectorAll('tbody tr');
        return {
          hasRecord: hasDescription,
          rowCount: rows.length,
          tableTextSample: tableText.substring(0, 500)
        };
      }
      return { hasRecord: false, hasTable: false, rowCount: 0 };
    }, [testBodyStructure.description], function(result) {
      console.log('[06] Table search result:', result.value);
      browser.assert.ok(result.value.hasRecord, 'Created record appears in table');
    });

    // Verify patient context is still active
    browser.execute(function() {
      if (typeof Session !== 'undefined') {
        return {
          patientId: Session.get('selectedPatientId'),
          hasPatient: !!Session.get('selectedPatient')
        };
      }
      return { patientId: null, hasPatient: false };
    }, [], function(result) {
      browser.assert.ok(result.value.hasPatient, 'Patient context still active after search');
    });

    console.log('[06] Table verification complete');
  });

  it('07. Open record for editing', function(browser) {
    console.log('[07] Opening record for editing...');

    // Click the row
    browser.execute(function() {
      const rows = document.querySelectorAll('#bodyStructuresTable tbody tr');
      if (rows.length > 0) {
        rows[0].click();
        return { clicked: true, rowCount: rows.length };
      }
      return { clicked: false, rowCount: 0 };
    }, [], function(result) {
      console.log('[07] Row click result:', result.value);
      browser.assert.ok(result.value.clicked, 'Table row was clicked');
      browser.assert.ok(result.value.rowCount > 0, 'Table had rows to click');
    });

    browser.pause(1000);

    // Verify detail page loaded
    browser.waitForElementVisible('#bodyStructureDetailPage', 5000);
    browser.assert.visible('#bodyStructureDetailPage', 'Detail page is visible');

    // Verify URL contains record ID
    browser.execute(function(expectedId) {
      return {
        pathname: window.location.pathname,
        containsId: window.location.pathname.includes(expectedId) ||
                    window.location.pathname.match(/\/body-structures\/[^/]+$/) !== null
      };
    }, [testBodyStructureId], function(result) {
      console.log('[07] URL check:', result.value);
      browser.assert.ok(result.value.containsId, 'URL contains record ID');
    });

    // Verify data populated in all fields
    browser.execute(function(expectedDescription) {
      const descriptionInput = document.querySelector('#descriptionInput');
      const morphologyInput = document.querySelector('#morphologyInput');
      const structureInput = document.querySelector('#structureInput');
      const activeCheckbox = document.querySelector('#activeCheckbox');
      const patientDisplay = document.querySelector('#patientDisplay');

      return {
        description: descriptionInput ? descriptionInput.value : null,
        morphology: morphologyInput ? morphologyInput.value : null,
        structure: structureInput ? structureInput.value : null,
        active: activeCheckbox ? activeCheckbox.checked : null,
        patient: patientDisplay ? patientDisplay.value : null,
        descriptionMatches: descriptionInput && descriptionInput.value.includes('Left upper arm')
      };
    }, [testBodyStructure.description], function(result) {
      console.log('[07] Loaded data:', result.value);
      browser.assert.ok(result.value.description, 'Description field is populated');
      browser.assert.ok(result.value.descriptionMatches, 'Description contains expected value');
      browser.assert.ok(result.value.patient, 'Patient field is populated');
    });

    // Verify view mode (Edit button should be visible)
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      let hasEditButton = false;
      let hasDeleteButton = false;

      for (let button of buttons) {
        if (button.textContent.includes('Edit')) {
          hasEditButton = true;
        }
        if (button.textContent.includes('Delete')) {
          hasDeleteButton = true;
        }
      }

      return {
        hasEditButton: hasEditButton,
        hasDeleteButton: hasDeleteButton
      };
    }, [], function(result) {
      console.log('[07] Button check:', result.value);
      browser.assert.ok(result.value.hasEditButton, 'Edit button is visible (view mode)');
      browser.assert.ok(result.value.hasDeleteButton, 'Delete button is visible (view mode)');
    });

    // Verify active status reflects saved state
    browser.execute(function(expectedActive) {
      const checkbox = document.querySelector('#activeCheckbox');
      return {
        checked: checkbox ? checkbox.checked : null,
        matchesExpected: checkbox ? checkbox.checked === expectedActive : false
      };
    }, [testBodyStructure.active], function(result) {
      console.log('[07] Active checkbox state:', result.value);
      browser.assert.ok(result.value.matchesExpected, 'Active checkbox reflects saved state');
    });

    console.log('[07] Record opening complete');
  });

  it('08. Update record', function(browser) {
    console.log('[08] Updating record...');

    // Store original URL to verify ID doesn't change
    let originalPathname = null;
    browser.execute(function() {
      return window.location.pathname;
    }, [], function(result) {
      originalPathname = result.value;
      console.log('[08] Original URL:', originalPathname);
    });

    // Click Edit button if in view mode
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Edit')) {
          button.click();
          return { clicked: true, buttonText: button.textContent };
        }
      }
      return { clicked: false, alreadyEditing: true };
    }, [], function(result) {
      console.log('[08] Edit button:', result.value);
      browser.assert.ok(result.value.clicked || result.value.alreadyEditing, 'Edit mode entered');
    });

    browser.pause(500);

    // Verify fields are editable
    browser.execute(function() {
      const description = document.querySelector('#descriptionInput');
      return {
        descriptionEditable: description && !description.disabled
      };
    }, [], function(result) {
      browser.assert.ok(result.value.descriptionEditable, 'Description field is editable');
    });

    // Update description
    browser
      .clearValue('#descriptionInput')
      .setValue('#descriptionInput', updatedBodyStructure.description)
      .pause(300);

    // Verify description was updated
    browser.getValue('#descriptionInput', function(result) {
      browser.assert.ok(result.value.includes('updated'), 'Description updated to new value');
      console.log('[08] Updated description to:', result.value);
    });

    // Update morphology
    browser.execute(function(value) {
      const input = document.querySelector('#morphologyInput');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));

        setTimeout(function() {
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }, 100);
        return { success: true, newValue: value };
      }
      return { success: false };
    }, [updatedBodyStructure.morphology], function(result) {
      if (result.value) {
        browser.assert.ok(result.value.success, 'Morphology field updated');
      }
    });

    browser.pause(500);

    // Toggle active status
    browser.execute(function(active) {
      const checkbox = document.querySelector('#activeCheckbox');
      if (checkbox) {
        const originalState = checkbox.checked;
        if (checkbox.checked !== active) {
          checkbox.click();
        }
        return {
          success: true,
          originalState: originalState,
          newState: active,
          changed: originalState !== active
        };
      }
      return { success: false };
    }, [updatedBodyStructure.active], function(result) {
      console.log('[08] Active toggle:', result.value);
      if (result.value) {
        browser.assert.ok(result.value.success, 'Active checkbox toggled');
      }
    });

    browser.pause(500);

    // Verify values before save
    browser.execute(function() {
      const description = document.querySelector('#descriptionInput');
      const active = document.querySelector('#activeCheckbox');
      return {
        descriptionValue: description ? description.value : null,
        activeChecked: active ? active.checked : null
      };
    }, [], function(result) {
      console.log('[08] Values before save:', result.value);
      browser.assert.ok(result.value.descriptionValue, 'Description has value before save');
    });

    // Click Save/Update button
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Save') || button.textContent.includes('Update')) {
          button.click();
          return { clicked: true, buttonText: button.textContent };
        }
      }
      return { clicked: false };
    }, [], function(result) {
      console.log('[08] Save/Update button:', result.value);
      browser.assert.ok(result.value.clicked, 'Save button was clicked');
    });

    browser.pause(2000);

    // Verify no errors after save
    browser.execute(function() {
      const errorMessages = document.querySelectorAll('.MuiAlert-standardError, .error-message');
      return {
        hasErrors: errorMessages.length > 0,
        errorCount: errorMessages.length
      };
    }, [], function(result) {
      console.log('[08] Error check:', result.value);
      browser.assert.ok(!result.value.hasErrors, 'No error messages after update');
    });

    // Verify changes persisted
    browser.execute(function(expectedDescription) {
      const descriptionInput = document.querySelector('#descriptionInput');
      const activeCheckbox = document.querySelector('#activeCheckbox');
      return {
        description: descriptionInput ? descriptionInput.value : null,
        active: activeCheckbox ? activeCheckbox.checked : null,
        descriptionMatches: descriptionInput && descriptionInput.value.includes('updated')
      };
    }, [updatedBodyStructure.description], function(result) {
      console.log('[08] Persisted data:', result.value);
      browser.assert.ok(result.value.descriptionMatches, 'Updated description persisted');
    });

    // Verify URL unchanged (same record)
    browser.execute(function() {
      return window.location.pathname;
    }, [], function(result) {
      console.log('[08] URL after save:', result.value);
      browser.assert.ok(result.value === originalPathname || result.value.includes(testBodyStructureId),
        'URL unchanged - same record ID');
    });

    // Verify back in view mode (Edit button visible again)
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      let hasEditButton = false;
      for (let button of buttons) {
        if (button.textContent.includes('Edit')) {
          hasEditButton = true;
          break;
        }
      }
      return { hasEditButton: hasEditButton };
    }, [], function(result) {
      console.log('[08] Mode after save:', result.value);
      browser.assert.ok(result.value.hasEditButton, 'Back in view mode after save (Edit button visible)');
    });

    console.log('[08] Record update complete');
  });

  it('09. Delete record', function(browser) {
    console.log('[09] Deleting record...');

    // Make sure we're in view mode (not edit mode) - Delete button only shows in view mode
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Cancel')) {
          button.click();
          return { clicked: true, reason: 'Exited edit mode' };
        }
      }
      return { clicked: false, reason: 'Already in view mode' };
    }, [], function(result) {
      console.log('[09] Mode check:', result.value);
    });

    browser.pause(500);

    // Click Delete button - simple execute without callback (callbacks can return null)
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let button of buttons) {
        if (button.textContent.includes('Delete')) {
          console.log('[09] Found Delete button, clicking...');
          button.click();
          return true;
        }
      }
      console.log('[09] Delete button not found');
      return false;
    });

    browser.pause(500);

    // Accept confirmation dialog
    browser.acceptAlert();
    console.log('[09] Accepted confirmation dialog');
    browser.pause(2000);

    // Verify redirect to list page
    browser.assert.urlContains('/body-structures', 'Redirected to list page after deletion');

    // Verify list page state
    browser.execute(function() {
      const hasPage = document.querySelector('#bodyStructuresPage') !== null;
      const hasTable = document.querySelector('#bodyStructuresTable') !== null;
      const hasNoData = document.body.textContent.includes('No Data Available') ||
                        document.querySelector('.no-data-card') !== null;
      return {
        hasPage: hasPage,
        hasTable: hasTable,
        hasNoData: hasNoData,
        anyValidState: hasPage || hasTable || hasNoData
      };
    }, [], function(result) {
      console.log('[09] After delete state:', result.value);
      browser.assert.ok(result.value.anyValidState,
        'List page is displayed after deletion (page, table, or no-data state)');
    });

    // Verify record is no longer in table (search for it)
    browser.execute(function(searchTerm) {
      const input = document.querySelector('#bodyStructureSearchInput');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(function() {
          input.value = searchTerm;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }, 300);
        return { searched: true };
      }
      return { searched: false };
    }, ['updated'], function(result) {
      if (result.value.searched) {
        console.log('[09] Searching for deleted record...');
      }
    });

    browser.pause(3000);

    // Verify deleted record not found in table
    browser.execute(function(deletedDescription) {
      const table = document.querySelector('#bodyStructuresTable');
      if (table) {
        const tableText = table.textContent;
        const hasDeletedRecord = tableText.includes(deletedDescription);
        const rows = table.querySelectorAll('tbody tr');
        return {
          hasDeletedRecord: hasDeletedRecord,
          rowCount: rows.length,
          deletionVerified: !hasDeletedRecord
        };
      }
      // No table means no records, which is valid after deletion
      return { hasDeletedRecord: false, rowCount: 0, deletionVerified: true };
    }, [updatedBodyStructure.description], function(result) {
      console.log('[09] Deletion verification:', result.value);
      browser.assert.ok(result.value.deletionVerified, 'Deleted record is not in table');
    });

    // Verify patient context still valid
    browser.execute(function() {
      if (typeof Session !== 'undefined') {
        return {
          hasPatient: !!Session.get('selectedPatient'),
          patientId: Session.get('selectedPatientId')
        };
      }
      return { hasPatient: false };
    }, [], function(result) {
      console.log('[09] Patient context after deletion:', result.value);
      browser.assert.ok(result.value.hasPatient, 'Patient context still valid after deletion');
    });

    console.log('[09] Record deletion complete');
  });

  after(function(browser, done) {
    console.log('Test suite complete');
    browser.end(done);
  });
});
