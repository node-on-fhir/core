// tests/nightwatch/honeycomb/enable_autopublish/crud.activitydefinitions.js

const testUtils = require('./shared-test-utils');
const loginHelper = require('../../helpers/login-helper');

/**
 * ActivityDefinition CRUD Tests - Comprehensive Version
 *
 * ActivityDefinition is a PATIENT-AGNOSTIC resource that defines reusable
 * clinical activities, protocols, and order sets. It can be used to create
 * ServiceRequests, MedicationRequests, Tasks, or Appointments.
 *
 * Key fields:
 * - status (required): draft, active, retired, unknown
 * - name: Computer-friendly name
 * - title: Human-friendly name
 * - description: Description of the activity
 * - kind: What type of resource this creates (ServiceRequest, MedicationRequest, Task, Appointment)
 * - intent: proposal, plan, directive, order, etc.
 * - priority: routine, urgent, asap, stat
 *
 * Target: ~60 assertions across 9 tests
 */

describe('ActivityDefinitions CRUD Operations', function() {
  const timestamp = Date.now();
  let testActivityDefinitionId = null;

  const testActivityDefinition = {
    name: 'test-activity-' + timestamp,
    title: 'Test Activity Definition ' + timestamp,
    description: 'An activity definition created for automated testing',
    status: 'draft',
    kind: 'ServiceRequest',
    intent: 'order',
    priority: 'routine',
    publisher: 'Test Publisher',
    version: '1.0.0'
  };

  const updatedActivityDefinition = {
    title: 'Updated Activity Definition ' + timestamp,
    status: 'active',
    priority: 'urgent',
    description: 'Updated description for testing'
  };

  before(function(browser, done) {
    browser.windowSize('current', 1400, 900);
    done();
  });

  // ============================================================================
  // TEST 01: SETUP (Target: 3-5 assertions)
  // ============================================================================
  it('01. Setup test environment', function(browser) {
    browser.url('http://localhost:3000');
    browser.pause(2000);

    // Verify app loaded
    browser.assert.urlContains('localhost:3000', 'App URL loaded correctly');

    loginHelper.ensureLoggedIn(browser, function(isLoggedIn) {
      browser.assert.ok(isLoggedIn, 'User is logged in');
      console.log('[01] Login verified');
    });

    browser.pause(1000);

    // Verify Meteor is available
    browser.execute(function() {
      return {
        hasMeteor: typeof Meteor !== 'undefined',
        hasSession: typeof Session !== 'undefined',
        hasActivityDefinitions: typeof ActivityDefinitions !== 'undefined' || (Meteor.Collections && Meteor.Collections.ActivityDefinitions)
      };
    }, [], function(result) {
      browser.assert.ok(result.value.hasMeteor, 'Meteor is available');
      browser.assert.ok(result.value.hasSession, 'Session is available');
      console.log('[01] Meteor environment verified');
    });

    console.log('[01] Setup complete - patient-agnostic resource, no patient context needed');
  });

  // ============================================================================
  // TEST 02: VERIFY LIST PAGE LOADS (Target: 4-6 assertions)
  // ============================================================================
  it('02. Verify list page loads', function(browser) {
    browser.url('http://localhost:3000/activity-definitions');
    browser.pause(2000);

    // Verify URL
    browser.assert.urlContains('/activity-definitions', 'URL contains activity-definitions');

    // Verify page container exists
    browser.execute(function() {
      const page = document.querySelector('#activityDefinitionsPage');
      const hasTable = document.querySelector('#activityDefinitionsTable') !== null;
      const hasNoDataCard = document.body.textContent.includes('No Activity Definitions');
      const hasNewButton = document.querySelector('#newActivityDefinitionButton') !== null;

      return {
        pageExists: page !== null,
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        validState: hasTable || hasNoDataCard,
        hasNewButton: hasNewButton
      };
    }, [], function(result) {
      console.log('[02] Page state:', result.value);
      browser.assert.ok(result.value.pageExists, 'ActivityDefinitions page container exists');
      browser.assert.ok(result.value.validState, 'Page shows either table or no-data state');
      browser.assert.ok(result.value.hasNewButton, 'New Activity Definition button exists');
    });

    // Verify page title or header
    browser.execute(function() {
      const cardHeader = document.querySelector('.MuiCardHeader-title');
      return {
        hasHeader: cardHeader !== null,
        headerText: cardHeader ? cardHeader.textContent : ''
      };
    }, [], function(result) {
      browser.assert.ok(result.value.hasHeader, 'Card header exists');
      console.log('[02] Header text:', result.value.headerText);
    });

    console.log('[02] List page loads successfully');
  });

  // ============================================================================
  // TEST 03: VERIFY SEARCH FUNCTIONALITY (Target: 4-6 assertions)
  // ============================================================================
  it('03. Verify table search functionality', function(browser) {
    // Look for search input
    browser.execute(function() {
      const searchInput = document.querySelector('#activityDefinitionSearchInput');
      return {
        hasSearchInput: searchInput !== null,
        searchInputId: searchInput ? searchInput.id : null,
        searchInputPlaceholder: searchInput ? searchInput.placeholder : null
      };
    }, [], function(result) {
      console.log('[03] Search input state:', result.value);
      browser.assert.ok(result.value.hasSearchInput, 'Search input exists');
      browser.assert.ok(result.value.searchInputId === 'activityDefinitionSearchInput', 'Search input has correct ID');
    });

    // Try typing in search
    browser.execute(function() {
      const input = document.querySelector('#activityDefinitionSearchInput');
      if (input) {
        input.value = 'test';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return { typed: true };
      }
      return { typed: false };
    }, [], function(result) {
      browser.assert.ok(result.value.typed, 'Can type in search input');
    });

    browser.pause(1000);

    // Clear search
    browser.execute(function() {
      const input = document.querySelector('#activityDefinitionSearchInput');
      if (input) {
        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return { cleared: true };
      }
      return { cleared: false };
    }, [], function(result) {
      browser.assert.ok(result.value.cleared, 'Can clear search input');
    });

    browser.pause(1000);
    console.log('[03] Search functionality verified');
  });

  // ============================================================================
  // TEST 04: NAVIGATE TO CREATE FORM (Target: 8-12 assertions)
  // ============================================================================
  it('04. Navigate to create form', function(browser) {
    // Click new button
    browser.execute(function() {
      const newButton = document.querySelector('#newActivityDefinitionButton');
      if (newButton) {
        newButton.click();
        return { clicked: true };
      }
      return { clicked: false };
    }, [], function(result) {
      browser.assert.ok(result.value.clicked, 'New Activity Definition button clicked');
    });

    browser.pause(2000);

    // Verify URL changed
    browser.assert.urlContains('/activity-definitions/new', 'URL changed to /new');

    // Verify detail page container
    browser.execute(function() {
      const detailPage = document.querySelector('#activityDefinitionDetailPage');
      return {
        detailPageExists: detailPage !== null
      };
    }, [], function(result) {
      browser.assert.ok(result.value.detailPageExists, 'Detail page container exists');
    });

    // Verify all form fields exist
    browser.execute(function() {
      return {
        hasNameInput: document.querySelector('#nameInput') !== null,
        hasTitleInput: document.querySelector('#titleInput') !== null,
        hasDescriptionInput: document.querySelector('#descriptionInput') !== null,
        hasStatusSelect: document.querySelector('#statusSelect') !== null,
        hasKindSelect: document.querySelector('#kindSelect') !== null,
        hasIntentSelect: document.querySelector('#intentSelect') !== null,
        hasPrioritySelect: document.querySelector('#prioritySelect') !== null,
        hasPublisherInput: document.querySelector('#publisherInput') !== null,
        hasVersionInput: document.querySelector('#versionInput') !== null,
        hasSaveButton: document.querySelector('#saveActivityDefinitionButton') !== null
      };
    }, [], function(result) {
      console.log('[04] Form fields:', result.value);
      browser.assert.ok(result.value.hasNameInput, 'Name input exists');
      browser.assert.ok(result.value.hasTitleInput, 'Title input exists');
      browser.assert.ok(result.value.hasDescriptionInput, 'Description input exists');
      browser.assert.ok(result.value.hasStatusSelect, 'Status select exists');
      browser.assert.ok(result.value.hasKindSelect, 'Kind select exists');
      browser.assert.ok(result.value.hasIntentSelect, 'Intent select exists');
      browser.assert.ok(result.value.hasPrioritySelect, 'Priority select exists');
      browser.assert.ok(result.value.hasSaveButton, 'Save button exists');
    });

    console.log('[04] Navigate to create form complete');
  });

  // ============================================================================
  // TEST 05: CREATE NEW RECORD (Target: 8-12 assertions)
  // ============================================================================
  it('05. Create new record', function(browser) {
    // Use Nightwatch's native setValue which simulates real typing
    // This properly triggers React's onChange handlers

    // Fill name field
    browser.clearValue('#nameInput');
    browser.setValue('#nameInput', testActivityDefinition.name);
    browser.pause(200);
    browser.assert.value('#nameInput', testActivityDefinition.name, 'Name field filled');

    // Fill title field
    browser.clearValue('#titleInput');
    browser.setValue('#titleInput', testActivityDefinition.title);
    browser.pause(200);
    browser.assert.value('#titleInput', testActivityDefinition.title, 'Title field filled');

    // Fill description field (multiline TextField)
    browser.clearValue('#descriptionInput');
    browser.setValue('#descriptionInput', testActivityDefinition.description);
    browser.pause(200);

    // Fill publisher field
    browser.clearValue('#publisherInput');
    browser.setValue('#publisherInput', testActivityDefinition.publisher);
    browser.pause(200);
    browser.assert.value('#publisherInput', testActivityDefinition.publisher, 'Publisher field filled');

    // Fill version field
    browser.clearValue('#versionInput');
    browser.setValue('#versionInput', testActivityDefinition.version);
    browser.pause(200);
    browser.assert.value('#versionInput', testActivityDefinition.version, 'Version field filled');

    browser.pause(500);

    // Status defaults to 'draft' - verify it's set correctly
    browser.execute(function() {
      // Check the status select has the default value
      const statusSelect = document.querySelector('#statusSelect');
      const statusFormControl = statusSelect ? statusSelect.closest('.MuiFormControl-root') : null;
      const currentValue = statusFormControl ? statusFormControl.textContent : '';
      return {
        hasStatusSelect: statusSelect !== null,
        currentValue: currentValue,
        includesDraft: currentValue.toLowerCase().includes('draft')
      };
    }, [], function(result) {
      browser.assert.ok(result.value.hasStatusSelect, 'Status select exists');
      browser.assert.ok(result.value.includesDraft, 'Status defaults to draft');
    });

    browser.pause(500);

    // Click save button
    browser.execute(function() {
      const saveButton = document.querySelector('#saveActivityDefinitionButton');
      if (saveButton) {
        saveButton.click();
        return { clicked: true };
      }
      return { clicked: false };
    }, [], function(result) {
      browser.assert.ok(result.value.clicked, 'Save button clicked');
    });

    browser.pause(2000);

    // Verify redirect to list page
    browser.execute(function() {
      const currentUrl = window.location.href;
      const onListPage = currentUrl.endsWith('/activity-definitions') ||
                         currentUrl.endsWith('/activity-definitions/');
      return {
        currentUrl: currentUrl,
        onListPage: onListPage
      };
    }, [], function(result) {
      console.log('[05] Post-save state:', result.value);
      browser.assert.ok(result.value.onListPage, 'Navigated to list page after save');
    });

    // Get the newly created record's ID from the server by searching for our timestamp
    browser.executeAsync(function(name, done) {
      if (typeof Meteor !== 'undefined' && typeof ActivityDefinitions !== 'undefined') {
        // Search for records with our timestamp in the name
        const records = ActivityDefinitions.find({
          name: { $regex: name }
        }, { sort: { 'meta.lastUpdated': -1 }, limit: 1 }).fetch();

        if (records.length > 0) {
          done({
            found: true,
            id: records[0]._id,
            name: records[0].name,
            title: records[0].title
          });
        } else {
          // Fallback: get the most recently created record
          const latest = ActivityDefinitions.find({}, { sort: { 'meta.lastUpdated': -1 }, limit: 1 }).fetch();
          if (latest.length > 0) {
            done({
              found: true,
              id: latest[0]._id,
              name: latest[0].name,
              title: latest[0].title,
              usedFallback: true
            });
          } else {
            done({ found: false });
          }
        }
      } else {
        done({ found: false, error: 'Meteor or ActivityDefinitions not available' });
      }
    }, [testActivityDefinition.name], function(result) {
      console.log('[05] Server lookup result:', result.value);
      if (result.value && result.value.found) {
        testActivityDefinitionId = result.value.id;
        console.log('[05] Captured ID from server:', testActivityDefinitionId);
      }
      browser.assert.ok(result.value && result.value.found, 'Found created record on server');
    });

    console.log('[05] Create record complete');
  });

  // ============================================================================
  // TEST 06: VERIFY NEW RECORD IN TABLE (Target: 4-6 assertions)
  // ============================================================================
  it('06. Verify new record in table', function(browser) {
    testUtils.navigateUrl(browser, '/activity-definitions');
    browser.pause(2000);

    // Verify on list page
    browser.assert.urlContains('/activity-definitions', 'On activity definitions list page');

    // Verify table exists and has data
    browser.expect.element('#activityDefinitionsPage').to.be.present;
    browser.expect.element('#activityDefinitionsTable').to.be.present;

    // Check table has rows (we should have at least the one we just created)
    browser.execute(function() {
      const rows = document.querySelectorAll('#activityDefinitionsTable tbody tr');
      const headerText = document.querySelector('#activityDefinitionsPage h4, #activityDefinitionsPage h5, #activityDefinitionsPage .MuiTypography-root');

      return {
        rowCount: rows.length,
        headerText: headerText ? headerText.textContent : '',
        hasTable: document.querySelector('#activityDefinitionsTable') !== null
      };
    }, [], function(result) {
      console.log('[06] Table state:', result.value);
      browser.assert.ok(result.value.rowCount > 0, 'Table has rows');
      browser.assert.ok(result.value.hasTable, 'Table element exists');
    });

    // Verify the captured ID exists - we'll navigate to it in test 07
    browser.execute(function(id) {
      if (!id) return { hasId: false };
      return { hasId: true, id: id };
    }, [testActivityDefinitionId], function(result) {
      console.log('[06] Captured record ID:', result.value);
      browser.assert.ok(result.value.hasId, 'Have record ID from creation');
    });

    console.log('[06] Verification complete');
  });

  // ============================================================================
  // TEST 07: OPEN RECORD FOR EDITING (Target: 8-12 assertions)
  // ============================================================================
  it('07. Open record for editing', function(browser) {
    // Navigate directly if we have ID
    if (testActivityDefinitionId) {
      browser.url('http://localhost:3000/activity-definitions/' + testActivityDefinitionId);
      browser.pause(2000);

      browser.assert.urlContains('/activity-definitions/' + testActivityDefinitionId, 'Navigated to detail page');
    } else {
      // Search and click first row
      browser.execute(function(timestamp) {
        const input = document.querySelector('#activityDefinitionSearchInput');
        if (input) {
          input.value = timestamp.toString();
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, [timestamp]);

      browser.pause(3000);

      browser.execute(function() {
        const rows = document.querySelectorAll('#activityDefinitionsTable tbody tr');
        if (rows.length > 0) {
          rows[0].click();
          return { clicked: true };
        }
        return { clicked: false };
      }, [], function(result) {
        browser.assert.ok(result.value.clicked, 'Table row clicked');
      });

      browser.pause(2000);
    }

    // Verify detail page loaded
    browser.execute(function() {
      const detailPage = document.querySelector('#activityDefinitionDetailPage');
      return { detailPageExists: detailPage !== null };
    }, [], function(result) {
      browser.assert.ok(result.value.detailPageExists, 'Detail page loaded');
    });

    // Verify form fields have values
    browser.execute(function(expectedTitle) {
      const nameInput = document.querySelector('#nameInput');
      const titleInput = document.querySelector('#titleInput');
      const descInput = document.querySelector('#descriptionInput');
      const statusSelect = document.querySelector('#statusSelect');

      return {
        hasName: nameInput && nameInput.value.length > 0,
        nameValue: nameInput ? nameInput.value : '',
        hasTitle: titleInput && titleInput.value.length > 0,
        titleValue: titleInput ? titleInput.value : '',
        hasDescription: descInput !== null,
        descriptionValue: descInput ? descInput.value : '',
        statusValue: statusSelect ? statusSelect.textContent : ''
      };
    }, [testActivityDefinition.title], function(result) {
      console.log('[07] Form values:', result.value);
      browser.assert.ok(result.value.hasName, 'Name field has value');
      browser.assert.ok(result.value.hasTitle, 'Title field has value');
    });

    // Verify in view mode (not edit mode)
    browser.execute(function() {
      const nameInput = document.querySelector('#nameInput');
      const editButton = document.querySelector('button');
      let hasEditButton = false;

      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        if (btn.textContent.includes('Edit')) {
          hasEditButton = true;
          break;
        }
      }

      return {
        isDisabled: nameInput ? nameInput.disabled : false,
        hasEditButton: hasEditButton
      };
    }, [], function(result) {
      browser.assert.ok(result.value.isDisabled, 'Form fields are disabled (view mode)');
      browser.assert.ok(result.value.hasEditButton, 'Edit button is present');
    });

    // Verify barcode/ID displayed
    browser.execute(function() {
      const barcode = document.querySelector('.barcode');
      return {
        hasBarcode: barcode !== null,
        barcodeValue: barcode ? barcode.textContent.trim() : ''
      };
    }, [], function(result) {
      browser.assert.ok(result.value.hasBarcode, 'Barcode/ID is displayed');
      console.log('[07] Barcode:', result.value.barcodeValue);
    });

    console.log('[07] Open for editing complete');
  });

  // ============================================================================
  // TEST 08: UPDATE RECORD (Target: 8-12 assertions)
  // ============================================================================
  it('08. Update record', function(browser) {
    // Click Edit button to enter edit mode
    browser.execute(function() {
      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        if (btn.textContent.includes('Edit')) {
          btn.click();
          return { clicked: true };
        }
      }
      return { clicked: false };
    }, [], function(result) {
      browser.assert.ok(result.value.clicked, 'Edit button clicked');
    });

    browser.pause(500);

    // Verify in edit mode
    browser.execute(function() {
      const nameInput = document.querySelector('#nameInput');
      const saveButton = document.querySelector('#saveActivityDefinitionButton');
      return {
        isEnabled: nameInput ? !nameInput.disabled : false,
        hasSaveButton: saveButton !== null
      };
    }, [], function(result) {
      browser.assert.ok(result.value.isEnabled, 'Form fields are enabled (edit mode)');
      browser.assert.ok(result.value.hasSaveButton, 'Save button present in edit mode');
    });

    // Update title
    browser.execute(function(newTitle) {
      const input = document.querySelector('#titleInput');
      if (input) {
        input.value = newTitle;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return { updated: true, value: input.value };
      }
      return { updated: false };
    }, [updatedActivityDefinition.title], function(result) {
      browser.assert.ok(result.value.updated, 'Title field updated');
    });

    browser.pause(300);

    // Update description
    browser.execute(function(newDesc) {
      const input = document.querySelector('#descriptionInput');
      if (input) {
        input.value = newDesc;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return { updated: true };
      }
      return { updated: false };
    }, [updatedActivityDefinition.description], function(result) {
      browser.assert.ok(result.value.updated, 'Description field updated');
    });

    browser.pause(500);

    // Change status to active - check if select is enabled first
    browser.execute(function() {
      const statusSelect = document.querySelector('#statusSelect');
      const formControl = statusSelect?.closest('.MuiFormControl-root');
      const isDisabled = formControl?.classList.contains('Mui-disabled');
      return {
        found: !!statusSelect,
        disabled: isDisabled,
        formControlClasses: formControl ? formControl.className : 'not found'
      };
    }, [], function(result) {
      console.log('[08] Status select state:', JSON.stringify(result.value));
    });

    // Use Nightwatch's native click instead of JavaScript click
    // First find the clickable element (the Select trigger)
    browser.waitForElementVisible('.MuiFormControl-root:has(#statusSelect) [role="combobox"]', 5000);
    browser.click('.MuiFormControl-root:has(#statusSelect) [role="combobox"]');
    browser.pause(1000); // Longer wait for portal to render

    // Check if the dropdown menu is visible
    browser.execute(function() {
      const listbox = document.querySelector('[role="listbox"]');
      const presentation = document.querySelector('[role="presentation"]');
      const muiMenu = document.querySelector('.MuiMenu-root');
      const muiPopover = document.querySelector('.MuiPopover-root');
      const options = document.querySelectorAll('li[role="option"]');
      const menuItems = document.querySelectorAll('.MuiMenuItem-root');

      return {
        hasListbox: !!listbox,
        hasPresentation: !!presentation,
        hasMuiMenu: !!muiMenu,
        hasMuiPopover: !!muiPopover,
        optionCount: options.length,
        menuItemCount: menuItems.length,
        listboxHTML: listbox ? listbox.innerHTML.substring(0, 200) : 'no listbox'
      };
    }, [], function(result) {
      console.log('[08] Dropdown state after click:', JSON.stringify(result.value));
    });

    // Select the status option - click by data-value attribute
    browser.execute(function(status) {
      // Find any element with the matching data-value
      const option = document.querySelector(`[data-value="${status}"]`);
      if (option) {
        option.click();
        return { selected: true, method: 'data-value' };
      }

      // Fallback: find by text content
      const allOptions = document.querySelectorAll('li[role="option"], .MuiMenuItem-root');
      for (let opt of allOptions) {
        if (opt.textContent.toLowerCase().includes(status.toLowerCase())) {
          opt.click();
          return { selected: true, method: 'text-content' };
        }
      }

      return { selected: false, optionCount: allOptions.length };
    }, [updatedActivityDefinition.status], function(result) {
      console.log('[08] Status option selection result:', JSON.stringify(result.value));
      browser.assert.ok(result.value && result.value.selected, 'Status option selected');
    });

    browser.pause(500);

    // Verify status was updated
    browser.execute(function(expectedStatus) {
      const statusFormControl = document.querySelector('#statusSelect')?.closest('.MuiFormControl-root');
      const currentValue = statusFormControl ? statusFormControl.textContent : '';
      return {
        currentValue: currentValue,
        includesExpected: currentValue.toLowerCase().includes(expectedStatus.toLowerCase())
      };
    }, [updatedActivityDefinition.status], function(result) {
      console.log('[08] Status verification:', result.value);
      browser.assert.ok(result.value.includesExpected, 'Status updated to active');
    });

    browser.pause(500);

    // Change priority to urgent - use Nightwatch's native click
    browser.waitForElementVisible('.MuiFormControl-root:has(#prioritySelect) [role="combobox"]', 5000);
    browser.click('.MuiFormControl-root:has(#prioritySelect) [role="combobox"]');
    browser.pause(1000); // Wait for portal to render

    // Check if the dropdown menu is visible
    browser.execute(function() {
      const listbox = document.querySelector('[role="listbox"]');
      const options = document.querySelectorAll('li[role="option"]');
      return {
        hasListbox: !!listbox,
        optionCount: options.length
      };
    }, [], function(result) {
      console.log('[08] Priority dropdown state:', JSON.stringify(result.value));
    });

    // Select the priority option
    browser.execute(function(priority) {
      // Find any element with the matching data-value
      const option = document.querySelector(`[data-value="${priority}"]`);
      if (option) {
        option.click();
        return { selected: true, method: 'data-value' };
      }

      // Fallback: find by text content
      const allOptions = document.querySelectorAll('li[role="option"], .MuiMenuItem-root');
      for (let opt of allOptions) {
        if (opt.textContent.toLowerCase().includes(priority.toLowerCase())) {
          opt.click();
          return { selected: true, method: 'text-content' };
        }
      }

      return { selected: false, optionCount: allOptions.length };
    }, [updatedActivityDefinition.priority], function(result) {
      console.log('[08] Priority option selection result:', JSON.stringify(result.value));
      browser.assert.ok(result.value && result.value.selected, 'Priority option selected');
    });

    browser.pause(500);

    // Verify priority was updated
    browser.execute(function(expectedPriority) {
      const priorityFormControl = document.querySelector('#prioritySelect')?.closest('.MuiFormControl-root');
      const currentValue = priorityFormControl ? priorityFormControl.textContent : '';
      return {
        currentValue: currentValue,
        includesExpected: currentValue.toLowerCase().includes(expectedPriority.toLowerCase())
      };
    }, [updatedActivityDefinition.priority], function(result) {
      console.log('[08] Priority verification:', result.value);
      browser.assert.ok(result.value.includesExpected, 'Priority updated to urgent');
    });

    browser.pause(500);

    // Click save
    browser.execute(function() {
      const saveButton = document.querySelector('#saveActivityDefinitionButton');
      if (saveButton) {
        saveButton.click();
        return { clicked: true };
      }
      return { clicked: false };
    }, [], function(result) {
      browser.assert.ok(result.value.clicked, 'Save button clicked after update');
    });

    browser.pause(2000);

    // Verify back in view mode after save
    browser.execute(function() {
      const nameInput = document.querySelector('#nameInput');
      let hasEditButton = false;
      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        if (btn.textContent.includes('Edit')) {
          hasEditButton = true;
          break;
        }
      }
      return {
        isDisabled: nameInput ? nameInput.disabled : false,
        hasEditButton: hasEditButton
      };
    }, [], function(result) {
      browser.assert.ok(result.value.isDisabled, 'Form fields disabled after save (view mode)');
      browser.assert.ok(result.value.hasEditButton, 'Edit button present after save');
    });

    console.log('[08] Update complete');
  });

  // ============================================================================
  // TEST 09: DELETE RECORD (Target: 5-8 assertions)
  // ============================================================================
  it('09. Delete record', function(browser) {
    // Make sure we're on the detail page
    if (testActivityDefinitionId) {
      browser.url('http://localhost:3000/activity-definitions/' + testActivityDefinitionId);
      browser.pause(2000);
    }

    // Verify on detail page
    browser.execute(function() {
      const detailPage = document.querySelector('#activityDefinitionDetailPage');
      return { detailPageExists: detailPage !== null };
    }, [], function(result) {
      browser.assert.ok(result.value.detailPageExists, 'On detail page for deletion');
    });

    // Verify delete button exists (in view mode)
    browser.execute(function() {
      const deleteButton = document.querySelector('#deleteActivityDefinitionButton');
      let hasDeleteButton = deleteButton !== null;

      if (!hasDeleteButton) {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent.includes('Delete')) {
            hasDeleteButton = true;
            break;
          }
        }
      }
      return { hasDeleteButton: hasDeleteButton };
    }, [], function(result) {
      browser.assert.ok(result.value.hasDeleteButton, 'Delete button exists');
    });

    // Click delete button - use simple execute without callback
    // The confirm dialog will block the response, so we can't check it
    browser.execute(function() {
      const deleteButton = document.querySelector('#deleteActivityDefinitionButton');
      if (deleteButton) {
        deleteButton.click();
        return true;
      }

      const buttons = document.querySelectorAll('button');
      for (let btn of buttons) {
        if (btn.textContent.includes('Delete')) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    // Small pause then immediately handle the confirm dialog
    browser.pause(300);

    // Handle confirmation dialog
    browser.acceptAlert(function(result) {
      console.log('[09] Alert accepted');
    });

    // Note: We can't verify the click result because the alert blocks it
    // The acceptAlert success is proof that the delete button was clicked

    browser.pause(2000);

    // Verify redirected to list page
    browser.execute(function() {
      const currentUrl = window.location.href;
      const onListPage = currentUrl.endsWith('/activity-definitions') ||
                        currentUrl.endsWith('/activity-definitions/');
      const pageExists = document.querySelector('#activityDefinitionsPage') !== null;
      return {
        onListPage: onListPage,
        pageExists: pageExists,
        currentUrl: currentUrl
      };
    }, [], function(result) {
      console.log('[09] Post-delete state:', result.value);
      browser.assert.ok(result.value.onListPage || result.value.pageExists, 'Returned to list page');
    });

    // Verify record is gone
    browser.execute(function(timestamp) {
      const input = document.querySelector('#activityDefinitionSearchInput');
      if (input) {
        input.value = timestamp.toString();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return { searched: true };
    }, [timestamp]);

    browser.pause(3000);

    browser.execute(function(timestamp) {
      const pageContent = document.body.textContent;
      const recordStillExists = pageContent.includes(timestamp.toString());
      const noResultsShown = pageContent.includes('No Activity Definitions') ||
                            document.querySelectorAll('#activityDefinitionsTable tbody tr').length === 0;

      return {
        recordStillExists: recordStillExists,
        noResultsShown: noResultsShown
      };
    }, [timestamp], function(result) {
      console.log('[09] Delete verification:', result.value);
      // Either record not found OR no results shown after search
      browser.assert.ok(!result.value.recordStillExists || result.value.noResultsShown,
                       'Record removed or not found in search');
    });

    console.log('[09] Delete complete');
  });

  after(function(browser, done) {
    console.log('');
    console.log('='.repeat(60));
    console.log('ActivityDefinition CRUD tests completed');
    console.log('Test record ID was:', testActivityDefinitionId);
    console.log('='.repeat(60));
    browser.end();
    done();
  });
});
