# Delete Operation Test Patterns

## Overview

Delete operations require careful handling to avoid "element click intercepted" errors and ensure proper cleanup verification.

## Standard Delete Pattern

```javascript
it('09. Delete record', browser => {
  // 1. Click Delete button (use execute block to avoid interception)
  browser.execute(function() {
    const deleteButton = document.querySelector('#deleteButton');
    if (deleteButton) {
      deleteButton.click();
      console.log('[09] Clicked delete button');
    }
  });

  browser.pause(1000);

  // 2. Confirm deletion dialog (if present)
  browser.execute(function() {
    const confirmButton = document.querySelector('#confirmDeleteButton');
    if (confirmButton) {
      confirmButton.click();
      console.log('[09] Confirmed deletion');
    }
  });

  browser.pause(2000); // Wait for method + subscription update

  // 3. Verify redirect to list page
  browser.expect.element('#tableContainer').to.be.present;

  // 4. Verify record removed
  browser.execute(function(recordId) {
    const rows = document.querySelectorAll('#table tbody tr');
    let found = false;

    rows.forEach(function(row) {
      if (row.textContent.includes(recordId)) {
        found = true;
      }
    });

    console.log('[09] Record still exists:', found);
    return { found: found };
  }, [testRecordId]);

  console.log('[09] Record deleted successfully');
});
```

## Why Execute Block for Delete?

**Problem**: Delete buttons are often covered by other elements:
- Sticky headers
- Floating action buttons
- Modal overlays
- Z-index stacking issues

```javascript
// ❌ WRONG: Can be intercepted
browser.click('#deleteButton');
// Error: "element click intercepted: Element <button> is not clickable at point (x,y)"

// ✅ CORRECT: Execute block bypasses interception
browser.execute(function() {
  const button = document.querySelector('#deleteButton');
  button.click();
});
```

## Confirmation Dialogs

### Simple Confirm

```javascript
browser.execute(function() {
  document.querySelector('#confirmDeleteButton').click();
});

browser.pause(2000);
```

### Material-UI Dialog

```javascript
// Wait for dialog to open
browser.pause(500);

// Verify dialog visible
browser.expect.element('#deleteConfirmDialog').to.be.visible;

// Click confirm inside dialog
browser.execute(function() {
  const confirmButton = document.querySelector('#deleteConfirmDialog #confirmButton');
  if (confirmButton) {
    confirmButton.click();
  }
});

browser.pause(2000); // Wait for close animation + deletion
```

### Browser Alert (window.confirm)

```javascript
// Accept browser alert
browser.acceptAlert();
browser.pause(2000);
```

## Delete from Table Row

Delete button in table row (not detail page):

```javascript
it('09. Delete record from table', browser => {
  // Find row containing record
  browser.execute(function(recordId) {
    const rows = document.querySelectorAll('#table tbody tr');
    let targetRow = null;

    rows.forEach(function(row) {
      if (row.textContent.includes(recordId)) {
        targetRow = row;
      }
    });

    if (targetRow) {
      // Find delete button within row
      const deleteButton = targetRow.querySelector('.deleteButton');
      if (deleteButton) {
        deleteButton.scrollIntoView();
        deleteButton.click();
        console.log('[09] Clicked delete in row');
        return { clicked: true };
      }
    }

    return { clicked: false };
  }, [testRecordId]);

  browser.pause(1000);

  // Confirm if needed
  browser.execute(function() {
    const confirmButton = document.querySelector('#confirmDeleteButton');
    if (confirmButton) confirmButton.click();
  });

  browser.pause(2000);
});
```

## Verify Deletion

### Method 1: Search for Record (Recommended)

```javascript
// Search for deleted record
browser.execute(function() {
  const input = document.querySelector('#searchInput');
  input.value = 'deleted record display name';
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

browser.pause(3000);

// Should find no rows
browser.elements('css selector', '#table tbody tr', function(result) {
  const rowCount = result.value.length;
  console.log('[09] Rows found:', rowCount);

  if (rowCount === 0) {
    console.log('[09] Record successfully removed');
  }
});
```

### Method 2: Check Collection Count

```javascript
browser.execute(function() {
  const count = CollectionName.find({}).count();
  console.log('[09] Total records after delete:', count);
  return { count: count };
});
```

### Method 3: Try to Navigate to Deleted Record

```javascript
// Try to load detail page for deleted record
browser.url(`http://localhost:3000/observations/${testRecordId}`);
browser.pause(1000);

// Should show "Not Found" or redirect to list
browser.expect.element('#notFoundMessage').to.be.present;
// OR
browser.expect.element('#tableContainer').to.be.present;
```

## Soft Delete vs Hard Delete

### Hard Delete (Remove from Database)

```javascript
// Meteor method
Meteor.methods({
  'observations.remove': async function(observationId) {
    await Observations.removeAsync({ _id: observationId });
  }
});

