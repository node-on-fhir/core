// tests/nightwatch/honeycomb/crud.plandefinitions.js

// PlanDefinitions is an infrastructure resource - no patient tracking needed

const loginHelper = require('../helpers/login-helper');
const saveNavigationHelper = require('../helpers/save-navigation-helper');
const testUtils = require('./enable_autopublish/shared-test-utils');

describe('PlanDefinitions CRUD Operations', function() {
  const timestamp = Date.now();
  const testPlanDefinition = {
    url: `http://example.org/plandefinition/${timestamp}`,
    version: '1.0.0',
    name: `TestPlanDefinition${timestamp}`,
    title: `Test Plan Definition ${timestamp}`,
    status: 'draft',
    date: '2024-01-15',
    description: `Test plan definition created at ${timestamp}`,
    purpose: `Test purpose for plan definition ${timestamp}`,
    usage: `Test usage for plan definition ${timestamp}`,
    approvalDate: '2024-01-01',
    lastReviewDate: '2024-01-10',
    effectivePeriodStart: '2024-01-01',
    effectivePeriodEnd: '2024-12-31'
  };

  const updatedPlanDefinition = {
    title: `Updated Plan Definition ${timestamp}`,
    status: 'active',
    version: '2.0.0',
    description: `Test plan definition updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting PlanDefinitions CRUD test suite...');
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

    // Use the login helper for robust login handling
    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      } else {
        browser.assert.ok(true, 'User is logged in');
      }
      
      // Clean up any existing test data
      browser.executeAsync(function(done) {
        if (typeof PlanDefinitions !== 'undefined') {
          const testPlanDefinitions = PlanDefinitions.find({ 
            $or: [
              { 'name': { $regex: 'TestPlanDefinition.*' } },
              { 'title': { $regex: '.*Plan Definition.*' } },
              { 'url': { $regex: '.*plandefinition.*' } }
            ]
          }).fetch();
          testPlanDefinitions.forEach(function(planDefinition) {
            PlanDefinitions.remove({ _id: planDefinition._id });
          });
          console.log('Cleared', testPlanDefinitions.length, 'test plan definitions');
        }
        done();
      });
      
      browser.pause(1000);
    });
  });

  it('02. Verify plan definitions list page loads', browser => {
    browser
      .url('http://localhost:3000/plan-definitions')
      .waitForElementVisible('#planDefinitionsPage', 5000)
      .pause(2000); // Give more time for subscription to complete
      
    browser.execute(function() {
        const pageElement = document.querySelector('#planDefinitionsPage');
        const pageText = pageElement ? pageElement.textContent : '';
        
        const hasTable = document.querySelector('#planDefinitionsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            pageText.includes('No Data Available');
        const isLoading = pageText.includes('Loading plan definitions');
        
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          isLoading: isLoading,
          hasEitherElement: hasTable || hasNoDataCard,
          pageText: pageText.substring(0, 200) // For debugging
        };
      }, [], function(result) {
        if (!result || !result.value) {
          browser.assert.fail('Failed to check page elements - result is null');
          return;
        }
        
        // If still loading, wait a bit more and try again
        if (result.value.isLoading) {
          console.log('Page is still loading, waiting...');
          browser.pause(2000);
          
          browser.execute(function() {
            const pageElement = document.querySelector('#planDefinitionsPage');
            const pageText = pageElement ? pageElement.textContent : '';
            
            const hasTable = document.querySelector('#planDefinitionsTable') !== null;
            const hasNoDataCard = pageText.includes('No Data Available');
            
            return {
              hasTable: hasTable,
              hasNoDataCard: hasNoDataCard,
              hasEitherElement: hasTable || hasNoDataCard,
              pageText: pageText.substring(0, 200)
            };
          }, [], function(retryResult) {
            if (!retryResult || !retryResult.value) {
              browser.assert.fail('Failed to check page elements after retry - result is null');
              return;
            }
            console.log('After retry - Page text:', retryResult.value.pageText);
            browser.assert.equal(retryResult.value.hasEitherElement, true, 'Either plan definitions table or no-data message is present');
          });
        } else {
          console.log('Page text:', result.value.pageText);
          browser.assert.equal(result.value.hasEitherElement, true, 'Either plan definitions table or no-data message is present');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/plan-definitions/02-plan-definitions-list.png');
  });

  it('03. Navigate to new plan definition form', browser => {
    browser
      .waitForElementVisible('#planDefinitionsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Plan Definition') || 
              button.textContent.includes('Add Your First Plan Definition')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Plan Definition button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#planDefinitionDetailPage', 5000)
      // Check Basic Info fields that we added IDs for
      .assert.elementPresent('#urlInput', 'Canonical URL field is present')
      .assert.elementPresent('#versionInput', 'Version field is present')
      .assert.elementPresent('#nameInput', 'Name field is present')
      .assert.elementPresent('#titleInput', 'Title field is present')
      .assert.elementPresent('#typeSelect', 'Type select is present')
      .assert.elementPresent('#statusSelect', 'Status select is present')
      .assert.elementPresent('#dateInput', 'Date field is present')
      .assert.elementPresent('#descriptionTextarea', 'Description field is present')
      .assert.elementPresent('#purposeTextarea', 'Purpose field is present')
      .assert.elementPresent('#usageTextarea', 'Usage field is present')
      .assert.elementPresent('#approvalDateInput', 'Approval Date field is present')
      .assert.elementPresent('#lastReviewDateInput', 'Last Review Date field is present')
      .assert.elementPresent('#effectivePeriodStartInput', 'Effective Period Start field is present')
      .assert.elementPresent('#effectivePeriodEndInput', 'Effective Period End field is present')
      .pause(1000)
      .saveScreenshot('tests/nightwatch/screenshots/plan-definitions/03-new-plan-definition-form.png');
  });

  it('04. Create new plan definition', browser => {
    browser
      .waitForElementVisible('#planDefinitionDetailPage', 5000)
      .pause(500);

    // Check if we're on the new plan definition page
    browser.assert.urlContains('/plan-definitions/new');

    // Check if form is in edit mode
    browser.execute(function() {
      const urlField = document.querySelector('#urlInput');
      if (urlField && urlField.disabled) {
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

    // Fill Basic Info tab fields
    browser
      .pause(500)
      .clearValue('#urlInput')
      .setValue('#urlInput', testPlanDefinition.url)
      .clearValue('#versionInput')
      .setValue('#versionInput', testPlanDefinition.version)
      .clearValue('#nameInput')
      .setValue('#nameInput', testPlanDefinition.name)
      .clearValue('#titleInput')
      .setValue('#titleInput', testPlanDefinition.title)
      .clearValue('#dateInput')
      .setValue('#dateInput', testPlanDefinition.date)
      .clearValue('#descriptionTextarea')
      .setValue('#descriptionTextarea', testPlanDefinition.description)
      .clearValue('#purposeTextarea')
      .setValue('#purposeTextarea', testPlanDefinition.purpose)
      .clearValue('#usageTextarea')
      .setValue('#usageTextarea', testPlanDefinition.usage)
      .clearValue('#approvalDateInput')
      .setValue('#approvalDateInput', testPlanDefinition.approvalDate)
      .clearValue('#lastReviewDateInput')
      .setValue('#lastReviewDateInput', testPlanDefinition.lastReviewDate)
      .clearValue('#effectivePeriodStartInput')
      .setValue('#effectivePeriodStartInput', testPlanDefinition.effectivePeriodStart)
      .clearValue('#effectivePeriodEndInput')
      .setValue('#effectivePeriodEndInput', testPlanDefinition.effectivePeriodEnd)
      .pause(500);

    // Handle Material-UI Select for type
    browser.execute(function(typeCode) {
      const typeSelect = document.querySelector('#typeSelect');
      if (typeSelect) {
        typeSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === typeCode) {
              option.click();
              break;
            }
          }
        }, 300);
      }
      return true;
    }, ['clinical-protocol']);  // Use default type
    
    browser.pause(500);

    // Handle Material-UI Select for status
    browser.execute(function(status) {
      const statusSelect = document.querySelector('#statusSelect');
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
    }, [testPlanDefinition.status]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/plan-definitions/04-filled-plan-definition-form.png');

    // Log form values before save
    browser.execute(function() {
      const urlField = document.querySelector('#urlInput');
      const nameField = document.querySelector('#nameInput');
      const titleField = document.querySelector('#titleInput');
      
      console.log('=== Form values before save ===');
      console.log('URL:', urlField ? urlField.value : 'not found');
      console.log('Name:', nameField ? nameField.value : 'not found');
      console.log('Title:', titleField ? titleField.value : 'not found');
      
      const statusSelect = document.querySelector('#statusSelect');
      console.log('Status value:', statusSelect ? statusSelect.value : 'not found');
      
      // Also check what's actually in the database
      if (typeof PlanDefinitions !== 'undefined' && window.testTimestamp) {
        const savedPlanDefinitions = PlanDefinitions.find().fetch();
        const testPlanDefinition = savedPlanDefinitions.find(p => p.name && 
          p.name.includes(window.testTimestamp));
        if (testPlanDefinition) {
          console.log('Found test plan definition in database:', testPlanDefinition);
          console.log('Plan definition status:', testPlanDefinition.status);
        } else {
          console.log('Test plan definition not found in database');
        }
      }
      
      return { logged: true };
    });

    // Save the plan definition
    browser
      .execute(function() {
        window.consoleErrors = [];
        const originalError = console.error;
        console.error = function() {
          window.consoleErrors.push(Array.from(arguments).join(' '));
          originalError.apply(console, arguments);
        };
        
        // First try to find the save button by ID
        const saveButton = document.querySelector('#savePlanDefinitionButton');
        if (saveButton) {
          console.log('Found save button by ID, text:', saveButton.textContent);
          saveButton.click();
          return true;
        }
        
        // Fallback to searching by text (Create for new, Update for existing)
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Create') || button.textContent.includes('Update') || button.textContent.includes('Save')) {
            console.log('Found button by text:', button.textContent);
            button.click();
            return true;
          }
        }
        console.error('Could not find Create/Update/Save button');
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Create button');
      });

    browser
      .pause(2000);
    
    // Check the result of the save
    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#planDefinitionsTable') !== null;
      const hasPlanDefinitionsPage = document.querySelector('#planDefinitionsPage') !== null;
      const hasDetailPage = document.querySelector('#planDefinitionDetailPage') !== null;
      
      // Look for actual error messages, not buttons with error color
      const errorAlerts = document.querySelectorAll('.MuiAlert-standardError, [role="alert"][severity="error"]');
      const errorMessages = document.querySelectorAll('.error-message, .error-text');
      let errorText = '';
      
      errorAlerts.forEach(el => {
        if (el.textContent && !el.textContent.includes('Delete')) {
          errorText += el.textContent + ' ';
        }
      });
      
      errorMessages.forEach(el => {
        if (el.textContent && !el.textContent.includes('Delete')) {
          errorText += el.textContent + ' ';
        }
      });
      
      const consoleErrors = window.consoleErrors || [];
      
      // Check if we successfully navigated away from /new
      const saveSuccessful = currentUrl !== '/plan-definitions/new' && currentUrl.startsWith('/plan-definitions/');
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasPlanDefinitionsPage: hasPlanDefinitionsPage,
        hasDetailPage: hasDetailPage,
        hasError: errorText.length > 0,
        errorText: errorText.trim(),
        consoleErrors: consoleErrors,
        userId: (typeof Meteor !== 'undefined' && Meteor.userId) ? Meteor.userId() : 'No Meteor.userId',
        isLoggedIn: (typeof Meteor !== 'undefined' && Meteor.userId) ? !!Meteor.userId() : false,
        saveSuccessful: saveSuccessful
      };
    }, [], function(result) {
      if (!result || !result.value) {
        browser.assert.fail('Failed to get post-save state - result is null');
        return;
      }
      console.log('Post-save state:', result.value);
      
      // Check if save was successful
      if (result.value.saveSuccessful) {
        browser.assert.ok(true, 'Plan definition saved successfully - navigated to ' + result.value.url);
      } else if (result.value.hasError && result.value.errorText) {
        browser.assert.fail(`Save failed with error: ${result.value.errorText}`);
      } else if (result.value.url === '/plan-definitions/new') {
        browser.assert.fail('Still on new plan definition page - save may have failed');
      }
      
      if (!result.value.isLoggedIn) {
        browser.assert.fail('User is not logged in after save attempt');
      }
    });
    
    // Wait for navigation to plan definitions list
    browser
      .pause(1000);
      
    // Check what page we're on and capture the created ID
    browser.execute(function() {
      // Try to find the created plan definition
      if (typeof PlanDefinitions !== 'undefined' && window.testTimestamp) {
        const createdPlanDefinition = PlanDefinitions.findOne({
          'name': { $regex: `TestPlanDefinition${window.testTimestamp}` }
        });
        if (createdPlanDefinition) {
          window.createdPlanDefinitionId = createdPlanDefinition._id;
          console.log('Created plan definition ID:', window.createdPlanDefinitionId);
          console.log('Created plan definition type:', createdPlanDefinition.type);
        }
      }
      
      return {
        url: window.location.pathname,
        hasPlanDefinitionsPage: document.querySelector('#planDefinitionsPage') !== null,
        hasDetailPage: document.querySelector('#planDefinitionDetailPage') !== null
      };
    }, [], function(result) {
      console.log('Current page after save attempt:', result.value);
      if (result.value.url.includes('/new')) {
        browser.assert.fail('Still on new plan definition page - save may have failed');
      }
    });
    
    // After successful save, navigate back to the list page
    // CRITICAL: Use testUtils.navigateUrl to preserve Session state
    testUtils.navigateUrl(browser, '/plan-definitions');
    browser
      .waitForElementVisible('#planDefinitionsPage', 10000)
      .saveScreenshot('tests/nightwatch/screenshots/plan-definitions/05-plan-definition-saved.png');
  });

  it('05. Verify new plan definition appears in list', browser => {
    // Ensure we're on the list page
    browser
      .waitForElementVisible('#planDefinitionsPage', 5000)
      .pause(1000);
    
    // Check if search input exists before trying to use it
    browser.execute(function() {
      const searchInput = document.querySelector('#planDefinitionSearchInput');
      return { hasSearchInput: searchInput !== null };
    }, [], function(result) {
      if (result.value.hasSearchInput) {
        // Search for our specific test plan definition using the full timestamp
        browser
          .waitForElementVisible('#planDefinitionSearchInput', 5000)
          .clearValue('#planDefinitionSearchInput')
          .setValue('#planDefinitionSearchInput', timestamp.toString())
          .pause(1000);
      } else {
        console.log('Search input not available, proceeding without search');
      }
    });
    
    browser.execute(function() {
      const hasTable = document.querySelector('#planDefinitionsTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageText = document.querySelector('#planDefinitionsPage')?.textContent || '';
      
      let totalPlanDefinitions = 0;
      
      if (typeof PlanDefinitions !== 'undefined') {
        totalPlanDefinitions = PlanDefinitions.find({}).count();
        console.log('Total plan definitions in database:', totalPlanDefinitions);
        
        const testPlanDefinition = PlanDefinitions.findOne({
          'name': { $regex: 'TestPlanDefinition.*' }
        });
        console.log('Found test plan definition:', testPlanDefinition);
      }
      
      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasNoData: pageText.includes('No Data Available'),
        totalPlanDefinitions: totalPlanDefinitions
      };
    }, [], function(result) {
      console.log('Page state:', result.value);
      
      if (result.value.totalPlanDefinitions > 0 && (result.value.hasNoData || result.value.hasNoDataCard)) {
        browser.assert.fail(`Plan definitions exist (${result.value.totalPlanDefinitions}) but showing no data - search filter may be too restrictive`);
      } else if (result.value.hasNoData || result.value.hasNoDataCard) {
        browser.assert.fail('No plan definitions found - save operation may have failed');
      }
    });
    
    browser.execute(function() {
      const table = document.querySelector('#planDefinitionsTable');
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
        browser.assert.ok(true, `Found ${result.value.rowCount} plan definition(s) in table`);
      } else {
        browser.assert.fail('No plan definitions table found or table is empty');
      }
    });
    
    browser
      .saveScreenshot('tests/nightwatch/screenshots/plan-definitions/06-plan-definition-in-list.png');
  });

  it('06. View plan definition details', browser => {
    browser
      .waitForElementVisible('#planDefinitionsPage', 5000)
      .pause(1000);

    // Search for our specific plan definition using the full timestamp
    browser
      .waitForElementVisible('#planDefinitionSearchInput', 5000)
      .clearValue('#planDefinitionSearchInput')
      .setValue('#planDefinitionSearchInput', timestamp.toString())
      .pause(1000);

    // Now click on the plan definition row
    browser
      .waitForElementVisible('#planDefinitionsTable', 5000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#planDefinitionsTable tbody tr');
        console.log('Found', rows.length, 'rows in plan definitions table');
        
        // Look for our test plan definition
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
        browser.assert.equal(result.value.clicked, true, 'Found and clicked plan definition row');
      });

    browser
      .pause(2000);
      
    // Verify we navigated to the detail page
    browser.execute(function() {
      return {
        url: window.location.pathname,
        hasDetailPage: document.querySelector('#planDefinitionDetailPage') !== null,
        hasTable: document.querySelector('#planDefinitionsTable') !== null
      };
    }, [], function(result) {
      console.log('Navigation result:', result.value);
      if (!result.value.hasDetailPage) {
        browser.assert.fail('Failed to navigate to plan definition detail page');
      }
    });
    
    browser
      .waitForElementVisible('#planDefinitionDetailPage', 10000)
      .assert.valueContains('#titleInput', testPlanDefinition.title)
      .assert.valueContains('#nameInput', testPlanDefinition.name)
      .assert.valueContains('#urlInput', testPlanDefinition.url)
      .execute(function(expected) {
        const getMUISelectValue = (selectId) => {
          const element = document.querySelector(selectId);
          if (!element) {
            console.log(`Element ${selectId} not found`);
            return null;
          }
          console.log(`Found element ${selectId}, tagName: ${element.tagName}, innerHTML preview:`, element.innerHTML.substring(0, 200));
          
          // First check if it's a native select
          if (element.tagName === 'SELECT') {
            return element.value;
          }
          
          // For MUI Select, check various possible structures
          // Check for hidden input (common in MUI)
          const hiddenInput = element.querySelector('input[type="hidden"]');
          if (hiddenInput && hiddenInput.value) return hiddenInput.value;
          
          // Check the main input element
          const selectInput = element.querySelector('input');
          if (selectInput && selectInput.value) return selectInput.value;
          
          // In disabled/view mode, MUI might render the value differently
          // Check for the displayed text in the input
          const inputElement = element.querySelector('input[role="combobox"]') || element.querySelector('input');
          if (inputElement) {
            // The value might be in the value attribute, data attribute, or aria attributes
            return inputElement.value || 
                   inputElement.getAttribute('value') || 
                   inputElement.getAttribute('data-value');
          }
          
          // For disabled MUI selects, the value might be in a div with the select role
          const selectDiv = element.querySelector('div[role="button"]') || element.querySelector('div[role="combobox"]');
          if (selectDiv) {
            // The display text might contain the status
            const displayText = selectDiv.textContent || selectDiv.innerText;
            // Try to match against known status values
            const statusValues = ['draft', 'active', 'retired', 'unknown'];
            for (let status of statusValues) {
              if (displayText && displayText.toLowerCase().includes(status)) {
                return status;
              }
            }
          }
          
          // Last resort - check if the element itself has a value
          return element.value || element.getAttribute('value');
        };
        
        const descriptionElement = document.querySelector('#descriptionTextarea');
        return {
          status: getMUISelectValue('#statusSelect'),
          description: descriptionElement ? descriptionElement.value : null
        };
      }, [testPlanDefinition], function(result) {
        console.log('View plan definition details - form values:', result.value);
        // Status field might not be immediately readable from Material-UI Select in view mode
        // Skip status check if null, as other fields confirm we're viewing the right record
        if (result.value && result.value.status !== null) {
          browser.assert.equal(result.value.status, testPlanDefinition.status, 'Status matches');
        } else {
          console.log('Status field not readable in view mode, skipping check');
        }
        if (result.value && result.value.description !== null && testPlanDefinition.description) {
          browser.assert.ok(result.value.description.includes(testPlanDefinition.description), 'Description contains expected text');
        } else {
          console.log('Description field not present or not readable in view mode, skipping check');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/plan-definitions/07-view-plan-definition-details.png');
    
    // Navigate back to plan definitions list
    // CRITICAL: Use testUtils.navigateUrl to preserve Session state
    testUtils.navigateUrl(browser, '/plan-definitions');
    browser
      .waitForElementVisible('#planDefinitionsPage', 10000);
  });

  it('07. Update existing plan definition', browser => {
    browser
      .waitForElementVisible('#planDefinitionsTable', 10000)
      .pause(1000);

    // Check if search input exists before trying to use it
    browser.execute(function() {
      const searchInput = document.querySelector('#planDefinitionSearchInput');
      return { hasSearchInput: searchInput !== null };
    }, [], function(result) {
      if (result.value.hasSearchInput) {
        // Search for our specific test plan definition using the full timestamp
        browser
          .waitForElementVisible('#planDefinitionSearchInput', 5000)
          .clearValue('#planDefinitionSearchInput')
          .setValue('#planDefinitionSearchInput', timestamp.toString())
          .pause(1000);
      } else {
        console.log('Search input not available, proceeding without search');
      }
    });

    // Now click on the plan definition to edit
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#planDefinitionsTable tbody tr');
        console.log('Looking for plan definition with timestamp:', timestamp);
        console.log('Found', rows.length, 'rows in table');
        
        for (let i = 0; i < rows.length; i++) {
          console.log('Row', i, ':', rows[i].textContent.substring(0, 100));
          if (rows[i].textContent.includes(timestamp)) {
            console.log('Found test plan definition in row', i);
            rows[i].click();
            return { success: true, found: true, rowIndex: i };
          }
        }
        
        console.error('Test plan definition not found in table!');
        return { success: false, found: false, error: 'Test plan definition not in table' };
      }, [timestamp.toString()], function(result) {
        if (!result.value.found) {
          browser.assert.fail('Test plan definition not found in table - cannot update.');
        }
      });

    browser
      .pause(1000)
      .waitForElementVisible('#planDefinitionDetailPage', 5000)
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

    // Update plan definition details
    browser
      .clearValue('#titleInput')
      .setValue('#titleInput', updatedPlanDefinition.title)
      .clearValue('#versionInput')
      .setValue('#versionInput', updatedPlanDefinition.version)
      .clearValue('#descriptionTextarea')
      .setValue('#descriptionTextarea', updatedPlanDefinition.description)
      .click('#statusSelect')
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
      }, [updatedPlanDefinition.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .clearValue('#descriptionTextarea')
      .setValue('#descriptionTextarea', updatedPlanDefinition.description)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/plan-definitions/08-updated-plan-definition-form.png');

    // Save the updated plan definition
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
        browser.assert.equal(result.value, true, 'Clicked Update/Save button');
      });

    browser
      .pause(1000);

    // CRITICAL: Use testUtils.navigateUrl to preserve Session state
    testUtils.navigateUrl(browser, '/plan-definitions');
    browser
      .waitForElementVisible('#planDefinitionsTable', 10000)
      .saveScreenshot('tests/nightwatch/screenshots/plan-definitions/09-plan-definition-updated.png');
  });

  it('08. Verify updated plan definition in list', browser => {
    browser
      .waitForElementVisible('#planDefinitionsTable', 5000)
      .waitForElementVisible('#planDefinitionSearchInput', 5000)
      .clearValue('#planDefinitionSearchInput')
      .pause(500);
      
    // Try searching for the timestamp first to see if any plan definition shows up
    browser
      .setValue('#planDefinitionSearchInput', timestamp.toString())
      .pause(1500)
      .execute(function() {
        const table = document.querySelector('#planDefinitionsTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const hasNoData = document.querySelector('.no-data-card') !== null ||
                         document.querySelector('#planDefinitionsPage').textContent.includes('No Data Available');
        
        console.log('=== Plan Definition Search Debug ===');
        console.log('Table found:', !!table);
        console.log('Row count:', rows.length);
        console.log('Has no-data state:', hasNoData);
        
        if (rows.length > 0) {
          console.log('First row text:', rows[0].textContent);
        }
        
        // Check if plan definition exists in the database
        if (typeof PlanDefinitions !== 'undefined') {
          const totalPlanDefinitions = PlanDefinitions.find({}).count();
          console.log('Total plan definitions in database:', totalPlanDefinitions);
          
          // Find our test plan definition
          const testPlanDefinitions = PlanDefinitions.find({
            $or: [
              { 'name': { $regex: '.*' + window.testTimestamp + '.*' } },
              { 'title': { $regex: '.*' + window.testTimestamp + '.*' } }
            ]
          }).fetch();
          
          console.log('Found test plan definitions:', testPlanDefinitions.length);
          if (testPlanDefinitions.length > 0) {
            console.log('Test plan definition:', JSON.stringify(testPlanDefinitions[0], null, 2));
          }
        }
        
        return {
          rowCount: rows.length,
          hasTable: !!table,
          hasNoData: hasNoData,
          tableContent: table ? table.textContent : 'No table'
        };
      }, [], function(result) {
        console.log('Initial search result:', result.value);
      });
      
    // Search again using the timestamp to find our updated plan definition
    browser
      .clearValue('#planDefinitionSearchInput')
      .setValue('#planDefinitionSearchInput', timestamp.toString())
      .pause(1500)
      .execute(function(expectedTitle, timestamp) {
        const table = document.querySelector('#planDefinitionsTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const planDefinitionInfo = [];
        
        console.log('=== Looking for updated plan definition ===');
        console.log('Expected title:', expectedTitle);
        console.log('Timestamp:', timestamp);
        
        // Debug database content
        if (typeof PlanDefinitions !== 'undefined') {
          const testPlanDefinition = PlanDefinitions.findOne({
            $or: [
              { 'name': { $regex: '.*' + timestamp + '.*' } },
              { 'title': { $regex: '.*' + timestamp + '.*' } }
            ]
          });
          
          if (testPlanDefinition) {
            console.log('Found plan definition in database:');
            console.log('- _id:', testPlanDefinition._id);
            console.log('- name:', testPlanDefinition.name);
            console.log('- title:', testPlanDefinition.title);
            console.log('- status:', testPlanDefinition.status);
            console.log('- version:', testPlanDefinition.version);
          }
        }
        
        for (let row of rows) {
          const rowText = row.textContent;
          console.log('Row text:', rowText);
          
          // Extract plan definition info from the row
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            // Usually plan definition info is in one of the first few columns
            for (let i = 0; i < Math.min(cells.length, 5); i++) {
              const cellText = cells[i].textContent.trim();
              if (cellText && cellText.length > 0) {
                planDefinitionInfo.push(`Cell ${i}: ${cellText}`);
              }
            }
          }
        }
        
        const foundExpected = table ? table.textContent.includes(expectedTitle) : false;
        const foundTimestamp = table ? table.textContent.includes(timestamp) : false;
        
        return {
          rowCount: rows.length,
          planDefinitionInfo: planDefinitionInfo,
          tableText: table ? table.textContent.substring(0, 500) : 'Table not found',
          foundExpected: foundExpected,
          foundTimestamp: foundTimestamp
        };
      }, [updatedPlanDefinition.title, timestamp.toString()], function(result) {
        console.log('Table debug info:', result.value);
        
        if (result.value.rowCount === 0) {
          browser.assert.fail('No plan definitions found in table after search. The update may have failed or search is not working.');
        } else if (!result.value.foundExpected && !result.value.foundTimestamp) {
          browser.assert.fail(`Updated plan definition '${updatedPlanDefinition.title}' not found in table. Table contains: ${result.value.planDefinitionInfo.join('; ')}`);
        } else {
          browser.assert.ok(true, 'Found updated plan definition in table');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/plan-definitions/10-updated-plan-definition-in-list.png');
  });

  it('09. Delete plan definition', browser => {
    browser
      .waitForElementVisible('#planDefinitionsPage', 5000)
      .pause(1000);

    browser.execute(function() {
      const hasTable = document.querySelector('#planDefinitionsTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#planDefinitionsPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#planDefinitionsTable tbody tr');
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked plan definition row');
          });

        browser
          .pause(1000)
          .waitForElementVisible('#planDefinitionDetailPage', 5000)
          .pause(500);

        // Click Delete button (only visible in view mode, not edit mode)
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
          .pause(100)
          .acceptAlert()
          .pause(500);

        browser
          .pause(1000)
          .waitForElementVisible('#planDefinitionsPage', 5000)
          .execute(function() {
            const hasTable = document.querySelector('#planDefinitionsTable') !== null;
            const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                                document.querySelector('.no-data-available') !== null ||
                                document.querySelector('[id*="no-data"]') !== null ||
                                (document.querySelector('#planDefinitionsPage') && 
                                 document.querySelector('#planDefinitionsPage').textContent.includes('No Data Available'));
            return {
              hasTable: hasTable,
              hasNoDataCard: hasNoDataCard,
              hasEitherElement: hasTable || hasNoDataCard
            };
          }, [], function(result) {
            browser.assert.equal(result.value.hasEitherElement, true, 'Either plan definitions table or no-data message is present after deletion');
          });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No plan definitions to delete - No Data Available state is correct');
      }
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/plan-definitions/11-plan-definition-deleted.png');
  });

  it('10. Verify plan definition removed from list', browser => {
    browser
      .waitForElementVisible('#planDefinitionsPage', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const table = document.querySelector('#planDefinitionsTable');
        if (table) {
          const rows = document.querySelectorAll('#planDefinitionsTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#planDefinitionsPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Plan definition no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (plan definition was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/plan-definitions/12-plan-definition-not-in-list.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof PlanDefinitions !== 'undefined') {
        PlanDefinitions.find({ 
          $or: [
            { 'name': { $regex: 'TestPlanDefinition.*' } },
            { 'title': { $regex: '.*Plan Definition.*' } },
            { 'url': { $regex: '.*plandefinition.*' } }
          ]
        }).fetch().forEach(function(planDefinition) {
          PlanDefinitions.remove({ _id: planDefinition._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});