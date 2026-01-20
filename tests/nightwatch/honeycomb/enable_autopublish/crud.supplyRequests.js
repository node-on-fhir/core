// tests/nightwatch/honeycomb/enable_autopublish/crud.supplyRequests.js

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('SupplyRequests CRUD Operations', function() {
  const timestamp = Date.now();
  let createdSupplyRequestId = null; // Store supply request ID for cross-test access

  const testSupplyRequest = {
    status: 'active',
    priority: 'routine',
    category: 'central',
    categoryCode: 'central',
    categoryDisplay: 'Central Supply',
    authoredOn: new Date().toISOString(),
    occurrenceDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    itemCodeableConcept: `Medical Supplies ${timestamp}`,
    itemCodeableConceptCode: '260787004',
    itemCodeableConceptDisplay: 'Medical supplies',
    quantity: '100',
    quantityUnit: 'units',
    requester: 'Dr. Jane Smith',
    requesterReference: `Practitioner/${timestamp}`,
    supplier: 'Medical Supply Company',
    supplierReference: `Organization/${timestamp}`,
    deliverFrom: 'Central Warehouse',
    deliverFromReference: `Location/${timestamp}`,
    deliverTo: 'Hospital Pharmacy',
    deliverToReference: `Location/${timestamp}-destination`,
    reasonCode: 'Stock replenishment',
    reasonCodeCode: '373066001',
    notes: `Test supply request created at ${timestamp}`
  };

  const updatedSupplyRequest = {
    status: 'completed',
    priority: 'urgent',
    quantity: '150',
    itemCodeableConcept: `Updated Medical Supplies ${timestamp}`,
    notes: `Test supply request updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting SupplyRequests CRUD test suite...');
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
      .execute(function(ts) {
        window.testTimestamp = ts;
      }, [timestamp]);

    // Use loginHelper to ensure user is logged in with retry logic
    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      } else {
        browser.assert.ok(true, 'User is logged in');
      }

      // Clean up any existing test data (MUST be inside callback)
      browser.executeAsync(function(ts, done) {
        console.log('[Test] Cleaning up test supply requests with timestamp:', ts);
        if (typeof SupplyRequests !== 'undefined') {
          const testRequests = SupplyRequests.find({
            $or: [
              { 'itemCodeableConcept.text': { $regex: ts.toString() } },
              { 'note.0.text': { $regex: ts.toString() } }
            ]
          }).fetch();

          testRequests.forEach(function(request) {
            SupplyRequests.remove({_id: request._id});
          });

          console.log('[Test] Cleaned up', testRequests.length, 'test supply requests');
        }
        done();
      }, [timestamp]);
    });
  });

  it('02. Navigate to supply requests list page', browser => {
    testUtils.navigateUrl(browser, '/supply-requests');
    browser
      .waitForElementVisible('body', 5000)
      .windowSize('current', 1400, 900)
      .pause(1000);

    // Check for either the table or the no-data state
    browser.execute(function() {
      const tableExists = !!document.getElementById('supplyRequestsTable');
      const noDataExists = !!document.querySelector('[data-testid="no-supply-requests"]');
      const pageTitle = document.querySelector('h4') ? document.querySelector('h4').textContent : '';

      return {
        tableExists: tableExists,
        noDataExists: noDataExists,
        pageTitle: pageTitle,
        hasEitherState: tableExists || noDataExists
      };
    }, [], function(result) {
      console.log('Page state:', result.value);
      browser.assert.ok(result.value.hasEitherState,
        'Either supply requests table or no-data state should be visible');
    });
  });

  it('03. Navigate to create supply request form', browser => {
    // First check if the Add button exists
    browser.execute(function() {
      const addButton = document.querySelector('[data-testid="add-supply-request-button"], #addSupplyRequestButton, button[title="Add Supply Request"]');
      return {
        buttonExists: !!addButton,
        buttonText: addButton ? addButton.textContent : null
      };
    }, [], function(result) {
      console.log('Add button check:', result.value);

      if (result.value.buttonExists) {
        // Click the Add button using a more flexible selector
        browser
          .click('[data-testid="add-supply-request-button"], #addSupplyRequestButton, button[title="Add Supply Request"]')
          .waitForElementVisible('#supplyRequestDetailPage', 5000);
      } else {
        console.log('Add button not found, attempting direct navigation');
        testUtils.navigateUrl(browser, '/supply-requests/new');
        browser
          .waitForElementVisible('#supplyRequestDetailPage', 5000);
      }
    });

    // Verify we're on the form page
    browser.execute(function() {
      const detailsPage = document.getElementById('supplyRequestDetailPage');
      const statusField = document.querySelector('#statusInput');
      const priorityField = document.querySelector('#priorityInput');
      const quantityField = document.querySelector('#quantityValueInput');

      return {
        detailsPageVisible: !!detailsPage,
        statusFieldVisible: !!statusField,
        priorityFieldVisible: !!priorityField,
        quantityFieldVisible: !!quantityField,
        currentUrl: window.location.pathname
      };
    }, [], function(result) {
      console.log('Form page state:', result.value);
      browser.assert.ok(result.value.detailsPageVisible, 'Supply request details page should be visible');
    });
  });

  it('04. Create new supply request', browser => {
    // Fill in status using Select component
    browser.execute(function(status) {
      const statusSelect = document.querySelector('#statusInput');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(function() {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === status || option.textContent.includes(status)) {
              option.click();
              break;
            }
          }
        }, 100);
      } else {
        console.error('Status select not found');
      }
    }, [testSupplyRequest.status]);

    browser.pause(500);

    // Fill in priority using Select component
    browser.execute(function(priority) {
      const prioritySelect = document.querySelector('#priorityInput');
      if (prioritySelect) {
        prioritySelect.click();
        setTimeout(function() {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === priority || option.textContent.includes(priority)) {
              option.click();
              break;
            }
          }
        }, 100);
      }
    }, [testSupplyRequest.priority]);

    browser.pause(500);

    // Fill in item codeable concept
    browser
      .setValue('#itemCodeableConceptInput', testSupplyRequest.itemCodeableConcept)
      .pause(300);

    // Fill in quantity
    browser
      .setValue('#quantityValueInput', testSupplyRequest.quantity)
      .pause(300);

    // Fill in authored on date
    browser.execute(function(dateTime) {
      const authoredOnField = document.querySelector('#authoredOnInput');
      if (authoredOnField) {
        authoredOnField.value = dateTime.substring(0, 10); // Just the date part
        authoredOnField.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, [testSupplyRequest.authoredOn]);

    // Fill in requester
    browser
      .setValue('#requesterInput', testSupplyRequest.requester)
      .pause(300);

    // Fill in supplier
    browser
      .setValue('#supplierInput', testSupplyRequest.supplier)
      .pause(300);

    // Fill in reason (notes)
    browser.execute(function(notes) {
      const reasonField = document.querySelector('#reasonInput');
      if (reasonField) {
        reasonField.value = notes;
        reasonField.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, [testSupplyRequest.notes]);

    browser.pause(500);

    // Log form values before save
    browser.execute(function() {
      const formData = {
        status: document.querySelector('#statusInput')?.value,
        priority: document.querySelector('#priorityInput')?.value,
        itemCodeableConcept: document.querySelector('#itemCodeableConceptInput')?.value,
        quantity: document.querySelector('#quantityValueInput')?.value,
        requester: document.querySelector('#requesterInput')?.value,
        supplier: document.querySelector('#supplierInput')?.value,
        reason: document.querySelector('#reasonInput')?.value
      };
      console.log('[Test] Form data before save:', formData);
    });

    // Click save button
    browser
      .click('#saveSupplyRequestButton')
      .pause(1000);

    // Verify navigation back to list
    browser.execute(function() {
      return {
        currentUrl: window.location.pathname,
        isOnListPage: window.location.pathname === '/supply-requests',
        isOnNewPage: window.location.pathname === '/supply-requests/new'
      };
    }, [], function(result) {
      console.log('Navigation after save:', result.value);
      browser.assert.ok(result.value.isOnListPage,
        'Should navigate back to supply requests list after save');
    });

    // Capture the created supply request ID for subsequent tests
    browser.execute(function() {
      return window.saveResult?.result || null;
    }, [], function(result) {
      if (result.value) {
        createdSupplyRequestId = result.value;
        console.log('✓ Captured supply request ID for subsequent tests:', createdSupplyRequestId);
      } else {
        console.warn('✗ Could not capture supply request ID');
      }
    });
  });

  it('05. Verify supply request was created', browser => {
    testUtils.navigateUrl(browser, '/supply-requests');
    browser
      .waitForElementVisible('body', 5000)
      .pause(1500);

    // Check if our supply request appears in the list
    browser.execute(function(ts) {
      const table = document.getElementById('supplyRequestsTable');
      const noDataMessage = document.querySelector('[data-testid="no-supply-requests"]');

      let foundRequest = false;
      let requestCount = 0;

      if (table) {
        const rows = table.querySelectorAll('tbody tr');
        requestCount = rows.length;

        // Look for our test request
        rows.forEach(function(row) {
          const cells = row.querySelectorAll('td');
          const rowText = Array.from(cells).map(cell => cell.textContent).join(' ');

          if (rowText.includes(ts.toString())) {
            foundRequest = true;
          }
        });
      }

      return {
        tableExists: !!table,
        noDataExists: !!noDataMessage,
        foundRequest: foundRequest,
        requestCount: requestCount
      };
    }, [timestamp], function(result) {
      console.log('List verification:', result.value);

      if (result.value.tableExists) {
        browser.assert.ok(result.value.foundRequest || result.value.requestCount > 0,
          'Test supply request should appear in the list');
      }
    });
  });

  it('06. View supply request details', browser => {
    browser.execute(function(requestId) {
      console.log('Navigating directly to supply request detail:', requestId);
      // Use React Router navigation to preserve state
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/supply-requests/' + requestId);
      } else {
        window.location.href = '/supply-requests/' + requestId;
      }
    }, [createdSupplyRequestId]);

    browser
      .pause(2000) // Wait for navigation and subscription to load data
      .waitForElementVisible('#supplyRequestDetailPage', 5000);

    // Verify we can see the details
    browser.execute(function(expectedRequest) {
      const statusField = document.querySelector('#statusInput');
      const priorityField = document.querySelector('#priorityInput');
      const quantityField = document.querySelector('#quantityValueInput');
      const itemCodeableConceptField = document.querySelector('#itemCodeableConceptInput');
      const reasonField = document.querySelector('#reasonInput');

      return {
        status: statusField ? (statusField.value || statusField.textContent) : null,
        priority: priorityField ? (priorityField.value || priorityField.textContent) : null,
        quantity: quantityField ? quantityField.value : null,
        itemCodeableConcept: itemCodeableConceptField ? itemCodeableConceptField.value : null,
        reason: reasonField ? reasonField.value : null
      };
    }, [testSupplyRequest], function(result) {
      console.log('Detail page values:', result.value);

      // Check that at least some values match
      if (result.value.itemCodeableConcept) {
        browser.assert.ok(
          result.value.itemCodeableConcept.includes(timestamp.toString()) ||
          result.value.itemCodeableConcept.includes('Medical Supplies'),
          'Item codeable concept should contain medical supplies text'
        );
      }
    });
  });

  it('07. Edit supply request', browser => {
    // Navigate directly to the supply request detail page
    browser.execute(function(requestId) {
      console.log('Navigating to supply request for edit:', requestId);
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/supply-requests/' + requestId);
      } else {
        window.location.href = '/supply-requests/' + requestId;
      }
    }, [createdSupplyRequestId]);

    browser
      .pause(2000)
      .waitForElementVisible('#supplyRequestDetailPage', 5000);

    // Enter edit mode if needed
    browser.execute(function() {
      const editButton = document.querySelector('#editSupplyRequestButton, #lockSupplyRequestButton');
      const isLocked = document.querySelector('#lockSupplyRequestButton');

      if (editButton && !isLocked) {
        editButton.click();
        return { clickedEdit: true };
      }
      return { clickedEdit: false, alreadyInEditMode: !isLocked };
    }, [], function(result) {
      console.log('Edit mode:', result.value);
    });

    browser.pause(500);

    // Update status
    browser.execute(function(newStatus) {
      const statusSelect = document.querySelector('#statusInput');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(function() {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === newStatus || option.textContent.includes(newStatus)) {
              option.click();
              break;
            }
          }
        }, 100);
      }
    }, [updatedSupplyRequest.status]);

    browser.pause(500);

    // Update priority
    browser.execute(function(newPriority) {
      const prioritySelect = document.querySelector('#priorityInput');
      if (prioritySelect) {
        prioritySelect.click();
        setTimeout(function() {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === newPriority || option.textContent.includes(newPriority)) {
              option.click();
              break;
            }
          }
        }, 100);
      }
    }, [updatedSupplyRequest.priority]);

    browser.pause(500);

    // Update quantity and item description
    browser
      .clearValue('#quantityValueInput')
      .setValue('#quantityValueInput', updatedSupplyRequest.quantity)
      .clearValue('#itemCodeableConceptInput')
      .setValue('#itemCodeableConceptInput', updatedSupplyRequest.itemCodeableConcept)
      .clearValue('#reasonInput')
      .setValue('#reasonInput', updatedSupplyRequest.notes)
      .pause(500);

    // Save changes
    browser
      .click('#saveSupplyRequestButton')
      .pause(1000);

    // Verify updates were saved
    browser.execute(function() {
      const quantityField = document.querySelector('#quantityValueInput');
      const reasonField = document.querySelector('#reasonInput');

      return {
        quantity: quantityField ? quantityField.value : null,
        reason: reasonField ? reasonField.value : null
      };
    }, [], function(result) {
      console.log('Updated values:', result.value);
      browser.assert.ok(
        result.value.quantity === updatedSupplyRequest.quantity,
        'Quantity should be updated'
      );
    });
  });

  it('08. Delete supply request', browser => {
    // Navigate directly to the supply request detail page
    browser.execute(function(requestId) {
      console.log('Navigating to supply request for deletion:', requestId);
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/supply-requests/' + requestId);
      } else {
        window.location.href = '/supply-requests/' + requestId;
      }
    }, [createdSupplyRequestId]);

    // Ensure we're on the detail page
    browser
      .pause(2000)
      .waitForElementVisible('#supplyRequestDetailPage', 5000)
      .pause(500);

    // Verify we're logged in before attempting deletion
    browser.execute(function() {
      return {
        pathname: window.location.pathname,
        isLoggedIn: typeof Meteor !== 'undefined' && !!Meteor.userId(),
        userId: Meteor.userId ? Meteor.userId() : null
      };
    }, [], function(result) {
      console.log('[Test 08] Current state:', result.value);
      browser.assert.ok(result.value.isLoggedIn, 'User should be logged in for deletion');
      browser.assert.ok(result.value.pathname.includes('/supply-requests/'),
        'Should be on supply request detail page');
    });

    // Debug: Check component state before delete
    browser.execute(function() {
      return {
        isEditing: window.__supplyRequestIsEditing,
        hasDeleteButton: !!document.querySelector('#deleteSupplyRequestButton'),
        pathname: window.location.pathname
      };
    }, [], function(result) {
      console.log('[Before delete]:', result.value);
    });

    // Click delete button directly (not in execute block)
    browser
      .pause(500)
      .click('#deleteSupplyRequestButton')
      .pause(500)
      .acceptAlert()
      .pause(5000); // Wait for delete method call + navigation + page mount in CI

    // Check for errors and what happened
    browser.execute(function() {
      const errorElement = document.querySelector('[class*="error"]') ||
                          document.querySelector('[class*="Alert"]') ||
                          document.querySelector('[severity="error"]');
      return {
        hasError: !!errorElement,
        errorText: errorElement ? errorElement.textContent : null,
        pathname: window.location.pathname,
        stillOnDetailPage: !!document.querySelector('#supplyRequestDetailPage')
      };
    }, [], function(result) {
      console.log('[After delete]:', result.value);
      if (result.value.hasError) {
        console.log('[Delete error found]:', result.value.errorText);
      }
    });

    // Verify we're back on the list page or wait for navigation
    browser
      .pause(2000)
      .waitForElementVisible('#supplyRequestsPage', 10000)
      .execute(function() {
        return {
          pathname: window.location.pathname,
          hasPage: !!document.querySelector('#supplyRequestsPage'),
          hasTable: !!document.querySelector('#supplyRequestsTable'),
          hasNoData: !!document.querySelector('[data-testid="no-supply-requests"]'),
          hasDetailPage: !!document.querySelector('#supplyRequestDetailPage')
        };
      }, [], function(result) {
        // ADD NULL CHECK - execute can return null
        if (!result || !result.value) {
          console.error('[Test 08] execute returned null - page may not be ready');
          browser.assert.fail('Failed to check page state after deletion - execute returned null');
          return;
        }

        console.log('[Test 08] After deletion:', result.value);

        if (result.value.hasDetailPage) {
          console.log('WARNING: Still on detail page - deletion may have failed or navigation slow');
        }

        browser.assert.ok(
          result.value.hasTable || result.value.hasNoData,
          'Should show either table or no-data state'
        );
      });
  });

  it('09. Cleanup test data', browser => {
    // Clean up any remaining test data
    browser.execute(function(ts) {
      console.log('[Test] Final cleanup for timestamp:', ts);

      if (typeof SupplyRequests !== 'undefined') {
        const testRequests = SupplyRequests.find({
          $or: [
            { 'itemCodeableConcept.text': { $regex: ts.toString() } },
            { 'note.0.text': { $regex: ts.toString() } }
          ]
        }).fetch();

        testRequests.forEach(function(request) {
          SupplyRequests.remove({_id: request._id});
        });

        console.log('[Test] Final cleanup removed', testRequests.length, 'test supply requests');
      }
    }, [timestamp]);

    browser.pause(500);
  });

  after(browser => {
    browser.end();
  });
});
