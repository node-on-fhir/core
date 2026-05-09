# Settings-Gated Feature Pattern

## Overview

Some features require server-side configuration (private settings, API keys, compliance flags) before they can operate. Unlike simple route-hiding (`settings.public.modules.X.enabled`), a settings-gated feature keeps the route accessible but guards the operation behind a server-side check, showing users a clear explanation when the feature is disabled.

This pattern ensures:
- Private settings never leak to the client
- Users see an actionable message (not a crash or silent failure)
- Action buttons are disabled when the feature is unavailable
- The UI handles the loading state gracefully

## The 3-Layer Pattern

### Layer 1: Server Method Guard

Every server method that performs the gated operation checks the setting and throws a descriptive `Meteor.Error` if disabled.

```javascript
// server/archivePatientMethods.js
'adminTools.archivePatient': async function(patientId) {
  check(patientId, String);

  if (!this.userId) {
    throw new Meteor.Error('not-authorized');
  }

  // Check feature flag
  const allowArchival = get(Meteor, 'settings.private.allowPatientArchival', false);
  if (!allowArchival) {
    throw new Meteor.Error('feature-disabled',
      'Patient archival is disabled. Set Meteor.settings.private.allowPatientArchival to true.');
  }

  // ... proceed with operation
}
```

**Key details**:
- Use `get(Meteor, 'settings.private.X', false)` — default to `false` (disabled) when absent
- Error name should be `'feature-disabled'` for consistency
- Error message should name the exact settings path

### Layer 2: Dedicated Check Method

A lightweight method the client calls on mount to determine whether the feature is enabled, without attempting the actual operation.

```javascript
// server/methods.js
'adminTools.checkArchivalSetting': async function() {
  const allowArchival = get(Meteor, 'settings.private.allowPatientArchival', false);
  console.log('[adminTools.checkArchivalSetting] allowPatientArchival:', allowArchival);
  return { allowPatientArchival: allowArchival };
}
```

**Why a separate method?**
- The client needs to know the feature state *before* the user clicks anything
- Calling the actual operation just to check would be wasteful and could have side effects
- This method can return multiple flags if the feature has sub-settings

### Layer 3: Client Component

The component calls the check method on mount, stores a tri-state value, and renders an Alert when the feature is disabled.

```javascript
// client/ArchivePatientPage.jsx
import { useState, useEffect } from 'react';
import { Alert, AlertTitle, Button } from '@mui/material';
import { get } from 'lodash';

function ArchivePatientPage() {
  // Tri-state: null = loading, true = enabled, false = disabled
  const [archivalEnabled, setArchivalEnabled] = useState(null);

  // On mount, check if archival is enabled via server settings
  useEffect(function() {
    Meteor.call('adminTools.checkArchivalSetting', function(error, result) {
      if (error) {
        console.warn('[ArchivePatientPage] Error checking archival setting:', error.reason);
        setArchivalEnabled(false);
      } else {
        setArchivalEnabled(get(result, 'allowPatientArchival', false));
      }
    });
  }, []);

  return (
    <Container maxWidth="lg">
      {/* Disabled warning */}
      {archivalEnabled === false && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Patient Archival Disabled</AlertTitle>
          Patient archival is not enabled. Contact your administrator to enable
          it in the server settings (Meteor.settings.private.allowPatientArchival).
        </Alert>
      )}

      {/* Action button — disabled when feature is off */}
      <Button
        variant="contained"
        color="error"
        disabled={archivalEnabled === false}
        onClick={handleArchive}
      >
        Archive Patient
      </Button>
    </Container>
  );
}
```

## Tri-State Loading Pattern

The `null` → `true`/`false` pattern prevents UI flicker:

| State | Meaning | UI |
|-------|---------|-----|
| `null` | Check in progress | Show loading or neutral state |
| `true` | Feature enabled | Show full UI, buttons enabled |
| `false` | Feature disabled | Show Alert, buttons disabled |

```javascript
// Do NOT default to true (would flash enabled UI then switch to disabled)
const [featureEnabled, setFeatureEnabled] = useState(null);

// Do NOT default to false (would flash disabled Alert then switch to enabled)
const [featureEnabled, setFeatureEnabled] = useState(false); // ❌
```

## Wrong Patterns

### Server-only guard with no proactive client check

```javascript
// ❌ WRONG: User clicks Archive, waits, then sees error
function ArchivePatientPage() {
  async function handleArchive() {
    try {
      await Meteor.callAsync('adminTools.archivePatient', patientId);
    } catch (error) {
      // User only finds out the feature is disabled AFTER clicking
      alert(error.reason);
    }
  }

  return <Button onClick={handleArchive}>Archive Patient</Button>;
}
```

The user shouldn't have to click a button to discover the feature is off.

### Reading private settings on the client

```javascript
// ❌ WRONG: Private settings are never available on the client
const allowed = get(Meteor, 'settings.private.allowPatientArchival', false);
// This always returns false — private settings don't exist client-side
```

### Boolean state without loading

```javascript
// ❌ WRONG: No loading state — flashes disabled Alert before check completes
const [enabled, setEnabled] = useState(false);
```

## Route-Hiding vs Settings-Gated Feature

| Aspect | Route-Hiding | Settings-Gated Feature |
|--------|-------------|----------------------|
| **Setting location** | `settings.public.modules.X.enabled` | `settings.private.X` |
| **Visibility** | Route/sidebar hidden entirely | Route accessible, operation guarded |
| **Client access** | Client reads public setting directly | Client calls server method to check |
| **User experience** | Feature invisible when off | Feature visible with explanation |
| **Use case** | Optional modules, UI sections | Destructive ops, compliance gates |
| **Example** | Hide "Observations" sidebar item | Guard patient archival |

## When to Use This Pattern

- **Destructive operations**: Patient archival, data purge, account deletion
- **External service dependencies**: Features requiring API keys (maps, AI, fax)
- **Compliance-sensitive operations**: Features that must be explicitly opted into
- **Licensed features**: Capabilities gated by deployment tier or contract

## Alert Message Guidelines

Write Alert messages that are actionable:

```javascript
// ✅ GOOD: States what's disabled, who to contact, exact setting path
<Alert severity="error">
  <AlertTitle>Patient Archival Disabled</AlertTitle>
  Patient archival is not enabled. Contact your administrator to enable it
  in the server settings (Meteor.settings.private.allowPatientArchival).
</Alert>

// ❌ BAD: Vague, no remediation path
<Alert severity="error">
  This feature is currently unavailable.
</Alert>
```

Include:
1. **AlertTitle** — Name the disabled feature
2. **What's disabled** — One sentence explaining the state
3. **Who to contact** — "Contact your administrator" (or similar)
4. **Settings path** — The exact `Meteor.settings` key to change

## Settings File Configuration

Add the flag to your settings JSON:

```json
{
  "private": {
    "allowPatientArchival": true
  }
}
```

Default to `false` when absent — features should be opt-in, not opt-out.

## Related

- Reference implementation: `packages/admin-tools/client/ArchivePatientPage.jsx`
- Server guard: `packages/admin-tools/server/archivePatientMethods.js`
- Check method: `packages/admin-tools/server/methods.js`
- Route-hiding pattern: Check `get(Meteor, 'settings.public.modules.X.enabled', true)` in sidebar/routes
- Meteor v3 async: `.claude/rules/meteor/v3-async.md`
- Anti-pattern (secrets in source): See `CLAUDE.md` secrets section
