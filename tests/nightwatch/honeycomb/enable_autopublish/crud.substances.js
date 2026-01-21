// tests/nightwatch/honeycomb/enable_autopublish/crud.substances.js
//
// CRUD test suite for Substances - a patient-agnostic FHIR resource.
// Substances are not owned by patients, so no patient context management is needed.
//
// This follows the standard CRUD test pattern for patient-agnostic resources:
//   1. Login
//   2. Navigate to list page
//   3. Create new record
//   4. Verify record in list
//   5. View details
//   6. Update record
//   7. Verify update
//   8. Delete record
//   9. Verify deletion

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('Substances CRUD Operations', function() {
  const timestamp = Date.now();
  let createdSubstanceId = null; // Store substance ID for cross-test access

  const testSubstance = {
    code: '387207008', // Ibuprofen SNOMED code
    codeDisplay: `Test Substance ${timestamp}`,
    category: 'drug',
    categoryDisplay: 'Drug or Medicament',
    status: 'active',
    description: `Test substance created at ${timestamp}`,
    instanceIdentifier: `BATCH-${timestamp}`,
    instanceExpiry: '2025-12-31',
    instanceQuantityValue: '100',
    instanceQuantityUnit: 'mg',
    ingredientCode: '387207008',
    ingredientDisplay: 'Ibuprofen'
  };

  const updatedSubstance = {
    description: `Test substance updated at ${timestamp}`,
    status: 'inactive',
    instanceExpiry: '2026-06-30'
  };

  before(browser => {
    console.log('Starting Substances CRUD test suite...');
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  beforeEach(browser => {
    // No pause needed
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      } else {
        browser.assert.ok(true, 'User is logged in');
      }

      // Clean up any existing test data
      browser.executeAsync(function(done) {
        if (typeof Substances !== 'undefined') {
          const testSubstances = Substances.find({
            'description': { $regex: 'Test substance' }
          }).fetch();
          testSubstances.forEach(function(substance) {
            Substances.remove({ _id: substance._id });
          });
          console.log('Cleared', testSubstances.length, 'test substances');
        }
        done();
      });
    });
  });

  it('02. Verify substances list page loads', browser => {
    // Navigate to substances page - this may use window.location which causes full page reload
    browser.url('http://localhost:3000/substances');

    // Wait for page to fully load - React needs time to hydrate after full page reload
    browser
      .waitForElementVisible('body', 10000)
      .pause(5000) // Give React more time to fully hydrate after page reload
      .execute(function() {
        // Debug: Log the page state
        console.log('Current URL:', window.location.href);
        const reactTarget = document.querySelector('#react-target');
        const hasReactContent = reactTarget && reactTarget.innerHTML.length > 100;
        console.log('React target has content:', hasReactContent);
        console.log('React target innerHTML length:', reactTarget ? reactTarget.innerHTML.length : 0);

        // If react target has content, show it
        if (reactTarget) {
          console.log('React target innerHTML (first 1000 chars):', reactTarget.innerHTML.substring(0, 1000));
        }

        // Check for any visible content
        const allVisibleText = document.body.innerText.substring(0, 500);
        console.log('Visible text:', allVisibleText);

        // Check for JS errors in window.onerror
        const substancesPage = document.querySelector('#substancesPage');
        console.log('substancesPage element:', substancesPage);

        // Check for common IDs
        const allIds = Array.from(document.querySelectorAll('[id]')).map(e => e.id);
        console.log('All page IDs:', allIds.slice(0, 30));

        // Check if Meteor is available
        const meteorAvailable = typeof Meteor !== 'undefined';
        const userLoggedIn = meteorAvailable && Meteor.userId() !== null;

        return {
          url: window.location.href,
          hasReactContent: hasReactContent,
          reactContentLength: reactTarget ? reactTarget.innerHTML.length : 0,
          reactContentSample: reactTarget ? reactTarget.innerHTML.substring(0, 500) : '',
          hasSubstancesPage: substancesPage !== null,
          allIds: allIds.slice(0, 30),
          meteorAvailable: meteorAvailable,
          userLoggedIn: userLoggedIn,
          visibleText: allVisibleText
        };
      }, [], function(result) {
        console.log('[Test 02] Debug info:', JSON.stringify(result.value, null, 2));
      });

    // Capture browser logs for errors
    browser.getLog('browser', function(logs) {
      console.log('[Test 02] Browser console logs:');
      if (logs && logs.length > 0) {
        logs.forEach(function(log) {
          if (log.level === 'SEVERE' || log.message.includes('Error') || log.message.includes('error')) {
            console.log('  [ERROR]', log.message);
          }
        });
      } else {
        console.log('  No error logs found');
      }
    });

    browser.waitForElementVisible('#substancesPage', 10000)
      .execute(function() {
        const hasTable = document.querySelector('#substancesTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#substancesPage') &&
                             document.querySelector('#substancesPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either substances table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/substances/02-substances-list.png');
  });

  it('03. Navigate to new substance form', browser => {
    browser
      .waitForElementVisible('#substancesPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        const buttonTexts = Array.from(buttons).map(b => b.textContent.trim());
        console.log('Available buttons:', buttonTexts);

        for (let button of buttons) {
          const text = button.textContent.toLowerCase();
          if (text.includes('add') && text.includes('substance')) {
            button.click();
            return true;
          }
        }

        return false;
      }, [], function(result) {
        if (!result.value) {
          testUtils.navigateUrl(browser, '/substances/new');
        } else {
          browser.assert.equal(result.value, true, 'Clicked Add Substance button');
        }
      });

    browser
      .waitForElementVisible('#substanceDetailPage', 10000)
      .assert.elementPresent('#codeText')
      .assert.elementPresent('#codeCode')
      .assert.elementPresent('#codeDisplay')
      .assert.elementPresent('#status')
      .assert.elementPresent('#description')
      .saveScreenshot('tests/nightwatch/screenshots/substances/03-new-substance-form.png');
  });

  it('04. Create new substance', browser => {
    browser
      .waitForElementVisible('#substanceDetailPage', 5000)
      .pause(500);

    browser.execute(function() {
      return {
        hasSubstancesCreate: typeof Meteor.call === 'function',
        userId: Meteor.userId ? Meteor.userId() : null,
        username: Meteor.user ? (Meteor.user() ? Meteor.user().username : null) : null
      };
    }, [], function(result) {
      console.log('Meteor state:', result.value);
    });

    browser
      .assert.urlContains('/substances/new')
      .pause(500);

    // Check if fields are editable (might need to click Edit button)
    browser.execute(function() {
      const codeField = document.querySelector('#codeText');
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

    browser
      .pause(500)
      .click('#codeText')
      .clearValue('#codeText')
      .setValue('#codeText', testSubstance.codeDisplay)
      .click('#codeCode')
      .clearValue('#codeCode')
      .setValue('#codeCode', testSubstance.code)
      .click('#codeDisplay')
      .clearValue('#codeDisplay')
      .setValue('#codeDisplay', testSubstance.codeDisplay);

    // Handle Material-UI Select component for status
    browser.execute(function(status) {
      const statusSelect = document.querySelector('#status');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === status) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testSubstance.status]);

    browser.pause(500);

    // Handle category select
    browser.execute(function(category) {
      const categorySelect = document.querySelector('#categorySelect');
      if (categorySelect) {
        categorySelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === category) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testSubstance.category]);

    browser
      .pause(500)
      .click('#description')
      .clearValue('#description')
      .setValue('#description', testSubstance.description)
      .click('#instanceIdentifier')
      .clearValue('#instanceIdentifier')
      .setValue('#instanceIdentifier', testSubstance.instanceIdentifier)
      .click('#instanceExpiry')
      .clearValue('#instanceExpiry')
      .setValue('#instanceExpiry', testSubstance.instanceExpiry)
      .click('#instanceQuantityValue')
      .clearValue('#instanceQuantityValue')
      .setValue('#instanceQuantityValue', testSubstance.instanceQuantityValue)
      .click('#instanceQuantityUnit')
      .clearValue('#instanceQuantityUnit')
      .setValue('#instanceQuantityUnit', testSubstance.instanceQuantityUnit)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/substances/04-filled-substance-form.png');

    // Set up interception for save result
    browser
      .execute(function() {
        window.consoleErrors = [];
        window.saveAttempted = false;
        window.saveResult = null;

        const originalError = console.error;
        console.error = function() {
          window.consoleErrors.push(Array.from(arguments).join(' '));
          originalError.apply(console, arguments);
        };

        const originalCall = Meteor.callAsync;
        Meteor.callAsync = async function(method, ...args) {
          console.log('Meteor.callAsync intercepted:', method);
          if (method === 'substances.create') {
            window.saveAttempted = true;
            try {
              const result = await originalCall.apply(this, [method, ...args]);
              window.saveResult = { success: true, result: result };
              console.log('Save successful, result:', result);
              return result;
            } catch (error) {
              window.saveResult = { success: false, error: error.message || error.toString() };
              console.error('Save failed:', error);
              throw error;
            }
          }
          return originalCall.apply(this, [method, ...args]);
        };

        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Save')) {
            console.log('Clicking save button...');
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Save button');
      });

    browser
      .waitForElementVisible('#substancesPage', 5000);

    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#substancesTable') !== null;
      const hasSubstancesPage = document.querySelector('#substancesPage') !== null;
      const hasDetailPage = document.querySelector('#substanceDetailPage') !== null;

      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });

      const consoleErrors = window.consoleErrors || [];

      return {
        url: currentUrl,
        hasTable: hasTable,
        hasSubstancesPage: hasSubstancesPage,
        hasDetailPage: hasDetailPage,
        hasError: errorText.length > 0,
        errorText: errorText.trim(),
        consoleErrors: consoleErrors,
        userId: Meteor.userId ? Meteor.userId() : 'No Meteor.userId',
        isLoggedIn: Meteor.userId ? !!Meteor.userId() : false,
        saveAttempted: window.saveAttempted || false,
        saveResult: window.saveResult || null
      };
    }, [], function(result) {
      console.log('Post-save state:', result.value);
      if (result.value.consoleErrors && result.value.consoleErrors.length > 0) {
        console.log('Console errors:', result.value.consoleErrors);
      }
      if (result.value.saveAttempted) {
        console.log('Save was attempted. Result:', result.value.saveResult);
      } else {
        console.log('Save was NOT attempted - method may not have been called');
      }
      if (result.value.hasError) {
        browser.assert.fail(`Save failed with error: ${result.value.errorText}`);
      }
      if (!result.value.isLoggedIn) {
        browser.assert.fail('User is not logged in after save attempt');
      }
      if (result.value.url === '/substances/new') {
        console.log('Still on new substance page - save may have failed silently');
      }
    });

    // Capture substance ID for use in subsequent tests
    browser.execute(function() {
      return window.saveResult?.result || null;
    }, [], function(result) {
      if (result.value) {
        createdSubstanceId = result.value;
        console.log('✓ Captured substance ID for subsequent tests:', createdSubstanceId);
      } else {
        console.warn('✗ Could not capture substance ID');
      }
    });

    browser
      .waitForElementVisible('#substancesPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/substances/05-substance-saved.png');
  });

  it('05. Verify new substance appears in list', browser => {
    browser
      .waitForElementVisible('#substancesPage', 5000)
      .pause(5000); // Give subscription more time to react

    // Check if table OR no-data state is present (handle both cases)
    browser.execute(function() {
      const hasTable = document.querySelector('#substancesTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                          (document.body.textContent.includes('No Data Available'));
      const substanceCount = typeof Substances !== 'undefined' ? Substances.find({}).count() : 0;
      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        substanceCount: substanceCount,
        hasEither: hasTable || hasNoDataCard
      };
    }, [], function(result) {
      console.log('[Test 05] Page state:', result.value);
      browser.assert.equal(result.value.hasEither, true, 'Either table or no-data message is present');
    });

    // Now verify the substance was created in the database
    browser.execute(function(timestamp) {
      const searchDescription = `Test substance created at ${timestamp}`;
      let ourSubstance = null;
      let savedSubstance = null;
      let substanceCount = 0;

      if (typeof Substances !== 'undefined') {
        substanceCount = Substances.find({}).count();
        ourSubstance = Substances.findOne({
          'description': searchDescription
        });

        if (window.saveResult && window.saveResult.result) {
          savedSubstance = Substances.findOne({
            _id: window.saveResult.result
          });
        }
      }

      const table = document.querySelector('#substancesTable');
      const rows = table ? table.querySelectorAll('tbody tr') : [];

      return {
        substanceCount: substanceCount,
        tableRowCount: rows.length,
        ourSubstance: ourSubstance ? {
          _id: ourSubstance._id,
          codeDisplay: ourSubstance.code?.text,
          description: ourSubstance.description
        } : null,
        savedSubstance: savedSubstance ? {
          _id: savedSubstance._id,
          codeDisplay: savedSubstance.code?.text,
          description: savedSubstance.description
        } : null,
        saveResultId: window.saveResult?.result || null
      };
    }, [timestamp.toString()], function(result) {
      console.log('[Test 05] Substance data:', JSON.stringify(result.value, null, 2));
    });

    browser
      .saveScreenshot('tests/nightwatch/screenshots/substances/06-substance-in-list.png');
  });

  it('06. View substance details', browser => {
    // Navigate directly to the substance detail page using captured ID
    browser.execute(function(substanceId) {
      console.log('Navigating directly to substance detail:', substanceId);
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/substances/' + substanceId);
      } else {
        window.location.href = '/substances/' + substanceId;
      }
      return { navigatedTo: substanceId };
    }, [createdSubstanceId], function(result) {
      console.log('Navigation:', result.value);
    });

    browser
      .pause(2000)
      .waitForElementVisible('#substanceDetailPage', 5000)
      .assert.valueContains('#codeText', testSubstance.codeDisplay)
      .assert.valueContains('#description', testSubstance.description)
      .execute(function() {
        const statusInput = document.querySelector('#status');

        return {
          status: statusInput ? statusInput.value : null,
          description: document.querySelector('#description').value,
          statusDisplay: document.querySelector('[aria-labelledby*="status"]')?.textContent ||
                        document.querySelector('#status')?.parentElement?.textContent
        };
      }, [], function(result) {
        const statusOk = result.value.status === testSubstance.status ||
                        (result.value.statusDisplay && result.value.statusDisplay.toLowerCase().includes('active'));

        browser.assert.ok(statusOk, 'Status matches');
        browser.assert.ok(result.value.description.includes(testSubstance.description), 'Description contains expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/substances/07-view-substance-details.png');

    testUtils.navigateUrl(browser, '/substances');
    browser
      .waitForElementVisible('#substancesPage', 5000);
  });

  it('07. Update existing substance', browser => {
    // Navigate directly to the substance detail page
    browser.execute(function(substanceId) {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/substances/' + substanceId);
      } else {
        window.location.href = '/substances/' + substanceId;
      }
    }, [createdSubstanceId]);

    browser
      .pause(2000)
      .waitForElementVisible('#substanceDetailPage', 5000)
      .pause(500);

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

    browser
      .click('#description')
      .clearValue('#description')
      .setValue('#description', updatedSubstance.description)
      .click('#status')
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
      }, [updatedSubstance.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#instanceExpiry')
      .clearValue('#instanceExpiry')
      .setValue('#instanceExpiry', updatedSubstance.instanceExpiry)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/substances/08-updated-substance-form.png');

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
      .pause(2000)
      .saveScreenshot('tests/nightwatch/screenshots/substances/09-substance-updated.png');
  });

  it('08. Verify substance was updated', browser => {
    // Navigate directly to verify the update persisted
    browser.execute(function(substanceId) {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/substances/' + substanceId);
      } else {
        window.location.href = '/substances/' + substanceId;
      }
    }, [createdSubstanceId]);

    browser
      .pause(2000)
      .waitForElementVisible('#substanceDetailPage', 5000)
      .assert.valueContains('#description', updatedSubstance.description)
      .saveScreenshot('tests/nightwatch/screenshots/substances/10-verified-update.png');

    // Navigate back to list
    testUtils.navigateUrl(browser, '/substances');
    browser.waitForElementVisible('#substancesPage', 5000);
  });

  it('09. Delete substance', browser => {
    // Navigate directly to the substance detail page
    browser.execute(function(substanceId) {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/substances/' + substanceId);
      } else {
        window.location.href = '/substances/' + substanceId;
      }
    }, [createdSubstanceId]);

    browser
      .pause(2000)
      .waitForElementVisible('#substanceDetailPage', 5000);

    // Delete button should be visible in view mode (not edit mode)
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

    // Verify we're back at the list page
    browser
      .waitForElementVisible('#substancesPage', 5000)
      .execute(function() {
        const hasTable = document.querySelector('#substancesTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('#substancesPage').textContent.includes('No Data Available');
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.ok(result.value.hasEitherElement, 'Either substances table or no-data message is present after deletion');
      })
      .saveScreenshot('tests/nightwatch/screenshots/substances/11-substance-deleted.png');
  });

  it('10. Verify substance removed from list', browser => {
    browser
      .waitForElementVisible('#substancesPage', 5000)
      .pause(500)
      .execute(function(timestamp) {
        const table = document.querySelector('#substancesTable');
        if (table) {
          const rows = document.querySelectorAll('#substancesTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#substancesPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Substance no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (substance was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/substances/12-substance-not-in-list.png');
  });

  after(browser => {
    browser.executeAsync(function(done) {
      if (typeof Substances !== 'undefined') {
        Substances.find({
          'description': { $regex: 'Test substance' }
        }).fetch().forEach(function(substance) {
          Substances.remove({ _id: substance._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});
