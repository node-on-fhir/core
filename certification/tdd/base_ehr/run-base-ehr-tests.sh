#!/bin/bash
# certification/tdd/base_ehr/run-base-ehr-tests.sh
# Run all Nightwatch tests required for Base EHR Certification
# Base EHR requires 11 of 11 core criteria per ONC 2015 Edition Cures Update
#
# ⚠️  IMPORTANT NOTICE - January 2025 ⚠️
# Due to government website shutdown, the official Base EHR definition is unavailable.
# § 170.315(a)(9) EXPIRED January 1, 2025 and was replaced by § 170.315(b)(11).
# This script runs BOTH tests until official guidance confirms which is required.

set -e

echo "=========================================="
echo "ONC Base EHR Certification Test Suite"
echo "=========================================="
echo ""
echo "⚠️  NOTE: Running both a-9 (expired) and b-11 (replacement)"
echo "    due to Base EHR definition uncertainty."
echo ""
echo "Running Base EHR criteria tests..."
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0

# Function to run a test and track results
run_test() {
  local test_file=$1
  local test_name=$2

  TEST_COUNT=$((TEST_COUNT + 1))
  echo -e "${BLUE}[$TEST_COUNT/11]${NC} Running: $test_name"
  echo "Test file: $test_file"

  if meteor npm test -- --test "$test_file"; then
    echo -e "${GREEN}✓ PASSED${NC}: $test_name"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo -e "\033[0;31m✗ FAILED\033[0m: $test_name"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  echo ""
}

echo "=========================================="
echo "Section (a) - Clinical Criteria (6 tests + 1 uncertain)"
echo "=========================================="
echo ""

# 1. CPOE Medications
run_test "packages/order-catalog/tests/nightwatch/170.315.a.1.test.js" \
  "170.315(a)(1) - CPOE Medications"

# 2. CPOE Laboratory
run_test "packages/order-catalog/tests/nightwatch/170.315.a.2.test.js" \
  "170.315(a)(2) - CPOE Laboratory"

# 3. CPOE Diagnostic Imaging
run_test "packages/clinical-lists/tests/nightwatch/170.315.a.3.test.js" \
  "170.315(a)(3) - CPOE Diagnostic Imaging"

# 4. Drug-Drug, Drug-Allergy Interaction Checks
run_test "packages/drug-interactions/tests/nightwatch/170.315.a.4.test.js" \
  "170.315(a)(4) - Drug Interactions"

# 5. Demographics
run_test "packages/drug-formulary/tests/nightwatch/170.315.a.5.test.js" \
  "170.315(a)(5) - Demographics"

# 6a. Clinical Decision Support (EXPIRED Jan 1, 2025)
echo "⚠️  Running EXPIRED criterion a-9 (may be grandfathered)"
run_test "certification/tdd/base_ehr/170.315.a.9.test.js" \
  "170.315(a)(9) - Clinical Decision Support (EXPIRED)"

# 6b. Decision Support Interventions (REPLACES a-9)
echo "⚠️  Running REPLACEMENT criterion b-11 (likely required)"
run_test "certification/tdd/base_ehr/170.315.b.11.test.js" \
  "170.315(b)(11) - Decision Support Interventions (REPLACES a-9)"

# 7. Implantable Device List
run_test "packages/implantable-devices/tests/nightwatch/170.315.a.14.test.js" \
  "170.315(a)(14) - Implantable Device List"

echo "=========================================="
echo "Section (e) - Patient Engagement (1 test)"
echo "=========================================="
echo ""

# 8. View, Download, and Transmit
run_test "certification/tdd/base_ehr/170.315.e.1.test.js" \
  "170.315(e)(1) - View, Download, Transmit"

echo "=========================================="
echo "Section (g) - APIs & Services (3 tests)"
echo "=========================================="
echo ""

# 9. Application Access - Patient Selection
run_test "certification/tdd/base_ehr/170.315.g.7.test.js" \
  "170.315(g)(7) - Application Access - Patient Selection"

# 10. Application Access - All Data Request
run_test "certification/tdd/base_ehr/170.315.g.9.test.js" \
  "170.315(g)(9) - Application Access - All Data"

# 11. Standardized API for Patient and Population Services
run_test "certification/tdd/base_ehr/170.315.g.10.test.js" \
  "170.315(g)(10) - Standardized API"

echo "=========================================="
echo "Base EHR Test Suite Results"
echo "=========================================="
echo ""
echo "Total Tests Run: $TEST_COUNT (includes both a-9 and b-11)"
echo "Base EHR Requires: 11 criteria (unclear if a-9 or b-11)"
echo ""
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
if [ $FAIL_COUNT -gt 0 ]; then
  echo -e "\033[0;31mFailed: $FAIL_COUNT\033[0m"
else
  echo "Failed: $FAIL_COUNT"
fi
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
  echo -e "${GREEN}=========================================="
  echo "✓ ALL BASE EHR TESTS PASSED"
  echo ""
  echo "NOTE: Both a-9 (expired) and b-11 (replacement)"
  echo "      passed. Once ONC guidance is available,"
  echo "      remove the test that is not required."
  echo "==========================================${NC}"
  exit 0
else
  echo -e "\033[0;31m=========================================="
  echo "✗ SOME TESTS FAILED"
  echo "==========================================${NC}"
  exit 1
fi
