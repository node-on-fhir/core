Profile: AuthorPractitionerRole
Parent: USCorePractitionerRole
Id: icsr-authorpractitionerrole
Title: "PractitionerRole Author"
Description: "The fields needed to specify the reporter of an ICSR Report."
* practitioner only Reference(AuthorPractitioner)
* code 1..1 MS

Profile: AuthorPractitioner
Parent: USCorePractitioner
Id: icsr-authorpractitioner
Title: "Practitioner Author"
Description: "Extra constraints on US Core Practitioner for the reporter of an ICSR Report."
* telecom MS
* address MS

Profile: AuthorRelatedPerson
Parent: RelatedPerson
Id: icsr-authorrelatedperson
Title: "RelatedPerson Author"
Description: "The fields needed to specify the reporter of an ICSR report who is a related person to the patient."
* name MS
* telecom MS
* address MS
* patient MS

Instance: SampleAuthorRole
InstanceOf: AuthorPractitionerRole
Title: "Sample Author Role of ICSR Report"
Description: "The role of the reporter in an ICSR report"
* code = QualificationType#1 "Physician"
* telecom[0].system = #email
* telecom[0].value = "joe@anywhere.com"
* organization.display = "reporter organization"
* location.display = "reporter department"
* practitioner = Reference(SampleAuthorPractitioner)

Instance: SampleAuthorPractitioner
InstanceOf: AuthorPractitioner
Title: "Sample Practitioner Author of ICSR Report"
Description: "The practitioner who is a reporter in an ICSR report"
* identifier.system = "http://hl7.org/fhir/sid/us-npi"
* identifier.value = "123456789"
* name.given = "Joe"
* name.family = "Smith"
* telecom[0].system = #phone
* telecom[0].value = "555-555-5554"
* telecom[1].system = #email
* telecom[1].value = "joe@anywhere.com"
* address.line = "1234 Apple St"
* address.city = "New York"
* address.state = "NY"
* address.country = "US"
* address.postalCode = "11111"

Instance: SampleAuthorRelatedPerson
InstanceOf: AuthorRelatedPerson
Title: "Sample Related Person Author of ICSR Report"
Description: "The related person who is a reporter in an ICSR report"
* name.given = "Joe"
* name.family = "Smith"
* telecom[0].system = #phone
* telecom[0].value = "555-555-5554"
* telecom[1].system = #email
* telecom[1].value = "joe@anywhere.com"
* address.line = "1234 Apple St"
* address.city = "New York"
* address.state = "NY"
* address.country = "US"
* address.postalCode = "11111"
* patient = Reference(SampleICSRPatient)