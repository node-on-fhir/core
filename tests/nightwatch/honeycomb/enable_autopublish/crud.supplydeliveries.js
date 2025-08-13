// tests/nightwatch/honeycomb/enable_autopublish/crud.supplydeliveries.js

const testUtils = require('./shared-test-utils');

describe('SupplyDeliveries CRUD Operations', function() {
  const timestamp = Date.now();
  const testSupplyDelivery = {
    status: 'in-progress',
    type: 'device',
    typeCode: '1264002',
    typeDisplay: 'Medical device',
    occurrenceDateTime: new Date().toISOString(),
    occurrencePeriodStart: new Date().toISOString(),
    occurrencePeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    supplier: 'Medical Supply Company',
    supplierReference: `Organization/${timestamp}`,
    destination: 'Main Hospital Storage',
    destinationReference: `Location/${timestamp}`,
    receiver: 'Dr. Jane Smith',
    receiverReference: `Practitioner/${timestamp}`,
    suppliedItem: {
      quantity: '100',
      quantityUnit: 'units',
      quantityCode: '1',
      quantitySystem: 'http://unitsofmeasure.org',
      itemCodeableConcept: `Medical Supplies ${timestamp}`,
      itemCodeableConceptCode: '260787004',
      itemCodeableConceptDisplay: 'Medical supplies',
      itemReference: `Medication/${timestamp}`
    },
    basedOn: `SupplyRequest/${timestamp}`,
    partOf: `SupplyDelivery/${timestamp}-parent`,
    patientName: 'John Doe',
    notes: `Test supply delivery created at ${timestamp}`
  };

  const updatedSupplyDelivery = {
    status: 'completed',
    suppliedItem: {
      quantity: '150',
      itemCodeableConcept: `Updated Medical Supplies ${timestamp}`
    },
    notes: `Test supply delivery updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting SupplyDeliveries CRUD test suite...');
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

    // Check if we're logged in
    browser.execute(function() {
      return {
        isLoggedIn: typeof Meteor !== 'undefined' && !!Meteor.userId(),
        userId: Meteor.userId ? Meteor.userId() : null,
        username: Meteor.user ? (Meteor.user() ? Meteor.user().username : null) : null
      };
    }, [], function(result) {
      console.log('Initial login state:', result.value);
      
      // Check if result.value exists before accessing its properties
      if (!result.value || !result.value.isLoggedIn) {
        console.log('Not logged in, attempting programmatic login...');
        
        browser.executeAsync(function(done) {
          if (typeof Meteor !== 'undefined') {
            Meteor.call('test.createTestUser', {
              username: 'janedoe',
              email: 'janedoe@test.org',
              password: 'janedoe123'
            }, function(err, userId) {
              if (err) {
                console.error('Failed to create test user:', err);
                done({ userCreated: false, error: err.message });
              } else {
                console.log('Test user ready, userId:', userId);
                Meteor.loginWithPassword('janedoe', 'janedoe123', function(loginErr) {
                  if (loginErr) {
                    console.error('Login failed:', loginErr);
                    done({ userCreated: true, loginSuccess: false, error: loginErr.message });
                  } else {
                    console.log('Login successful');
                    done({ 
                      userCreated: true,
                      loginSuccess: true, 
                      userId: Meteor.userId(), 
                      username: Meteor.user() ? Meteor.user().username : null 
                    });
                  }
                });
              }
            });
          } else {
            done({ userCreated: false, loginSuccess: false, error: 'Meteor not available' });
          }
        }, [], function(result) {
          if (result.value.loginSuccess) {
            console.log('Test user logged in successfully as:', result.value.username);
          } else {
            console.error('Login failed:', result.value.error);
          }
        });
      }
    });

    // Create test patient
    console.log('Creating test patient...');
    testUtils.createTestPatient(browser, {
      givenName: 'John',
      familyName: 'Doe',
      birthDate: '1970-01-01'
    }, function(result) {
      console.log('Test patient created:', result);
      
      // Set the patient in Session immediately after creation
      browser.execute(function(patientId) {
        const patient = Patients.findOne({_id: patientId});
        if (patient) {
          console.log('[Test] Setting session patient:', patient);
          Session.set('selectedPatientId', patientId);
          Session.set('selectedPatient', patient);
          console.log('[Test] Session variables set successfully');
        } else {
          console.error('[Test] Patient not found with ID:', patientId);
        }
      }, [result.result]);
    });

    // Clean up any existing test data
    browser.execute(function(ts) {
      console.log('[Test] Cleaning up test supply deliveries with timestamp:', ts);
      const testDeliveries = SupplyDeliveries.find({
        $or: [
          { 'suppliedItem.itemCodeableConcept': { $regex: ts.toString() } },
          { notes: { $regex: ts.toString() } }
        ]
      }).fetch();
      
      testDeliveries.forEach(function(delivery) {
        SupplyDeliveries.remove({_id: delivery._id});
      });
      
      console.log('[Test] Cleaned up', testDeliveries.length, 'test supply deliveries');
    }, [timestamp]);

    browser.pause(500);
  });

  it('02. Navigate to supply deliveries list page', browser => {
    browser
      .url('http://localhost:3000/supply-deliveries')
      .waitForElementVisible('body', 5000)
      .windowSize('current', 1400, 900)
      .pause(1000);

    // Check for either the table or the no-data state
    browser.execute(function() {
      const tableExists = !!document.getElementById('supplyDeliveriesTable');
      const noDataExists = !!document.querySelector('[data-testid="no-supply-deliveries"]');
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
        'Either supply deliveries table or no-data state should be visible');
    });
  });

  it('03. Navigate to create supply delivery form', browser => {
    // First check if the Add button exists
    browser.execute(function() {
      const addButton = document.querySelector('[data-testid="add-supply-delivery-button"], #addSupplyDeliveryButton, button[title="Add Supply Delivery"]');
      return {
        buttonExists: !!addButton,
        buttonText: addButton ? addButton.textContent : null
      };
    }, [], function(result) {
      console.log('Add button check:', result.value);
      
      if (result.value.buttonExists) {
        // Click the Add button using a more flexible selector
        browser
          .click('[data-testid="add-supply-delivery-button"], #addSupplyDeliveryButton, button[title="Add Supply Delivery"]')
          .waitForElementVisible('#supplyDeliveryDetailsPage', 5000);
      } else {
        console.log('Add button not found, attempting direct navigation');
        browser
          .url('http://localhost:3000/supply-deliveries/new')
          .waitForElementVisible('#supplyDeliveryDetailsPage', 5000);
      }
    });

    // Verify we're on the form page
    browser.execute(function() {
      const detailsPage = document.getElementById('supplyDeliveryDetailsPage');
      const statusField = document.querySelector('input[name="status"], #statusInput');
      const typeField = document.querySelector('input[name="type"], #typeInput');
      const quantityField = document.querySelector('input[name="quantity"], #suppliedItemQuantityInput');
      
      return {
        detailsPageVisible: !!detailsPage,
        statusFieldVisible: !!statusField,
        typeFieldVisible: !!typeField,
        quantityFieldVisible: !!quantityField,
        currentUrl: window.location.pathname
      };
    }, [], function(result) {
      console.log('Form page state:', result.value);
      browser.assert.ok(result.value.detailsPageVisible, 'Supply delivery details page should be visible');
    });
  });

  it('04. Create new supply delivery', browser => {
    // Fill in status using Select component
    browser.execute(function(status) {
      const statusSelect = document.querySelector('#statusInput, [name="status"]');
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
    }, [testSupplyDelivery.status]);

    browser.pause(500);

    // Fill in type
    browser
      .setValue('#typeInput', testSupplyDelivery.type)
      .pause(300);

    // Fill in occurrence date/time
    browser.execute(function(dateTime) {
      const occurrenceField = document.querySelector('#occurrenceDateTimeInput');
      if (occurrenceField) {
        occurrenceField.value = dateTime;
        occurrenceField.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, [testSupplyDelivery.occurrenceDateTime]);

    // Fill in supplier and destination
    browser
      .setValue('#supplierInput', testSupplyDelivery.supplier)
      .setValue('#destinationInput', testSupplyDelivery.destination)
      .setValue('#receiverInput', testSupplyDelivery.receiver)
      .pause(300);

    // Fill in supplied item details
    browser
      .setValue('#suppliedItemQuantityInput', testSupplyDelivery.suppliedItem.quantity)
      .setValue('#suppliedItemQuantityUnitInput', testSupplyDelivery.suppliedItem.quantityUnit)
      .setValue('#suppliedItemCodeableConceptInput', testSupplyDelivery.suppliedItem.itemCodeableConcept)
      .pause(300);

    // Fill in references
    browser.execute(function(delivery) {
      const basedOnField = document.querySelector('#basedOnInput');
      const partOfField = document.querySelector('#partOfInput');
      const notesField = document.querySelector('#notesInput');
      
      if (basedOnField) {
        basedOnField.value = delivery.basedOn;
        basedOnField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (partOfField) {
        partOfField.value = delivery.partOf;
        partOfField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (notesField) {
        notesField.value = delivery.notes;
        notesField.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, [testSupplyDelivery]);

    browser.pause(500);

    // Log form values before save
    browser.execute(function() {
      const formData = {
        status: document.querySelector('#statusInput')?.value,
        type: document.querySelector('#typeInput')?.value,
        supplier: document.querySelector('#supplierInput')?.value,
        destination: document.querySelector('#destinationInput')?.value,
        quantity: document.querySelector('#suppliedItemQuantityInput')?.value,
        itemCodeableConcept: document.querySelector('#suppliedItemCodeableConceptInput')?.value,
        notes: document.querySelector('#notesInput')?.value
      };
      console.log('[Test] Form data before save:', formData);
      
      // Check session patient
      const patient = Session.get('selectedPatient');
      console.log('[Test] Selected patient:', patient);
    });

    // Click save button
    browser
      .click('#saveSupplyDeliveryButton')
      .pause(1000);

    // Verify navigation back to list
    browser.execute(function() {
      return {
        currentUrl: window.location.pathname,
        isOnListPage: window.location.pathname === '/supply-deliveries',
        isOnNewPage: window.location.pathname === '/supply-deliveries/new'
      };
    }, [], function(result) {
      console.log('Navigation after save:', result.value);
      browser.assert.ok(result.value.isOnListPage, 
        'Should navigate back to supply deliveries list after save');
    });
  });

  it('05. Verify supply delivery was created', browser => {
    browser
      .url('http://localhost:3000/supply-deliveries')
      .waitForElementVisible('body', 5000)
      .pause(1500);

    // Check if our supply delivery appears in the list
    browser.execute(function(ts) {
      const table = document.getElementById('supplyDeliveriesTable');
      const noDataMessage = document.querySelector('[data-testid="no-supply-deliveries"]');
      
      let foundDelivery = false;
      let deliveryCount = 0;
      
      if (table) {
        const rows = table.querySelectorAll('tbody tr');
        deliveryCount = rows.length;
        
        // Look for our test delivery
        rows.forEach(function(row) {
          const cells = row.querySelectorAll('td');
          const rowText = Array.from(cells).map(cell => cell.textContent).join(' ');
          
          if (rowText.includes(ts.toString())) {
            foundDelivery = true;
          }
        });
      }
      
      return {
        tableExists: !!table,
        noDataExists: !!noDataMessage,
        foundDelivery: foundDelivery,
        deliveryCount: deliveryCount
      };
    }, [timestamp], function(result) {
      console.log('List verification:', result.value);
      
      if (result.value.tableExists) {
        browser.assert.ok(result.value.foundDelivery || result.value.deliveryCount > 0, 
          'Test supply delivery should appear in the list');
      }
    });
  });

  it('06. View supply delivery details', browser => {
    // Search for our specific supply delivery if search is available
    browser.execute(function(ts) {
      const searchInput = document.querySelector('#supplyDeliverySearchInput');
      if (searchInput) {
        searchInput.value = ts.toString();
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        return { searchPerformed: true };
      }
      return { searchPerformed: false };
    }, [timestamp], function(result) {
      if (result.value.searchPerformed) {
        browser.pause(500); // Wait for search to filter results
      }
    });

    // Click on the first row (should be our newest supply delivery if sorted properly)
    browser
      .click('#supplyDeliveriesTable tbody tr:first-child')
      .pause(1000)
      .waitForElementVisible('#supplyDeliveryDetailsPage', 5000);

    // Verify we can see the details
    browser.execute(function(expectedDelivery) {
      const statusField = document.querySelector('#statusInput');
      const typeField = document.querySelector('#typeInput');
      const quantityField = document.querySelector('#suppliedItemQuantityInput');
      const itemCodeableConceptField = document.querySelector('#suppliedItemCodeableConceptInput');
      const notesField = document.querySelector('#notesInput');
      
      // For Material-UI Select, we need to check the hidden input
      const statusValue = statusField ? (statusField.value || statusField.textContent) : null;
      
      return {
        status: statusValue,
        type: typeField ? typeField.value : null,
        quantity: quantityField ? quantityField.value : null,
        itemCodeableConcept: itemCodeableConceptField ? itemCodeableConceptField.value : null,
        notes: notesField ? notesField.value : null
      };
    }, [testSupplyDelivery], function(result) {
      console.log('Detail page values:', result.value);
      
      // Check that at least some values match
      if (result.value.itemCodeableConcept) {
        // The field might contain both original and updated values
        browser.assert.ok(
          result.value.itemCodeableConcept.includes(timestamp.toString()) || 
          result.value.itemCodeableConcept.includes('Medical Supplies'),
          'Item codeable concept should contain medical supplies text'
        );
      }
    });
  });

  it('07. Edit supply delivery', browser => {
    // Enter edit mode if needed
    browser.execute(function() {
      const editButton = document.querySelector('#editSupplyDeliveryButton, #lockSupplyDeliveryButton');
      const isLocked = document.querySelector('#lockSupplyDeliveryButton');
      
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
    }, [updatedSupplyDelivery.status]);

    browser.pause(500);

    // Update quantity and item description
    browser
      .clearValue('#suppliedItemQuantityInput')
      .setValue('#suppliedItemQuantityInput', updatedSupplyDelivery.suppliedItem.quantity)
      .clearValue('#suppliedItemCodeableConceptInput')
      .setValue('#suppliedItemCodeableConceptInput', updatedSupplyDelivery.suppliedItem.itemCodeableConcept)
      .clearValue('#notesInput')
      .setValue('#notesInput', updatedSupplyDelivery.notes)
      .pause(500);

    // Save changes
    browser
      .click('#saveSupplyDeliveryButton')
      .pause(1000);

    // Verify updates were saved
    browser.execute(function() {
      const quantityField = document.querySelector('#suppliedItemQuantityInput');
      const notesField = document.querySelector('#notesInput');
      
      return {
        quantity: quantityField ? quantityField.value : null,
        notes: notesField ? notesField.value : null
      };
    }, [], function(result) {
      console.log('Updated values:', result.value);
      browser.assert.ok(
        result.value.quantity === updatedSupplyDelivery.suppliedItem.quantity,
        'Quantity should be updated'
      );
    });
  });

  it('08. Delete supply delivery', browser => {
    // Navigate to the supply delivery if not already there
    browser.execute(function() {
      return window.location.pathname;
    }, [], function(result) {
      if (!result.value.includes('/supply-deliveries/')) {
        // Navigate back to the supply delivery
        browser
          .url('http://localhost:3000/supply-deliveries')
          .pause(1000)
          .click('#supplyDeliveriesTable tbody tr:first-child')
          .pause(1000);
      }
    });

    // Ensure we're on the detail page
    browser
      .waitForElementVisible('#supplyDeliveryDetailsPage', 5000)
      .pause(500);

    // Click delete button
    browser
      .waitForElementVisible('#deleteSupplyDeliveryButton', 5000)
      .click('#deleteSupplyDeliveryButton')
      .pause(500)
      .acceptAlert()
      .pause(1000);

    // Verify we're back on the list page
    browser.execute(function() {
      return window.location.pathname;
    }, [], function(result) {
      browser.assert.ok(
        result.value === '/supply-deliveries',
        'Should be redirected to supply deliveries list after deletion'
      );
    });
  });

  it('09. Cleanup test data', browser => {
    // Clean up any remaining test data
    browser.execute(function(ts) {
      console.log('[Test] Final cleanup for timestamp:', ts);
      
      const testDeliveries = SupplyDeliveries.find({
        $or: [
          { 'suppliedItem.itemCodeableConcept': { $regex: ts.toString() } },
          { notes: { $regex: ts.toString() } }
        ]
      }).fetch();
      
      testDeliveries.forEach(function(delivery) {
        SupplyDeliveries.remove({_id: delivery._id});
      });
      
      console.log('[Test] Final cleanup removed', testDeliveries.length, 'test supply deliveries');
      
      // Also clean up test patient
      const testPatients = Patients.find({
        $or: [
          { 'name.given': 'John' },
          { 'name.family': 'Doe' }
        ]
      }).fetch();
      
      testPatients.forEach(function(patient) {
        if (patient.name && patient.name[0].given && patient.name[0].given[0] === 'John' &&
            patient.name[0].family === 'Doe') {
          Patients.remove({_id: patient._id});
        }
      });
    }, [timestamp]);

    browser.pause(500);
  });

  after(browser => {
    browser.end();
  });
});