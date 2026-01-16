# Deployment Scripts

This directory contains scripts to manage deployments, particularly for handling package-specific NPM dependencies that need to be temporarily added to the main package.json for Galaxy deployment.

## The Problem

Meteor packages can declare NPM dependencies using `Npm.depends()`, but Galaxy doesn't properly resolve these dependencies during deployment. This causes errors like:

```
Failed to load MCP SDK: Cannot find module '@modelcontextprotocol/sdk/dist/index.js'
```

## The Solution

These scripts provide an automated workflow that:
1. Temporarily adds package dependencies to the main package.json
2. Deploys to Galaxy
3. Restores the original package.json to keep it clean

## Scripts

### deploy-to-galaxy.sh

Main deployment script that automates the entire process:

```bash
./scripts/deploy-to-galaxy.sh \
  --settings configs/settings.honeycomb.production.json \
  --galaxy galaxy.meteor.com \
  --hostname myapp.meteorapp.com
```

This script:
1. Prepares dependencies (adds package NPM deps to package.json)
2. Runs `npm install`
3. Deploys to Galaxy
4. Cleans up (restores original package.json)

### prepare-galaxy-deployment.js

Adds package-specific dependencies to package.json:

```bash
node scripts/prepare-galaxy-deployment.js
```

This script:
- Reads `.meteor/packages` to find active packages
- Looks up each package's NPM dependencies
- Adds missing dependencies to package.json
- Creates a backup of the original package.json

### restore-package-json.js

Restores the original package.json after deployment:

```bash
node scripts/restore-package-json.js
```

## Adding New Package Dependencies

To add NPM dependencies for a new package, edit `prepare-galaxy-deployment.js`:

```javascript
const PACKAGE_DEPENDENCIES = {
  'symptomatic:mcp': {
    '@modelcontextprotocol/sdk': '1.0.4',
    // ... other dependencies
  },
  'your:package-name': {
    'some-npm-package': '1.0.0',
    'another-package': '2.0.0'
  }
};
```

## Manual Workflow

If you prefer to manage the process manually:

```bash
# 1. Prepare dependencies
node scripts/prepare-galaxy-deployment.js

# 2. Install dependencies
npm install

# 3. Deploy to Galaxy
meteor deploy myapp.meteorapp.com --settings settings.json

# 4. Restore package.json
node scripts/restore-package-json.js
```

## Local Development

These scripts only affect Galaxy deployment. For local development, Meteor properly resolves package NPM dependencies, so no action is needed.

## Notes

- The scripts maintain alphabetical sorting of dependencies in package.json
- A backup is always created at `package.json.backup` 
- If something goes wrong, you can manually restore: `cp package.json.backup package.json`
- The deploy script will restore package.json even if deployment fails