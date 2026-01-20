# Anti-Pattern: Navigation Methods

## The Problem

Using the wrong navigation method can cause:
- Loss of Session state (patient context, user preferences)
- Unnecessary full page reloads
- Breaking React Router state
- Test failures in CI

## ❌ WRONG Patterns

### In React Components

```javascript
// Causes full page reload, loses React state
window.location.href = '/patients';

// Forces page refresh
window.location = '/observations';

// Bypasses React Router
<a href="/patients">Patients</a>
```

### In Nightwatch Tests

```javascript
// Loses Session state (patient context)
browser.url('http://localhost:3000/observations');

// No Session restoration after navigation
it('02. Verify list page', browser => {
  browser.url('http://localhost:3000/observations');
  // Session.get('selectedPatient') is now null!
});
```

## ✅ CORRECT Patterns

### In React Components

```javascript
// Use React Router's useNavigate hook
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  // Navigate programmatically
  function handleClick() {
    navigate('/patients');
  }

  // Navigate with state
  function handleClickWithState() {
    navigate('/patients/123', { state: { from: 'dashboard' } });
  }

  // Use Link component for navigation
  return (
    <Link to="/patients">Patients</Link>
  );
}
```

### In Nightwatch Tests

**Option A: Use testUtils.navigateUrl() (Recommended)**
```javascript
// Preserves Session state
testUtils.navigateUrl(browser, '/observations');

// Or with full URL
testUtils.navigateUrl(browser, 'http://localhost:3000/observations');
```

**Option B: Restore Session after browser.url()**
```javascript
it('02. Verify list page', browser => {
  browser.url('http://localhost:3000/observations');

  // Restore patient context
  browser.executeAsync(function(patientId, done) {
    Meteor.call('patients.findOne', patientId, function(error, patient) {
      Session.set('selectedPatient', patient);
      Session.set('selectedPatientId', patient.id);
      done({ success: true });
    });
  }, [testPatientId]);

  browser.pause(1000); // Wait for subscription
});
```

## Why This Matters

### React Navigation

**window.location.href**:
- ❌ Full page reload (slow)
- ❌ Loses React component state
- ❌ Loses React Router state
- ❌ Re-initializes entire app
- ❌ Triggers new Meteor subscriptions
- ❌ Poor user experience (flash of white page)

**navigate()** (React Router):
- ✅ Client-side navigation (fast)
- ✅ Preserves React state
- ✅ Maintains subscriptions
- ✅ Smooth transitions
- ✅ Back/forward button support
- ✅ Better user experience

### Test Navigation

**browser.url()**:
- ❌ Clears Session state (full page reload)
- ❌ Loses patient context
- ❌ Requires Session restoration
- ✅ Necessary for initial page load
- ✅ Works for external URLs

**testUtils.navigateUrl()**:
- ✅ Preserves Session state
- ✅ Maintains patient context
- ✅ No restoration needed
- ✅ Faster test execution
- ❌ Only works for internal navigation

## When to Use What

### React Components

| Scenario | Method |
|----------|--------|
| Programmatic navigation | `navigate('/path')` |
| Link in JSX | `<Link to="/path">` |
| Navigate with state | `navigate('/path', { state })` |
| External URL | `window.location.href = 'https://external.com'` |
| Force page reload | `window.location.reload()` (rarely needed) |

### Nightwatch Tests

| Scenario | Method |
|----------|--------|
| Initial page load | `browser.url('http://localhost:3000/')` |
| Navigate within app | `testUtils.navigateUrl(browser, '/observations')` |
| Patient-scoped navigation | `testUtils.navigateUrl()` + Session already set |
| Navigation without patient | `browser.url()` (patient-agnostic resources) |

## Common Mistakes

### Mistake 1: window.location in onClick
```javascript
// ❌ WRONG
<Button onClick={() => window.location.href = '/patients'}>
  Go to Patients
</Button>

// ✅ CORRECT
const navigate = useNavigate();
<Button onClick={() => navigate('/patients')}>
  Go to Patients
</Button>
```

### Mistake 2: Not restoring Session after browser.url()
```javascript
// ❌ WRONG - Patient context lost
it('02. Verify observations page', browser => {
  browser.url('http://localhost:3000/observations');
  browser.expect.element('#observationsTable').to.be.present;
  // Table will be empty!
});

// ✅ CORRECT - Patient context restored
it('02. Verify observations page', browser => {
  testUtils.navigateUrl(browser, '/observations');
  browser.expect.element('#observationsTable').to.be.present;
});
```

### Mistake 3: Using <a> tag instead of <Link>
```javascript
// ❌ WRONG - Forces page reload
<a href="/patients/123">View Patient</a>

// ✅ CORRECT - Client-side navigation
<Link to="/patients/123">View Patient</Link>
```

## Rule Summary

**In React components:**
- Always use `useNavigate()` hook for programmatic navigation
- Always use `<Link>` component for navigation links
- Never use `window.location.href` unless navigating to external URLs

**In Nightwatch tests:**
- Use `testUtils.navigateUrl()` to preserve Session state
- Use `browser.url()` only for initial page load or when Session restoration is explicit
- Always restore patient context if using `browser.url()` for patient-scoped pages

## Detection

Look for these patterns in code:
```javascript
// React components
window.location.href
window.location =
<a href="/

// Nightwatch tests
browser.url() // without Session restoration
```

## Related

- Agent: `.claude/agents/patient-context-debugger.md` - Session state management
- See `tests/nightwatch/testUtils/index.js` for `navigateUrl()` implementation
- See `tests/nightwatch/honeycomb/enable_autopublish/CLAUDE.md` lines 407-527
