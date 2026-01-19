#!/bin/zsh
# run-nightwatch-local-circleci.sh
# Runs the same Nightwatch tests locally that run on CircleCI
#
# Usage: ./scripts/run-nightwatch-local-circleci.sh [group]
#
# Prerequisites:
#   1. Start Meteor first: ./scripts/run-meteor-local-circleci-config.sh
#   2. Then run this script in another terminal

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# All CRUD groups (not including accounts which needs different login settings)
CRUD_GROUPS="actors clinical-history autoimmune pharmacy radiology care-management scheduling structured-data-capture clinical-trials administrative supply-chain communications public-health library-sciences"

# Function to get test files for a group
get_test_files() {
    local group=$1

    case $group in
        "accounts")
            echo "tests/nightwatch/honeycomb/default/accounts.login.js tests/nightwatch/honeycomb/default/accounts.signup.js tests/nightwatch/honeycomb/default/accounts.viewports.js"
            ;;
        "actors")
            echo "tests/nightwatch/honeycomb/enable_autopublish/crud.patients.js tests/nightwatch/honeycomb/enable_autopublish/crud.practitioners.js tests/nightwatch/honeycomb/enable_autopublish/crud.careteams.js"
            ;;
        "clinical-history")
            echo "tests/nightwatch/honeycomb/enable_autopublish/crud.observations.js tests/nightwatch/honeycomb/enable_autopublish/crud.conditions.js tests/nightwatch/honeycomb/enable_autopublish/crud.encounters.js tests/nightwatch/honeycomb/enable_autopublish/crud.procedures.js"
            ;;
        "autoimmune")
            echo "tests/nightwatch/honeycomb/enable_autopublish/crud.allergyintolerances.js tests/nightwatch/honeycomb/enable_autopublish/crud.immunizations.js"
            ;;
        "pharmacy")
            echo "tests/nightwatch/honeycomb/enable_autopublish/crud.medications.js tests/nightwatch/honeycomb/enable_autopublish/crud.medicationrequests.js tests/nightwatch/honeycomb/enable_autopublish/crud.medicationadministrations.js"
            ;;
        "radiology")
            echo "tests/nightwatch/honeycomb/enable_autopublish/crud.diagnosticreports.js tests/nightwatch/honeycomb/enable_autopublish/crud.imagingstudies.js"
            ;;
        "care-management")
            echo "tests/nightwatch/honeycomb/enable_autopublish/crud.careplans.js tests/nightwatch/honeycomb/enable_autopublish/crud.nutritionintakes.js tests/nightwatch/honeycomb/enable_autopublish/crud.nutritionorders.js tests/nightwatch/honeycomb/enable_autopublish/crud.servicerequests.js"
            ;;
        "scheduling")
            echo "tests/nightwatch/honeycomb/enable_autopublish/crud.appointments.js tests/nightwatch/honeycomb/enable_autopublish/crud.schedules.js"
            ;;
        "structured-data-capture")
            echo "tests/nightwatch/honeycomb/enable_autopublish/crud.questionnaires.js tests/nightwatch/honeycomb/enable_autopublish/crud.questionnaireresponses.js"
            ;;
        "clinical-trials")
            echo "tests/nightwatch/honeycomb/enable_autopublish/crud.researchstudy.js tests/nightwatch/honeycomb/enable_autopublish/crud.researchsubjects.js"
            ;;
        "administrative")
            echo "tests/nightwatch/honeycomb/enable_autopublish/crud.consents.js tests/nightwatch/honeycomb/enable_autopublish/crud.tasks.js tests/nightwatch/honeycomb/crud.plandefinitions.js"
            ;;
        "supply-chain")
            echo "tests/nightwatch/honeycomb/enable_autopublish/crud.devices.js tests/nightwatch/honeycomb/enable_autopublish/crud.locations.js tests/nightwatch/honeycomb/enable_autopublish/crud.supplydeliveries.js"
            ;;
        "communications")
            echo "tests/nightwatch/honeycomb/crud.messageheaders.js tests/nightwatch/honeycomb/enable_autopublish/crud.communications.js"
            ;;
        "public-health")
            echo "tests/nightwatch/honeycomb/crud.measures.js tests/nightwatch/honeycomb/crud.measurereports.js"
            ;;
        "library-sciences")
            echo "tests/nightwatch/honeycomb/enable_autopublish/crud.medias.js tests/nightwatch/honeycomb/enable_autopublish/crud.documentreferences.js"
            ;;
        "framework")
            echo "tests/nightwatch/honeycomb/enable_autopublish/simple-sorting-test.js tests/nightwatch/honeycomb/dev_auto_login/my.profile.js tests/nightwatch/honeycomb/default/localhost.js"
            ;;
        "base-ehr")
            echo "packages/order-catalog/tests/nightwatch/170.315.a.1.test.js packages/order-catalog/tests/nightwatch/170.315.a.2.test.js packages/implantable-devices/tests/nightwatch/170.315.a.14.test.js packages/hipaa-compliance/tests/nightwatch/170.315.d.1.test.js packages/family-health-history/tests/nightwatch/170.315.a.12.test.js"
            ;;
        "crud")
            # Expand glob pattern for all CRUD tests
            echo tests/nightwatch/honeycomb/enable_autopublish/crud.*.js
            ;;
        *)
            echo ""
            ;;
    esac
}

