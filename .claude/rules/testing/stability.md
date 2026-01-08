# Nightwatch Test Stability Patterns

## Overview

E2E tests in CircleCI require specific patterns to handle timing, resource constraints, and Material-UI/React interactions. These patterns prevent intermittent failures.

## Pause Timing Strategies

### Standard Pause Times

```javascript
// After navigation
browser.url('http://localhost:3000/observations');
browser.pause(1000); // 1 second for page load

// After button clicks
browser.click('#saveButton');
browser.pause(500); // 500ms for UI update

// After form input
browser.setValue('#input', 'value');
browser.pause(300); // 300ms for React state update

// After search/filter (subscription reactions)
browser.execute(function() {
  const input = document.querySelector('#searchInput');
  input.value = 'test';
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
browser.pause(3000); // 3+ seconds for subscription to react

// After Material-UI Select open
browser.execute(function() {
  document.querySelector('#select').click();
});
browser.pause(500); // 500ms for portal to render

// After delete operation
browser.click('#deleteButton');
browser.pause(2000); // 2 seconds for server method + subscription update
```

### CircleCI-Specific Timing

```javascript
// CircleCI is slower than local
const CI_MULTIPLIER = process.env.CI ? 1.5 : 1;

browser.pause(1000 * CI_MULTIPLIER); // 1s local, 1.5s CI
```

## Nightwatch Configuration

### Chrome Stability Options

**`nightwatch.circle.conf.js`** (CircleCI):
```javascript
module.exports = {
  test_settings: {
    default: {
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          args: [
            '--headless',
            '--no-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1920,1080',
            '--disable-extensions',
            '--disable-software-rasterizer'
          ]
        }
      },
      webdriver: {
        start_process: true,
        server_path: require('chromedriver').path
      },
      request_timeout_options: {
        timeout: 120000, // 120s (CircleCI needs more time)
        retry_attempts: 0
      }
    }
  }
};
```

**Key Options**:
- `--no-sandbox`: Required for Docker/CI environments
- `--disable-dev-shm-usage`: Prevents /dev/shm memory issues
- `--disable-blink-features=AutomationControlled`: Hides automation detection
- `--window-size=1920,1080`: Consistent viewport for layout
- `timeout: 120000`: 2-minute timeout (vs 60s default)

### Local Configuration

**`nightwatch.conf.js`** (Local):
```javascript
module.exports = {
  test_settings: {
    default: {
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          args: [
            '--window-size=1920,1080'
          ]
        }
      },
      request_timeout_options: {
        timeout: 60000, // 60s is fine locally
        retry_attempts: 0
      }
    }
  }
};
```

## React Form Handling

### Problem: clearValue() Doesn't Trigger React onChange

```javascript
// ❌ WRONG: Doesn't trigger React state update
browser.clearValue('#searchInput');

// Input is visually cleared, but React state still has old value
// Next search uses old value!
```

### Solution: dispatchEvent('input')

```javascript
// ✅ CORRECT: Trigger React events
browser.execute(function() {
  const input = document.querySelector('#searchInput');

  // Set to empty string
  input.value = '';

  // Trigger React onChange
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
});

browser.pause(300);
```

### Complete Clear + Type Pattern

```javascript
// Clear existing value
browser.execute(function() {
  const input = document.querySelector('#searchInput');
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

browser.pause(300);

// Type new value
browser.execute(function() {
  const input = document.querySelector('#searchInput');
  input.value = 'new search term';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
});

browser.pause(3000); // Wait for search to react
```

## Material-UI Component Testing

### Select Dropdowns (Portal-Based)

**Problem**: Material-UI Select renders options in a portal outside the DOM hierarchy.

```javascript
// ❌ WRONG: Element not found (not in Select component)
browser.click('#statusSelect option[value="final"]');

// ✅ CORRECT: Use execute block with setTimeout
browser.execute(function() {
  const select = document.querySelector('#statusSelect');
  select.click(); // Open dropdown

  setTimeout(function() {
    // Options now rendered in portal
    const option = document.querySelector('[data-value="final"]');
    if (option) {
      option.click();
    }
  }, 500); // Wait for portal render
});

browser.pause(1000); // Wait for selection to apply
```

### TextField with InputAdornment

```javascript
// If TextField has InputAdornment, selector must target input inside
browser.setValue('#textFieldId input', 'value'); // Note the 'input' suffix

// Or use execute block
browser.execute(function() {
  const input = document.querySelector('#textFieldId input');
  input.value = 'value';
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
```

### Modal/Dialog Timing

```javascript
// Open dialog
browser.click('#openDialogButton');
browser.pause(500); // Wait for dialog animation

// Interact with dialog
browser.expect.element('#dialogContent').to.be.present;
browser.setValue('#dialogInput', 'value');

// Close dialog
browser.click('#dialogCloseButton');
browser.pause(500); // Wait for dialog to close
```

## Element Click Interception

### Problem: "Element click intercepted" Error

Occurs when element is covered by another element (overlay, modal, sticky header).

```javascript
// ❌ WRONG: Direct click can be intercepted
browser.click('#deleteButton');

// ✅ CORRECT: Click inside execute block
browser.execute(function() {
  const button = document.querySelector('#deleteButton');
  if (button) {
    button.click();
  }
});

browser.pause(1000);
```

### scrollIntoView Pattern

```javascript
// Ensure element is visible before clicking
browser.execute(function() {
  const element = document.querySelector('#targetElement');
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

browser.pause(500); // Wait for scroll

browser.click('#targetElement');
```

## Search-Based Test Patterns

### Character-by-Character Typing (For Search)

