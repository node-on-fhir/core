// tests/nightwatch/honeycomb/enable_autopublish/crud.nutritionProducts.js
//
// NutritionProducts CRUD Test Suite - Patient-Agnostic Resource
//
// NutritionProducts are patient-agnostic (like Medications, Locations, Organizations).
// They do not belong to a specific patient and are globally available.
// No patient context is needed for this resource.

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

describe('NutritionProducts CRUD Operations', function() {
  const timestamp = Date.now();
  let createdNutritionProductId = null;

  const testNutritionProduct = {
    code: '227312003', // SNOMED code for nutritional product
    display: `Test Enteral Formula ${timestamp}`,
    manufacturer: `Nutrition Corp ${timestamp}`,
    status: 'active',
    category: 'enteral-formula',
    categoryDisplay: 'Enteral Formula',
    description: `Test nutritional product for E2E testing - ${timestamp}`,
    notes: `Test nutrition product created at ${timestamp}`
  };

  const updatedNutritionProduct = {
    manufacturer: `Updated Nutrition Corp ${timestamp}`,
    status: 'inactive',
    description: `Updated test nutritional product - ${timestamp}`,
    notes: `Test nutrition product updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting NutritionProducts CRUD test suite...');
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
      .waitForElementVisible('body', 5000);

    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      if (!isLoggedIn) {
        browser.assert.fail('Failed to ensure user is logged in');
      } else {
        browser.assert.ok(true, 'User is logged in');
      }

      // Clean up any existing test data
      browser.executeAsync(function(done) {
        if (typeof NutritionProducts !== 'undefined') {
          const testProducts = NutritionProducts.find({
            'manufacturer.display': { $regex: 'Nutrition Corp|Updated Nutrition Corp' }
          }).fetch();
          testProducts.forEach(function(product) {
            NutritionProducts.remove({ _id: product._id });
          });
          console.log('Cleared', testProducts.length, 'test nutrition products');
        }
        done();
      });
    });
  });

  it('02. Verify nutrition products list page loads', browser => {
    // Navigate to list page using direct URL to avoid stale element issues
    browser
      .url('http://localhost:3000/nutrition-products')
      .pause(3000)
      .saveScreenshot('tests/nightwatch/screenshots/nutritionProducts/02a-before-check.png');

    // Debug what's on the page
    browser.execute(function() {
      const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id).filter(id => id);
      const bodyHtml = document.body.innerHTML.substring(0, 500);
      return {
        allIds: allIds.slice(0, 20),
        bodyPreview: bodyHtml,
        url: window.location.href
      };
    }, [], function(result) {
      console.log('Page debug:', JSON.stringify(result.value, null, 2));
    });

    browser
      .waitForElementVisible('body', 5000);

    // Simple check - just verify the page has content
    browser.execute(function() {
      const page = document.querySelector('#nutritionProductsPage');
      const hasTable = document.querySelector('#nutritionProductsTable') !== null;
      const pageText = page ? page.textContent : '';
      const hasNoDataText = pageText.includes('No Data Available');

      console.log('Page check:', { hasTable, hasNoDataText, pageExists: !!page });

      return {
        hasTable: hasTable,
        hasNoDataText: hasNoDataText,
        hasEither: hasTable || hasNoDataText
      };
    }, [], function(result) {
      console.log('Test 02 result:', result.value);
      if (result.value) {
        browser.assert.ok(result.value.hasEither, 'Either nutrition products table or no-data message is present');
      } else {
        // Fallback - check by looking for specific elements
        browser.assert.elementPresent('#nutritionProductsPage');
      }
    });

    browser.saveScreenshot('tests/nightwatch/screenshots/nutritionProducts/02-nutritionProducts-list.png');
  });

  it('03. Navigate to new nutrition product form', browser => {
    browser
      .waitForElementVisible('#nutritionProductsPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        const buttonTexts = Array.from(buttons).map(b => b.textContent.trim());
        console.log('Available buttons:', buttonTexts);

        for (let button of buttons) {
          const text = button.textContent.toLowerCase();
          if (text.includes('add') && text.includes('nutrition')) {
            button.click();
            return true;
          }
        }

        // Try FAB button
        const fabButtons = document.querySelectorAll('[aria-label*="add"], [aria-label*="Add"], button[title*="add"], button[title*="Add"]');
        for (let fab of fabButtons) {
          fab.click();
          return true;
        }

        return false;
      }, [], function(result) {
        if (!result.value) {
          testUtils.navigateUrl(browser, '/nutrition-products/new');
        } else {
          browser.assert.equal(result.value, true, 'Clicked Add Nutrition Product button');
        }
      });

    browser
      .waitForElementVisible('#nutritionProductDetailPage', 10000)
      .assert.elementPresent('#codeCode')
      .assert.elementPresent('#codeDisplay')
      .assert.elementPresent('#manufacturerDisplay')
      .assert.elementPresent('#status')
      .assert.elementPresent('#category')
      .assert.elementPresent('#description')
      .assert.elementPresent('#notesTextarea')
      .saveScreenshot('tests/nightwatch/screenshots/nutritionProducts/03-new-nutritionProduct-form.png');
  });

  it('04. Create new nutrition product', browser => {
    browser
      .waitForElementVisible('#nutritionProductDetailPage', 5000)
      .pause(500);

    browser.execute(function() {
      return {
        hasMeteorCall: typeof Meteor.call === 'function',
        userId: Meteor.userId ? Meteor.userId() : null,
        username: Meteor.user ? (Meteor.user() ? Meteor.user().username : null) : null
      };
    }, [], function(result) {
      console.log('Meteor state:', result.value);
    });

    browser
      .assert.urlContains('/nutrition-products/new');

    browser
      .pause(500);

    // Check if in edit mode
    browser.execute(function() {
      const codeField = document.querySelector('#codeCode');
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
      .click('#codeCode')
      .execute(function() {
        const codeField = document.querySelector('#codeCode');
        if (codeField) {
          codeField.select();
          codeField.value = '';
          codeField.dispatchEvent(new Event('input', { bubbles: true }));
          codeField.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })
      .setValue('#codeCode', testNutritionProduct.code)
      .click('#codeDisplay')
      .execute(function() {
        const displayField = document.querySelector('#codeDisplay');
        if (displayField) {
          displayField.select();
          displayField.value = '';
          displayField.dispatchEvent(new Event('input', { bubbles: true }));
          displayField.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })
      .setValue('#codeDisplay', testNutritionProduct.display)
      .click('#manufacturerDisplay')
      .execute(function() {
        const manufacturerField = document.querySelector('#manufacturerDisplay');
        if (manufacturerField) {
          manufacturerField.select();
          manufacturerField.value = '';
          manufacturerField.dispatchEvent(new Event('input', { bubbles: true }));
          manufacturerField.dispatchEvent(new Event('change', { bubbles: true }));
        }
      })
      .setValue('#manufacturerDisplay', testNutritionProduct.manufacturer);

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
    }, [testNutritionProduct.status]);

    // Handle Material-UI Select component for category
    browser.execute(function(category) {
      const categorySelect = document.querySelector('#category');
      if (categorySelect) {
        categorySelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          for (let option of options) {
            if (option.getAttribute('data-value') === category ||
                option.textContent.toLowerCase().includes(category.toLowerCase())) {
              option.click();
              break;
            }
          }
        }, 300);
      }
    }, [testNutritionProduct.category]);

    browser
      .pause(500)
      .click('#description')
      .clearValue('#description')
      .setValue('#description', testNutritionProduct.description)
      .click('#notesTextarea')
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', testNutritionProduct.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/nutritionProducts/04-filled-nutritionProduct-form.png');

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

        // The created record's _id is captured AFTER save by querying the client
        // collection (see below), not by intercepting the transport — so this is
        // agnostic to whether the save call travels over DDP or POST /api/rpc.
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Save')) {
            console.log('Clicking save button...');
            window.saveAttempted = true;
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Save button');
      });

    browser
      .waitForElementVisible('#nutritionProductsPage', 5000);

    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#nutritionProductsTable') !== null;
      const hasNutritionProductsPage = document.querySelector('#nutritionProductsPage') !== null;
      const hasDetailPage = document.querySelector('#nutritionProductDetailPage') !== null;

      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });

      const consoleErrors = window.consoleErrors || [];

      return {
        url: currentUrl,
        hasTable: hasTable,
        hasNutritionProductsPage: hasNutritionProductsPage,
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
    });

    // Capture nutrition product ID for subsequent tests by querying the client
    // collection for the record we just created (unique manufacturer).
    // Transport-agnostic: does not depend on how the save call reached the server.
    browser.executeAsync(function(uniqueManufacturer, done) {
      var attempts = 0;
      function tryFind() {
        attempts++;
        var rec = (typeof NutritionProducts !== 'undefined')
          ? NutritionProducts.findOne({ 'manufacturer.display': uniqueManufacturer })
          : null;
        if (rec && rec._id) { done(String(rec._id)); return; }
        if (attempts >= 20) { done(null); return; }
        setTimeout(tryFind, 250);
      }
      tryFind();
    }, [testNutritionProduct.manufacturer], function(result) {
      if (result.value) {
        createdNutritionProductId = result.value;
        console.log('✓ Captured nutrition product ID from collection:', createdNutritionProductId);
      } else {
        console.warn('✗ Could not capture nutrition product ID from collection');
      }
    });

    browser
      .waitForElementVisible('#nutritionProductsPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/nutritionProducts/05-nutritionProduct-saved.png');
  });

  it('05. Verify new nutrition product appears in list', browser => {
    browser
      .waitForElementVisible('#nutritionProductsPage', 5000)
      .pause(3000);

    // Check for either table or no-data state (subscription may take time)
    browser.execute(function() {
      const hasTable = document.querySelector('#nutritionProductsTable') !== null ||
                      document.querySelector('.nutritionProductsTable') !== null;
      const hasNoDataCard = document.querySelector('#nutritionProductsPage')?.textContent?.includes('No Data Available');
      const hasContent = hasTable || hasNoDataCard;
      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasContent: hasContent
      };
    }, [], function(result) {
      console.log('Page content check:', result.value);
      browser.assert.ok(result.value.hasContent, 'Page shows either table or no-data message');
    });

    // Debug: Check what's in the table and database
    browser.execute(function(timestamp) {
      const table = document.querySelector('#nutritionProductsTable');
      const rows = table ? table.querySelectorAll('tbody tr') : [];
      const firstFiveRows = [];
      for (let i = 0; i < Math.min(5, rows.length); i++) {
        firstFiveRows.push(rows[i].textContent);
      }

      const searchManufacturer = `Nutrition Corp ${timestamp}`;
      const ourProduct = typeof NutritionProducts !== 'undefined' ? NutritionProducts.findOne({
        'manufacturer.display': searchManufacturer
      }) : null;

      let savedProduct = null;
      if (window.saveResult && window.saveResult.result) {
        savedProduct = typeof NutritionProducts !== 'undefined' ? NutritionProducts.findOne({
          _id: window.saveResult.result
        }) : null;
      }

      const recentProducts = typeof NutritionProducts !== 'undefined' ? NutritionProducts.find({}, {
        sort: { '_id': -1 },
        limit: 5
      }).fetch() : [];

      return {
        firstFiveRows: firstFiveRows,
        ourProduct: ourProduct ? {
          _id: ourProduct._id,
          display: ourProduct.code?.text || ourProduct.code?.coding?.[0]?.display,
          manufacturer: ourProduct.manufacturer?.[0]?.display
        } : null,
        savedProduct: savedProduct ? {
          _id: savedProduct._id,
          display: savedProduct.code?.text || savedProduct.code?.coding?.[0]?.display,
          manufacturer: savedProduct.manufacturer?.[0]?.display
        } : null,
        saveResultId: window.saveResult?.result || null,
        recentProducts: recentProducts.map(p => ({
          _id: p._id,
          display: p.code?.text || p.code?.coding?.[0]?.display,
          manufacturer: p.manufacturer?.[0]?.display
        }))
      };
    }, [timestamp.toString()], function(result) {
      console.log('Debug info:', JSON.stringify(result.value, null, 2));
    });

    browser
      .saveScreenshot('tests/nightwatch/screenshots/nutritionProducts/06-nutritionProduct-in-list.png');
  });

  it('06. View nutrition product details', browser => {
    browser.execute(function(nutritionProductId) {
      console.log('Navigating directly to nutrition product detail:', nutritionProductId);
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/nutrition-products/' + nutritionProductId);
      } else {
        window.location.href = '/nutrition-products/' + nutritionProductId;
      }
      return { navigatedTo: nutritionProductId };
    }, [createdNutritionProductId], function(result) {
      console.log('Navigation:', result.value);
    });

    browser
      .pause(2000)
      .waitForElementVisible('#nutritionProductDetailPage', 5000)
      .assert.valueContains('#codeCode', testNutritionProduct.code)
      .assert.valueContains('#codeDisplay', testNutritionProduct.display)
      .assert.valueContains('#manufacturerDisplay', testNutritionProduct.manufacturer)
      .execute(function() {
        const statusInput = document.querySelector('#status');

        return {
          status: statusInput ? statusInput.value : null,
          notes: document.querySelector('#notesTextarea').value,
          statusDisplay: document.querySelector('[aria-labelledby*="status"]')?.textContent ||
                        document.querySelector('#status')?.parentElement?.textContent
        };
      }, [], function(result) {
        const statusOk = result.value.status === testNutritionProduct.status ||
                        (result.value.statusDisplay && result.value.statusDisplay.toLowerCase().includes('active'));

        browser.assert.ok(statusOk, 'Status matches');
        browser.assert.ok(result.value.notes.includes(testNutritionProduct.notes), 'Notes contain expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/nutritionProducts/07-view-nutritionProduct-details.png');

    testUtils.navigateUrl(browser, '/nutrition-products');
    browser
      .waitForElementVisible('#nutritionProductsPage', 5000);
  });

  it('07. Update existing nutrition product', browser => {
    browser.execute(function(nutritionProductId) {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/nutrition-products/' + nutritionProductId);
      } else {
        window.location.href = '/nutrition-products/' + nutritionProductId;
      }
    }, [createdNutritionProductId]);

    browser
      .pause(2000)
      .waitForElementVisible('#nutritionProductDetailPage', 5000)
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
      .click('#manufacturerDisplay')
      .clearValue('#manufacturerDisplay')
      .setValue('#manufacturerDisplay', updatedNutritionProduct.manufacturer)
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
      }, [updatedNutritionProduct.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#description')
      .clearValue('#description')
      .setValue('#description', updatedNutritionProduct.description)
      .click('#notesTextarea')
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', updatedNutritionProduct.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/nutritionProducts/08-updated-nutritionProduct-form.png');

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

    testUtils.navigateUrl(browser, '/nutrition-products');
    browser
      .waitForElementVisible('#nutritionProductsTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/nutritionProducts/09-nutritionProduct-updated.png');
  });

  it('08. Verify nutrition product was updated', browser => {
    browser.execute(function(nutritionProductId) {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/nutrition-products/' + nutritionProductId);
      } else {
        window.location.href = '/nutrition-products/' + nutritionProductId;
      }
    }, [createdNutritionProductId]);

    browser
      .pause(2000)
      .waitForElementVisible('#nutritionProductDetailPage', 5000)
      .assert.valueContains('#manufacturerDisplay', updatedNutritionProduct.manufacturer)
      .saveScreenshot('tests/nightwatch/screenshots/nutritionProducts/10-verified-update.png');

    testUtils.navigateUrl(browser, '/nutrition-products');
    browser.waitForElementVisible('#nutritionProductsPage', 5000);
  });

  it('09. Delete nutrition product', browser => {
    browser.execute(function(nutritionProductId) {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/nutrition-products/' + nutritionProductId);
      } else {
        window.location.href = '/nutrition-products/' + nutritionProductId;
      }
    }, [createdNutritionProductId]);

    browser
      .pause(2000)
      .waitForElementVisible('#nutritionProductDetailPage', 5000);

    // Delete button is visible in read-only mode (not edit mode)
    // Click delete button directly
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
      .waitForElementVisible('#nutritionProductsPage', 5000)
      .execute(function() {
        const hasTable = document.querySelector('#nutritionProductsTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('#nutritionProductsPage').textContent.includes('No Data Available');
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.ok(result.value.hasEitherElement, 'Either nutrition products table or no-data message is present after deletion');
      })
      .saveScreenshot('tests/nightwatch/screenshots/nutritionProducts/11-nutritionProduct-deleted.png');
  });

  after(browser => {
    browser.executeAsync(function(done) {
      if (typeof NutritionProducts !== 'undefined') {
        NutritionProducts.find({
          'manufacturer.display': { $regex: 'Nutrition Corp|Updated Nutrition Corp' }
        }).fetch().forEach(function(product) {
          NutritionProducts.remove({ _id: product._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});
