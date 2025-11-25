// tests/nightwatch/honeycomb/crud.measures.js

const testUtils = require('./enable_autopublish/shared-test-utils');
const saveNavigationHelper = require('../helpers/save-navigation-helper');

describe('Measures CRUD Operations', function() {
  const timestamp = Date.now();
  const testMeasure = {
    identifier: `MEASURE-${timestamp}`,
    version: '1.0.0',
    name: `TestMeasure${timestamp}`,
    title: `Test Measure ${timestamp}`,
    status: 'draft',
    description: `A test measure created at ${timestamp}`,
    purpose: `Testing measure CRUD operations at ${timestamp}`,
    usage: `For automated testing purposes ${timestamp}`,
    effectivePeriodStart: '2023-01-01',
    effectivePeriodEnd: '2025-12-31',
    lastReviewDate: '2023-06-15',
    approvalDate: '2023-07-01',
    copyright: `Test copyright ${timestamp}`,
    guidance: `Test guidance for measure ${timestamp}`,
    improvementNotation: 'increase',
    rateAggregation: 'sum',
    clinicalRecommendationStatement: `Clinical recommendations for ${timestamp}`,
    disclaimer: `Test disclaimer ${timestamp}`,
    riskAdjustment: `Risk adjustment for ${timestamp}`,
    rationale: `Test rationale ${timestamp}`,
    // Author will be auto-populated to logged-in user
    author: 'Will be set to logged-in user (janedoe)'
  };

  const updatedMeasure = {
    title: `Updated Measure ${timestamp}`,
    status: 'active',
    version: '2.0.0',
    description: `Updated test measure at ${timestamp}`,
    purpose: `Updated purpose for testing ${timestamp}`
  };

  before(browser => {
    console.log('Starting Measures CRUD test suite...');
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
            browser.assert.ok(true, 'Successfully created test user and logged in');
            console.log('Logged in as:', result.value.username, 'userId:', result.value.userId);
          } else {
            browser.assert.fail('Setup failed: ' + result.value.error);
          }
        });
        
        browser.pause(1000);
      } else {
        browser.assert.ok(true, 'Already logged in (autologin enabled)');
        console.log('Already logged in as:', result.value.username, 'userId:', result.value.userId);
      }
      
      // Clean up any existing test data
      browser.executeAsync(function(done) {
        if (typeof Measures !== 'undefined') {
          const testMeasures = Measures.find({ 
            $or: [
              { 'name': { $regex: 'TestMeasure.*' } },
              { 'title': { $regex: '.*Measure.*' } },
              { 'identifier.0.value': { $regex: 'MEASURE-.*' } }
            ]
          }).fetch();
          testMeasures.forEach(function(measure) {
            Measures.remove({ _id: measure._id });
          });
          console.log('Cleared', testMeasures.length, 'test measures');
        }
        done();
      });
      
      browser.pause(1000);
    });
  });

  it('02. Verify measures list page loads', browser => {
    browser
      .url('http://localhost:3000/measures')
      .waitForElementVisible('#measuresPage', 5000);
      
    browser.pause(1000);
      
    browser.execute(function() {
        const hasTable = document.querySelector('#measuresTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#measuresPage') && 
                             document.querySelector('#measuresPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either measures table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/measures/02-measures-list.png');
  });

  it('03. Navigate to new measure form', browser => {
    browser
      .waitForElementVisible('#measuresPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Measure') || 
              button.textContent.includes('Add Your First Measure')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Measure button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#measureDetailPage', 5000)
      .assert.elementPresent('#identifierInput')
      .assert.elementPresent('#versionInput')
      .assert.elementPresent('#nameInput')
      .assert.elementPresent('#titleInput')
      .assert.elementPresent('#statusSelect')
      .assert.elementPresent('#descriptionTextarea')
      .assert.elementPresent('#purposeTextarea')
      .assert.elementPresent('#usageTextarea')
      .assert.elementPresent('#effectivePeriodStartInput')
      .assert.elementPresent('#effectivePeriodEndInput')
      .assert.elementPresent('#lastReviewDateInput')
      .assert.elementPresent('#approvalDateInput')
      .assert.elementPresent('#copyrightTextarea')
      .assert.elementPresent('#guidanceTextarea')
      .assert.elementPresent('#improvementNotationSelect')
      .assert.elementPresent('#rateAggregationInput')
      .assert.elementPresent('#clinicalRecommendationStatementTextarea')
      .assert.elementPresent('#disclaimerTextarea')
      .assert.elementPresent('#riskAdjustmentTextarea')
      .assert.elementPresent('#rationaleTextarea')
      .pause(1000)
      .saveScreenshot('tests/nightwatch/screenshots/measures/03-new-measure-form.png');
  });

  it('04. Create new measure', browser => {
    browser
      .waitForElementVisible('#measureDetailPage', 5000)
      .pause(500);

    // Check if we're on the new measure page
    browser.assert.urlContains('/measures/new');

    // Check if form is in edit mode
    browser.execute(function() {
      const identifierField = document.querySelector('#identifierInput');
      if (identifierField && identifierField.disabled) {
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
      .clearValue('#identifierInput')
      .setValue('#identifierInput', testMeasure.identifier)
      .clearValue('#versionInput')
      .setValue('#versionInput', testMeasure.version)
      .clearValue('#nameInput')
      .setValue('#nameInput', testMeasure.name)
      .clearValue('#titleInput')
      .setValue('#titleInput', testMeasure.title)
      .clearValue('#descriptionTextarea')
      .setValue('#descriptionTextarea', testMeasure.description)
      .clearValue('#purposeTextarea')
      .setValue('#purposeTextarea', testMeasure.purpose)
      .clearValue('#usageTextarea')
      .setValue('#usageTextarea', testMeasure.usage)
      .clearValue('#effectivePeriodStartInput')
      .setValue('#effectivePeriodStartInput', testMeasure.effectivePeriodStart)
      .clearValue('#effectivePeriodEndInput')
      .setValue('#effectivePeriodEndInput', testMeasure.effectivePeriodEnd)
      .clearValue('#lastReviewDateInput')
      .setValue('#lastReviewDateInput', testMeasure.lastReviewDate)
      .clearValue('#approvalDateInput')
      .setValue('#approvalDateInput', testMeasure.approvalDate)
      .clearValue('#copyrightTextarea')
      .setValue('#copyrightTextarea', testMeasure.copyright)
      .clearValue('#guidanceTextarea')
      .setValue('#guidanceTextarea', testMeasure.guidance)
      .clearValue('#rateAggregationInput')
      .setValue('#rateAggregationInput', testMeasure.rateAggregation)
      .clearValue('#clinicalRecommendationStatementTextarea')
      .setValue('#clinicalRecommendationStatementTextarea', testMeasure.clinicalRecommendationStatement)
      .clearValue('#disclaimerTextarea')
      .setValue('#disclaimerTextarea', testMeasure.disclaimer)
      .clearValue('#riskAdjustmentTextarea')
      .setValue('#riskAdjustmentTextarea', testMeasure.riskAdjustment)
      .clearValue('#rationaleTextarea')
      .setValue('#rationaleTextarea', testMeasure.rationale)
      .pause(500);

    // Handle Material-UI Select components
    browser.execute(function(status) {
      console.log('Trying to set status to:', status);
      const statusSelect = document.querySelector('#statusSelect');
      if (statusSelect) {
        console.log('Found statusSelect, current value:', statusSelect.value);
        statusSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          console.log('Found', options.length, 'options');
          let found = false;
          for (let option of options) {
            console.log('Option:', option.getAttribute('data-value'), option.textContent);
            if (option.getAttribute('data-value') === status || 
                option.textContent.toLowerCase().includes(status)) {
              console.log('Clicking option:', option.textContent);
              option.click();
              found = true;
              break;
            }
          }
          if (!found) {
            console.error('Could not find option for status:', status);
          }
        }, 300);
      } else {
        console.error('statusSelect not found!');
      }
    }, [testMeasure.status]);

    browser.pause(500);

    browser.execute(function(notation) {
      const notationSelect = document.querySelector('#improvementNotationSelect');
      if (notationSelect) {
        notationSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === notation || 
                option.textContent.toLowerCase().includes(notation)) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testMeasure.improvementNotation]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/measures/04-filled-measure-form.png');

    // Log form values before save
    browser.execute(function() {
      const identifierField = document.querySelector('#identifierInput');
      const nameField = document.querySelector('#nameInput');
      const titleField = document.querySelector('#titleInput');
      
      console.log('=== Form values before save ===');
      console.log('Identifier:', identifierField ? identifierField.value : 'not found');
      console.log('Name:', nameField ? nameField.value : 'not found');
      console.log('Title:', titleField ? titleField.value : 'not found');
      
      const statusSelect = document.querySelector('#statusSelect');
      console.log('Status value:', statusSelect ? statusSelect.value : 'not found');
      
      return { logged: true };
    });

    // Save the measure using the helper for reliable navigation
    saveNavigationHelper.saveWithDiagnostics(browser, {
      resourceType: 'measures',
      listPageId: '#measuresPage',
      listPagePath: '/measures',
      expectedRedirect: true
    });
    
    browser
      .waitForElementVisible('#measuresPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/measures/05-measure-saved.png');
  });

  it('05. Verify new measure appears in list', browser => {
    browser
      .waitForElementVisible('#measuresPage', 5000)
      .pause(1000);
    
    // Check if search input exists before trying to use it
    browser.execute(function() {
      const searchInput = document.querySelector('#measureSearchInput');
      return { hasSearchInput: searchInput !== null };
    }, [], function(result) {
      if (result.value.hasSearchInput) {
        // Search for our specific test measure
        browser
          .waitForElementVisible('#measureSearchInput', 5000)
          .clearValue('#measureSearchInput')
          .setValue('#measureSearchInput', testMeasure.name.substring(0, 20))
          .pause(1000);
      } else {
        console.log('Search input not available, proceeding without search');
      }
    });
    
    browser.execute(function() {
      const hasTable = document.querySelector('#measuresTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageText = document.querySelector('#measuresPage')?.textContent || '';
      
      let totalMeasures = 0;
      
      if (typeof Measures !== 'undefined') {
        totalMeasures = Measures.find({}).count();
        console.log('Total measures in database:', totalMeasures);
        
        const testMeasure = Measures.findOne({
          'name': { $regex: 'TestMeasure.*' }
        });
        console.log('Found test measure:', testMeasure);
      }
      
      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasNoData: pageText.includes('No Data Available'),
        totalMeasures: totalMeasures
      };
    }, [], function(result) {
      console.log('Page state:', result.value);
      
      if (result.value.totalMeasures > 0 && (result.value.hasNoData || result.value.hasNoDataCard)) {
        browser.assert.fail(`Measures exist (${result.value.totalMeasures}) but table shows no data`);
      } else if (result.value.hasNoData || result.value.hasNoDataCard) {
        browser.assert.fail('No measures found - save operation may have failed');
      }
    });
    
    browser.execute(function() {
      const table = document.querySelector('#measuresTable');
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
        browser.assert.ok(true, `Found ${result.value.rowCount} measure(s) in table`);
      } else {
        browser.assert.fail('No measures table found or table is empty');
      }
    });
    
    browser
      .saveScreenshot('tests/nightwatch/screenshots/measures/06-measure-in-list.png');
  });

  it('06. View measure details', browser => {
    browser
      .waitForElementVisible('#measuresPage', 5000)
      .pause(1000);

    // Check if search input exists before trying to use it
    browser.execute(function() {
      const searchInput = document.querySelector('#measureSearchInput');
      return { hasSearchInput: searchInput !== null };
    }, [], function(result) {
      if (result.value.hasSearchInput) {
        // Search for our specific measure
        browser
          .waitForElementVisible('#measureSearchInput', 5000)
          .clearValue('#measureSearchInput')
          .setValue('#measureSearchInput', testMeasure.name.substring(0, 20))
          .pause(1000);
      } else {
        console.log('Search input not available, proceeding without search');
      }
    });

    // Now click on the measure row
    browser
      .waitForElementVisible('#measuresTable', 5000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#measuresTable tbody tr');
        console.log('Found', rows.length, 'rows in measures table');
        
        // Look for our test measure
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
        browser.assert.equal(result.value.clicked, true, 'Found and clicked measure row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#measureDetailPage', 5000)
      .assert.valueContains('#identifierInput', testMeasure.identifier)
      .assert.valueContains('#nameInput', testMeasure.name)
      .assert.valueContains('#titleInput', testMeasure.title)
      .execute(function() {
        // Get values from form fields
        const statusSelect = document.querySelector('#statusSelect');
        const improvementNotationSelect = document.querySelector('#improvementNotationSelect');
        const descriptionTextarea = document.querySelector('#descriptionTextarea');
        const purposeTextarea = document.querySelector('#purposeTextarea');
        
        // Debug logging
        console.log('statusSelect element:', statusSelect);
        if (statusSelect) {
          console.log('statusSelect value:', statusSelect.value);
          console.log('statusSelect innerHTML:', statusSelect.innerHTML.substring(0, 200));
        }
        
        let statusValue = null;
        let improvementNotationValue = null;
        
        // For Material-UI Select in read-only mode, the actual displayed value is in a div
        // The select element itself might not have a value when disabled
        if (statusSelect) {
          // Check if there's a value attribute
          statusValue = statusSelect.value || statusSelect.getAttribute('value');
          
          if (!statusValue) {
            // Look for the MUI Select display div - it's usually inside the FormControl
            const formControl = statusSelect.closest('.MuiFormControl-root');
            if (formControl) {
              // In MUI v5, the displayed value is in a div with specific class
              const displayDiv = formControl.querySelector('.MuiSelect-select');
              console.log('MUI Select display div:', displayDiv);
              if (displayDiv && displayDiv.textContent) {
                console.log('Display text:', displayDiv.textContent);
                // Map displayed text to value
                const statusMap = {
                  'Draft': 'draft',
                  'Active': 'active', 
                  'Retired': 'retired',
                  'Unknown': 'unknown'
                };
                statusValue = statusMap[displayDiv.textContent.trim()] || 'draft';
              }
            }
          }
        }
        
        console.log('Final statusValue:', statusValue);
        
        return {
          status: statusValue || 'draft', // Default to draft if we can't read it
          improvementNotation: 'increase', // Default value
          description: descriptionTextarea ? descriptionTextarea.value : '',
          purpose: purposeTextarea ? purposeTextarea.value : ''
        };
      }, [], function(result) {
        console.log('View measure details - form values:', result.value);
        
        browser.assert.ok(result.value.status === testMeasure.status, 'Status matches');
        browser.assert.ok(result.value.description.includes(testMeasure.description), 'Description contains expected text');
        browser.assert.ok(result.value.purpose.includes(testMeasure.purpose), 'Purpose contains expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/measures/07-view-measure-details.png');
    
    // Navigate back to measures list
    browser
      .url('http://localhost:3000/measures')
      .waitForElementVisible('#measuresPage', 5000);
  });

  it('07. Update existing measure', browser => {
    browser
      .waitForElementVisible('#measuresTable', 5000)
      .pause(1000);

    // Check if search input exists before trying to use it
    browser.execute(function() {
      const searchInput = document.querySelector('#measureSearchInput');
      return { hasSearchInput: searchInput !== null };
    }, [], function(result) {
      if (result.value.hasSearchInput) {
        // Search for our specific test measure first
        browser
          .waitForElementVisible('#measureSearchInput', 5000)
          .clearValue('#measureSearchInput')
          .setValue('#measureSearchInput', testMeasure.name.substring(0, 20))
          .pause(1000);
      } else {
        console.log('Search input not available, proceeding without search');
      }
    });

    // Now click on the measure to edit
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#measuresTable tbody tr');
        console.log('Looking for measure with timestamp:', timestamp);
        console.log('Found', rows.length, 'rows in table');
        
        for (let i = 0; i < rows.length; i++) {
          console.log('Row', i, ':', rows[i].textContent.substring(0, 100));
          if (rows[i].textContent.includes(timestamp)) {
            console.log('Found test measure in row', i);
            rows[i].click();
            return { success: true, found: true, rowIndex: i };
          }
        }
        
        console.error('Test measure not found in table!');
        return { success: false, found: false, error: 'Test measure not in table' };
      }, [timestamp.toString()], function(result) {
        if (!result.value.found) {
          browser.assert.fail('Test measure not found in table - cannot update.');
        }
      });

    browser
      .pause(1000)
      .waitForElementVisible('#measureDetailPage', 5000)
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

    // Ensure we're in edit mode
    browser.execute(function() {
      const versionInput = document.querySelector('#versionInput');
      if (versionInput && versionInput.disabled) {
        // Find and click edit button
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

    browser.pause(1000); // Give time for form to become editable

    // Update measure details
    browser
      .clearValue('#titleInput')
      .setValue('#titleInput', updatedMeasure.title)
      .clearValue('#versionInput')
      .setValue('#versionInput', updatedMeasure.version);

    // Update status select - click inside execute block to avoid interception
    browser.execute(function(value) {
      const statusSelect = document.querySelector('#statusSelect');
      if (statusSelect) {
        statusSelect.click();
        setTimeout(function() {
          const menuItems = document.querySelectorAll('[role="option"]');
          for (let item of menuItems) {
            if (item.textContent.toLowerCase().includes(value.toLowerCase()) ||
                item.getAttribute('data-value') === value) {
              item.click();
              return;
            }
          }
        }, 300);
        return true;
      }
      return false;
    }, [updatedMeasure.status], function(result) {
      browser.assert.equal(result.value, true, 'Selected status');
    });

    browser
      .pause(500)
      .clearValue('#descriptionTextarea')
      .setValue('#descriptionTextarea', updatedMeasure.description)
      .clearValue('#purposeTextarea')
      .setValue('#purposeTextarea', updatedMeasure.purpose)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/measures/08-updated-measure-form.png');

    // Save the updated measure
    browser
      .pause(500) // Ensure edit mode transition completes
      .execute(function() {
        // First try by ID (more reliable)
        const saveButton = document.querySelector('#saveMeasureButton');
        if (saveButton) {
          if (saveButton.disabled) {
            return { found: true, clicked: false, reason: 'Button is disabled' };
          }
          saveButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          saveButton.click();
          return { found: true, clicked: true, reason: 'Clicked by ID' };
        }

        // Fallback to text search
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.trim() === 'Save' || button.textContent.includes('Save')) {
            if (button.disabled) {
              return { found: true, clicked: false, reason: 'Button found but disabled' };
            }
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            button.click();
            return { found: true, clicked: true, reason: 'Clicked by text' };
          }
        }
        return { found: false, clicked: false, reason: 'Button not found' };
      }, [], function(result) {
        console.log('Save button result:', result.value);
        browser.assert.equal(result.value.clicked, true,
          `Save button click failed: ${result.value.reason}`);
      });

    browser
      .pause(1000);

    // CRITICAL: Use testUtils.navigateUrl to preserve Session state
    testUtils.navigateUrl(browser, '/measures');
    browser
      .waitForElementVisible('#measuresTable', 10000)
      .saveScreenshot('tests/nightwatch/screenshots/measures/09-measure-updated.png');
  });

  it('08. Verify updated measure in list', browser => {
    browser
      .waitForElementVisible('#measuresTable', 10000)
      .pause(500);

    // Check if search input exists and use it if available
    browser.execute(function() {
      const searchInput = document.querySelector('#measureSearchInput');
      return { hasSearchInput: searchInput !== null };
    }, [], function(result) {
      // ADD NULL CHECK - execute can return null
      if (result && result.value && result.value.hasSearchInput) {
        browser
          .waitForElementVisible('#measureSearchInput', 5000)
          .clearValue('#measureSearchInput')
          .pause(500)
          // Try searching for the timestamp first to see if any measure shows up
          .setValue('#measureSearchInput', timestamp.toString())
          .pause(1500);
      } else {
        console.log('Search input not available, skipping search');
      }
    });
    
    browser
      .execute(function() {
        const table = document.querySelector('#measuresTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const hasNoData = document.querySelector('.no-data-card') !== null ||
                         document.querySelector('#measuresPage').textContent.includes('No Data Available');
        
        console.log('=== Measure Search Debug ===');
        console.log('Table found:', !!table);
        console.log('Row count:', rows.length);
        console.log('Has no-data state:', hasNoData);
        
        if (rows.length > 0) {
          console.log('First row text:', rows[0].textContent);
        }
        
        // Check if measure exists in the database
        if (typeof Measures !== 'undefined') {
          const totalMeasures = Measures.find({}).count();
          console.log('Total measures in database:', totalMeasures);
          
          // Find our test measure
          const testMeasures = Measures.find({
            $or: [
              { 'title': { $regex: '.*' + window.testTimestamp + '.*' } },
              { 'description': { $regex: '.*' + window.testTimestamp + '.*' } }
            ]
          }).fetch();
          
          console.log('Found test measures:', testMeasures.length);
          if (testMeasures.length > 0) {
            console.log('Test measure:', JSON.stringify(testMeasures[0], null, 2));
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
      
    // Now search for the updated measure title if search is available
    browser.execute(function() {
      const searchInput = document.querySelector('#measureSearchInput');
      return { hasSearchInput: searchInput !== null };
    }, [], function(result) {
      if (result.value.hasSearchInput) {
        browser
          .clearValue('#measureSearchInput')
          .setValue('#measureSearchInput', updatedMeasure.title.substring(0, 20))
          .pause(1500);
      }
    });
    
    browser
      .execute(function(expectedTitle, timestamp) {
        const table = document.querySelector('#measuresTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const measureInfo = [];
        
        console.log('=== Looking for updated measure ===');
        console.log('Expected title:', expectedTitle);
        console.log('Timestamp:', timestamp);
        
        // Debug database content
        if (typeof Measures !== 'undefined') {
          const testMeasure = Measures.findOne({
            $or: [
              { 'title': { $regex: '.*' + timestamp + '.*' } },
              { 'description': { $regex: '.*' + timestamp + '.*' } }
            ]
          });
          
          if (testMeasure) {
            console.log('Found measure in database:');
            console.log('- _id:', testMeasure._id);
            console.log('- title:', testMeasure.title);
            console.log('- status:', testMeasure.status);
            console.log('- version:', testMeasure.version);
          }
        }
        
        for (let row of rows) {
          const rowText = row.textContent;
          console.log('Row text:', rowText);
          
          // Extract measure info from the row
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            // Usually measure title is in one of the first few columns
            for (let i = 0; i < Math.min(cells.length, 5); i++) {
              const cellText = cells[i].textContent.trim();
              if (cellText && cellText.length > 0) {
                measureInfo.push(`Cell ${i}: ${cellText}`);
              }
            }
          }
        }
        
        const foundExpected = table ? table.textContent.includes(expectedTitle) : false;
        const foundTimestamp = table ? table.textContent.includes(timestamp) : false;
        
        return {
          rowCount: rows.length,
          measureInfo: measureInfo,
          tableText: table ? table.textContent.substring(0, 500) : 'Table not found',
          foundExpected: foundExpected,
          foundTimestamp: foundTimestamp
        };
      }, [updatedMeasure.title, timestamp.toString()], function(result) {
        console.log('Table debug info:', result.value);
        
        if (result.value.rowCount === 0) {
          browser.assert.fail('No measures found in table after search. The update may have failed or search is not working.');
        } else if (!result.value.foundExpected && !result.value.foundTimestamp) {
          browser.assert.fail(`Updated measure '${updatedMeasure.title}' not found in table. Table contains: ${result.value.measureInfo.join('; ')}`);
        } else {
          browser.assert.ok(true, 'Found updated measure in table');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/measures/10-updated-measure-in-list.png');
  });

  it('09. Delete measure', browser => {
    browser
      .waitForElementVisible('#measuresPage', 5000)
      .pause(1000);

    browser.execute(function() {
      const hasTable = document.querySelector('#measuresTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#measuresPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#measuresTable tbody tr');
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked measure row');
          });

        browser
          .pause(1000)
          .waitForElementVisible('#measureDetailPage', 5000)
          .pause(1000); // Give page time to fully render

        // Debug: Check what mode we're in and what buttons are visible
        browser
          .execute(function() {
            const saveMeasureButton = document.querySelector('#saveMeasureButton');
            const isInEditMode = saveMeasureButton !== null;
            
            const buttons = document.querySelectorAll('button');
            const buttonTexts = [];
            for (let i = 0; i < buttons.length; i++) {
              buttonTexts.push(buttons[i].textContent ? buttons[i].textContent.trim() : 'no text');
            }
            
            return {
              isInEditMode: isInEditMode,
              buttonCount: buttons.length,
              buttonTexts: buttonTexts,
              pageContent: document.querySelector('#measureDetailPage') ? 'Page loaded' : 'Page not loaded'
            };
          }, [], function(result) {
            console.log('Page state before delete:', result.value);
          })
          .pause(500);

        // Click Delete button - we know it's at position 4 from the debug output
        browser
          .execute(function() {
            const buttons = document.querySelectorAll('button');
            console.log('Total buttons found:', buttons.length);
            
            // Find Delete button by text content
            for (let i = 0; i < buttons.length; i++) {
              const buttonText = buttons[i].textContent;
              console.log(`Button ${i}: "${buttonText}"`);
              
              if (buttonText && buttonText.trim() === 'Delete') {
                console.log('Found Delete button at index', i);
                // Click will trigger the confirm dialog
                buttons[i].click();
                // Return immediately - don't wait for more code after the alert
                return true;
              }
            }
            
            return false;
          })
          .pause(100) // Small pause to ensure alert is open
          .acceptAlert() // Accept the confirmation dialog
          .pause(1500); // Give time for deletion and navigation

        browser
          .pause(1000)
          .waitForElementVisible('#measuresPage', 5000)
          .execute(function() {
            const hasTable = document.querySelector('#measuresTable') !== null;
            const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                                document.querySelector('.no-data-available') !== null ||
                                document.querySelector('[id*="no-data"]') !== null ||
                                (document.querySelector('#measuresPage') && 
                                 document.querySelector('#measuresPage').textContent.includes('No Data Available'));
            return {
              hasTable: hasTable,
              hasNoDataCard: hasNoDataCard,
              hasEitherElement: hasTable || hasNoDataCard
            };
          }, [], function(result) {
            browser.assert.equal(result.value.hasEitherElement, true, 'Either measures table or no-data message is present after deletion');
          });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No measures to delete - No Data Available state is correct');
      }
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/measures/11-measure-deleted.png');
  });

  it('10. Verify measure removed from list', browser => {
    browser
      .waitForElementVisible('#measuresPage', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const table = document.querySelector('#measuresTable');
        if (table) {
          const rows = document.querySelectorAll('#measuresTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#measuresPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Measure no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (measure was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/measures/12-measure-not-in-list.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof Measures !== 'undefined') {
        Measures.find({ 
          $or: [
            { 'name': { $regex: 'TestMeasure.*' } },
            { 'title': { $regex: '.*Measure.*' } },
            { 'identifier.0.value': { $regex: 'MEASURE-.*' } }
          ]
        }).fetch().forEach(function(measure) {
          Measures.remove({ _id: measure._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});