```javascript
// Type search term character by character (simulates real typing)
const searchTerm = 'test';

for (let i = 0; i < searchTerm.length; i++) {
  browser.execute(function(partialTerm) {
    const input = document.querySelector('#searchInput');
    input.value = partialTerm;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, [searchTerm.substring(0, i + 1)]);

  browser.pause(100); // 100ms between characters
}

// Final change event
browser.execute(function() {
  const input = document.querySelector('#searchInput');
  input.dispatchEvent(new Event('change', { bubbles: true }));
});

browser.pause(3000); // Wait for search results
```

### Wait for Search Filtering

```javascript
// After setting search value, wait 3+ seconds for subscription
browser.execute(function() {
  const input = document.querySelector('#searchInput');
  input.value = 'search term';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
});

browser.pause(3000); // CRITICAL: 3+ seconds for subscription reaction

// Now check results
browser.expect.element('#table tbody tr').to.be.present;
```

## Navigation Patterns

### testUtils.navigateUrl() vs browser.url()

```javascript
// ❌ LOSES SESSION: Full page reload
browser.url('http://localhost:3000/observations');
// Session.get('selectedPatient') is now null!

// ✅ PRESERVES SESSION: Client-side navigation
testUtils.navigateUrl(browser, '/observations');
// Session still intact
```

### Restore Session After browser.url()

```javascript
it('02. Verify list page', browser => {
  browser.url('http://localhost:3000/observations');

  // Restore patient context
  browser.executeAsync(function(patientId, done) {
    Meteor.call('patients.findOne', patientId, function(error, patient) {
      if (patient) {
        Session.set('selectedPatient', patient);
        Session.set('selectedPatientId', patient.id);
      }
      done({ success: true });
    });
  }, [testPatientId]);

  browser.pause(1000); // Wait for subscription
});
```

## Socket Hang Up Prevention

### Problem: "Socket hang up" in CircleCI

Occurs when Meteor method or subscription takes too long.

### Solution: Increase Timeouts

```javascript
// nightwatch.circle.conf.js
request_timeout_options: {
  timeout: 120000, // 120s (vs 60s default)
  retry_attempts: 0
}
```

### Solution: Optimize Data Loading

```javascript
// ❌ SLOW: Subscribe to all patients (1000+ records)
Meteor.subscribe('autopublish.Patients', {}, {});

// ✅ FAST: Fetch single patient via method
browser.executeAsync(function(patientId, done) {
  Meteor.call('patients.findOne', patientId, function(error, patient) {
    Session.set('selectedPatient', patient);
    done({ success: true });
  });
}, [testPatientId]);
```

## Retry Strategy

### Fail Fast (Recommended)

```javascript
// Don't retry tests - fix the root cause
request_timeout_options: {
  timeout: 120000,
  retry_attempts: 0 // Fail immediately
}
```

**Why**: Retrying masks underlying issues. Better to fix stability problems than hide them with retries.

### When to Retry

Only retry if external service is genuinely flaky (3rd party API, network issues):

```javascript
request_timeout_options: {
  timeout: 60000,
  retry_attempts: 2 // Max 2 retries
}
```

## Debugging Techniques

### Console Logging in Tests

```javascript
// Log from test
console.log('[03] Searching for:', searchTerm);

// Log from browser context
browser.execute(function() {
  console.log('Patient:', Session.get('selectedPatient'));
  console.log('Records:', Observations.find({}).count());
});

// Check console output in CI logs
```

### Screenshot on Failure

```javascript
// nightwatch.conf.js
module.exports = {
  test_settings: {
    default: {
      screenshots: {
        enabled: true,
        on_failure: true,
        on_error: true,
        path: 'tests/screenshots'
      }
    }
  }
};
```

### Element Inspection

```javascript
// Check if element exists
browser.element('css selector', '#targetElement', function(result) {
  if (result.status === 0) {
    console.log('[DEBUG] Element found');
  } else {
    console.log('[DEBUG] Element NOT found');
  }
});

// Get element attributes
browser.getAttribute('#targetElement', 'class', function(result) {
  console.log('[DEBUG] Classes:', result.value);
});
```

## Common Stability Issues

### Issue 1: Test passes locally, fails in CI
**Cause**: Timing differences (CI is slower)
**Fix**: Increase pauses for CI:
```javascript
browser.pause(process.env.CI ? 2000 : 1000);
```

### Issue 2: "Element not found after 5000ms"
**Cause**: Page not fully loaded
**Fix**: Add longer initial pause or check element visibility:
```javascript
browser.pause(2000); // Longer initial wait
browser.waitForElementVisible('#element', 10000); // Explicit wait
```

### Issue 3: Search returns wrong results
**Cause**: `clearValue()` doesn't trigger React onChange
**Fix**: Use `dispatchEvent('input')`:
```javascript
browser.execute(function() {
  const input = document.querySelector('#searchInput');
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
```

### Issue 4: Delete button click intercepted
**Cause**: Element covered by another element
**Fix**: Click inside execute block:
```javascript
browser.execute(function() {
  document.querySelector('#deleteButton').click();
});
```

### Issue 5: Material-UI Select not working
**Cause**: Options rendered in portal
**Fix**: Use execute block with setTimeout:
```javascript
browser.execute(function() {
  document.querySelector('#select').click();
  setTimeout(function() {
    document.querySelector('[data-value="option"]').click();
  }, 500);
});
```

## Related

- Agent: `test-stabilizer` - Specialized stability debugging
- Agent: `patient-context-debugger` - Session management issues
- Rule: `rules/testing/crud-patterns.md` - Complete test structure
- Rule: `rules/testing/search-patterns.md` - Search-specific patterns
- See `tests/nightwatch/TEST_STABILITY_GUIDE.md` for comprehensive guide
- See `tests/nightwatch/honeycomb/enable_autopublish/CLAUDE.md` for real examples
