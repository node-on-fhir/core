#!/usr/bin/env python3
"""
Update bulk NDJSON files with new Daisey Koelpin resources
"""

import json
import os
import sys

# File paths
NEW_RESOURCES_PART1 = "daisey_new_resources.json"
NEW_RESOURCES_PART2 = "daisey_new_resources_part2.json"
NEW_RESOURCES_PART3 = "daisey_new_resources_part3.json"
NEW_RESOURCES_PART4 = "daisey_new_resources_part4.json"
BULK_DIR = "bulk"

# Files that need to be created
FILES_TO_CREATE = ["Coverage.ndjson", "Goal.ndjson", "MedicationDispense.ndjson",
                   "ServiceRequest.ndjson", "Specimen.ndjson", "RelatedPerson.ndjson"]

def load_json(filename):
    """Load JSON file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        sys.exit(1)

def append_to_ndjson(filename, resources):
    """Append resources to NDJSON file"""
    if not resources:
        return 0

    try:
        with open(filename, 'a', encoding='utf-8') as f:
            for resource in resources:
                # Extract just the resource object (not the fullUrl/request wrapper)
                resource_obj = resource.get('resource', resource)
                json.dump(resource_obj, f, ensure_ascii=False)
                f.write('\n')
        return len(resources)
    except Exception as e:
        print(f"Error appending to {filename}: {e}")
        return 0

def create_ndjson_file(filename):
    """Create empty NDJSON file if it doesn't exist"""
    if not os.path.exists(filename):
        with open(filename, 'w', encoding='utf-8') as f:
            pass
        print(f"   Created new file: {filename}")
        return True
    return False

def main():
    print("=" * 70)
    print("Updating Bulk NDJSON Files with ONC (g)(10) Resources")
    print("=" * 70)

    # Load all new resource files
    print(f"\n1. Loading new resources...")
    new_resources_1 = load_json(NEW_RESOURCES_PART1)
    new_resources_2 = load_json(NEW_RESOURCES_PART2)
    new_resources_3 = load_json(NEW_RESOURCES_PART3)
    new_resources_4 = load_json(NEW_RESOURCES_PART4)

    # Organize resources by type
    resources_by_type = {}

    # Part 1: AllergyIntolerances, Coverages, Goals
    allergyIntolerances = new_resources_1.get('newResources', {}).get('allergyIntolerances', [])
    coverages = new_resources_1.get('newResources', {}).get('coverages', [])
    goals = new_resources_1.get('newResources', {}).get('goals', [])

    resources_by_type['AllergyIntolerance'] = allergyIntolerances
    resources_by_type['Coverage'] = coverages
    resources_by_type['Goal'] = goals

    # Part 2: MedicationDispenses, ServiceRequests
    resources_by_type['MedicationDispense'] = new_resources_2.get('medicationDispenses', [])
    resources_by_type['ServiceRequest'] = new_resources_2.get('serviceRequests', [])

    # Part 3: Specimens, RelatedPersons
    resources_by_type['Specimen'] = new_resources_3.get('specimens', [])
    resources_by_type['RelatedPerson'] = new_resources_3.get('relatedPersons', [])

    # Part 4: Additional Observations
    resources_by_type['Observation'] = new_resources_4.get('additionalObservations', [])

    print(f"\n2. Resource counts by type:")
    for resource_type, resources in sorted(resources_by_type.items()):
        print(f"   {resource_type:25} {len(resources):3}")

    # Create missing bulk files
    print(f"\n3. Checking/creating bulk NDJSON files...")
    for filename in FILES_TO_CREATE:
        filepath = os.path.join(BULK_DIR, filename)
        create_ndjson_file(filepath)

    # Update bulk files
    print(f"\n4. Appending resources to bulk NDJSON files...")
    total_appended = 0
    summary = {}

    for resource_type, resources in sorted(resources_by_type.items()):
        if resources:
            filename = os.path.join(BULK_DIR, f"{resource_type}.ndjson")
            count = append_to_ndjson(filename, resources)
            total_appended += count
            summary[resource_type] = count
            print(f"   {resource_type:25} {count:3} resources -> {filename}")

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total resources appended to bulk files: {total_appended}")
    print("\nResources added by type:")
    print("-" * 70)
    for resource_type in sorted(summary.keys()):
        print(f"  {resource_type:25} {summary[resource_type]:3} -> bulk/{resource_type}.ndjson")

    print("\n" + "=" * 70)
    print("Bulk NDJSON update complete!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    main()
