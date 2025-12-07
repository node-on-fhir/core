#!/usr/bin/env python3
"""
Inject Daisy Koelpin's resources into FHIR NDJSON files

This script extracts all resources from Daisy's bundle and appends them
to the appropriate NDJSON files in the fhir/ directory.
"""

import json
import os
import sys
from collections import defaultdict

# Configuration
DAISY_BUNDLE = "Daisey627_Jackelyn13_Koelpin146_958c63b0-4a7f-2ee7-ef6a-e04df5931b4c.json"
FHIR_DIR = "../fhir"
PATIENT_ID = "958c63b0-4a7f-2ee7-ef6a-e04df5931b4c"


def load_daisy_bundle():
    """Load Daisy's FHIR bundle"""
    print(f"Loading Daisy's bundle: {DAISY_BUNDLE}")
    try:
        with open(DAISY_BUNDLE, 'r', encoding='utf-8') as f:
            bundle = json.load(f)
        return bundle
    except Exception as e:
        print(f"ERROR: Failed to load bundle: {e}")
        sys.exit(1)


def extract_resources_by_type(bundle):
    """Extract and organize resources by type"""
    resources_by_type = defaultdict(list)

    if bundle.get('resourceType') != 'Bundle':
        print("ERROR: Not a valid FHIR Bundle")
        sys.exit(1)

    entries = bundle.get('entry', [])
    print(f"\nFound {len(entries)} total entries in bundle")

    for entry in entries:
        resource = entry.get('resource', {})
        resource_type = resource.get('resourceType')

        if resource_type:
            resources_by_type[resource_type].append(resource)

    return resources_by_type


def count_daisy_resources_in_file(filepath):
    """Count how many of Daisy's resources are already in a file"""
    if not os.path.exists(filepath):
        return 0

    count = 0
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                if PATIENT_ID in line:
                    count += 1
    except Exception:
        pass

    return count


def append_resources_to_ndjson(resource_type, resources):
    """Append resources to the appropriate NDJSON file"""
    filename = f"{resource_type}.ndjson"
    filepath = os.path.join(FHIR_DIR, filename)

    # Check if file exists and count existing Daisy resources
    file_exists = os.path.exists(filepath)
    existing_count = count_daisy_resources_in_file(filepath)

    if existing_count > 0:
        print(f"   WARNING: {filename} already contains {existing_count} Daisy resources - skipping")
        return 0

    # Create or append to file
    try:
        mode = 'a' if file_exists else 'w'
        with open(filepath, mode, encoding='utf-8') as f:
            for resource in resources:
                json.dump(resource, f, ensure_ascii=False)
                f.write('\n')

        action = "Appended to" if file_exists else "Created"
        return len(resources)

    except Exception as e:
        print(f"   ERROR appending to {filename}: {e}")
        return 0


def main():
    print("=" * 80)
    print("INJECT DAISY'S RESOURCES INTO FHIR NDJSON FILES")
    print("=" * 80)

    # Step 1: Load bundle
    bundle = load_daisy_bundle()

    # Step 2: Extract resources by type
    print("\n" + "=" * 80)
    print("EXTRACTING RESOURCES BY TYPE")
    print("=" * 80)
    resources_by_type = extract_resources_by_type(bundle)

    print("\nResources found by type:")
    print("-" * 80)
    total_resources = 0
    for resource_type in sorted(resources_by_type.keys()):
        count = len(resources_by_type[resource_type])
        total_resources += count
        print(f"  {resource_type:30} {count:4} resources")
    print("-" * 80)
    print(f"  {'TOTAL':30} {total_resources:4} resources")

    # Step 3: Check FHIR directory
    if not os.path.exists(FHIR_DIR):
        print(f"\nERROR: FHIR directory not found: {FHIR_DIR}")
        sys.exit(1)

    # Step 4: Append resources to NDJSON files
    print("\n" + "=" * 80)
    print("APPENDING RESOURCES TO NDJSON FILES")
    print("=" * 80)

    appended_counts = {}
    total_appended = 0

    for resource_type in sorted(resources_by_type.keys()):
        resources = resources_by_type[resource_type]
        count = append_resources_to_ndjson(resource_type, resources)
        appended_counts[resource_type] = count
        total_appended += count

        filename = f"{resource_type}.ndjson"
        if count > 0:
            print(f"  ✓ {filename:35} +{count:3} resources")
        else:
            print(f"  ⊘ {filename:35} (skipped)")

    # Step 5: Summary
    print("\n" + "=" * 80)
    print("INJECTION SUMMARY")
    print("=" * 80)
    print(f"Total resources in bundle:    {total_resources}")
    print(f"Total resources appended:     {total_appended}")
    print(f"Total resources skipped:      {total_resources - total_appended}")

    if total_appended == total_resources:
        print("\n✓ SUCCESS: All of Daisy's resources have been injected!")
    elif total_appended > 0:
        print(f"\n⚠ PARTIAL: {total_appended}/{total_resources} resources injected")
        print("  (Some files already contained Daisy's resources)")
    else:
        print("\n⊘ SKIPPED: No resources were injected")
        print("  (Daisy's resources already exist in the files)")

    # Step 6: Verification
    print("\n" + "=" * 80)
    print("VERIFICATION")
    print("=" * 80)
    print(f"Patient ID: {PATIENT_ID}")
    print("\nYou can verify the injection with these commands:")
    print(f"  grep -c '{PATIENT_ID}' {FHIR_DIR}/Patient.ndjson")
    print(f"  grep -c '{PATIENT_ID}' {FHIR_DIR}/Observation.ndjson")
    print(f"  grep -c '{PATIENT_ID}' {FHIR_DIR}/Condition.ndjson")

    print("\n" + "=" * 80)
    print("INJECTION COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    main()
