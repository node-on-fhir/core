#!/usr/bin/env node
// /Volumes/SonicMagic/Code/honeycomb-public-release/scripts/prepare-galaxy-deployment.js

/**
 * Prepare for Galaxy deployment by conditionally adding package dependencies
 * 
 * This script manages NPM dependencies that are declared in Atmosphere packages
 * but need to be in the main package.json for Galaxy deployment.
 */

const fs = require('fs');
const path = require('path');

// Define package-specific dependencies
const PACKAGE_DEPENDENCIES = {
  'symptomatic:mcp': {
    '@modelcontextprotocol/sdk': '1.0.4',
    '@langchain/mongodb': '0.1.0',
    '@langchain/openai': '0.3.16',
    '@langchain/community': '0.3.0',
    '@langchain/core': '0.3.0',
    'langchain': '0.3.6',
    'hnswlib-node': '3.0.0'
  }
  // Add other packages and their dependencies here as needed
};

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');
const METEOR_PACKAGES_PATH = path.join(ROOT_DIR, '.meteor', 'packages');
const BACKUP_PATH = path.join(ROOT_DIR, 'package.json.backup');

function getActivePackages() {
  try {
    const packagesContent = fs.readFileSync(METEOR_PACKAGES_PATH, 'utf8');
    return packagesContent
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .map(line => line.trim());
  } catch (error) {
    console.error('Error reading .meteor/packages:', error.message);
    return [];
  }
}

function addDependenciesToPackageJson(dependencies) {
  try {
    // Create backup
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(packageJson, null, 2));
    console.log('Created backup at package.json.backup');

    // Add dependencies
    let added = 0;
    Object.entries(dependencies).forEach(([name, version]) => {
      if (!packageJson.dependencies[name]) {
        packageJson.dependencies[name] = version;
        added++;
        console.log(`  Added: ${name}@${version}`);
      } else {
        console.log(`  Skipped: ${name} (already exists)`);
      }
    });

    // Sort dependencies alphabetically
    const sortedDeps = {};
    Object.keys(packageJson.dependencies)
      .sort()
      .forEach(key => {
        sortedDeps[key] = packageJson.dependencies[key];
      });
    packageJson.dependencies = sortedDeps;

    // Write updated package.json
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2));
    console.log(`\nAdded ${added} dependencies to package.json`);
    
    return true;
  } catch (error) {
    console.error('Error updating package.json:', error.message);
    return false;
  }
}

function main() {
  console.log('Preparing for Galaxy deployment...\n');

  // Get active Meteor packages
  const activePackages = getActivePackages();
  console.log('Active Meteor packages:', activePackages.length);

  // Collect all required dependencies
  const requiredDependencies = {};
  
  activePackages.forEach(packageName => {
    if (PACKAGE_DEPENDENCIES[packageName]) {
      console.log(`\nFound package: ${packageName}`);
      Object.assign(requiredDependencies, PACKAGE_DEPENDENCIES[packageName]);
    }
  });

  if (Object.keys(requiredDependencies).length === 0) {
    console.log('\nNo additional dependencies needed for Galaxy deployment.');
    return;
  }

  console.log('\nDependencies to add:');
  Object.entries(requiredDependencies).forEach(([name, version]) => {
    console.log(`  ${name}@${version}`);
  });

  // Add dependencies to package.json
  console.log('\nUpdating package.json...');
  if (addDependenciesToPackageJson(requiredDependencies)) {
    console.log('\n✓ Successfully prepared for Galaxy deployment');
    console.log('\nNext steps:');
    console.log('1. Run: npm install');
    console.log('2. Deploy to Galaxy');
    console.log('\nTo restore original package.json:');
    console.log('  cp package.json.backup package.json');
  } else {
    console.error('\n✗ Failed to prepare for Galaxy deployment');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PACKAGE_DEPENDENCIES, addDependenciesToPackageJson };