# Function to show help
show_help() {
    echo "${BLUE}======================================${NC}"
    echo "${BLUE}  Nightwatch Local Test Runner${NC}"
    echo "${BLUE}======================================${NC}"
    echo ""
    echo "Usage: ${GREEN}./scripts/run-nightwatch-local-circleci.sh [group]${NC}"
    echo ""
    echo "${YELLOW}Prerequisites:${NC}"
    echo "  1. Start Meteor first in another terminal:"
    echo "     ${GREEN}./scripts/run-meteor-local-circleci-config.sh${NC}"
    echo ""
    echo "${YELLOW}Available test groups:${NC}"
    echo ""
    echo "  ${GREEN}crud${NC}              - All CRUD tests (wildcard match)"
    echo "  ${GREEN}base-ehr${NC}          - ONC 170.315 certification tests"
    echo "  ${GREEN}accounts${NC}          - Login, signup, viewports"
    echo "  ${GREEN}actors${NC}            - Patients, practitioners, careteams"
    echo "  ${GREEN}clinical-history${NC}  - Observations, conditions, encounters, procedures"
    echo "  ${GREEN}autoimmune${NC}        - Allergy intolerances, immunizations"
    echo "  ${GREEN}pharmacy${NC}          - Medications, medication requests/administrations"
    echo "  ${GREEN}radiology${NC}         - Diagnostic reports, imaging studies"
    echo "  ${GREEN}care-management${NC}   - Care plans, nutrition orders, service requests"
    echo "  ${GREEN}scheduling${NC}        - Appointments, schedules"
    echo "  ${GREEN}structured-data-capture${NC} - Questionnaires, responses"
    echo "  ${GREEN}clinical-trials${NC}   - Research studies, subjects"
    echo "  ${GREEN}administrative${NC}    - Consents, tasks, plan definitions"
    echo "  ${GREEN}supply-chain${NC}      - Devices, locations, supply deliveries"
    echo "  ${GREEN}communications${NC}    - Message headers, communications"
    echo "  ${GREEN}public-health${NC}     - Measures, measure reports"
    echo "  ${GREEN}library-sciences${NC}  - Medias, document references"
    echo "  ${GREEN}framework${NC}         - Sorting test, profile, localhost"
    echo ""
    echo "  ${GREEN}all-crud${NC}          - Run all CRUD groups sequentially"
    echo "  ${GREEN}not-crud${NC}          - Run all NON-CRUD groups (accounts, base-ehr, framework)"
    echo "  ${GREEN}all${NC}               - Run ALL test groups sequentially"
    echo ""
    echo "${YELLOW}Examples:${NC}"
    echo "  ./scripts/run-nightwatch-local-circleci.sh crud"
    echo "  ./scripts/run-nightwatch-local-circleci.sh base-ehr"
    echo "  ./scripts/run-nightwatch-local-circleci.sh pharmacy"
    echo "  ./scripts/run-nightwatch-local-circleci.sh all-crud"
    echo ""
}

