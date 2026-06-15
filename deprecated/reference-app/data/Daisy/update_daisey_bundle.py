#!/usr/bin/env python3
"""
Update Daisey Koelpin's FHIR Bundle with new ONC (g)(10) resources
"""

import json
import sys

# File paths
ORIGINAL_BUNDLE = "fhir/Daisey627_Jackelyn13_Koelpin146_958c63b0-4a7f-2ee7-ef6a-e04df5931b4c.json"
NEW_RESOURCES_PART1 = "daisey_new_resources.json"
NEW_RESOURCES_PART2 = "daisey_new_resources_part2.json"
NEW_RESOURCES_PART3 = "daisey_new_resources_part3.json"
NEW_RESOURCES_PART4 = "daisey_new_resources_part4.json"
OUTPUT_BUNDLE = "fhir/Daisey627_Jackelyn13_Koelpin146_958c63b0-4a7f-2ee7-ef6a-e04df5931b4c.json"
BACKUP_BUNDLE = "fhir/Daisey627_Jackelyn13_Koelpin146_958c63b0-4a7f-2ee7-ef6a-e04df5931b4c.json.backup"

def load_json(filename):
    """Load JSON file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        sys.exit(1)

def save_json(data, filename):
    """Save JSON file with pretty formatting"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved: {filename}")
    except Exception as e:
        print(f"Error saving {filename}: {e}")
        sys.exit(1)

def main():
    print("=" * 70)
    print("Updating Daisey Koelpin FHIR Bundle with ONC (g)(10) Resources")
    print("=" * 70)

    # Load original bundle
    print(f"\n1. Loading original bundle: {ORIGINAL_BUNDLE}")
    bundle = load_json(ORIGINAL_BUNDLE)
    original_entry_count = len(bundle.get('entry', []))
    print(f"   Original entry count: {original_entry_count}")

    # Create backup
    print(f"\n2. Creating backup: {BACKUP_BUNDLE}")
    save_json(bundle, BACKUP_BUNDLE)

    # Load all new resource files
    print(f"\n3. Loading new resources...")
    new_resources_1 = load_json(NEW_RESOURCES_PART1)
    new_resources_2 = load_json(NEW_RESOURCES_PART2)
    new_resources_3 = load_json(NEW_RESOURCES_PART3)
    new_resources_4 = load_json(NEW_RESOURCES_PART4)

    # Collect all new entries
    new_entries = []

    # Part 1: AllergyIntolerances, Coverages, Goals
    new_entries.extend(new_resources_1.get('newResources', {}).get('allergyIntolerances', []))
    new_entries.extend(new_resources_1.get('newResources', {}).get('coverages', []))
    new_entries.extend(new_resources_1.get('newResources', {}).get('goals', []))

    # Part 2: MedicationDispenses, ServiceRequests
    new_entries.extend(new_resources_2.get('medicationDispenses', []))
    new_entries.extend(new_resources_2.get('serviceRequests', []))

    # Part 3: Specimens, RelatedPersons
    new_entries.extend(new_resources_3.get('specimens', []))
    new_entries.extend(new_resources_3.get('relatedPersons', []))

    # Part 4: Additional Observations
    new_entries.extend(new_resources_4.get('additionalObservations', []))

    print(f"   Total new entries to add: {len(new_entries)}")

    # Add new entries to bundle
    print(f"\n4. Adding new entries to bundle...")
    if 'entry' not in bundle:
        bundle['entry'] = []

    bundle['entry'].extend(new_entries)

    new_entry_count = len(bundle['entry'])
    print(f"   New total entry count: {new_entry_count}")
    print(f"   Entries added: {new_entry_count - original_entry_count}")

    # Update bundle type to transaction if not already
    if bundle.get('type') != 'transaction':
        bundle['type'] = 'transaction'
        print(f"   Bundle type set to: transaction")

    # Save updated bundle
    print(f"\n5. Saving updated bundle: {OUTPUT_BUNDLE}")
    save_json(bundle, OUTPUT_BUNDLE)

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Original entries:        {original_entry_count}")
    print(f"New entries added:       {new_entry_count - original_entry_count}")
    print(f"Total entries:           {new_entry_count}")
    print(f"\nBackup saved to:         {BACKUP_BUNDLE}")
    print(f"Updated bundle saved to: {OUTPUT_BUNDLE}")
    print("\n" + "=" * 70)

    # Resource type breakdown
    print("\nNew Resources Added by Type:")
    print("-" * 70)
    resource_counts = {}
    for entry in new_entries:
        resource_type = entry.get('resource', {}).get('resourceType', 'Unknown')
        resource_counts[resource_type] = resource_counts.get(resource_type, 0) + 1

    for resource_type in sorted(resource_counts.keys()):
        print(f"  {resource_type:25} {resource_counts[resource_type]:3}")

    print("\n" + "=" * 70)
    print("Update complete!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    main()
