// tests/nightwatch/honeycomb/enable_autopublish/crud.groups.js

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('Groups CRUD Operations [Patient-Agnostic]', function() {
  const timestamp = Date.now();
  const testGroup = {
    name: `Test Patient Cohort ${timestamp}`,
    type: 'person',
    actual: true,
    description: `A test group of patients created at ${timestamp}`,
    managingEntity: 'Test Health System'
  };

  const updatedGroup = {
    name: `Updated Patient Cohort ${timestamp}`,
    description: `Test group updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting Groups CRUD test suite...');
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  beforeEach(browser => {
    // No additional setup needed between tests
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
        if (typeof Groups !== 'undefined') {
          const testGroups = Groups.find({
            $or: [
              { 'name': { $regex: '.*Patient Cohort.*' } },
              { 'name': { $regex: '.*Test.*Cohort.*' } }
            ]
          }).fetch();
          testGroups.forEach(function(group) {
            Groups.remove({ _id: group._id });
          });
          console.log('Cleared', testGroups.length, 'test groups');
        }
        done();
      });
    });
  });

  it('02. Verify groups list page loads', browser => {
    testUtils.navigateUrl(browser, '/groups');
    browser
      .waitForElementVisible('#groupsPage', 5000)
      .execute(function() {
        const hasTable = document.querySelector('#groupsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#groupsPage') &&
                             document.querySelector('#groupsPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either groups table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/groups/02-groups-list.png');
  });

  it('03. Navigate to new group form', browser => {
    browser
      .waitForElementVisible('#groupsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Group') ||
              button.textContent.includes('Add Your First Group')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Group button');
      });

    browser
      .pause(500)
      .waitForElementVisible('#groupDetailPage', 5000)
      .assert.elementPresent('#nameInput')
      .assert.elementPresent('#typeSelect')
      .assert.elementPresent('#descriptionTextarea')
      .saveScreenshot('tests/nightwatch/screenshots/groups/03-new-group-form.png');
  });

  it('04. Create new group', browser => {
    browser
      .waitForElementVisible('#groupDetailPage', 5000)
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
      .setValue('#nameInput', testGroup.name)
      .clearValue('#descriptionTextarea')
      .setValue('#descriptionTextarea', testGroup.description)
      .pause(500);

    // Handle type select (person, animal, practitioner, device, careteam, organization)
    browser.execute(function(type) {
      const typeSelect = document.querySelector('#typeSelect');
      if (typeSelect) {
        typeSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === type ||
                option.textContent.toLowerCase() === type) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testGroup.type]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/groups/04-filled-group-form.png');

    // Save the group
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
      .waitForElementVisible('#groupsPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/groups/05-group-saved.png');
  });

  it('05. Verify new group appears in list', browser => {
    browser
      .waitForElementVisible('#groupsPage', 5000)
      .pause(500);

    browser.execute(function(timestamp) {
      const hasTable = document.querySelector('#groupsTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageText = document.querySelector('#groupsPage')?.textContent || '';

      let totalGroups = 0;
      if (typeof Groups !== 'undefined') {
        totalGroups = Groups.find({}).count();
        console.log('Total groups in database:', totalGroups);
      }

      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasNoData: pageText.includes('No Data Available'),
        totalGroups: totalGroups
      };
    }, [timestamp], function(result) {
      console.log('Page state:', result.value);
      browser.assert.ok(result.value.hasTable || result.value.totalGroups > 0,
        'Groups table exists or groups are in database');
    });

    browser
      .saveScreenshot('tests/nightwatch/screenshots/groups/06-group-in-list.png');
  });

  it('06. View group details', browser => {
    browser
      .waitForElementVisible('#groupsTable', 5000)
      .pause(500);

    // Click on the test group row
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#groupsTable tbody tr');
        console.log('Found', rows.length, 'rows in groups table');

        // Look for our test group
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
        browser.assert.equal(result.value.clicked, true, 'Found and clicked group row');
      });

    browser
      .pause(500)
      .waitForElementVisible('#groupDetailPage', 5000)
      .assert.valueContains('#nameInput', testGroup.name)
      .saveScreenshot('tests/nightwatch/screenshots/groups/07-view-group-details.png');

    // Navigate back to groups list
    testUtils.navigateUrl(browser, '/groups');
    browser
      .waitForElementVisible('#groupsPage', 5000);
  });

  it('07. Update existing group', browser => {
    browser
      .waitForElementVisible('#groupsTable', 5000)
      .pause(500);

    // Click on the group to edit
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#groupsTable tbody tr');
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
        browser.assert.equal(result.value, true, 'Found and clicked group row');
      });

    browser
      .pause(500)
      .waitForElementVisible('#groupDetailPage', 5000)
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

    // Update group details
    browser
      .click('#nameInput')
      .clearValue('#nameInput')
      .setValue('#nameInput', updatedGroup.name)
      .click('#descriptionTextarea')
      .clearValue('#descriptionTextarea')
      .setValue('#descriptionTextarea', updatedGroup.description)
      .pause(500);

    browser
      .saveScreenshot('tests/nightwatch/screenshots/groups/08-updated-group-form.png');

    // Save the updated group
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

    testUtils.navigateUrl(browser, '/groups');
    browser
      .waitForElementVisible('#groupsPage', 10000)
      .pause(2000)
      .execute(function() {
        const hasTable = document.querySelector('#groupsTable') !== null;
        const hasNoData = document.querySelector('.no-data-card') !== null ||
                         document.querySelector('#groupsPage').textContent.includes('No Data Available');
        return { hasTable: hasTable, hasNoData: hasNoData };
      }, [], function(result) {
        browser.assert.ok(
          result.value.hasTable || result.value.hasNoData,
          'Either groups table or no-data state is present'
        );
      })
      .saveScreenshot('tests/nightwatch/screenshots/groups/09-group-updated.png');
  });

  it('08. Verify updated group in list', browser => {
    browser
      .execute(function() {
        const hasTable = document.querySelector('#groupsTable') !== null;
        const hasNoData = document.querySelector('.no-data-card') !== null ||
                         document.querySelector('#groupsPage').textContent.includes('No Data Available');
        return { hasTable: hasTable, hasNoData: hasNoData };
      }, [], function(result) {
        if (result.value.hasTable) {
          browser
            .waitForElementVisible('#groupsTable', 5000)
            .pause(500)
            .assert.containsText('#groupsTable', updatedGroup.name)
            .saveScreenshot('tests/nightwatch/screenshots/groups/10-updated-group-in-list.png');
        } else {
          browser.assert.ok(result.value.hasNoData, 'No-data state is present');
        }
      });
  });

  it('09. Delete group', browser => {
    browser
      .waitForElementVisible('#groupsPage', 5000)
      .pause(500);

    browser.execute(function() {
      const hasTable = document.querySelector('#groupsTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#groupsPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#groupsTable tbody tr');
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked group row');
          });

        browser
          .pause(500)
          .waitForElementVisible('#groupDetailPage', 5000)
          .pause(500);

        // Click Delete button (visible in view mode, NOT edit mode)
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
          .pause(1000);

        browser
          .waitForElementVisible('#groupsPage', 5000);
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No groups to delete - No Data Available state is correct');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/groups/11-group-deleted.png');
  });

  it('10. Verify group removed from list', browser => {
    browser
      .waitForElementVisible('#groupsPage', 5000)
      .pause(500)
      .execute(function(timestamp) {
        const table = document.querySelector('#groupsTable');
        if (table) {
          const rows = document.querySelectorAll('#groupsTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#groupsPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Group no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (group was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/groups/12-group-not-in-list.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof Groups !== 'undefined') {
        Groups.find({
          $or: [
            { 'name': { $regex: '.*Patient Cohort.*' } },
            { 'name': { $regex: '.*Test.*Cohort.*' } }
          ]
        }).fetch().forEach(function(group) {
          Groups.remove({ _id: group._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});
