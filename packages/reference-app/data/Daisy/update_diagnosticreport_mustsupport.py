#!/usr/bin/env python3
# packages/reference-app/data/Daisy/update_diagnosticreport_mustsupport.py
"""
Update DiagnosticReport resources to add MustSupport elements for ONC (g)(10) tests:
- 12.10.08: Add media and media.link to DiagnosticReport-note profile
- 12.11.08: Add meta.lastUpdated to DiagnosticReport-lab profile
- 12.10.09/12.11.09: Add Practitioner reference to performer, fix result references

This script modifies the Daisey patient bundle JSON file.
"""

import json
import os

# File path
BUNDLE_FILE = "Daisey627_Jackelyn13_Koelpin146_958c63b0-4a7f-2ee7-ef6a-e04df5931b4c.json"

# Patient ID for references
PATIENT_ID = "958c63b0-4a7f-2ee7-ef6a-e04df5931b4c"

# Media resource to add
MEDIA_RESOURCE = {
    "fullUrl": "urn:uuid:958c63b0-4a7f-2ee7-media-001",
    "resource": {
        "resourceType": "Media",
        "id": "958c63b0-4a7f-2ee7-media-001",
        "meta": {
            "profile": [
                "http://hl7.org/fhir/StructureDefinition/Media"
            ],
            "lastUpdated": "2024-06-10T10:30:00.000-06:00"
        },
        "status": "completed",
        "type": {
            "coding": [
                {
                    "system": "http://terminology.hl7.org/CodeSystem/media-type",
                    "code": "image",
                    "display": "Image"
                }
            ]
        },
        "subject": {
            "reference": f"Patient/{PATIENT_ID}",
            "display": "Mrs. Daisey627 Jackelyn13 Koelpin146"
        },
        "createdDateTime": "2024-06-10T09:30:00-06:00",
        "issued": "2024-06-10T10:15:00-06:00",
        "content": {
            "contentType": "image/jpeg",
            "url": "https://example.org/imaging/chest-xray-001.jpg",
            "title": "Chest X-ray PA view"
        },
        "note": [
            {
                "text": "Portable chest X-ray performed for routine screening"
            }
        ]
    },
    "request": {
        "method": "POST",
        "url": "Media"
    }
}

def update_bundle():
    """Update the bundle with MustSupport elements."""

    # Read the bundle
    script_dir = os.path.dirname(os.path.abspath(__file__))
    bundle_path = os.path.join(script_dir, BUNDLE_FILE)

    print(f"Reading bundle from: {bundle_path}")

    with open(bundle_path, 'r') as f:
        bundle = json.load(f)

    diagnosticreport_count = 0
    note_profile_count = 0
    lab_profile_count = 0
    added_media_link = False
    media_added = False
    added_practitioner_ref = False
    result_refs_fixed = 0

    # Process entries
    for entry in bundle.get("entry", []):
        resource = entry.get("resource", {})

        if resource.get("resourceType") == "DiagnosticReport":
            diagnosticreport_count += 1

            # Get profile to determine type
            profiles = resource.get("meta", {}).get("profile", [])
            is_note_profile = any("diagnosticreport-note" in p for p in profiles)
            is_lab_profile = any("diagnosticreport-lab" in p for p in profiles)

            if is_note_profile:
                note_profile_count += 1
            if is_lab_profile:
                lab_profile_count += 1

            # 1. Add meta.lastUpdated if not present
            if "meta" not in resource:
                resource["meta"] = {}

            if "lastUpdated" not in resource["meta"]:
                # Use issued date if available, otherwise use effectiveDateTime
                issued = resource.get("issued")
                effective = resource.get("effectiveDateTime")

                if issued:
                    # Convert issued format to lastUpdated format
                    resource["meta"]["lastUpdated"] = issued.replace(".254", ".000")
                elif effective:
                    resource["meta"]["lastUpdated"] = effective + ".000"
                else:
                    resource["meta"]["lastUpdated"] = "2024-06-10T10:00:00.000-06:00"

            # 2. Add media and media.link to first note profile DiagnosticReport
            if is_note_profile and not added_media_link:
                # Add media array with link to our Media resource
                if "media" not in resource:
                    resource["media"] = []

                # Add a media reference
                resource["media"].append({
                    "comment": "Chest X-ray image",
                    "link": {
                        "reference": "Media/958c63b0-4a7f-2ee7-media-001",
                        "display": "Chest X-ray PA view"
                    }
                })

                added_media_link = True
                print(f"  Added media.link to DiagnosticReport: {resource.get('id')}")

            # 3. For lab profile: Add Practitioner reference to performer (first lab only)
            if is_lab_profile and not added_practitioner_ref:
                if "performer" not in resource:
                    resource["performer"] = []

                # Add Practitioner reference (using existing practitioner in bundle)
                resource["performer"].append({
                    "reference": "Practitioner/958c63b0-4a7f-2ee7-prac-9999928895",
                    "display": "Dr. Bernardo333 Stanton715"
                })
                added_practitioner_ref = True
                print(f"  Added Practitioner performer to DiagnosticReport: {resource.get('id')}")

            # 4. For lab profile: Fix result references from urn:uuid: to Observation/
            if is_lab_profile and "result" in resource:
                for result_ref in resource["result"]:
                    ref_value = result_ref.get("reference", "")
                    if ref_value.startswith("urn:uuid:"):
                        # Extract ID and convert to Observation/ID format
                        obs_id = ref_value.replace("urn:uuid:", "")
                        result_ref["reference"] = f"Observation/{obs_id}"
                        result_refs_fixed += 1

    # 3. Add Media resource to bundle if we added a media link
    if added_media_link:
        # Check if Media resource already exists
        for entry in bundle.get("entry", []):
            if entry.get("resource", {}).get("resourceType") == "Media":
                media_added = True
                break

        if not media_added:
            bundle["entry"].append(MEDIA_RESOURCE)
            media_added = True
            print(f"  Added Media resource: {MEDIA_RESOURCE['resource']['id']}")

    # Write updated bundle
    with open(bundle_path, 'w') as f:
        json.dump(bundle, f, indent=2)

    print(f"\nSummary:")
    print(f"  Total DiagnosticReports: {diagnosticreport_count}")
    print(f"  Note profile: {note_profile_count}")
    print(f"  Lab profile: {lab_profile_count}")
    print(f"  Added meta.lastUpdated to DiagnosticReports")
    print(f"  Added media.link to first note profile DiagnosticReport")
    if media_added:
        print(f"  Added Media resource to bundle")
    if added_practitioner_ref:
        print(f"  Added Practitioner performer reference to first lab DiagnosticReport")
    print(f"  Fixed {result_refs_fixed} result references (urn:uuid: -> Observation/)")

    print(f"\nBundle updated successfully!")

if __name__ == "__main__":
    update_bundle()
