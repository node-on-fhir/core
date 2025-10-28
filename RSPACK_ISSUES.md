# RSPack Migration Issues

**Date**: 2025-10-28
**Meteor Version**: 3.4-beta.12
**RSPack Version**: 1.0.0-beta340.12

## Summary

The upgrade from Meteor 3.3 to 3.4-beta.12 with RSPack has introduced several compilation and runtime errors. These fall into three categories:

1. **Module Export Errors** (CRITICAL) - Duplicate exports causing parse failures
2. **Missing Module Errors** (HIGH) - Missing startup files
3. **Import/Export Mismatches** (MEDIUM) - ESModule linking warnings
4. **Runtime Error** (CRITICAL) - Server crash on boot

---

## Critical Errors (Must Fix)

### 1. Duplicate Export Error - Measures.js
**File**: `imports/lib/schemas/SimpleSchemas/Measures.js:687`

```
× JavaScript parse error: Duplicate export of 'Measures'
export { MeasureSchema, MeasureSchemaR4, Measure, Measures };
```

**Cause**: RSPack is detecting that `Measures` is exported twice in the same file.

**Solution**: Check the file for duplicate export statements and consolidate.

---

### 2. Duplicate Export Error - Observations.js
**File**: `imports/lib/schemas/SimpleSchemas/Observations.js:851`

```
× JavaScript parse error: Duplicate export of 'Observations'
export { Observation, Observations, ObservationSchema, ObservationDstu2, ObservationStu3, ObservationR4 };
```

**Cause**: RSPack is detecting that `Observations` is exported twice in the same file.

**Solution**: Check the file for duplicate export statements and consolidate.

---

### 3. Server Crash on Boot - UdapMethods.js
**File**: `imports/lib/UdapMethods.js:19`

```
TypeError: Cannot read properties of undefined (reading 'Endpoints')
```

**Cause**: Likely trying to access `Collections.Endpoints` before it's initialized, or the collection is not being exported/imported correctly after RSPack migration.

**Solution**:
- Check if `Endpoints` collection is properly imported
- Verify initialization order
- May need to wrap in `Meteor.startup()` or add null check

---

## High Priority - Missing Modules

### Server-Side Missing Modules

1. **email-startup.js**
   ```
   Module not found: Can't resolve './email-startup' in
   '/Users/abigailwatson/Code/honeycomb-ehr/imports/startup/server'
   ```

2. **scheduler-startup.js**
   ```
   Module not found: Can't resolve './scheduler-startup' in
   '/Users/abigailwatson/Code/honeycomb-ehr/imports/startup/server'
   ```

3. **monitoring-startup.js**
   ```
   Module not found: Can't resolve './monitoring-startup' in
   '/Users/abigailwatson/Code/honeycomb-ehr/imports/startup/server'
   ```

### Client-Side Missing Modules

1. **analytics-startup.js**
   ```
   Module not found: Can't resolve './analytics-startup' in
   '/Users/abigailwatson/Code/honeycomb-ehr/imports/startup/client'
   ```

2. **chat-startup.js**
   ```
   Module not found: Can't resolve './chat-startup' in
   '/Users/abigailwatson/Code/honeycomb-ehr/imports/startup/client'
   ```

3. **notifications-startup.js**
   ```
   Module not found: Can't resolve './notifications-startup' in
   '/Users/abigailwatson/Code/honeycomb-ehr/imports/startup/client'
   ```

**Solution**:
- Either create placeholder files for these modules
- Or update `imports/startup/server/index.js` and `imports/startup/client/index.js` to not try importing them

---

## Medium Priority - Import/Export Warnings

These are warnings (not errors) but indicate potential runtime issues:

### 1. Default Export Not Found
Multiple files expecting default exports but finding named exports:

- `ConsentSchema` from `./Consents.js`
- `OAuthClientComponents` from `'../imports/collections/OAuthClients.js`
- `OAuthServerConfig` from `'./OAuthServer.js'`
- `asn1js` from `'asn1js'`
- `pkijs` from `'pkijs'`
- `pvutils` from `'pvutils'`
- `HipaaLogger` from `'../../lib/HipaaLogger.js'`
- Various others...

**Solution**: Update import statements to use named imports instead of default imports:

```javascript
// BEFORE
import ConsentSchema from './Consents.js';

// AFTER
import { ConsentSchema } from './Consents.js';
```

### 2. Missing MUI Icons
Multiple warnings about Material-UI icons not found:

- `LastPageIcon`
- `FirstPageIcon`
- `KeyboardArrowRight`
- `KeyboardArrowLeft`

**Solution**: Import these from `@mui/icons-material` instead of `@mui/material`:

```javascript
// BEFORE
import { LastPageIcon } from '@mui/material';

// AFTER
import { LastPage as LastPageIcon } from '@mui/icons-material';
```

---

## Low Priority - Optional Dependency Warnings

These are expected warnings for optional MongoDB dependencies:

- `kerberos`
- `@mongodb-js/zstd`
- `@aws-sdk/credential-providers`
- `gcp-metadata`
- `snappy`
- `socks`
- `aws4`
- `mongodb-client-encryption`

**Action**: These can be ignored unless you need these features.

---

## Recommended Fix Order

1. **Fix server crash** (UdapMethods.js) - App won't start without this
2. **Fix duplicate exports** (Measures.js, Observations.js) - Preventing compilation
3. **Create missing startup files** or disable their imports - Preventing compilation
4. **Fix import/export mismatches** - May cause runtime errors
5. **Fix MUI icon imports** - UI components won't render correctly

---

## Commands to Diagnose

### Check Measures.js for duplicate exports:
```bash
grep -n "export.*Measures" imports/lib/schemas/SimpleSchemas/Measures.js
```

### Check Observations.js for duplicate exports:
```bash
grep -n "export.*Observations" imports/lib/schemas/SimpleSchemas/Observations.js
```

### Check UdapMethods.js:
```bash
head -25 imports/lib/UdapMethods.js
```

### List missing startup files:
```bash
ls imports/startup/server/*-startup.js
ls imports/startup/client/*-startup.js
```

---

## Next Steps

1. Let's fix the critical errors first (duplicate exports + server crash)
2. Then handle missing modules
3. Finally clean up import/export warnings

The DICOM viewer package we're building is insulated from most of these issues since it's self-contained in `packages/dicom-viewer/`.
