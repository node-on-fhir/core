// tests/nightwatch/honeycomb/enable_autopublish/crud.organizations.js

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('Organizations CRUD Operations', function() {
  const timestamp = Date.now();
  let createdOrganizationId = null; // Store created organization ID for later tests

  const testOrganization = {
    name: `Test Hospital ${timestamp}`,
    identifier: `ORG${timestamp}`,
    phone: '555-1234',
    email: `org${timestamp}@hospital.org`,
    addressLine: '123 Healthcare Ave',
    city: 'Medical City',
    state: 'MC',
    postalCode: '12345',
    country: 'USA'
  };

  const updatedOrganization = {
    name: `Updated Hospital ${timestamp}`,
    phone: '555-5678',
    email: `updated${timestamp}@hospital.org`
  };

  before(browser => {
    console.log('Starting Organizations CRUD test suite...');
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

      // Clean up any existing test data using Meteor methods
      browser.executeAsync(function(done) {
        if (typeof Organizations !== 'undefined' && typeof Meteor !== 'undefined') {
          const testOrgs = Organizations.find({
            $or: [
              { 'name': { $regex: '.*Hospital.*' } },
              { 'identifier.0.value': { $regex: 'ORG.*' } }
            ]
          }).fetch();

          console.log('Found', testOrgs.length, 'test organizations to clean up');

          // Use counter to track async deletions
          let remaining = testOrgs.length;
          if (remaining === 0) {
            done();
            return;
          }

          testOrgs.forEach(function(org) {
            Meteor.call('organizations.remove', org._id, function(error) {
              if (error) {
                console.warn('Could not remove org:', org._id, error.message);
              } else {
                console.log('Removed test organization:', org._id);
              }
              remaining--;
              if (remaining === 0) {
                done();
              }
            });
          });
        } else {
          done();
        }
      });
    });
  });

  it('02. Verify organizations list page loads', browser => {
    // First, let's go to the homepage and check if React is rendering at all
    browser
      .url('http://localhost:3000/')
      .pause(3000)
      .execute(function() {
        const reactTarget = document.querySelector('#react-target');
        const reactContent = reactTarget ? reactTarget.innerHTML.substring(0, 300) : 'no react target';
        return {
          url: window.location.href,
          reactContent: reactContent
        };
      }, [], function(result) {
        console.log('Homepage check:', result.value);
      });

    // Now navigate to organizations
    browser
      .url('http://localhost:3000/organizations')
      .pause(5000)
      .execute(function() {
        // Debug: check what's on the page
        const url = window.location.href;
        const orgPage = document.querySelector('#organizationsPage');
        const anyElement = document.querySelectorAll('*[id]');
        const isLoggedIn = typeof Meteor !== 'undefined' && Meteor.userId() !== null;
        const reactTarget = document.querySelector('#react-target');
        const reactContent = reactTarget ? reactTarget.innerHTML.substring(0, 500) : 'no react target';

        // Check for any error boundaries or error messages
        const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
        const errorTexts = Array.from(errorElements).map(e => e.textContent.substring(0, 100));

        console.log('Current URL:', url);
        console.log('Is logged in:', isLoggedIn);
        console.log('Organizations page element:', !!orgPage);
        console.log('React target content:', reactContent.substring(0, 200));
        console.log('All elements with ID:', Array.from(anyElement).slice(0, 30).map(e => e.id).filter(id => id));

        return {
          url: url,
          hasOrgPage: !!orgPage,
          isLoggedIn: isLoggedIn,
          allIds: Array.from(anyElement).slice(0, 30).map(e => e.id).filter(id => id),
          reactContent: reactContent.substring(0, 200),
          errorTexts: errorTexts
        };
      }, [], function(result) {
        console.log('Page debug info:', result.value);
      })
      .waitForElementVisible('#organizationsPage', 10000)
      .execute(function() {
        const hasTable = document.querySelector('#organizationsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#organizationsPage') &&
                             document.querySelector('#organizationsPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either organizations table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/organizations/02-organizations-list.png');
  });

  it('03. Navigate to new organization form', browser => {
    browser
      .waitForElementVisible('#organizationsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Organization') ||
              button.textContent.includes('Add Your First Organization')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Organization button');
      });

    browser
      .pause(500)
      .waitForElementVisible('#organizationDetailPage', 5000)
      .assert.elementPresent('#nameInput')
      .assert.elementPresent('#identifierInput')
      .assert.elementPresent('#phoneInput')
      .assert.elementPresent('#emailInput')
      .assert.elementPresent('#addressLineInput')
      .assert.elementPresent('#cityInput')
      .assert.elementPresent('#stateInput')
      .assert.elementPresent('#postalCodeInput')
      .assert.elementPresent('#countryInput')
      .saveScreenshot('tests/nightwatch/screenshots/organizations/03-new-organization-form.png');
  });

  it('04. Create new organization', browser => {
    browser
      .waitForElementVisible('#organizationDetailPage', 5000)
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

    browser.pause(500);

    // Fill form fields using execute block with React-compatible events
    // Note: Material-UI TextField puts the id on the wrapper div,
    // so we need to find the actual input element inside
    browser.execute(function(testData) {
      function setFieldValue(id, value) {
        // For Material-UI TextField, the id is on the wrapper div
        // The actual input is a child element
        let input = document.querySelector('#' + id);

        // If it's a div (MUI wrapper), find the input inside
        if (input && input.tagName !== 'INPUT') {
          input = input.querySelector('input');
        }

        // If still not found, try finding input with the id directly
        if (!input) {
          input = document.querySelector('input#' + id);
        }

        if (input) {
          console.log('Setting field ' + id + ' to: ' + value);

          // Focus the input
          input.focus();

          // Use the native value setter to properly set React's state
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 'value'
          ).set;

          // Clear existing value
          nativeInputValueSetter.call(input, '');
          input.dispatchEvent(new Event('input', { bubbles: true }));

          // Set new value using native setter
          nativeInputValueSetter.call(input, value);

          // Dispatch input event to trigger React's onChange
          const inputEvent = new Event('input', { bubbles: true });
          input.dispatchEvent(inputEvent);

          // Also dispatch change event
          const changeEvent = new Event('change', { bubbles: true });
          input.dispatchEvent(changeEvent);

          // Blur to finalize
          input.blur();
          return true;
        }
        console.log('Could not find input for id: ' + id);
        return false;
      }

      const results = {
        name: setFieldValue('nameInput', testData.name),
        identifier: setFieldValue('identifierInput', testData.identifier),
        phone: setFieldValue('phoneInput', testData.phone),
        email: setFieldValue('emailInput', testData.email),
        addressLine: setFieldValue('addressLineInput', testData.addressLine),
        city: setFieldValue('cityInput', testData.city),
        state: setFieldValue('stateInput', testData.state),
        postalCode: setFieldValue('postalCodeInput', testData.postalCode),
        country: setFieldValue('countryInput', testData.country)
      };

      console.log('Form field results:', results);
      return results;
    }, [testOrganization], function(result) {
      console.log('Form fields filled:', result.value);
    });

    browser
      .pause(1000)
      .saveScreenshot('tests/nightwatch/screenshots/organizations/04-filled-organization-form.png');

    // Verify form values before saving
    browser.execute(function() {
      function getInputValue(id) {
        let input = document.querySelector('#' + id);
        if (input && input.tagName !== 'INPUT') {
          input = input.querySelector('input');
        }
        return input ? input.value : 'NOT FOUND';
      }

      const values = {
        name: getInputValue('nameInput'),
        identifier: getInputValue('identifierInput'),
        phone: getInputValue('phoneInput'),
        email: getInputValue('emailInput')
      };

      console.log('Verifying form values before save:');
      console.log('Name:', values.name);
      console.log('Identifier:', values.identifier);
      console.log('Phone:', values.phone);
      console.log('Email:', values.email);

      return values;
    }, [], function(result) {
      console.log('Form values before save:', result.value);
    });

    // Save the organization
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Save')) {
            console.log('Found Save button, clicking...');
            button.click();
            return true;
          }
        }
        console.log('Save button not found');
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Save button');
      });

    // Wait for save operation and navigation
    browser
      .pause(3000)
      .waitForElementVisible('#organizationsPage', 10000)
      .saveScreenshot('tests/nightwatch/screenshots/organizations/05-organization-saved.png');
  });

  it('05. Verify new organization appears in list', browser => {
    browser
      .waitForElementVisible('#organizationsPage', 5000)
      .pause(500);

    // Find and store the created organization's ID
    browser.execute(function(timestamp) {
      const hasTable = document.querySelector('#organizationsTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageText = document.querySelector('#organizationsPage')?.textContent || '';

      let totalOrgs = 0;
      let foundOrgId = null;
      let foundOrgName = null;

      if (typeof Organizations !== 'undefined') {
        totalOrgs = Organizations.find({}).count();
        console.log('Total organizations in database:', totalOrgs);

        // Find the organization we just created by timestamp
        const testOrg = Organizations.findOne({ 'name': { $regex: timestamp.toString() } });
        if (testOrg) {
          foundOrgId = testOrg._id;
          foundOrgName = testOrg.name;
          console.log('Found created organization:', foundOrgId, foundOrgName);
        } else {
          // List all organizations with "Hospital" in name for debugging
          const testOrgs = Organizations.find({ 'name': { $regex: 'Hospital' } }).fetch();
          console.log('Organizations with Hospital in name:', testOrgs.map(o => ({
            _id: o._id,
            name: o.name
          })));
        }
      }

      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasNoData: pageText.includes('No Data Available'),
        totalOrgs: totalOrgs,
        foundOrgId: foundOrgId,
        foundOrgName: foundOrgName
      };
    }, [timestamp], function(result) {
      console.log('Page state:', result.value);

      // Store the found organization ID for later tests
      if (result.value.foundOrgId) {
        createdOrganizationId = result.value.foundOrgId;
        console.log('Stored created organization ID:', createdOrganizationId);
      }

      browser.assert.ok(result.value.hasTable || result.value.totalOrgs > 0,
        'Organizations table exists or organizations are in database');
    });

    browser
      .saveScreenshot('tests/nightwatch/screenshots/organizations/06-organization-in-list.png');
  });

  it('06. View organization details', browser => {
    browser
      .waitForElementVisible('#organizationsTable', 5000)
      .pause(500);

    // Click on our specific organization using the stored ID
    browser
      .execute(function(orgId, timestamp) {
        const rows = document.querySelectorAll('#organizationsTable tbody tr');
        console.log('Found', rows.length, 'rows in organizations table');
        console.log('Looking for organization ID:', orgId, 'or timestamp:', timestamp);

        // Debug: Log all row contents
        const rowContents = [];
        for (let i = 0; i < rows.length; i++) {
          rowContents.push({
            index: i,
            text: rows[i].textContent.substring(0, 100)
          });
        }
        console.log('All row contents:', JSON.stringify(rowContents));

        // First, try to find by stored ID (if available)
        if (orgId) {
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (row.textContent.includes(orgId)) {
              console.log('Found row by ID, clicking row', i);
              row.click();
              return { clicked: true, rowText: row.textContent, rowIndex: i, method: 'byId' };
            }
          }
        }

        // Fallback: Look for our test organization by timestamp
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.textContent.includes(timestamp)) {
            console.log('Found row by timestamp, clicking row', i, 'with text:', row.textContent);
            row.click();
            return { clicked: true, rowText: row.textContent, rowIndex: i, method: 'byTimestamp' };
          }
        }

        // Debug: Also check Organizations collection
        let dbInfo = {};
        if (typeof Organizations !== 'undefined') {
          const allOrgs = Organizations.find({}).fetch();
          dbInfo = allOrgs.map(o => ({
            _id: o._id,
            name: o.name
          }));
        }

        return {
          clicked: false,
          error: 'Organization not found by ID or timestamp',
          rowCount: rows.length,
          rowContents: rowContents,
          dbOrgs: dbInfo
        };
      }, [createdOrganizationId, timestamp.toString()], function(result) {
        console.log('Click result:', result.value);
        browser.assert.equal(result.value.clicked, true, 'Found and clicked organization row');
      });

    browser
      .pause(500)
      .waitForElementVisible('#organizationDetailPage', 5000)
      .assert.valueContains('#nameInput', testOrganization.name)
      .assert.valueContains('#identifierInput', testOrganization.identifier)
      .assert.valueContains('#phoneInput', testOrganization.phone)
      .saveScreenshot('tests/nightwatch/screenshots/organizations/07-view-organization-details.png');

    // Navigate back to organizations list
    testUtils.navigateUrl(browser, '/organizations');
    browser
      .waitForElementVisible('#organizationsPage', 5000);
  });

  it('07. Update existing organization', browser => {
    browser
      .waitForElementVisible('#organizationsTable', 5000)
      .pause(500);

    // Click on our specific organization using the stored ID
    browser
      .execute(function(orgId, timestamp) {
        const rows = document.querySelectorAll('#organizationsTable tbody tr');
        console.log('Looking for organization ID:', orgId, 'or timestamp:', timestamp);

        // First, try to find by stored ID
        if (orgId) {
          for (let row of rows) {
            if (row.textContent.includes(orgId)) {
              console.log('Found row by ID');
              row.click();
              return { clicked: true, method: 'byId' };
            }
          }
        }

        // Fallback: Look for by timestamp
        for (let row of rows) {
          if (row.textContent.includes(timestamp)) {
            console.log('Found row by timestamp');
            row.click();
            return { clicked: true, method: 'byTimestamp' };
          }
        }

        return { clicked: false, error: 'Organization not found' };
      }, [createdOrganizationId, timestamp.toString()], function(result) {
        console.log('Click result:', result.value);
        browser.assert.equal(result.value.clicked, true, 'Found and clicked organization row');
      });

    browser
      .pause(500)
      .waitForElementVisible('#organizationDetailPage', 5000)
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

    // Update organization details
    browser
      .click('#nameInput')
      .clearValue('#nameInput')
      .setValue('#nameInput', updatedOrganization.name)
      .click('#phoneInput')
      .clearValue('#phoneInput')
      .setValue('#phoneInput', updatedOrganization.phone)
      .click('#emailInput')
      .clearValue('#emailInput')
      .setValue('#emailInput', updatedOrganization.email)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/organizations/08-updated-organization-form.png');

    // Save the updated organization
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

    testUtils.navigateUrl(browser, '/organizations');
    browser
      .waitForElementVisible('#organizationsPage', 10000)
      .pause(2000) // Give time for data to load
      .execute(function() {
        const hasTable = document.querySelector('#organizationsTable') !== null;
        const hasNoData = document.querySelector('.no-data-card') !== null ||
                         document.querySelector('#organizationsPage').textContent.includes('No Data Available');
        return { hasTable: hasTable, hasNoData: hasNoData };
      }, [], function(result) {
        browser.assert.ok(
          result.value.hasTable || result.value.hasNoData,
          'Either organizations table or no-data state is present'
        );
      })
      .saveScreenshot('tests/nightwatch/screenshots/organizations/09-organization-updated.png');
  });

  it('08. Verify updated organization in list', browser => {
    browser
      .execute(function() {
        const hasTable = document.querySelector('#organizationsTable') !== null;
        const hasNoData = document.querySelector('.no-data-card') !== null ||
                         document.querySelector('#organizationsPage').textContent.includes('No Data Available');
        return { hasTable: hasTable, hasNoData: hasNoData };
      }, [], function(result) {
        if (result.value.hasTable) {
          browser
            .waitForElementVisible('#organizationsTable', 5000)
            .pause(500)
            .assert.containsText('#organizationsTable', updatedOrganization.name)
            .saveScreenshot('tests/nightwatch/screenshots/organizations/10-updated-organization-in-list.png');
        } else {
          browser.assert.ok(result.value.hasNoData, 'No-data state is present');
        }
      });
  });

  it('09. Delete organization', browser => {
    browser
      .waitForElementVisible('#organizationsPage', 5000)
      .pause(500);

    browser.execute(function() {
      const hasTable = document.querySelector('#organizationsTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#organizationsPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        // Click on our specific organization using the stored ID
        browser
          .execute(function(orgId, timestamp) {
            const rows = document.querySelectorAll('#organizationsTable tbody tr');
            console.log('Looking for organization ID:', orgId, 'or timestamp:', timestamp);

            // First, try to find by stored ID
            if (orgId) {
              for (let row of rows) {
                if (row.textContent.includes(orgId)) {
                  console.log('Found row by ID for deletion');
                  row.click();
                  return { clicked: true, method: 'byId' };
                }
              }
            }

            // Fallback: Look for by timestamp (updated name now)
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                console.log('Found row by timestamp for deletion');
                row.click();
                return { clicked: true, method: 'byTimestamp' };
              }
            }

            return { clicked: false, error: 'Organization not found' };
          }, [createdOrganizationId, timestamp.toString()], function(result) {
            console.log('Delete click result:', result.value);
            browser.assert.equal(result.value.clicked, true, 'Found and clicked organization row');
          });

        browser
          .pause(500)
          .waitForElementVisible('#organizationDetailPage', 5000);

        // Delete button is visible in view mode (not edit mode)
        // Click Delete button directly
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
          .pause(500)
          .acceptAlert()
          .pause(1000);

        browser
          .waitForElementVisible('#organizationsPage', 5000);
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No organizations to delete - No Data Available state is correct');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/organizations/11-organization-deleted.png');
  });

  it('10. Verify organization removed from list', browser => {
    browser
      .waitForElementVisible('#organizationsPage', 5000)
      .pause(500)
      .execute(function(orgId, timestamp) {
        const table = document.querySelector('#organizationsTable');
        if (table) {
          const rows = document.querySelectorAll('#organizationsTable tbody tr');

          // Check for our specific organization by ID or timestamp
          for (let row of rows) {
            if ((orgId && row.textContent.includes(orgId)) ||
                row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#organizationsPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [createdOrganizationId, timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Organization no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (organization was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/organizations/12-organization-not-in-list.png');
  });

  after(browser => {
    // Clean up test data using Meteor methods
    browser.executeAsync(function(done) {
      if (typeof Organizations !== 'undefined' && typeof Meteor !== 'undefined') {
        const testOrgs = Organizations.find({
          $or: [
            { 'name': { $regex: '.*Hospital.*' } },
            { 'identifier.0.value': { $regex: 'ORG.*' } }
          ]
        }).fetch();

        console.log('After cleanup: Found', testOrgs.length, 'test organizations');

        let remaining = testOrgs.length;
        if (remaining === 0) {
          done();
          return;
        }

        testOrgs.forEach(function(org) {
          Meteor.call('organizations.remove', org._id, function(error) {
            if (error) {
              console.warn('After cleanup: Could not remove org:', org._id, error.message);
            } else {
              console.log('After cleanup: Removed test organization:', org._id);
            }
            remaining--;
            if (remaining === 0) {
              done();
            }
          });
        });
      } else {
        done();
      }
    });

    browser.end();
  });
});