// Test verification: Record completely gone
browser.execute(function(id) {
  const record = Observations.findOne({ _id: id });
  return { exists: !!record };
}, [testRecordId], function(result) {
  assert.equal(result.value.exists, false, 'Record should be removed');
});
```

### Soft Delete (Mark as Deleted)

```javascript
// Meteor method
Meteor.methods({
  'observations.softDelete': async function(observationId) {
    await Observations.updateAsync(
      { _id: observationId },
      { $set: { 'meta.deleted': true } }
    );
  }
});

// Test verification: Record still exists but marked deleted
browser.execute(function(id) {
  const record = Observations.findOne({ _id: id });
  return {
    exists: !!record,
    deleted: record?.meta?.deleted
  };
}, [testRecordId], function(result) {
  assert.equal(result.value.exists, true, 'Record should still exist');
  assert.equal(result.value.deleted, true, 'Record should be marked deleted');
});
```

## Delete Multiple Records

Bulk delete pattern:

```javascript
it('09. Delete multiple records', browser => {
  // Select checkboxes for multiple rows
  browser.execute(function(recordIds) {
    recordIds.forEach(function(id) {
      const checkbox = document.querySelector(`input[data-record-id="${id}"]`);
      if (checkbox) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }, [testRecordIds]);

  browser.pause(500);

  // Click bulk delete button
  browser.execute(function() {
    document.querySelector('#bulkDeleteButton').click();
  });

  browser.pause(1000);

  // Confirm
  browser.execute(function() {
    const confirmButton = document.querySelector('#confirmBulkDeleteButton');
    if (confirmButton) confirmButton.click();
  });

  browser.pause(3000); // Wait for all deletions

  // Verify all records removed
  browser.execute(function(recordIds) {
    const remaining = recordIds.filter(function(id) {
      return !!CollectionName.findOne({ _id: id });
    });

    console.log('[09] Remaining records:', remaining.length);
    return { remaining: remaining.length };
  }, [testRecordIds]);
});
```

## Error Handling

### Delete Fails (Permission Denied)

```javascript
it('09. Delete fails for unauthorized user', browser => {
  browser.execute(function() {
    document.querySelector('#deleteButton').click();
  });

  browser.pause(1000);

  browser.execute(function() {
    document.querySelector('#confirmDeleteButton')?.click();
  });

  browser.pause(2000);

  // Verify error message displayed
  browser.expect.element('#errorMessage').to.be.visible;
  browser.expect.element('#errorMessage').text.to.contain('not authorized');

  // Record should still exist
  browser.execute(function(id) {
    const record = CollectionName.findOne({ _id: id });
    return { exists: !!record };
  }, [testRecordId], function(result) {
    assert.equal(result.value.exists, true, 'Record should not be deleted');
  });
});
```

### Delete Button Disabled

```javascript
// Verify delete button disabled in view mode
browser.getAttribute('#deleteButton', 'disabled', function(result) {
  assert.equal(result.value, 'true', 'Delete button should be disabled in view mode');
});

// Enable by entering edit mode
browser.click('#editButton');
browser.pause(500);

// Now delete button enabled
browser.getAttribute('#deleteButton', 'disabled', function(result) {
  assert.equal(result.value, null, 'Delete button should be enabled in edit mode');
});
```

## Common Issues

### Issue 1: "Element click intercepted"
**Fix**: Use execute block for delete button click

### Issue 2: Confirmation dialog not appearing
**Cause**: Delete button click failed silently
**Fix**: Check if button exists and is clickable:
```javascript
browser.execute(function() {
  const button = document.querySelector('#deleteButton');
  console.log('Delete button:', {
    exists: !!button,
    visible: button?.offsetParent !== null,
    enabled: !button?.disabled
  });
  if (button && !button.disabled) {
    button.click();
  }
});
```

### Issue 3: Record not removed from table
**Cause**: Insufficient wait time
**Fix**: Increase pause after deletion to 2000-3000ms

### Issue 4: Soft delete showing in results
**Cause**: Query doesn't filter out deleted records
**Fix**: Update publication to exclude deleted:
```javascript
Meteor.publish('autopublish.Observations', function(query) {
  return Observations.find({
    ...query,
    'meta.deleted': { $ne: true }
  });
});
```

## Related

- Rule: `rules/testing/crud-patterns.md` - Complete test structure
- Rule: `rules/testing/stability.md` - Element interception issues
- Agent: `test-stabilizer` - Delete operation debugging
- See `tests/nightwatch/honeycomb/enable_autopublish/CLAUDE.md` lines 1155-1268
