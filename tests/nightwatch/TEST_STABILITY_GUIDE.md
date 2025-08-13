# Nightwatch Test Stability Guide for CircleCI

This guide documents the stability improvements implemented to fix socket hang up errors and test timeouts in CircleCI.

## Changes Applied

### 1. Nightwatch Configuration (`nightwatch.circle.conf.js`)

#### Increased Timeouts
```javascript
request_timeout_options: {
  timeout: 120000,  // Increased from 60000ms to 120000ms
  retry_attempts: 2  // Reduced from 3 to fail faster
}
```

#### Added Chrome Stability Options
```javascript
'goog:chromeOptions': {
  args: [
    // Existing options...
    '--disable-blink-features=AutomationControlled',  // Improve stability
    '--disable-extensions',  // Reduce memory usage
    '--disable-plugins',     // Reduce memory usage
    '--disable-images',      // Faster loading for tests
    '--disable-default-apps',
    '--disable-translate',
    '--disable-sync',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-first-run',
    '--safebrowsing-disable-auto-update',
    '--password-store=basic',
    '--use-mock-keychain'
  ]
}
```

#### WebDriver Timeout Increase
```javascript
timeout_options: {
  timeout: 120000,  // Increased from 60000ms
  retry_attempts: 2  // Reduced from 3
}
```

### 2. Test Writing Best Practices

#### Use Simple setValue Instead of Complex Execute Blocks
```javascript
// ❌ AVOID - Complex execute blocks with native setters
browser.execute(function() {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  ).set;
  nativeInputValueSetter.call(field, value); // Causes "Illegal invocation"
});

// ✅ PREFERRED - Simple setValue
browser
  .clearValue('#fieldId')
  .setValue('#fieldId', value);
```

#### Add Stability Pauses
```javascript
// Between operations that might race
browser
  .click('#field')
  .pause(300)  // Small pause for UI to update
  .clearValue('#field')
  .pause(300)  // Allow clear to complete
  .setValue('#field', 'value')
  .pause(500); // Allow React to process
```

#### Material-UI Select Handling
```javascript
// Click and wait for dropdown animation
browser
  .click('#status')
  .pause(800)  // Increased pause for dropdown
  .execute(function(value) {
    const options = document.querySelectorAll('li[role="option"]');
    for (let option of options) {
      if (option.getAttribute('data-value') === value || 
          option.textContent.includes(value)) {
        option.click();
        return true;
      }
    }
    return false;
  }, [statusValue]);
```

### 3. CircleCI Configuration

The NODE_OPTIONS environment variable is already set in `.circleci/config.yml`:
```yaml
environment:
  NODE_OPTIONS: --max_old_space_size=4096
```

## Common Issues and Solutions

### Socket Hang Up Errors
**Cause**: ChromeDriver losing connection during long operations
**Solution**: 
- Increased timeouts to 120 seconds
- Added stability pauses between operations
- Reduced retry attempts to fail faster

### Illegal Invocation Errors
**Cause**: Using native property setters incorrectly in execute blocks
**Solution**: Use Nightwatch's built-in setValue method

### Long Test Execution Times
**Cause**: Multiple retries with long timeouts
**Solution**: 
- Reduced retry attempts from 3 to 2
- Added Chrome flags to disable unnecessary features
- Use --disable-images for faster page loads

### Test Failures After Save
**Cause**: Navigation timing issues
**Solution**: 
- Add longer pause after save operations (3000ms)
- Verify navigation with waitForElementVisible
- Check for console errors after operations

## Running Tests with New Configuration

The CircleCI environment automatically uses `nightwatch.circle.conf.js` when tests run in CI.

For local testing with similar settings:
```bash
# Use the CircleCI config locally
./node_modules/.bin/nightwatch --config nightwatch.circle.conf.js tests/nightwatch/honeycomb/enable_autopublish/crud.questionnaireresponses.js
```

## Monitoring Test Stability

1. Check for "socket hang up" errors in logs
2. Monitor test execution times
3. Look for "Illegal invocation" errors
4. Watch for navigation failures after save operations

## Future Improvements

If issues persist:
1. Consider increasing CircleCI resource_class
2. Split long test files into smaller chunks
3. Implement test retry logic at the suite level
4. Add more comprehensive error logging

## Debug Output

The updated tests include better debug output:
- Post-save state logging
- Console error capture
- Navigation verification
- Form state checks

This helps diagnose issues when tests fail in CI.