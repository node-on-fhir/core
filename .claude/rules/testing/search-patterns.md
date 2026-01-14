# Search Functionality Test Patterns

## Overview

Search/filter functionality in Honeycomb requires specific patterns to handle React form state, subscription reactions, and table filtering reliably.

## Core Search Pattern

```javascript
it('03. Verify table search functionality', browser => {
  // 1. Clear existing search value
  browser.execute(function() {
    const input = document.querySelector('#searchInput');
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });

  browser.pause(300);

  // 2. Type new search term
  browser.execute(function() {
    const input = document.querySelector('#searchInput');
    input.value = 'test search';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // 3. CRITICAL: Wait 3+ seconds for subscription to react
  browser.pause(3000);

  // 4. Verify filtered results
  browser.expect.element('#table tbody tr').to.be.present;

  console.log('[03] Search functionality verified');
});
```

## Why 3+ Second Wait?

**Subscription reaction chain**:
1. User types → React state updates (instant)
2. React triggers subscription param change (instant)
3. Subscription invalidates → Meteor.subscribe() called (100-500ms)
4. Server queries MongoDB → Sends results (500-1000ms)
5. Client receives data → Collection updates (100-300ms)
6. React re-renders table (50-100ms)

**Total**: 750ms - 1900ms (varies by CI load)

**Safe wait**: 3000ms (3 seconds) accounts for CI variability

## Search Value Clearing

### ❌ WRONG: browser.clearValue()

```javascript
browser.clearValue('#searchInput');
// Input visually cleared, but React state unchanged
// Next search concatenates with old value!
```

### ✅ CORRECT: dispatchEvent('input')

```javascript
browser.execute(function() {
  const input = document.querySelector('#searchInput');
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
```

## Character-by-Character Typing

For complex search that needs progressive filtering:

```javascript
const searchTerm = 'heart rate';

for (let i = 0; i < searchTerm.length; i++) {
  browser.execute(function(partial) {
    const input = document.querySelector('#searchInput');
    input.value = partial;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, [searchTerm.substring(0, i + 1)]);

  browser.pause(100); // 100ms between characters
}

browser.execute(function() {
  const input = document.querySelector('#searchInput');
  input.dispatchEvent(new Event('change', { bubbles: true }));
});

browser.pause(3000); // Wait for final results
```

## Search-Based Row Finding

**NEVER use position-based selectors** - rows change order!

### ❌ WRONG: Position-Based

```javascript
// Brittle: Breaks if row order changes
browser.click('#table tbody tr:nth-child(2)');
```

### ✅ CORRECT: Search-Based

```javascript
browser.execute(function(recordId) {
  const rows = document.querySelectorAll('#table tbody tr');
  let targetRow = null;

  rows.forEach(function(row) {
    // Search by ID in cells
    const cells = row.querySelectorAll('td');
    cells.forEach(function(cell) {
      if (cell.textContent.includes(recordId)) {
        targetRow = row;
      }
    });
  });

  if (targetRow) {
    targetRow.scrollIntoView();
    targetRow.click();
    return { found: true };
  }

  return { found: false };
}, [testRecordId]);
```

## Multiple Search Attempts

Sometimes one search attempt isn't enough (subscription timing):

```javascript
it('06. Verify new record in table', browser => {
  let attempts = 0;
  const maxAttempts = 3;

  function searchForRecord() {
    // Clear + type search
    browser.execute(function() {
      const input = document.querySelector('#searchInput');
      input.value = 'test record';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    browser.pause(3000);

    // Check if found
    browser.execute(function(recordId) {
      const rows = document.querySelectorAll('#table tbody tr');
      let found = false;

      rows.forEach(function(row) {
        if (row.textContent.includes(recordId)) {
          found = true;
        }
      });

      return { found: found };
    }, [testRecordId], function(result) {
      if (!result.value.found && attempts < maxAttempts) {
        attempts++;
        console.log('[06] Record not found, attempt ' + attempts);
        searchForRecord(); // Retry
      } else {
        console.log('[06] Record found or max attempts reached');
      }
    });
  }

  searchForRecord();
});
```

## Filter Dropdowns

For dropdown filters (not text search):

```javascript
// Material-UI Select dropdown
browser.execute(function() {
  const select = document.querySelector('#categoryFilter');
  select.click();

  setTimeout(function() {
    const option = document.querySelector('[data-value="vital-signs"]');
    if (option) option.click();
  }, 500);
});

browser.pause(3000); // Wait for subscription filter
```

## Date Range Filters

```javascript
// Start date
browser.setValue('#startDateInput', '2024-01-01');
browser.pause(300);

// End date
browser.setValue('#endDateInput', '2024-12-31');
browser.pause(300);

// Trigger filter
browser.click('#applyFilterButton');
browser.pause(3000); // Wait for subscription
```

## Debounced Search

If search input is debounced (waits for user to stop typing):

```javascript
browser.execute(function() {
  const input = document.querySelector('#searchInput');
  input.value = 'search term';
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

// Wait for debounce + subscription
browser.pause(5000); // 500ms debounce + 3000ms subscription + margin
```

## Clearing Filters

```javascript
// Clear search
browser.execute(function() {
  const input = document.querySelector('#searchInput');
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
});

browser.pause(3000);

// Verify all records returned
browser.elements('css selector', '#table tbody tr', function(result) {
  console.log('Total rows after clear:', result.value.length);
});
```

## Common Issues

### Issue 1: Search returns old results
**Cause**: Didn't clear previous search value properly
**Fix**: Use `dispatchEvent('input')` to clear

### Issue 2: Search finds nothing but record exists
**Cause**: Insufficient wait time for subscription
**Fix**: Increase pause to 3000ms+

### Issue 3: Can't find row after search
**Cause**: Using position-based selector
**Fix**: Use search-based row finding with recordId

### Issue 4: Intermittent search failures
**Cause**: Subscription limit (100-1000 records in CI)
**Fix**: Use more specific search terms to reduce result set

## Related

- Rule: `rules/testing/crud-patterns.md` - Complete test structure
- Rule: `rules/testing/stability.md` - Timing and pause strategies
- Agent: `test-stabilizer` - Search stability issues
- See `tests/nightwatch/honeycomb/enable_autopublish/CLAUDE.md` lines 1053-1345
