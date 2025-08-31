#!/bin/bash
# /Volumes/SonicMagic/Code/honeycomb-public-release/scripts/deploy-to-galaxy.sh

# Galaxy deployment script with automatic dependency management
# This script handles package-specific NPM dependencies that Galaxy needs

set -e  # Exit on error

echo "🚀 Galaxy Deployment Script"
echo "=========================="

# Check if required tools are installed
command -v meteor >/dev/null 2>&1 || { echo "❌ Meteor is required but not installed." >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed." >&2; exit 1; }

# Parse command line arguments
SETTINGS_FILE=""
GALAXY_URL=""
DEPLOY_HOSTNAME=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --settings)
      SETTINGS_FILE="$2"
      shift 2
      ;;
    --galaxy)
      GALAXY_URL="$2"
      shift 2
      ;;
    --hostname)
      DEPLOY_HOSTNAME="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 --settings <settings.json> --galaxy <url> --hostname <hostname>"
      exit 1
      ;;
  esac
done

# Validate required arguments
if [ -z "$SETTINGS_FILE" ] || [ -z "$GALAXY_URL" ] || [ -z "$DEPLOY_HOSTNAME" ]; then
  echo "❌ Missing required arguments"
  echo "Usage: $0 --settings <settings.json> --galaxy <url> --hostname <hostname>"
  exit 1
fi

if [ ! -f "$SETTINGS_FILE" ]; then
  echo "❌ Settings file not found: $SETTINGS_FILE"
  exit 1
fi

echo "📋 Deployment configuration:"
echo "  Settings: $SETTINGS_FILE"
echo "  Galaxy: $GALAXY_URL"
echo "  Hostname: $DEPLOY_HOSTNAME"
echo ""

# Step 1: Prepare dependencies
echo "📦 Step 1: Preparing package dependencies..."
node scripts/prepare-galaxy-deployment.js
if [ $? -ne 0 ]; then
  echo "❌ Failed to prepare dependencies"
  exit 1
fi

# Step 2: Install dependencies
echo ""
echo "📥 Step 2: Installing NPM dependencies..."
npm install
if [ $? -ne 0 ]; then
  echo "❌ Failed to install dependencies"
  node scripts/restore-package-json.js
  exit 1
fi

# Step 3: Deploy to Galaxy
echo ""
echo "🚀 Step 3: Deploying to Galaxy..."
echo "Running: meteor deploy $DEPLOY_HOSTNAME --settings $SETTINGS_FILE"

meteor deploy "$DEPLOY_HOSTNAME" --settings "$SETTINGS_FILE"
DEPLOY_EXIT_CODE=$?

# Step 4: Clean up (always runs, even if deploy fails)
echo ""
echo "🧹 Step 4: Cleaning up..."
node scripts/restore-package-json.js

# Check deployment result
if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Deployment successful!"
  echo "🌐 Your app is available at: https://$DEPLOY_HOSTNAME"
else
  echo ""
  echo "❌ Deployment failed with exit code: $DEPLOY_EXIT_CODE"
  exit $DEPLOY_EXIT_CODE
fi