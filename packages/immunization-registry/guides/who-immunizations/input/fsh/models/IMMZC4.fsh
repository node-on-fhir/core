Invariant:    IMMZ-C-name-1
Description:  "Only letters and special characters (period, dash) allowed."
Expression:   "$this.matches('[A-Za-z-.]*')"
Severity:     #error

Invariant:    IMMZ-C-age-1
Description:  "Required if date of birth is entered."
Expression:   "not(%resource.dateOfBirth.exists()) or $this.exists()"
Severity:     #error

Logical:      IMMZC4
Title:        "IMMZ.C4.Create client record"
Description:  "Data elements for the IMMZ.C4.Create client record Data Dictionary Activity.  Identical to IMMZ.C5.3.Update client details."

* ^name = "IMMZ_C4_Create_client_record"
* ^status = #active
* ^meta.profile[+] = "http://hl7.org/fhir/uv/crmi/StructureDefinition/crmi-shareablestructuredefinition"
* ^meta.profile[+] = "http://hl7.org/fhir/uv/crmi/StructureDefinition/crmi-publishablestructuredefinition"
* ^version = "0.2.0"
* ^experimental = false
* ^publisher = "WHO"
* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/cqf-knowledgeCapability"
* ^extension[=].valueCode = #shareable
* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/artifact-versionAlgorithm"
* ^extension[=].valueCoding = http://hl7.org/fhir/version-algorithm#semver
* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/artifact-versionPolicy"
* ^extension[=].valueCodeableConcept = http://terminology.hl7.org/CodeSystem/artifact-version-policy-codes#metadata
* ^date = "2024-12-18"


* uniqueIdentifier 1..1 string "Unique identifier" "Unique identifier for the client, according to the policies applicable to each country. There can be more than one unique identifier used to link records (e.g. national identification [ID], health ID, immunization information system ID, medical record ID)"
  * ^code[+] = IMMZ.C#DE1
* name 1..1 string "Name" "The full name of the client"
  * obeys IMMZ-C-name-1
  * ^code[+] = IMMZ.C#DE2
  * ^code[+] = $LNC#54125-0 "Patient name"
  * ^code[+] = $SCT#371484003 "Patient name (observable entity)"
* firstName 0..1 string "First name" "Client's first name or given name"
  * obeys IMMZ-C-name-1
  * ^code[+] = IMMZ.C#DE3
  * ^code[+] = $LNC#45392-8 "First name"
  * ^code[+] = $SCT#184095009 "Patient forename (observable entity)"
* familyName 0..1 string "Family name" "Client's family name or last name"
  * obeys IMMZ-C-name-1
  * ^code[+] = IMMZ.C#DE4
  * ^code[+] = $LNC#45394-4 "Last name"
  * ^code[+] = $SCT#184096005 "Patient surname (observable entity)"
* sex 1..1 code "Sex" "Documentation of a specific instance of sex information for the client"
* sex from IMMZ.C.DE5 (required)
  * ^code[+] = IMMZ.C#DE5
  * ^code[+] = $LNC#46098-0 "Sex"
  * ^code[+] = $SCT#184100006 "Patient sex (observable entity)"
* dateOfBirth  1..1 string "Date of birth" "Client's date of birth (DOB) if known; if unknown, use assigned DOB for administrative purposes"
  * ^code[+] = IMMZ.C#DE10
  * ^code[+] = $LNC#21112-8 "Birth date"
  * ^code[+] = $SCT#184099003 "Date of birth (observable entity)"
* age 0..1 string "Age" "The client's calculated age (presented as number of years, months, weeks, days) based on the DOB and the visit date"
  * obeys IMMZ-C-age-1
  * ^code[+] = IMMZ.C#DE13
  * ^code[+] = $LNC#63900-5 "Current age or age at death"
* caregiversMultiple 0..* BackboneElement "Caregivers (multiple)" "Details of the client's caregiver (person) who could be next of kin (e.g. partner, husband, mother, sibling, etc.)"
  * ^code[+] = IMMZ.C#DE14
  * ^code[+] = $SCT#184140000 "Caregiver details (observable entity)"
  * caregiversFullName 0..1 string "Caregiver's full name" "The full name of the client's caregiver"
    * obeys IMMZ-C-name-1
    * ^code[+] = IMMZ.C#DE15
    * ^code[+] = $SCT#184140000 "Caregiver details (observable entity)"
  * caregiversFirstName 0..1 string "Caregiver's first name" "First or given name of the client's caregiver"
    * obeys IMMZ-C-name-1
    * ^code[+] = IMMZ.C#DE16
    * ^code[+] = $LNC#45392-8 "First name"
  * caregiversFamilyName 0..1 string "Caregiver's family name" "Family name or last name of the client's caregiver"
    * obeys IMMZ-C-name-1
    * ^code[+] = IMMZ.C#DE17
    * ^code[+] = $LNC#45394-4 "Last name"
* contactPhoneNumber 1..1 string "Contact phone number" "Client's phone number; can be a landline or a mobile phone number"
  * ^code[+] = IMMZ.C#DE18
  * ^code[+] = $LNC#42077-8 "Patient Phone number"
  * ^code[+] = $SCT#184103008 "Patient telephone number (observable entity)"
* address 1..1 string "Address" "Client's home address or address that the client is consenting to disclose"
  * ^code[+] = IMMZ.C#DE19
  * ^code[+] = $LNC#56799-0 "Address"
  * ^code[+] = $SCT#184097001 "Patient address (observable entity)"

Mapping:    IMMZC4.to.Patient
Source:     IMMZC4
Target:     "http://smart.who.int/immunizations/StructureDefinition/IMMZPatient"
Title:      "Mapping from the IMMZ.C4 to the IMMZPatient profile"

* -> "Patient"
* uniqueIdentifier -> "Patient.identifier.value"
* name -> "Patient.name.text"
* firstName -> "Patient.name.given"
* familyName -> "Patient.name.family"
* sex -> "Patient.gender"
* dateOfBirth -> "Patient.birthDate"
* contactPhoneNumber -> "Patient.telecom.value"
* address -> "Patient.address.text"

Mapping:    IMMZC4.to.RelatedPerson
Source:     IMMZC4
Target:     "http://smart.who.int/immunizations/StructureDefinition/IMMZCaregiver"
Title:      "Mapping from the IMMZ.C4 to the IMMZCaregiver (RelatedPerson) profile"

* caregiversMultiple -> "RelatedPerson"
* caregiversMultiple.caregiversFullName -> "RelatedPerson.name.text"
* caregiversMultiple.caregiversFirstName -> "RelatedPerson.name.given"
* caregiversMultiple.caregiversFamilyName -> "RelatedPerson.name.family"
