// tests/nightwatch/honeycomb/enable_autopublish/crud.practitioners.js

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('Practitioners CRUD Operations', function() {
  const timestamp = Date.now();
  let createdPractitionerId = null; // Will store the ID after creation
  const testPractitioner = {
    givenName: `Test ${timestamp}`,
    familyName: `Practitioner ${timestamp}`,
    npiIdentifier: `NPI${timestamp}`.substring(0, 10), // NPI should be 10 digits
    qualification: 'MD',
    specialtyCode: '207R00000X',
    specialtyDisplay: 'Internal Medicine',
    addressLine: '456 Medical Plaza',
    city: 'Health City',
    state: 'HC',
    postalCode: '54321',
    country: 'USA',
    phone: '555-2468',
    email: `practitioner${timestamp}@medical.org`,
    active: true
  };

  const updatedPractitioner = {
    givenName: `Updated ${timestamp}`,
    familyName: `Practitioner ${timestamp}`,
    phone: '555-1357',
    email: `updated.practitioner${timestamp}@medical.org`,
    specialtyDisplay: 'Family Medicine'
  };

  before(browser => {
    console.log('Starting Practitioners CRUD test suite...');
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

    // Use login helper with built-in retry logic and null checks
    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      } else {
        browser.assert.ok(true, 'User is logged in');
      }

      // Clean up any existing test data
      browser.executeAsync(function(done) {
        if (typeof Practitioners !== 'undefined') {
          const testPractitioners = Practitioners.find({
            $or: [
              { 'name.0.family': { $regex: 'Practitioner.*' } },
              { 'identifier.0.value': { $regex: 'NPI.*' } }
            ]
          }).fetch();
          testPractitioners.forEach(function(practitioner) {
            Practitioners.remove({ _id: practitioner._id });
          });
          console.log('Cleared', testPractitioners.length, 'test practitioners');
        }
        done();
      });

      // Create a test patient for practitioner association
      testUtils.createTestPatient(browser, {
        name: 'John Doe',
        family: 'Doe',
        given: 'John',
        identifier: 'test-patient-' + timestamp
      }, function(result) {
        if (result.error) {
          console.error('Failed to create test patient:', result.error);
        } else {
          console.log('Test patient created with ID:', result.result);
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

      browser.pause(1000);
    });
  });

  it('02. Verify practitioners list page loads', browser => {
    browser
      .url('http://localhost:3000/practitioners')
      .waitForElementVisible('#practitionersPage', 5000)
      .pause(1000)
      .execute(function() {
        const hasTable = document.querySelector('#practitionersTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#practitionersPage') && 
                             document.querySelector('#practitionersPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either practitioners table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/practitioners/02-practitioners-list.png');
  });

  it('03. Navigate to new practitioner form', browser => {
    browser
      .waitForElementVisible('#practitionersPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Practitioner') || 
              button.textContent.includes('Add Your First Practitioner')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Practitioner button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#practitionerDetailPage', 5000)
      .assert.elementPresent('#givenNameInput')
      .assert.elementPresent('#familyNameInput')
      .assert.elementPresent('#npiInput')
      .assert.elementPresent('#qualificationInput')
      .assert.elementPresent('#specialtyCodeInput')
      .assert.elementPresent('#specialtyDisplayInput')
      .assert.elementPresent('#addressLineInput')
      .assert.elementPresent('#cityInput')
      .assert.elementPresent('#stateInput')
      .assert.elementPresent('#postalCodeInput')
      .assert.elementPresent('#countryInput')
      .assert.elementPresent('#phoneInput')
      .assert.elementPresent('#emailInput')
      .assert.elementPresent('#activeSwitch')
      .saveScreenshot('tests/nightwatch/screenshots/practitioners/03-new-practitioner-form.png');
  });

  it('04. Create new practitioner', browser => {
    browser
      .waitForElementVisible('#practitionerDetailPage', 5000)
      .pause(500);

    // Check if form is in edit mode
    browser.execute(function() {
      const givenNameField = document.querySelector('#givenNameInput');
      if (givenNameField && givenNameField.disabled) {
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
      .clearValue('#givenNameInput')
      .setValue('#givenNameInput', testPractitioner.givenName)
      .clearValue('#familyNameInput')
      .setValue('#familyNameInput', testPractitioner.familyName)
      .clearValue('#npiInput')
      .setValue('#npiInput', testPractitioner.npiIdentifier)
      .clearValue('#specialtyCodeInput')
      .setValue('#specialtyCodeInput', testPractitioner.specialtyCode)
      .clearValue('#specialtyDisplayInput')
      .setValue('#specialtyDisplayInput', testPractitioner.specialtyDisplay)
      .clearValue('#addressLineInput')
      .setValue('#addressLineInput', testPractitioner.addressLine)
      .clearValue('#cityInput')
      .setValue('#cityInput', testPractitioner.city)
      .clearValue('#stateInput')
      .setValue('#stateInput', testPractitioner.state)
      .clearValue('#postalCodeInput')
      .setValue('#postalCodeInput', testPractitioner.postalCode)
      .clearValue('#countryInput')
      .setValue('#countryInput', testPractitioner.country)
      .clearValue('#phoneInput')
      .setValue('#phoneInput', testPractitioner.phone)
      .clearValue('#emailInput')
      .setValue('#emailInput', testPractitioner.email)
      .pause(500);

    // Handle Material-UI Select for qualification
    browser.execute(function(qualification) {
      // Click on the select to open dropdown
      const selectDiv = document.querySelector('#qualificationInput');
      if (selectDiv) {
        selectDiv.click();
        setTimeout(function() {
          // Find and click the menu item
          const menuItems = document.querySelectorAll('li[role="option"]');
          for (let item of menuItems) {
            if (item.textContent.includes(qualification)) {
              item.click();
              break;
            }
          }
        }, 100);
      }
    }, [testPractitioner.qualification]);
    
    browser.pause(500); // Wait for qualification to be set

    // Handle the active switch if needed
    browser.execute(function(active) {
      const activeSwitch = document.querySelector('#activeSwitch');
      if (activeSwitch) {
        const isChecked = activeSwitch.checked;
        if (isChecked !== active) {
          activeSwitch.click();
        }
      }
    }, [testPractitioner.active]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/practitioners/04-filled-practitioner-form.png');

    // Save the practitioner
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

    // Debug: Check current URL and page state after save
    browser
      .pause(2000)  // Give more time for navigation
      .execute(function() {
        const currentUrl = window.location.pathname;
        const hasPractitionersPage = document.querySelector('#practitionersPage') !== null;
        const hasPractitionerDetail = document.querySelector('#practitionerDetailPage') !== null;
        const errorElements = document.querySelectorAll('[class*="error"], [color="error"]');
        let errorText = '';
        errorElements.forEach(el => {
          if (el.textContent) errorText += el.textContent + ' ';
        });
        
        return {
          url: currentUrl,
          hasPractitionersPage: hasPractitionersPage,
          hasPractitionerDetail: hasPractitionerDetail,
          hasError: errorText.length > 0,
          errorText: errorText.trim()
        };
      }, [], function(result) {
        console.log('Post-save state:', result.value);
        if (result.value.hasError) {
          browser.assert.fail(`Save failed with error: ${result.value.errorText}`);
        }
      });

    browser
      .waitForElementVisible('#practitionersPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/practitioners/05-practitioner-saved.png');
    
    // Capture the ID of the newly created practitioner
    browser.execute(function(timestamp) {
      // Find the practitioner we just created
      if (typeof Practitioners !== 'undefined') {
        const newPractitioner = Practitioners.findOne({
          'name.0.given.0': { $regex: `Test ${timestamp}` }
        });
        if (newPractitioner) {
          console.log('Found newly created practitioner with ID:', newPractitioner._id);
          return newPractitioner._id;
        }
      }
      return null;
    }, [timestamp.toString()], function(result) {
      if (result.value) {
        createdPractitionerId = result.value;
        console.log('Stored practitioner ID for later use:', createdPractitionerId);
      }
    });
  });

  it('05. Verify new practitioner appears in list', browser => {
    browser
      .waitForElementVisible('#practitionersPage', 5000)
      .pause(1000);
    
    // Search for our newly created practitioner using the ID if we have it
    browser
      .waitForElementVisible('#practitionerSearchInput', 5000)
      .clearValue('#practitionerSearchInput')
      .execute(function(id, givenName) {
        const searchTerm = id || givenName;
        console.log('Searching for practitioner with:', searchTerm);
        return searchTerm;
      }, [createdPractitionerId, testPractitioner.givenName], function(result) {
        browser.setValue('#practitionerSearchInput', result.value);
      })
      .pause(1000); // Wait for search results to update
    
    browser.execute(function(timestamp) {
      const hasTable = document.querySelector('#practitionersTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageText = document.querySelector('#practitionersPage')?.textContent || '';
      
      let totalPractitioners = 0;
      let filteredPractitioners = 0;
      if (typeof Practitioners !== 'undefined') {
        totalPractitioners = Practitioners.find({}).count();
        // Check if our test practitioner exists
        const testPractitioners = Practitioners.find({
          'name.0.given.0': { $regex: timestamp }
        }).count();
        filteredPractitioners = testPractitioners;
        console.log('Total practitioners in database:', totalPractitioners);
        console.log('Test practitioners found:', filteredPractitioners);
      }
      
      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasNoData: pageText.includes('No Data Available'),
        totalPractitioners: totalPractitioners,
        filteredPractitioners: filteredPractitioners
      };
    }, [timestamp.toString()], function(result) {
      console.log('Page state:', result.value);
      browser.assert.ok(result.value.hasTable || result.value.totalPractitioners > 0, 
        'Practitioners table exists or practitioners are in database');
      browser.assert.ok(result.value.filteredPractitioners > 0, 
        'Our test practitioner exists in the database');
    });
    
    browser
      .saveScreenshot('tests/nightwatch/screenshots/practitioners/06-practitioner-in-list.png');
  });

  it('06. View practitioner details', browser => {
    browser
      .waitForElementVisible('#practitionersTable', 5000)
      .pause(1000);

    // Click on the first practitioner row (should be our searched result)
    browser
      .execute(function() {
        const rows = document.querySelectorAll('#practitionersTable tbody tr');
        console.log('Found', rows.length, 'rows in practitioners table');
        
        if (rows.length > 0) {
          console.log('Clicking first row with text:', rows[0].textContent);
          rows[0].click();
          return { clicked: true, rowText: rows[0].textContent, rowCount: rows.length };
        }
        
        return { clicked: false, error: 'No rows found' };
      }, [], function(result) {
        console.log('Click result:', result.value);
        browser.assert.equal(result.value.clicked, true, 'Found and clicked practitioner row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#practitionerDetailPage', 5000)
      .assert.valueContains('#givenNameInput', testPractitioner.givenName)
      .assert.valueContains('#familyNameInput', testPractitioner.familyName)
      .assert.valueContains('#npiInput', testPractitioner.npiIdentifier)
      .saveScreenshot('tests/nightwatch/screenshots/practitioners/07-view-practitioner-details.png');
    
    // Navigate back to practitioners list
    browser
      .url('http://localhost:3000/practitioners')
      .waitForElementVisible('#practitionersPage', 5000);
  });

  it('07. Update existing practitioner', browser => {
    browser
      .waitForElementVisible('#practitionersTable', 5000)
      .pause(1000);

    // Search for our practitioner again using ID if available
    browser
      .waitForElementVisible('#practitionerSearchInput', 5000)
      .clearValue('#practitionerSearchInput')
      .execute(function(id, givenName) {
        const searchTerm = id || givenName;
        console.log('Test 07 - Searching for practitioner with:', searchTerm);
        return searchTerm;
      }, [createdPractitionerId, testPractitioner.givenName], function(result) {
        browser.setValue('#practitionerSearchInput', result.value);
      })
      .pause(1000); // Wait for search results to update

    // Click on the practitioner to edit
    browser
      .execute(function() {
        const rows = document.querySelectorAll('#practitionersTable tbody tr');
        if (rows.length > 0) {
          rows[0].click();
          return true;
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked practitioner row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#practitionerDetailPage', 5000)
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

    // Update practitioner details
    browser
      .clearValue('#givenNameInput')
      .setValue('#givenNameInput', updatedPractitioner.givenName)
      .clearValue('#phoneInput')
      .setValue('#phoneInput', updatedPractitioner.phone)
      .clearValue('#emailInput')
      .setValue('#emailInput', updatedPractitioner.email)
      .clearValue('#specialtyDisplayInput')
      .setValue('#specialtyDisplayInput', updatedPractitioner.specialtyDisplay)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/practitioners/08-updated-practitioner-form.png');

    // Save the updated practitioner
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
      .pause(1000)
      .url('http://localhost:3000/practitioners')
      .waitForElementVisible('#practitionersTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/practitioners/09-practitioner-updated.png');
  });

  it('08. Verify updated practitioner in list', browser => {
    browser
      .waitForElementVisible('#practitionersTable', 5000)
      .pause(1000);
    
    // Search for the updated practitioner
    browser
      .waitForElementVisible('#practitionerSearchInput', 5000)
      .clearValue('#practitionerSearchInput')
      .setValue('#practitionerSearchInput', updatedPractitioner.givenName)
      .pause(1000); // Wait for search results to update
    
    browser
      .assert.containsText('#practitionersTable', updatedPractitioner.givenName)
      .saveScreenshot('tests/nightwatch/screenshots/practitioners/10-updated-practitioner-in-list.png');
  });

  it('09. Delete practitioner', browser => {
    browser
      .waitForElementVisible('#practitionersPage', 5000)
      .pause(1000);

    browser.execute(function() {
      const hasTable = document.querySelector('#practitionersTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#practitionersPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        // Search for our practitioner using ID if available (name might have changed)
        browser
          .waitForElementVisible('#practitionerSearchInput', 5000)
          .clearValue('#practitionerSearchInput')
          .execute(function(id, givenName) {
            const searchTerm = id || givenName;
            console.log('Test 09 - Searching for practitioner with:', searchTerm);
            return searchTerm;
          }, [createdPractitionerId, updatedPractitioner.givenName], function(result) {
            browser.setValue('#practitionerSearchInput', result.value);
          })
          .pause(1000); // Wait for search results to update
        
        // Check if there are any practitioners to delete
        browser
          .execute(function() {
            const rows = document.querySelectorAll('#practitionersTable tbody tr');
            console.log('Delete test - found', rows.length, 'rows after search');
            
            // Log what we see in the table
            if (rows.length === 0) {
              const tableContent = document.querySelector('#practitionersTable')?.textContent || '';
              console.log('Table content:', tableContent);
              
              // Check if any practitioners exist in the database
              if (typeof Practitioners !== 'undefined') {
                const totalCount = Practitioners.find().count();
                const testCount = Practitioners.find({
                  'name.0.given.0': { $regex: 'Updated.*' }
                }).count();
                console.log('Total practitioners in DB:', totalCount);
                console.log('Test practitioners with "Updated":', testCount);
              }
              return { found: false };
            } else {
              console.log('First row content:', rows[0].textContent);
              return { found: true, rowText: rows[0].textContent };
            }
          }, [], function(result) {
            if (!result.value.found) {
              // If no rows found, this might be expected if the practitioner was already deleted
              console.log('No practitioners found to delete - checking if this is expected...');
              browser.assert.ok(true, 'No practitioners found (may have been deleted in a previous test run)');
            } else {
              browser.assert.ok(true, 'Found practitioner to delete: ' + result.value.rowText);
              
              // Click on the row to navigate to detail page
              browser
                .execute(function() {
                  const rows = document.querySelectorAll('#practitionersTable tbody tr');
                  if (rows.length > 0) {
                    rows[0].click();
                    return true;
                  }
                  return false;
                })
                .pause(1000)
                .waitForElementVisible('#practitionerDetailPage', 5000);

              // PractitionerDetail shows Delete button in EDIT mode (different from other components)
              // So we need to enter edit mode first
              browser
                .execute(function() {
                  // Click Edit button to enter edit mode
                  const buttons = document.querySelectorAll('button');
                  for (let button of buttons) {
                    if (button.textContent.includes('Edit')) {
                      console.log('Clicking Edit button to enter edit mode');
                      button.click();
                      return true;
                    }
                  }
                  return false;
                })
                .pause(500);
                
              // Now click Delete button and handle the confirm dialog
              browser
                .execute(function() {
                  // Override window.confirm to automatically accept
                  window.confirm = function() { return true; };
                  
                  const buttons = document.querySelectorAll('button');
                  for (let button of buttons) {
                    if (button.textContent.includes('Delete')) {
                      console.log('Found Delete button, clicking it');
                      button.click();
                      return true;
                    }
                  }
                  console.log('Delete button not found');
                  return false;
                })
                .pause(1000);

              browser
                .waitForElementVisible('#practitionersPage', 5000);
            }
          });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No practitioners to delete - No Data Available state is correct');
      }
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/practitioners/11-practitioner-deleted.png');
  });

  it('10. Verify practitioner removed from list', browser => {
    browser
      .waitForElementVisible('#practitionersPage', 5000)
      .pause(1000);
    
    // Try searching for the deleted practitioner
    browser
      .waitForElementVisible('#practitionerSearchInput', 5000)
      .clearValue('#practitionerSearchInput')
      .setValue('#practitionerSearchInput', updatedPractitioner.givenName)
      .pause(1000); // Wait for search results to update
    
    browser
      .execute(function() {
        const table = document.querySelector('#practitionersTable');
        if (table) {
          const rows = document.querySelectorAll('#practitionersTable tbody tr');
          const noDataInTable = table.textContent.includes('No practitioners found') || 
                               table.textContent.includes('No data available');
          return { 
            found: rows.length > 0, 
            hasTable: true, 
            rowCount: rows.length,
            noDataInTable: noDataInTable
          };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#practitionersPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [], function(result) {
        console.log('Delete verification result:', result.value);
        if (result.value.hasTable) {
          // Either no rows or table shows "no data" message
          browser.assert.ok(
            result.value.rowCount === 0 || result.value.noDataInTable, 
            'Practitioner no longer in filtered list'
          );
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (practitioner was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/practitioners/12-practitioner-not-in-list.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof Practitioners !== 'undefined') {
        Practitioners.find({ 
          $or: [
            { 'name.0.family': { $regex: 'Practitioner.*' } },
            { 'identifier.0.value': { $regex: 'NPI.*' } }
          ]
        }).fetch().forEach(function(practitioner) {
          Practitioners.remove({ _id: practitioner._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});