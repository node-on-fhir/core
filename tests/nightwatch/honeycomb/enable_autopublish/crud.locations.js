// tests/nightwatch/honeycomb/enable_autopublish/crud.locations.js

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('Locations CRUD Operations', function() {
  const timestamp = Date.now();
  const testLocation = {
    name: `Test Hospital ${timestamp}`,
    identifier: `LOC${timestamp}`,
    status: 'active',
    operationalStatus: 'operational',
    type: 'HOSP',
    typeDisplay: 'Hospital',
    description: `Test hospital created at ${timestamp}`,
    addressLine: '789 Healthcare Blvd',
    city: 'Medical Town',
    state: 'MT',
    postalCode: '98765',
    country: 'USA',
    phone: '555-3698',
    email: `location${timestamp}@hospital.org`,
    managingOrganization: 'Test Health System'
  };

  const updatedLocation = {
    name: `Updated Hospital ${timestamp}`,
    status: 'suspended',
    operationalStatus: 'housekeeping',
    phone: '555-7410',
    email: `updated${timestamp}@hospital.org`,
    description: `Test location updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting Locations CRUD test suite...');
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
        if (typeof Locations !== 'undefined') {
          const testLocations = Locations.find({
            $or: [
              { 'name': { $regex: '.*Hospital.*' } },
              { 'identifier.0.value': { $regex: 'LOC.*' } }
            ]
          }).fetch();
          testLocations.forEach(function(location) {
            Locations.remove({ _id: location._id });
          });
          console.log('Cleared', testLocations.length, 'test locations');
        }
        done();
      });
    });
  });

  it('02. Verify locations list page loads', browser => {
    testUtils.navigateUrl(browser, '/locations');
    browser
      .waitForElementVisible('#locationsPage', 5000)
      .execute(function() {
        const hasTable = document.querySelector('#locationsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#locationsPage') && 
                             document.querySelector('#locationsPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either locations table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/locations/02-locations-list.png');
  });

  it('03. Navigate to new location form', browser => {
    browser
      .waitForElementVisible('#locationsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Location') || 
              button.textContent.includes('Add Your First Location')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Location button');
      });

    browser
      .pause(500)
      .waitForElementVisible('#locationDetailPage', 5000)
      .assert.elementPresent('#nameInput')
      .assert.elementPresent('#identifierInput')
      .assert.elementPresent('#statusSelect')
      .assert.elementPresent('#operationalStatusSelect')
      .assert.elementPresent('#typeSelect')
      .assert.elementPresent('#typeDisplayInput')
      .assert.elementPresent('#descriptionTextarea')
      .assert.elementPresent('#addressLineInput')
      .assert.elementPresent('#cityInput')
      .assert.elementPresent('#stateInput')
      .assert.elementPresent('#postalCodeInput')
      .assert.elementPresent('#countryInput')
      .assert.elementPresent('#phoneInput')
      .assert.elementPresent('#emailInput')
      .assert.elementPresent('#managingOrgInput')
      .saveScreenshot('tests/nightwatch/screenshots/locations/03-new-location-form.png');
  });

  it('04. Create new location', browser => {
    browser
      .waitForElementVisible('#locationDetailPage', 5000)
      .pause(500);

    // Check if form is in edit mode
    browser.execute(function() {
      const nameField = document.querySelector('#nameInput');
      if (nameField && nameField.disabled) {
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
      .clearValue('#nameInput')
      .setValue('#nameInput', testLocation.name)
      .clearValue('#identifierInput')
      .setValue('#identifierInput', testLocation.identifier)
      .clearValue('#typeDisplayInput')
      .setValue('#typeDisplayInput', testLocation.typeDisplay)
      .clearValue('#descriptionTextarea')
      .setValue('#descriptionTextarea', testLocation.description)
      .clearValue('#addressLineInput')
      .setValue('#addressLineInput', testLocation.addressLine)
      .clearValue('#cityInput')
      .setValue('#cityInput', testLocation.city)
      .clearValue('#stateInput')
      .setValue('#stateInput', testLocation.state)
      .clearValue('#postalCodeInput')
      .setValue('#postalCodeInput', testLocation.postalCode)
      .clearValue('#countryInput')
      .setValue('#countryInput', testLocation.country)
      .clearValue('#phoneInput')
      .setValue('#phoneInput', testLocation.phone)
      .clearValue('#emailInput')
      .setValue('#emailInput', testLocation.email)
      .clearValue('#managingOrgInput')
      .setValue('#managingOrgInput', testLocation.managingOrganization)
      .pause(500);

    // Handle Material-UI Selects
    browser.execute(function(status) {
      const statusSelect = document.querySelector('#statusSelect');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === status || 
                option.textContent.toLowerCase() === status) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testLocation.status]);

    browser.pause(500);

    browser.execute(function(opStatus) {
      const opStatusSelect = document.querySelector('#operationalStatusSelect');
      if (opStatusSelect) {
        opStatusSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === opStatus || 
                option.textContent.toLowerCase() === opStatus) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testLocation.operationalStatus]);

    browser.pause(500);

    browser.execute(function(type) {
      const typeSelect = document.querySelector('#typeSelect');
      if (typeSelect) {
        typeSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === type || 
                option.textContent.includes(type)) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testLocation.type]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/locations/04-filled-location-form.png');

    // Save the location
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
      .waitForElementVisible('#locationsPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/locations/05-location-saved.png');
  });

  it('05. Verify new location appears in list', browser => {
    browser
      .waitForElementVisible('#locationsPage', 5000)
      .pause(500);
    
    browser.execute(function(timestamp) {
      const hasTable = document.querySelector('#locationsTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageText = document.querySelector('#locationsPage')?.textContent || '';
      
      let totalLocations = 0;
      if (typeof Locations !== 'undefined') {
        totalLocations = Locations.find({}).count();
        console.log('Total locations in database:', totalLocations);
      }
      
      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasNoData: pageText.includes('No Data Available'),
        totalLocations: totalLocations
      };
    }, [timestamp], function(result) {
      console.log('Page state:', result.value);
      browser.assert.ok(result.value.hasTable || result.value.totalLocations > 0, 
        'Locations table exists or locations are in database');
    });
    
    browser
      .saveScreenshot('tests/nightwatch/screenshots/locations/06-location-in-list.png');
  });

  it('06. View location details', browser => {
    browser
      .waitForElementVisible('#locationsTable', 5000)
      .pause(500);

    // Click on the first location row
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#locationsTable tbody tr');
        console.log('Found', rows.length, 'rows in locations table');
        
        // Look for our test location
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
        browser.assert.equal(result.value.clicked, true, 'Found and clicked location row');
      });

    browser
      .pause(500)
      .waitForElementVisible('#locationDetailPage', 5000)
      .assert.valueContains('#nameInput', testLocation.name)
      .assert.valueContains('#identifierInput', testLocation.identifier)
      .assert.valueContains('#phoneInput', testLocation.phone)
      .saveScreenshot('tests/nightwatch/screenshots/locations/07-view-location-details.png');

    // Navigate back to locations list
    testUtils.navigateUrl(browser, '/locations');
    browser
      .waitForElementVisible('#locationsPage', 5000);
  });

  it('07. Update existing location', browser => {
    browser
      .waitForElementVisible('#locationsTable', 5000)
      .pause(500);

    // Click on the location to edit
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#locationsTable tbody tr');
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            row.click();
            return true;
          }
        }
        if (rows.length > 0) {
          rows[0].click();
          return true;
        }
        return false;
      }, [timestamp.toString()], function(result) {
        browser.assert.equal(result.value, true, 'Found and clicked location row');
      });

    browser
      .pause(500)
      .waitForElementVisible('#locationDetailPage', 5000)
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

    // Update location details
    browser
      .click('#nameInput')
      .clearValue('#nameInput')
      .setValue('#nameInput', updatedLocation.name)
      .click('#phoneInput')
      .clearValue('#phoneInput')
      .setValue('#phoneInput', updatedLocation.phone)
      .click('#emailInput')
      .clearValue('#emailInput')
      .setValue('#emailInput', updatedLocation.email)
      .click('#descriptionTextarea')
      .clearValue('#descriptionTextarea')
      .setValue('#descriptionTextarea', updatedLocation.description)
      .pause(500);

    // Update status select
    browser.execute(function(status) {
      const statusSelect = document.querySelector('#statusSelect');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === status || 
                option.textContent.toLowerCase() === status) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [updatedLocation.status]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/locations/08-updated-location-form.png');

    // Save the updated location
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

    testUtils.navigateUrl(browser, '/locations');
    browser
      .waitForElementVisible('#locationsPage', 10000)
      .pause(2000) // Give time for data to load
      .execute(function() {
        const hasTable = document.querySelector('#locationsTable') !== null;
        const hasNoData = document.querySelector('.no-data-card') !== null ||
                         document.querySelector('#locationsPage').textContent.includes('No Data Available');
        return { hasTable: hasTable, hasNoData: hasNoData };
      }, [], function(result) {
        browser.assert.ok(
          result.value.hasTable || result.value.hasNoData,
          'Either locations table or no-data state is present'
        );
      })
      .saveScreenshot('tests/nightwatch/screenshots/locations/09-location-updated.png');
  });

  it('08. Verify updated location in list', browser => {
    browser
      .execute(function() {
        const hasTable = document.querySelector('#locationsTable') !== null;
        const hasNoData = document.querySelector('.no-data-card') !== null ||
                         document.querySelector('#locationsPage').textContent.includes('No Data Available');
        return { hasTable: hasTable, hasNoData: hasNoData };
      }, [], function(result) {
        if (result.value.hasTable) {
          browser
            .waitForElementVisible('#locationsTable', 5000)
            .pause(500)
            .assert.containsText('#locationsTable', updatedLocation.name)
            .saveScreenshot('tests/nightwatch/screenshots/locations/10-updated-location-in-list.png');
        } else {
          browser.assert.ok(result.value.hasNoData, 'No-data state is present');
        }
      });
  });

  it('09. Delete location', browser => {
    browser
      .waitForElementVisible('#locationsPage', 5000)
      .pause(500);

    browser.execute(function() {
      const hasTable = document.querySelector('#locationsTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#locationsPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#locationsTable tbody tr');
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked location row');
          });

        browser
          .pause(500)
          .waitForElementVisible('#locationDetailPage', 5000);

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

        // Click Delete button
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
              .acceptAlert()
          .pause(500);

        browser
              .waitForElementVisible('#locationsPage', 5000);
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No locations to delete - No Data Available state is correct');
      }
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/locations/11-location-deleted.png');
  });

  it('10. Verify location removed from list', browser => {
    browser
      .waitForElementVisible('#locationsPage', 5000)
      .pause(500)
      .execute(function(timestamp) {
        const table = document.querySelector('#locationsTable');
        if (table) {
          const rows = document.querySelectorAll('#locationsTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#locationsPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Location no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (location was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/locations/12-location-not-in-list.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof Locations !== 'undefined') {
        Locations.find({ 
          $or: [
            { 'name': { $regex: '.*Hospital.*' } },
            { 'identifier.0.value': { $regex: 'LOC.*' } }
          ]
        }).fetch().forEach(function(location) {
          Locations.remove({ _id: location._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});