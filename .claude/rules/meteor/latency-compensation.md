# Latency Compensation & the RPC Write Path

## The empirical fact this rule rests on

Meteor's latency compensation (optimistic UI) only exists for methods that have
a **client-side stub** — a `Meteor.methods({...})` definition loaded in the
browser bundle, which Meteor simulates against minimongo before the server
round-trip.

**Honeycomb has zero client-side stubs** (verified 2026-07-22: the only
client-reachable `Meteor.methods` call is inside `imports/lib/ServerMethods.js`,
gated behind `if (Meteor.isServer)`). Every business method has always been a
server-only definition. Therefore:

- `Meteor.callAsync` from the browser was **always** a plain round-trip RPC —
  it just rode DDP instead of HTTP.
- The JSON-RPC migration (`Meteor.rpc` → `POST /api/rpc`) **lost no optimistic
  behavior**. There was none.
- Switching a call site "back to `Meteor.call()` for latency compensation" is
  a pure loss: same round-trip wait, minus DevTools/network observability,
  minus curl reproducibility. **Don't do it.**

## ❌ WRONG: transport choice as a UX fix

```javascript
// ❌ WRONG — no client stub exists, so this waits for the server exactly
// like Meteor.rpc does; you just can't see it in DevTools anymore.
await Meteor.callAsync('medications.update', id, data);
```

The widget a component uses (AceEditor, forms, tables) is **not** the decision
axis. The interaction pattern is.

## Decision table

| Interaction pattern | Example | Pattern |
|---|---|---|
| Explicit action: save/submit/delete button, editor save (AceEditor, Monaco), import, export | `MedicationDetail` save, `/import-data` LOAD DATA | **A** — `Meteor.rpc` + loading state |
| Read/fetch on mount or navigation | detail-page GET fallback | **A** — `Meteor.rpc` (+ subscription) |
| Rapid-fire, collection-rendered micro-interactions where waiting feels broken | checkbox toggle in a list, drag-reorder, tap counter, bed assign/release | **B** — local optimistic state + `Meteor.rpc` |
| Genuine minimongo simulation required (rare; none exist today) | — | **C** — hand-written client stub + `Meteor.callAsync` |

## Pattern A (default): `Meteor.rpc` + loading state

Explicit actions should *look* like actions. A disabled button + spinner for
the round-trip is correct UX — users expect a save to take a beat. This is the
existing norm across the codebase; editors are the *least* affected components
because typing is pure local state and only the save crosses the network.

```javascript
async function handleSave() {
  setLoading(true);
  try {
    await Meteor.rpc('medications.update', { medicationId: id, medicationData: medication });
    setIsEditing(false);
  } catch (err) {
    setError(err.reason || err.message);
  } finally {
    setLoading(false);
  }
}
```

## Pattern B: local optimistic state + `Meteor.rpc` + rollback

For micro-interactions rendered from component state (or derived from a
subscription), update the UI immediately, fire the RPC, and roll back on
failure. Transport-agnostic, no Meteor magic, testable.

```javascript
async function handleToggle(item) {
  const previous = item.status;
  setItems(function(current) {            // 1. optimistic local update
    return current.map(function(i) {
      return i._id === item._id ? { ...i, status: previous === 'active' ? 'inactive' : 'active' } : i;
    });
  });
  try {
    await Meteor.rpc('items.setStatus', { itemId: item._id, status: previous === 'active' ? 'inactive' : 'active' });
    // subscription delivers the authoritative record and reconciles
  } catch (err) {
    setItems(function(current) {          // 2. rollback on failure
      return current.map(function(i) {
        return i._id === item._id ? { ...i, status: previous } : i;
      });
    });
    setError(err.reason || 'Update failed');
  }
}
```

Note the reconciliation is free when the list renders from a subscription:
the server write flows back through the publication and minimongo replaces
your optimistic guess with the authoritative record.

## Pattern C (sanctioned escape hatch — currently unused): real stubs

If a future interaction genuinely needs Meteor's simulate-and-reconcile
machinery (minimongo simulation with automatic rollback), the mechanism is:

1. Define a **client-side stub** with the same method name, mutating minimongo:
   ```javascript
   // client-only file
   Meteor.methods({
     'items.setStatus': function(itemId, status) {
       Items.update({ _id: itemId }, { $set: { status: status } });  // simulation
     }
   });
   ```
2. Keep that call site on **`Meteor.callAsync`** — `Meteor.rpc` goes over HTTP
   and never runs stubs. (The server side is already served by the
   ServerMethods DDP adapter.)
3. **Document it**: add the method to the list below so future call-site
   migrations (#172-style sweeps) don't move it to `Meteor.rpc` and silently
   kill the stub.

### Stubbed methods registry (keep current)

| Method | Stub location | Why |
|--------|--------------|-----|
| _none_ | — | — |

## Rule summary

- **Default everything to `Meteor.rpc`.** Explicit actions get loading states.
- **Never switch transports as a UX fix** — without a stub, `Meteor.call` is
  the same wait with worse observability.
- **Want optimism? Add it deliberately**: Pattern B for local state, Pattern C
  (stub + callAsync + registry entry) only if minimongo simulation is truly
  required.
- Editors (AceEditor/Monaco) are Pattern A. Typing never touches the network;
  only the save does, and saves may honestly take a beat.

## Related

- Rule: `rules/meteor/v3-async.md` — server-side async patterns
- File: `imports/lib/rpcClient.js` — `Meteor.rpc` / `Meteor.rpcStream`
- File: `imports/lib/ServerMethods.js` — pipeline + DDP adapter
- PR #173 — the JSON-RPC migration this rule accompanies
- Issue #172 — server-internal `callAsync` migration (sweeps must respect the
  stubbed-methods registry above)
