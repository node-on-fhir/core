# Plan: Fix PatientSubscriptionManager Tranche Chain

## Context

Procedures don't show on `/patient-chart` or `/timeline-vertical` unless a direct `Meteor.subscribe` is added as a workaround (currently in AutoDashboard.jsx:418). The root cause is the tranche chain in PatientSubscriptionManager breaking before it reaches Tranche 2 (where Procedures lives).

The tranche system, the `selectedPatient.Procedures` publication, and the tracker activation all exist and are wired correctly. The bug is in `subscribeTranche()` itself — the chain silently dies.

## Bugs Identified

### Bug 1: No `onError` callback on `Meteor.subscribe` (line 122)

If a publication errors (server exception, DDP error, or publication not found for a collection), the subscription handle stays permanently not-ready. Without an `onError` callback, the error is silently swallowed. The `handles.every(h => h.handle.ready())` check never returns true, stalling the tranche for the full 10s timeout — or worse, if the timeout also has issues.

### Bug 2: Orphaned `readyComputation` autoruns (not tracked in `clearSubscriptions`)

When `clearSubscriptions()` is called (patient change), it stops subscription handles and clears timeouts — but the `readyComputation` Tracker.autorun computations from each tranche are NOT stopped. These orphaned computations can potentially fire later and call `subscribeTranche` with a stale patientId.

### Bug 3: `Array.every()` short-circuits reactive dependency tracking (line 145)

```javascript
const allReady = handles.every(function(h) { return h.handle.ready(); });
```

`every()` stops calling `.ready()` at the first `false`. So the Tracker autorun only registers a dependency on the first not-ready handle. This means the autorun needs to re-fire N times (once per handle) instead of once. Not a breaking bug on its own, but combined with Bug 1 (stuck handles), it amplifies the problem.

## Changes

### File 1: `imports/client/subscriptions/PatientSubscriptionManager.js`

#### Fix 1: Track readyComputations for cleanup

Add `this.pendingComputations = []` to constructor. Store each `readyComputation` in it. Stop them all in `clearSubscriptions()`.

#### Fix 2: Add `onError` callback to `Meteor.subscribe`

When a subscription errors, log the error and mark the handle as "failed" so it doesn't block the chain. Track failed handles separately so `every()` can skip them.

#### Fix 3: Replace `every()` short-circuit with a loop

Use a manual loop that calls `.ready()` on ALL handles every time, ensuring all reactive dependencies are registered on every autorun run.

#### Fix 4: Better diagnostic logging

Log which specific handles are ready/not-ready on each autorun tick, so the chain behavior is observable in the console.

### File 2: `imports/patient/AutoDashboard.jsx`

Remove the direct `Meteor.subscribe('selectedPatient.Procedures', ...)` workaround (lines 414-421). Revert to the same query-only pattern used by all other resources in AutoDashboard.

## Detailed Code Changes

### PatientSubscriptionManager.js — constructor

```javascript
constructor() {
  this.subscriptions = new Map();
  this.currentPatientId = null;
  this.pendingTimeouts = [];
  this.pendingComputations = [];  // NEW: track autoruns for cleanup
  this.failedSubscriptions = new Set();  // NEW: track errored subs
}
```

### PatientSubscriptionManager.js — subscribeTranche (subscribe call)

```javascript
tranche.resources.forEach((resourceName) => {
  const publicationName = `selectedPatient.${resourceName}`;

  const handle = Meteor.subscribe(publicationName, patientId, {
    limit: 1000
  }, {
    onError: (error) => {
      console.error(`PatientSubscriptionManager: Subscription error for ${resourceName}:`, error.message || error);
      this.failedSubscriptions.add(resourceName);
    }
  });

  this.subscriptions.set(resourceName, handle);
  handles.push({ handle, resourceName });
});
```

### PatientSubscriptionManager.js — subscribeTranche (readiness check)

Replace `handles.every()` with a loop that always checks all handles and skips failed ones:

```javascript
const readyComputation = Tracker.autorun(function(comp) {
  // Check ALL handles every time (no short-circuit) to register all reactive deps
  let allReady = true;
  for (let i = 0; i < handles.length; i++) {
    const isReady = handles[i].handle.ready() || this.failedSubscriptions.has(handles[i].resourceName);
    if (!isReady) {
      allReady = false;
      // Don't break — keep calling .ready() on remaining handles to register deps
    }
  }

  if (allReady) {
    Meteor.clearTimeout(timeout);
    comp.stop();
    const failed = handles.filter(h => this.failedSubscriptions.has(h.resourceName)).map(h => h.resourceName);
    if (failed.length > 0) {
      console.warn(`PatientSubscriptionManager: Tranche "${tranche.name}" ready (${failed.length} failed: ${failed.join(', ')})`);
    } else {
      console.log(`PatientSubscriptionManager: Tranche "${tranche.name}" fully ready`);
    }
    this.subscribeTranche(patientId, trancheIndex + 1);
  }
}.bind(this));

this.pendingComputations.push(readyComputation);
```

### PatientSubscriptionManager.js — clearSubscriptions

```javascript
clearSubscriptions() {
  console.log('PatientSubscriptionManager: Clearing existing subscriptions');

  // Clear all pending timeouts
  this.pendingTimeouts.forEach(function(t) { Meteor.clearTimeout(t); });
  this.pendingTimeouts = [];

  // Stop all readyComputation autoruns
  this.pendingComputations.forEach(function(comp) {
    try { comp.stop(); } catch (e) { /* already stopped */ }
  });
  this.pendingComputations = [];

  // Stop all subscription handles
  this.subscriptions.forEach(function(handle, resourceName) {
    try {
      handle.stop();
    } catch (error) {
      console.error(`PatientSubscriptionManager: Error stopping ${resourceName}:`, error);
    }
  });

  this.subscriptions.clear();
  this.failedSubscriptions.clear();
  this.currentPatientId = null;
}
```

### AutoDashboard.jsx — Remove workaround (lines 414-421)

Revert Procedures useTracker to match other resources (query only, no direct subscribe):

```javascript
if(Procedures){
    data.procedures = useTracker(function(){
        return Procedures.find(FhirUtilities.addPatientFilterToQuery(Session.get('selectedPatientId'))).fetch()
    }, [])
}
```

## Files Modified

| File | Change |
|------|--------|
| `imports/client/subscriptions/PatientSubscriptionManager.js` | Fix tranche chain: error handling, computation cleanup, readiness check |
| `imports/patient/AutoDashboard.jsx` | Remove direct Procedures subscribe workaround |

## Verification

1. Open browser console, navigate to app
2. Select a patient with Procedures
3. Console should show:
   - `PatientSubscriptionManager: Starting tranche "IPS Required"`
   - `PatientSubscriptionManager: Tranche "IPS Required" fully ready`
   - `PatientSubscriptionManager: Starting tranche "IPS Recommended"`
   - `PatientSubscriptionManager: Tranche "IPS Recommended" fully ready`
   - (continues through all 5 tranches)
   - `PatientSubscriptionManager: All tranches complete. N subscriptions active.`
4. Navigate to `/patient-chart` — Procedures should appear without the direct subscribe
5. Navigate to `/timeline-vertical` — Procedures should appear in the timeline
6. `Procedures.find().fetch().length` > 0 in console
7. If any tranche shows "failed" subscriptions, investigate the specific publication