# Function to check if Meteor is running
check_meteor() {
    if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
        echo "${GREEN}✓ Meteor is running on port 3000${NC}"
        return 0
    else
        echo "${RED}✗ Meteor is not running on port 3000${NC}"
        echo ""
        echo "${YELLOW}Please start Meteor first:${NC}"
        echo "  ${GREEN}./scripts/run-meteor-local-circleci-config.sh${NC}"
        echo ""
        return 1
    fi
}

# Function to run tests
run_tests() {
    local group=$1
    local test_files=$(get_test_files "$group")

    if [ -z "$test_files" ]; then
        echo "${RED}Unknown test group: $group${NC}"
        echo "Run with --help to see available groups"
        exit 1
    fi

    echo "${BLUE}======================================${NC}"
    echo "${BLUE}  Running test group: ${GREEN}$group${NC}"
    echo "${BLUE}======================================${NC}"
    echo ""
    echo "${YELLOW}Test files:${NC}"
    for f in ${=test_files}; do
        echo "  - $f"
    done
    echo ""

    # Run nightwatch
    npx nightwatch --config nightwatch.circle.conf.js ${=test_files}
}

# Function to run all CRUD groups
run_all_crud() {
    echo "${BLUE}======================================${NC}"
    echo "${BLUE}  Running ALL CRUD test groups${NC}"
    echo "${BLUE}======================================${NC}"
    echo ""

    for group in ${=CRUD_GROUPS}; do
        echo "${YELLOW}>>> Starting group: $group${NC}"
        run_tests "$group"
        echo ""
    done

    echo "${GREEN}All CRUD tests completed!${NC}"
}

# Function to run all non-CRUD groups
run_not_crud() {
    echo "${BLUE}======================================${NC}"
    echo "${BLUE}  Running NON-CRUD test groups${NC}"
    echo "${BLUE}======================================${NC}"
    echo ""

    # Run accounts
    echo "${YELLOW}>>> Starting group: accounts${NC}"
    run_tests "accounts"

    # Run base-ehr
    echo "${YELLOW}>>> Starting group: base-ehr${NC}"
    run_tests "base-ehr"

    # Run framework
    echo "${YELLOW}>>> Starting group: framework${NC}"
    run_tests "framework"

    echo "${GREEN}All non-CRUD tests completed!${NC}"
}

# Function to run all groups
run_all() {
    echo "${BLUE}======================================${NC}"
    echo "${BLUE}  Running ALL test groups${NC}"
    echo "${BLUE}======================================${NC}"
    echo ""

    # Run accounts first (may need different settings)
    echo "${YELLOW}>>> Starting group: accounts${NC}"
    run_tests "accounts"

    # Run all CRUD groups
    for group in ${=CRUD_GROUPS}; do
        echo "${YELLOW}>>> Starting group: $group${NC}"
        run_tests "$group"
        echo ""
    done

    # Run base-ehr
    echo "${YELLOW}>>> Starting group: base-ehr${NC}"
    run_tests "base-ehr"

    # Run framework
    echo "${YELLOW}>>> Starting group: framework${NC}"
    run_tests "framework"

    echo "${GREEN}All tests completed!${NC}"
}

# Main script
main() {
    local group=${1:-"--help"}

    # Show help
    if [ "$group" = "--help" ] || [ "$group" = "-h" ] || [ "$group" = "help" ]; then
        show_help
        exit 0
    fi

    # Check if Meteor is running
    if ! check_meteor; then
        exit 1
    fi

    echo ""

    # Handle special cases
    case $group in
        "all-crud")
            run_all_crud
            ;;
        "not-crud")
            run_not_crud
            ;;
        "all")
            run_all
            ;;
        *)
            run_tests "$group"
            ;;
    esac
}

# Run main
main "$@"
