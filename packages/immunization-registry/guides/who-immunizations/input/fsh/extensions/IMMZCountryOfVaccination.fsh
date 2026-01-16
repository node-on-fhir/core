Extension: IMMZCountryOfVaccination
Title: "Immunization Country of Vaccination"
Description: "The service delivery country where the vaccine administration occurred"
Context: Immunization.location

* ^experimental = false

* value[x] only CodeableConcept
* value[x] from http://hl7.org/fhir/ValueSet/iso3166-1-3 (required)