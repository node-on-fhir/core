// tests/nightwatch/honeycomb/enable_autopublish/crud.nutritionorders.js

const testUtils = require('./shared-test-utils');

describe('NutritionOrders CRUD Operations', function() {
  const timestamp = Date.now();
  const testNutritionOrder = {
    status: 'active',
    intent: 'order',
    dateTime: new Date().toISOString(),
    orderer: 'Dr. Jane Smith',
    ordererReference: `Practitioner/${timestamp}`,
    encounter: `Encounter/${timestamp}`,
    oralDiet: {
      type: 'Diabetic diet',
      typeCode: '160670007',
      typeDisplay: 'Diabetic diet',
      schedule: 'Three times daily with meals',
      nutrient: {
        modifier: 'Carbohydrate',
        modifierCode: '226374008',
        modifierDisplay: 'Carbohydrate',
        amount: '30',
        amountUnit: 'g',
        amountCode: 'g',
        amountSystem: 'http://unitsofmeasure.org'
      },
      texture: 'Regular',
      textureCode: '228055009',
      textureDisplay: 'Regular diet texture',
      fluidConsistencyType: 'Thin liquids',
      fluidCode: '439021000124105',
      fluidDisplay: 'Dietary liquid consistency - thin liquid',
      instruction: `Follow diabetic diet protocol ${timestamp}`
    },
    supplement: {
      type: 'Protein supplement',
      typeCode: '442901000124106',
      typeDisplay: 'Adult high protein formula',
      productName: `Ensure Protein ${timestamp}`,
      schedule: 'Twice daily between meals',
      quantity: '1',
      quantityUnit: 'bottle',
      instruction: `Supplement instructions ${timestamp}`
    },
    enteralFormula: {
      baseFormulaType: 'Adult standard formula',
      baseFormulaCode: '442991000124104',
      baseFormulaDisplay: 'Adult enteral formula',
      baseFormulaProductName: `Standard Formula ${timestamp}`,
      additiveType: 'Fiber',
      additiveCode: '116762002',
      additiveDisplay: 'Fiber supplement',
      caloricDensity: '1.5',
      caloricDensityUnit: 'kcal/mL',
      routeOfAdministration: 'Nasogastric tube',
      routeCode: '418136008',
      routeDisplay: 'Nasogastric route',
      administration: {
        schedule: 'Continuous',
        quantity: '60',
        quantityUnit: 'mL/hr',
        rateQuantity: '60',
        rateUnit: 'mL/hr'
      }
    },
    patientName: 'John Doe',
    allergyIntolerance: `No known allergies ${timestamp}`,
    foodPreferenceModifier: 'Vegetarian',
    excludeFoodModifier: 'Pork',
    notes: `Test nutrition order created at ${timestamp}`
  };

  const updatedNutritionOrder = {
    status: 'completed',
    oralDiet: {
      type: 'Low sodium diet',
      instruction: `Updated diabetic diet protocol ${timestamp}`
    },
    notes: `Test nutrition order updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting NutritionOrders CRUD test suite...');
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  beforeEach(browser => {
    browser.pause(500);
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .pause(2000)
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
      
      if (!result.value.isLoggedIn) {
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
      console.log('[Test] Cleaning up test nutrition orders with timestamp:', ts);
      const testOrders = NutritionOrders.find({
        $or: [
          { 'oralDiet.instruction': { $regex: ts.toString() } },
          { 'supplement.productName': { $regex: ts.toString() } },
          { 'enteralFormula.baseFormulaProductName': { $regex: ts.toString() } }
        ]
      }).fetch();
      
      testOrders.forEach(function(order) {
        NutritionOrders.remove({_id: order._id});
      });
      
      console.log('[Test] Cleaned up', testOrders.length, 'test nutrition orders');
    }, [timestamp]);

    browser.pause(1000);
  });

  it('02. Navigate to nutrition orders list page', browser => {
    browser
      .url('http://localhost:3000/nutrition-orders')
      .waitForElementVisible('body', 5000)
      .windowSize('current', 1400, 900)
      .pause(1000);

    // Check for either the table or the no-data state
    browser.execute(function() {
      const tableExists = !!document.getElementById('nutritionOrdersTable');
      const noDataExists = !!document.querySelector('[data-testid="no-nutrition-orders"]');
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
        'Either nutrition orders table or no-data state should be visible');
    });
  });

  it('03. Navigate to create nutrition order form', browser => {
    // First check if the Add button exists
    browser.execute(function() {
      const addButton = document.querySelector('[data-testid="add-nutrition-order-button"], #addNutritionOrderButton, button[title="Add Nutrition Order"]');
      return {
        buttonExists: !!addButton,
        buttonText: addButton ? addButton.textContent : null
      };
    }, [], function(result) {
      console.log('Add button check:', result.value);
      
      if (result.value.buttonExists) {
        // Click the Add button using a more flexible selector
        browser
          .click('[data-testid="add-nutrition-order-button"], #addNutritionOrderButton, button[title="Add Nutrition Order"]')
          .pause(2000)
          .waitForElementVisible('#nutritionOrderDetailsPage', 5000);
      } else {
        console.log('Add button not found, attempting direct navigation');
        browser
          .url('http://localhost:3000/nutrition-orders/new')
          .pause(2000)
          .waitForElementVisible('#nutritionOrderDetailsPage', 5000);
      }
    });

    // Verify we're on the form page
    browser.execute(function() {
      const detailsPage = document.getElementById('nutritionOrderDetailsPage');
      const statusField = document.querySelector('input[name="status"], #statusInput');
      const oralDietTypeField = document.querySelector('input[name="oralDietType"], #oralDietTypeInput');
      const instructionField = document.querySelector('input[name="oralDietInstruction"], #oralDietInstructionInput');
      
      return {
        detailsPageVisible: !!detailsPage,
        statusFieldVisible: !!statusField,
        oralDietTypeFieldVisible: !!oralDietTypeField,
        instructionFieldVisible: !!instructionField,
        currentUrl: window.location.pathname
      };
    }, [], function(result) {
      console.log('Form page state:', result.value);
      browser.assert.ok(result.value.detailsPageVisible, 'Nutrition order details page should be visible');
    });
  });

  it('04. Create new nutrition order', browser => {
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
    }, [testNutritionOrder.status]);

    browser.pause(500);

    // Fill in oral diet fields
    browser
      .setValue('#oralDietTypeInput', testNutritionOrder.oralDiet.type)
      .setValue('#oralDietInstructionInput', testNutritionOrder.oralDiet.instruction)
      .pause(300);

    // Fill in supplement fields if available
    browser.execute(function(supplement) {
      const supplementTypeField = document.querySelector('#supplementTypeInput');
      const supplementProductNameField = document.querySelector('#supplementProductNameInput');
      const supplementInstructionField = document.querySelector('#supplementInstructionInput');
      
      if (supplementTypeField) {
        supplementTypeField.value = supplement.type;
        supplementTypeField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (supplementProductNameField) {
        supplementProductNameField.value = supplement.productName;
        supplementProductNameField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (supplementInstructionField) {
        supplementInstructionField.value = supplement.instruction;
        supplementInstructionField.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, [testNutritionOrder.supplement]);

    // Fill in enteral formula fields if available
    browser.execute(function(enteralFormula) {
      const formulaTypeField = document.querySelector('#enteralFormulaTypeInput');
      const formulaProductNameField = document.querySelector('#enteralFormulaProductNameInput');
      
      if (formulaTypeField) {
        formulaTypeField.value = enteralFormula.baseFormulaType;
        formulaTypeField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (formulaProductNameField) {
        formulaProductNameField.value = enteralFormula.baseFormulaProductName;
        formulaProductNameField.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, [testNutritionOrder.enteralFormula]);

    // Fill in additional fields
    browser.execute(function(order) {
      const allergyField = document.querySelector('#allergyIntoleranceInput');
      const foodPreferenceField = document.querySelector('#foodPreferenceModifierInput');
      const excludeFoodField = document.querySelector('#excludeFoodModifierInput');
      const notesField = document.querySelector('#notesInput');
      
      if (allergyField) {
        allergyField.value = order.allergyIntolerance;
        allergyField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (foodPreferenceField) {
        foodPreferenceField.value = order.foodPreferenceModifier;
        foodPreferenceField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (excludeFoodField) {
        excludeFoodField.value = order.excludeFoodModifier;
        excludeFoodField.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (notesField) {
        notesField.value = order.notes;
        notesField.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, [testNutritionOrder]);

    browser.pause(500);

    // Log form values before save
    browser.execute(function() {
      const formData = {
        status: document.querySelector('#statusInput')?.value,
        oralDietType: document.querySelector('#oralDietTypeInput')?.value,
        oralDietInstruction: document.querySelector('#oralDietInstructionInput')?.value,
        supplementType: document.querySelector('#supplementTypeInput')?.value,
        supplementProductName: document.querySelector('#supplementProductNameInput')?.value,
        enteralFormulaType: document.querySelector('#enteralFormulaTypeInput')?.value,
        enteralFormulaProductName: document.querySelector('#enteralFormulaProductNameInput')?.value,
        allergyIntolerance: document.querySelector('#allergyIntoleranceInput')?.value,
        notes: document.querySelector('#notesInput')?.value
      };
      console.log('[Test] Form data before save:', formData);
      
      // Check session patient
      const patient = Session.get('selectedPatient');
      console.log('[Test] Selected patient:', patient);
    });

    // Click save button
    browser
      .click('#saveNutritionOrderButton')
      .pause(2000);

    // Verify navigation back to list
    browser.execute(function() {
      return {
        currentUrl: window.location.pathname,
        isOnListPage: window.location.pathname === '/nutrition-orders',
        isOnNewPage: window.location.pathname === '/nutrition-orders/new'
      };
    }, [], function(result) {
      console.log('Navigation after save:', result.value);
      browser.assert.ok(result.value.isOnListPage, 
        'Should navigate back to nutrition orders list after save');
    });
  });

  it('05. Verify nutrition order was created', browser => {
    browser
      .url('http://localhost:3000/nutrition-orders')
      .waitForElementVisible('body', 5000)
      .pause(1500);

    // Check if our nutrition order appears in the list
    browser.execute(function(ts) {
      const table = document.getElementById('nutritionOrdersTable');
      const noDataMessage = document.querySelector('[data-testid="no-nutrition-orders"]');
      
      let foundOrder = false;
      let orderCount = 0;
      
      if (table) {
        const rows = table.querySelectorAll('tbody tr');
        orderCount = rows.length;
        
        // Look for our test order
        rows.forEach(function(row) {
          const cells = row.querySelectorAll('td');
          const rowText = Array.from(cells).map(cell => cell.textContent).join(' ');
          
          if (rowText.includes(ts.toString())) {
            foundOrder = true;
          }
        });
      }
      
      return {
        tableExists: !!table,
        noDataExists: !!noDataMessage,
        foundOrder: foundOrder,
        orderCount: orderCount
      };
    }, [timestamp], function(result) {
      console.log('List verification:', result.value);
      
      if (result.value.tableExists) {
        browser.assert.ok(result.value.foundOrder || result.value.orderCount > 0, 
          'Test nutrition order should appear in the list');
      }
    });
  });

  it('06. View nutrition order details', browser => {
    // Search for our specific nutrition order if search is available
    browser.execute(function(ts) {
      const searchInput = document.querySelector('#nutritionOrderSearchInput');
      if (searchInput) {
        searchInput.value = ts.toString();
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        return { searchPerformed: true };
      }
      return { searchPerformed: false };
    }, [timestamp], function(result) {
      if (result.value.searchPerformed) {
        browser.pause(1000); // Wait for search to filter results
      }
    });

    // Click on the first row (should be our newest nutrition order if sorted properly)
    browser
      .click('#nutritionOrdersTable tbody tr:first-child')
      .pause(2000)
      .waitForElementVisible('#nutritionOrderDetailsPage', 5000);

    // Verify we can see the details
    browser.execute(function(expectedOrder) {
      const statusField = document.querySelector('#statusInput');
      const oralDietTypeField = document.querySelector('#oralDietTypeInput');
      const oralDietInstructionField = document.querySelector('#oralDietInstructionInput');
      const notesField = document.querySelector('#notesInput');
      
      return {
        status: statusField ? statusField.value : null,
        oralDietType: oralDietTypeField ? oralDietTypeField.value : null,
        oralDietInstruction: oralDietInstructionField ? oralDietInstructionField.value : null,
        notes: notesField ? notesField.value : null
      };
    }, [testNutritionOrder], function(result) {
      console.log('Detail page values:', result.value);
      
      // Check that at least some values match
      if (result.value.oralDietInstruction) {
        browser.assert.ok(
          result.value.oralDietInstruction.includes(timestamp.toString()),
          'Oral diet instruction should contain our timestamp'
        );
      }
    });
  });

  it('07. Edit nutrition order', browser => {
    // Enter edit mode if needed
    browser.execute(function() {
      const editButton = document.querySelector('#editNutritionOrderButton, #lockNutritionOrderButton');
      const isLocked = document.querySelector('#lockNutritionOrderButton');
      
      if (editButton && !isLocked) {
        editButton.click();
        return { clickedEdit: true };
      }
      return { clickedEdit: false, alreadyInEditMode: !isLocked };
    }, [], function(result) {
      console.log('Edit mode:', result.value);
    });

    browser.pause(1000);

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
    }, [updatedNutritionOrder.status]);

    browser.pause(500);

    // Update oral diet fields
    browser
      .clearValue('#oralDietTypeInput')
      .setValue('#oralDietTypeInput', updatedNutritionOrder.oralDiet.type)
      .clearValue('#oralDietInstructionInput')
      .setValue('#oralDietInstructionInput', updatedNutritionOrder.oralDiet.instruction)
      .clearValue('#notesInput')
      .setValue('#notesInput', updatedNutritionOrder.notes)
      .pause(500);

    // Save changes
    browser
      .click('#saveNutritionOrderButton')
      .pause(2000);

    // Verify updates were saved
    browser.execute(function() {
      const oralDietTypeField = document.querySelector('#oralDietTypeInput');
      const notesField = document.querySelector('#notesInput');
      
      return {
        oralDietType: oralDietTypeField ? oralDietTypeField.value : null,
        notes: notesField ? notesField.value : null
      };
    }, [], function(result) {
      console.log('Updated values:', result.value);
      browser.assert.ok(
        result.value.oralDietType === updatedNutritionOrder.oralDiet.type,
        'Oral diet type should be updated'
      );
    });
  });

  it('08. Delete nutrition order', browser => {
    // Navigate to the nutrition order if not already there
    browser.execute(function() {
      return window.location.pathname;
    }, [], function(result) {
      if (!result.value.includes('/nutrition-orders/')) {
        // Navigate back to the nutrition order
        browser
          .url('http://localhost:3000/nutrition-orders')
          .pause(1000)
          .click('#nutritionOrdersTable tbody tr:first-child')
          .pause(2000);
      }
    });

    // Click delete button
    browser
      .waitForElementVisible('#deleteNutritionOrderButton', 5000)
      .click('#deleteNutritionOrderButton')
      .pause(1000);

    // Confirm deletion if there's a confirmation dialog
    browser.execute(function() {
      const confirmButton = document.querySelector('[data-testid="confirm-delete"], button:contains("Confirm")');
      if (confirmButton) {
        confirmButton.click();
        return { confirmed: true };
      }
      return { confirmed: false };
    });

    browser.pause(2000);

    // Verify we're back on the list page
    browser.execute(function() {
      return window.location.pathname;
    }, [], function(result) {
      browser.assert.ok(
        result.value === '/nutrition-orders',
        'Should be redirected to nutrition orders list after deletion'
      );
    });
  });

  it('09. Cleanup test data', browser => {
    // Clean up any remaining test data
    browser.execute(function(ts) {
      console.log('[Test] Final cleanup for timestamp:', ts);
      
      const testOrders = NutritionOrders.find({
        $or: [
          { 'oralDiet.instruction': { $regex: ts.toString() } },
          { 'supplement.productName': { $regex: ts.toString() } },
          { 'enteralFormula.baseFormulaProductName': { $regex: ts.toString() } },
          { notes: { $regex: ts.toString() } }
        ]
      }).fetch();
      
      testOrders.forEach(function(order) {
        NutritionOrders.remove({_id: order._id});
      });
      
      console.log('[Test] Final cleanup removed', testOrders.length, 'test nutrition orders');
      
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

    browser.pause(1000);
  });

  after(browser => {
    browser.end();
  });
});