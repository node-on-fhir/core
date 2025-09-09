# CircleCI Pre-build Timeout Fix

## Problem
The CircleCI build was failing with:
```
Pre-building Meteor packages...
Browserslist: caniuse-lite is outdated. Please run:
  npx update-browserslist-db@latest
  (  Building the application                  ... )
Too long with no output (exceeded 10m0s): context deadline exceeded
```

## Root Causes
1. The Meteor build process was timing out after 10 minutes with no output
2. The browserslist database was outdated, causing warnings
3. The build process wasn't providing periodic output, causing CircleCI to think it was hung

## Solutions Implemented

### 1. Updated Browserslist Database
Added a step to update the browserslist database after npm install:
```bash
npx update-browserslist-db@latest || true
```

### 2. Extended Timeout and Added Progress Monitoring
- Changed from `timeout 600` (10 minutes) to `timeout 1200` (20 minutes)
- Added `no_output_timeout: 20m` to the CircleCI step
- Created a wrapper script that outputs progress every 30 seconds

### 3. Optimized Build Process
- Added `--debug` flag to skip minification during prebuild
- Added environment variables to help with caching:
  - `METEOR_DISABLE_OPTIMISTIC_CACHING=1`
  - `METEOR_PROFILE=100`
- Made the prebuild step non-fatal (continues even if it times out)

### 4. Progress Monitoring Script
The new script:
- Runs the Meteor build in the background
- Outputs progress every 30 seconds including:
  - Elapsed time
  - Package cache size
- Prevents CircleCI from thinking the process is hung

## Why This Works
1. **Browserslist Update**: Eliminates the warning and potential issues with outdated browser data
2. **Progress Output**: Prevents CircleCI's "no output" timeout by showing activity
3. **Extended Timeout**: Gives Meteor enough time to download and compile all packages
4. **Non-fatal Prebuild**: Even if prebuild times out, the actual app can still start (it will just take longer)

## Additional Notes
- The prebuild step is optional - it speeds up the actual app start but isn't required
- Large Meteor projects can take 15-20 minutes to build initially
- The `.meteor/local` directory caches compiled packages for future runs
- Using `--debug` flag skips optimizations, making the prebuild faster

## Future Improvements
Consider:
1. Caching `.meteor/local` between builds
2. Using a custom Docker image with pre-installed Meteor packages
3. Splitting the build into smaller chunks
4. Using Meteor's `--extra-packages` flag to only build required packages