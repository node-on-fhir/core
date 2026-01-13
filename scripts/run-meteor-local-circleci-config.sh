#!/bin/bash
# run-circleci-local.sh
# Runs Meteor with the same configuration as CircleCI

# Environment variables matching CircleCI
export ENABLE_AUTOPUBLISH=true
export DEV_AUTO_LOGIN=true
export DEV_AUTO_USERNAME="demouser"
export DEV_AUTO_PASSWORD="password2025"
export TEST_RUN=true
export ENABLE_SYNCED_CRON=false
export NODE_OPTIONS="--max_old_space_size=4096"

# Run Meteor with TDD settings and all ONC packages
meteor run --settings configs/settings.honeycomb.tdd.json --port 3000 \
  --extra-packages "clinical:reference-app, clinical:order-catalog, clinical:drug-interactions, clinical:secure-messaging, clinical:request-for-corrections, clinical:ccda-export, clinical:implantable-devices, clinical:e-prescribing, clinical:quality-measures, clinical:hipaa-compliance, clinical:clinical-lists, clinical:drug-formulary, clinical:syndromic-surveillance, clinical:family-health-history, clinical:social-determinants, clinical:structured-data-capture, clinical:case-reporting, clinical:cancer-registry-reporting, clinical:lab-test-reporting, clinical:immunization-registry, clinical:antimicrobial-reporting, clinical:pacio-core, clinical:accounts-management, clinical:multi-factor-auth, clinical:patient-matching"
