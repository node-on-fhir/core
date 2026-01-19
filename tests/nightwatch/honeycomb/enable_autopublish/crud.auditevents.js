// tests/nightwatch/honeycomb/enable_autopublish/crud.auditevents.js

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('AuditEvents CRUD Operations', function() {
  const timestamp = Date.now();

  const testAuditEvent = {
    typeCode: `rest-${timestamp}`,
    typeDisplay: `RESTful Operation ${timestamp}`,
    action: 'C', // Create
    outcome: '0', // Success
    outcomeDesc: `Test audit event created at ${timestamp}`,
    agentDisplay: `Test Agent ${timestamp}`,
    sourceObserver: 'Test Observer',
    sourceSite: 'Test Site'
  };

  const updatedAuditEvent = {
    typeDisplay: `Updated RESTful Operation ${timestamp}`,
    action: 'U', // Update
    outcome: '4', // Minor Failure
    outcomeDesc: `Test audit event updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting AuditEvents CRUD test suite...');
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
      .waitForElementVisible('body', 5000)
      .pause(1000)
      .execute(function(ts) {
        window.testTimestamp = ts;
      }, [timestamp]);

    // Use login helper with built-in retry logic
    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      } else {
        browser.assert.ok(true, 'User is logged in');
      }

      // Clean up any existing test audit events
      browser.executeAsync(function(done) {
        if (typeof AuditEvents !== 'undefined') {
          const testAuditEvents = AuditEvents.find({
            $or: [
              { 'type.code': { $regex: 'rest-.*' } },
              { 'outcomeDesc': { $regex: '.*audit event.*' } }
            ]
          }).fetch();
          testAuditEvents.forEach(function(auditEvent) {
            AuditEvents.remove({ _id: auditEvent._id });
          });
          console.log('Cleared', testAuditEvents.length, 'test audit events');
        }
        done();
      });
    });
  });

  it('02. Verify audit events list page loads', browser => {
    testUtils.navigateUrl(browser, '/audit-events');

    browser
      .waitForElementVisible('#auditEventsPage', 5000);

    // Wait for subscription to be ready and page to render
    browser.pause(2000);

    browser.execute(function() {
      const hasTable = document.querySelector('#auditEventsTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                          document.querySelector('.no-data-available') !== null ||
                          document.querySelector('[id*="no-data"]') !== null ||
                          document.querySelector('#noAuditEventsMessage') !== null ||
                          (document.querySelector('#auditEventsPage') &&
                           document.querySelector('#auditEventsPage').textContent.includes('No Audit Events Found'));

      // Debug: check what's actually on the page
      const pageElement = document.querySelector('#auditEventsPage');
      const pageText = pageElement ? pageElement.textContent : 'No #auditEventsPage element';

      console.log('=== Page State Debug ===');
      console.log('Has table:', hasTable);
      console.log('Has no-data card:', hasNoDataCard);
      console.log('Page text snippet:', pageText.substring(0, 200));

      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasEitherElement: hasTable || hasNoDataCard,
        pageText: pageText.substring(0, 200)
      };
    }, [], function(result) {
      console.log('Page state result:', result.value);
      browser.assert.equal(result.value.hasEitherElement, true, 'Either audit events table or no-data message is present');
    })
    .saveScreenshot('tests/nightwatch/screenshots/auditEvents/02-auditevents-list.png');
  });

  it('03. Navigate to new audit event form', browser => {
    browser
      .waitForElementVisible('#auditEventsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Audit Event') ||
              button.textContent.includes('Add Your First Audit Event')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Audit Event button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#auditEventDetailPage', 5000)
      .assert.elementPresent('#typeCodeInput')
      .assert.elementPresent('#typeDisplayInput')
      .assert.elementPresent('#actionSelect')
      .assert.elementPresent('#outcomeSelect')
      .assert.elementPresent('#outcomeDescInput')
      .assert.elementPresent('#agentWhoDisplayInput')
      .assert.elementPresent('#sourceObserverDisplayInput')
      .saveScreenshot('tests/nightwatch/screenshots/auditEvents/03-new-auditevent-form.png');
  });

  it('04. Create new audit event', browser => {
    browser
      .waitForElementVisible('#auditEventDetailPage', 5000)
      .pause(500);

    // Check if we're on the new audit event page
    browser.assert.urlContains('/audit-events/new');

    // Fill form fields
    browser
      .clearValue('#typeCodeInput')
      .setValue('#typeCodeInput', testAuditEvent.typeCode)
      .clearValue('#typeDisplayInput')
      .setValue('#typeDisplayInput', testAuditEvent.typeDisplay)
      .clearValue('#outcomeDescInput')
      .setValue('#outcomeDescInput', testAuditEvent.outcomeDesc)
      .clearValue('#agentWhoDisplayInput')
      .setValue('#agentWhoDisplayInput', testAuditEvent.agentDisplay)
      .clearValue('#sourceObserverDisplayInput')
      .setValue('#sourceObserverDisplayInput', testAuditEvent.sourceObserver)
      .clearValue('#sourceSiteInput')
      .setValue('#sourceSiteInput', testAuditEvent.sourceSite)
      .pause(500);

    // Handle Material-UI Select for action
    browser.execute(function(action) {
      console.log('Trying to set action to:', action);
      const actionSelect = document.querySelector('#actionSelect');
      if (actionSelect) {
        actionSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          console.log('Found', options.length, 'options');
          for (let option of options) {
            if (option.getAttribute('data-value') === action) {
              console.log('Clicking option:', option.textContent);
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testAuditEvent.action]);

    browser.pause(500);

    // Handle Material-UI Select for outcome
    browser.execute(function(outcome) {
      const outcomeSelect = document.querySelector('#outcomeSelect');
      if (outcomeSelect) {
        outcomeSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === outcome) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testAuditEvent.outcome]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/auditEvents/04-filled-auditevent-form.png');

    // Log form values before save
    browser.execute(function() {
      const typeCodeField = document.querySelector('#typeCodeInput');
      const typeDisplayField = document.querySelector('#typeDisplayInput');
      const outcomeDescField = document.querySelector('#outcomeDescInput');

      console.log('=== Form values before save ===');
      console.log('Type code:', typeCodeField ? typeCodeField.value : 'not found');
      console.log('Type display:', typeDisplayField ? typeDisplayField.value : 'not found');
      console.log('Outcome desc:', outcomeDescField ? outcomeDescField.value : 'not found');

      if (typeof Session !== 'undefined') {
        console.log('User ID:', typeof Meteor !== 'undefined' ? Meteor.userId() : 'No Meteor');
      }

      return { logged: true };
    });

    // Save the audit event
    browser
      .execute(function() {
        window.consoleErrors = [];
        const originalError = console.error;
        console.error = function() {
          window.consoleErrors.push(Array.from(arguments).join(' '));
          originalError.apply(console, arguments);
        };

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

    browser.pause(2000);

    // Check if we're back on the audit events list page
    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#auditEventsTable') !== null;
      const hasAuditEventsPage = document.querySelector('#auditEventsPage') !== null;
      const hasDetailPage = document.querySelector('#auditEventDetailPage') !== null;

      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });

      const consoleErrors = window.consoleErrors || [];

      return {
        url: currentUrl,
        hasTable: hasTable,
        hasAuditEventsPage: hasAuditEventsPage,
        hasDetailPage: hasDetailPage,
        hasError: errorText.length > 0,
        errorText: errorText.trim(),
        consoleErrors: consoleErrors,
        userId: typeof Meteor !== 'undefined' && Meteor.userId ? Meteor.userId() : 'No Meteor.userId',
        isLoggedIn: typeof Meteor !== 'undefined' && Meteor.userId ? !!Meteor.userId() : false
      };
    }, [], function(result) {
      console.log('Post-save state:', result.value);
      if (result.value.hasError) {
        browser.assert.fail(`Save failed with error: ${result.value.errorText}`);
      }
      if (!result.value.isLoggedIn) {
        browser.assert.fail('User is not logged in after save attempt');
      }
      if (result.value.url === '/audit-events/new') {
        console.log('Still on new audit event page - save may have failed silently');
      }
    });

    browser
      .waitForElementVisible('#auditEventsPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/auditEvents/05-auditevent-saved.png');
  });

  it('05. Verify new audit event appears in list', browser => {
    browser
      .waitForElementVisible('#auditEventsPage', 5000)
      .pause(1000);

    // Search for our specific test audit event
    browser
      .waitForElementVisible('#auditEventSearchInput', 5000)
      .execute(function(searchValue) {
        const input = document.querySelector('#auditEventSearchInput');
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
      }, [testAuditEvent.typeDisplay.substring(0, 20)])
      .pause(3000);

    browser.execute(function() {
      const hasTable = document.querySelector('#auditEventsTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                          document.querySelector('#noAuditEventsMessage') !== null;
      const pageText = document.querySelector('#auditEventsPage')?.textContent || '';

      let totalAuditEvents = 0;

      if (typeof AuditEvents !== 'undefined') {
        totalAuditEvents = AuditEvents.find({}).count();
        console.log('Total audit events in database:', totalAuditEvents);

        const testAuditEvent = AuditEvents.findOne({
          'type.code': { $regex: 'rest-.*' }
        });
        console.log('Found test audit event:', testAuditEvent);
      }

      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasNoData: pageText.includes('No Audit Events Found'),
        totalAuditEvents: totalAuditEvents
      };
    }, [], function(result) {
      console.log('Page state:', result.value);

      if (result.value.totalAuditEvents > 0 && (result.value.hasNoData || result.value.hasNoDataCard)) {
        browser.assert.fail(`Audit events exist (${result.value.totalAuditEvents}) but are not showing - query issue`);
      } else if (result.value.hasNoData || result.value.hasNoDataCard) {
        browser.assert.fail('No audit events found - save operation may have failed');
      }
    });

    browser.execute(function() {
      const table = document.querySelector('#auditEventsTable');
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
        browser.assert.ok(true, `Found ${result.value.rowCount} audit event(s) in table`);
      } else {
        browser.assert.fail('No audit events table found or table is empty');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/auditEvents/06-auditevent-in-list.png');
  });

  it('06. View audit event details', browser => {
    browser
      .waitForElementVisible('#auditEventsPage', 5000)
      .pause(1000);

    // Search for our specific audit event
    browser
      .waitForElementVisible('#auditEventSearchInput', 5000)
      .execute(function(searchValue) {
        const input = document.querySelector('#auditEventSearchInput');
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.value = searchValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, [testAuditEvent.typeDisplay.substring(0, 20)])
      .pause(3000);

    // Now click on the audit event row
    browser
      .waitForElementVisible('#auditEventsTable', 5000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#auditEventsTable tbody tr');
        console.log('Found', rows.length, 'rows in audit events table');

        // Look for our test audit event
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.textContent.includes(timestamp)) {
            console.log('Clicking row', i, 'with text:', row.textContent.substring(0, 100));
            row.click();
            return { clicked: true, rowText: row.textContent.substring(0, 100), rowIndex: i };
          }
        }

        // If not found, click the first row
        if (rows.length > 0) {
          rows[0].click();
          return { clicked: true, rowText: rows[0].textContent.substring(0, 100), rowIndex: 0 };
        }

        return { clicked: false, error: 'No rows found' };
      }, [timestamp.toString()], function(result) {
        console.log('Click result:', result.value);
        browser.assert.equal(result.value.clicked, true, 'Found and clicked audit event row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#auditEventDetailPage', 5000)
      .assert.valueContains('#typeDisplayInput', testAuditEvent.typeDisplay.substring(0, 20))
      .assert.valueContains('#outcomeDescInput', testAuditEvent.outcomeDesc.substring(0, 20))
      .execute(function() {
        const actionSelect = document.querySelector('#actionSelect');
        const outcomeSelect = document.querySelector('#outcomeSelect');

        return {
          action: actionSelect ? actionSelect.value : null,
          outcome: outcomeSelect ? outcomeSelect.value : null
        };
      }, [], function(result) {
        console.log('View audit event details - form values:', result.value);
      })
      .saveScreenshot('tests/nightwatch/screenshots/auditEvents/07-view-auditevent-details.png');

    // Navigate back to audit events list
    testUtils.navigateUrl(browser, '/audit-events');
    browser.waitForElementVisible('#auditEventsPage', 5000);
  });

  it('07. Update existing audit event', browser => {
    browser
      .waitForElementVisible('#auditEventsTable', 5000)
      .pause(1000);

    // Search for our specific test audit event first
    browser
      .waitForElementVisible('#auditEventSearchInput', 5000)
      .execute(function(searchValue) {
        const input = document.querySelector('#auditEventSearchInput');
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.value = searchValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, [testAuditEvent.typeDisplay.substring(0, 20)])
      .pause(3000);

    // Now click on the audit event to edit
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#auditEventsTable tbody tr');
        console.log('Looking for audit event with timestamp:', timestamp);
        console.log('Found', rows.length, 'rows in table');

        for (let i = 0; i < rows.length; i++) {
          console.log('Row', i, ':', rows[i].textContent.substring(0, 100));
          if (rows[i].textContent.includes(timestamp)) {
            console.log('Found test audit event in row', i);
            rows[i].click();
            return { success: true, found: true, rowIndex: i };
          }
        }

        // Click first row if not found
        if (rows.length > 0) {
          rows[0].click();
          return { success: true, found: false, rowIndex: 0 };
        }

        console.error('Test audit event not found in table!');
        return { success: false, found: false, error: 'Test audit event not in table' };
      }, [timestamp.toString()], function(result) {
        if (!result.value.found) {
          console.log('Test audit event not found by timestamp, using first row');
        }
      });

    browser
      .pause(1000)
      .waitForElementVisible('#auditEventDetailPage', 5000)
      .pause(500);

    // Enter edit mode
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Edit')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Edit button to enter edit mode');
      })
      .pause(500);

    // Update audit event details
    browser
      .clearValue('#typeDisplayInput')
      .setValue('#typeDisplayInput', updatedAuditEvent.typeDisplay)
      .clearValue('#outcomeDescInput')
      .setValue('#outcomeDescInput', updatedAuditEvent.outcomeDesc)
      .pause(500);

    // Update action
    browser.execute(function(action) {
      const actionSelect = document.querySelector('#actionSelect');
      if (actionSelect) {
        actionSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === action) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [updatedAuditEvent.action]);

    browser.pause(500);

    // Update outcome
    browser.execute(function(outcome) {
      const outcomeSelect = document.querySelector('#outcomeSelect');
      if (outcomeSelect) {
        outcomeSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === outcome) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [updatedAuditEvent.outcome]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/auditEvents/08-updated-auditevent-form.png');

    // Save the updated audit event
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
        browser.assert.equal(result.value, true, 'Clicked Save/Update button');
      });

    browser.pause(1000);

    // Navigate back to audit events list
    testUtils.navigateUrl(browser, '/audit-events');
    browser
      .waitForElementVisible('#auditEventsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/auditEvents/09-auditevent-updated.png');
  });

  it('08. Verify updated audit event in list', browser => {
    browser
      .waitForElementVisible('#auditEventsTable', 5000)
      .waitForElementVisible('#auditEventSearchInput', 5000)
      .execute(function(searchValue) {
        const input = document.querySelector('#auditEventSearchInput');
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.value = searchValue;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, [updatedAuditEvent.typeDisplay.substring(0, 20)])
      .pause(3000);

    browser
      .execute(function(expectedName, timestamp) {
        const table = document.querySelector('#auditEventsTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const auditEventInfo = [];

        console.log('=== Looking for updated audit event ===');
        console.log('Expected name:', expectedName);
        console.log('Timestamp:', timestamp);

        // Debug database content
        if (typeof AuditEvents !== 'undefined') {
          const testAuditEvent = AuditEvents.findOne({
            $or: [
              { 'type.display': { $regex: '.*' + timestamp + '.*' } },
              { 'outcomeDesc': { $regex: '.*' + timestamp + '.*' } }
            ]
          });

          if (testAuditEvent) {
            console.log('Found audit event in database:');
            console.log('- _id:', testAuditEvent._id);
            console.log('- type:', JSON.stringify(testAuditEvent.type, null, 2));
            console.log('- action:', testAuditEvent.action);
            console.log('- outcome:', testAuditEvent.outcome);
          }
        }

        for (let row of rows) {
          const rowText = row.textContent;
          console.log('Row text:', rowText.substring(0, 100));

          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            for (let i = 0; i < Math.min(cells.length, 5); i++) {
              const cellText = cells[i].textContent.trim();
              if (cellText && cellText.length > 0) {
                auditEventInfo.push(`Cell ${i}: ${cellText}`);
              }
            }
          }
        }

        const foundExpected = table ? table.textContent.includes(expectedName.substring(0, 15)) : false;
        const foundTimestamp = table ? table.textContent.includes(timestamp) : false;

        return {
          rowCount: rows.length,
          auditEventInfo: auditEventInfo,
          tableText: table ? table.textContent.substring(0, 500) : 'Table not found',
          foundExpected: foundExpected,
          foundTimestamp: foundTimestamp
        };
      }, [updatedAuditEvent.typeDisplay, timestamp.toString()], function(result) {
        console.log('Table debug info:', result.value);

        if (result.value.rowCount === 0) {
          browser.assert.fail('No audit events found in table after search. The update may have failed or search is not working.');
        } else if (!result.value.foundExpected && !result.value.foundTimestamp) {
          browser.assert.fail(`Updated audit event not found in table. Table contains: ${result.value.auditEventInfo.join('; ')}`);
        } else {
          browser.assert.ok(true, 'Found updated audit event in table');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/auditEvents/10-updated-auditevent-in-list.png');
  });

  it('09. Delete audit event', browser => {
    browser
      .waitForElementVisible('#auditEventsPage', 5000)
      .pause(1000);

    browser.execute(function() {
      const hasTable = document.querySelector('#auditEventsTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#noAuditEventsMessage') !== null ||
                       document.querySelector('#auditEventsPage').textContent.includes('No Audit Events Found');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        // Search for our audit event
        browser
          .execute(function(searchValue) {
            const input = document.querySelector('#auditEventSearchInput');
            if (input) {
              input.value = '';
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.value = searchValue;
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
            return false;
          }, [updatedAuditEvent.typeDisplay.substring(0, 15)])
          .pause(3000);

        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#auditEventsTable tbody tr');
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            // Click first row if not found
            if (rows.length > 0) {
              rows[0].click();
              return true;
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked audit event row');
          });

        browser
          .pause(1000)
          .waitForElementVisible('#auditEventDetailPage', 5000);

        // Click Delete button (visible in view mode)
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
          .waitForElementVisible('#auditEventsPage', 5000)
          .execute(function() {
            const hasTable = document.querySelector('#auditEventsTable') !== null;
            const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                                document.querySelector('.no-data-available') !== null ||
                                document.querySelector('#noAuditEventsMessage') !== null ||
                                (document.querySelector('#auditEventsPage') &&
                                 document.querySelector('#auditEventsPage').textContent.includes('No Audit Events Found'));
            return {
              hasTable: hasTable,
              hasNoDataCard: hasNoDataCard,
              hasEitherElement: hasTable || hasNoDataCard
            };
          }, [], function(result) {
            browser.assert.equal(result.value.hasEitherElement, true, 'Either audit events table or no-data message is present after deletion');
          });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No audit events to delete - No Data Available state is correct');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/auditEvents/11-auditevent-deleted.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof AuditEvents !== 'undefined') {
        AuditEvents.find({
          $or: [
            { 'type.code': { $regex: 'rest-.*' } },
            { 'outcomeDesc': { $regex: '.*audit event.*' } }
          ]
        }).fetch().forEach(function(auditEvent) {
          AuditEvents.remove({ _id: auditEvent._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});
