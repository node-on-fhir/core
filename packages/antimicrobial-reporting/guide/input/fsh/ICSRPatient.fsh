Profile: ICSRPatient
Parent: USCorePatient
Id: icsr-patient
Title: "ICSR Patient"
Description: "The fields required to identify a patient for an ICSR Report."
* identifier MS
* name MS
* telecom MS
* gender MS
* birthDate MS
* address MS
* extension contains MilitaryStatus named militaryStatus 0..1 MS

//Patient example
Instance: SampleICSRPatient
InstanceOf: ICSRPatient
Title: "Sample ICSR Report Patient"
Description: "A sample Patient for an ICSR Report."

* identifier.system = "http://hl7.org/fhir/sid/us-ssn"
* identifier.value = "123456789"
* name.given = "Irma"
* name.family = "Black"
* telecom[0].system = #phone
* telecom[0].value = "+ 1-234-653-6558"
* gender = #female
* birthDate = "1998-08-31"
* address.line = "50878 Coleman Ferry"
* address.city = "Montague"
* address.state = "MA"
* address.country = "US"
* extension[militaryStatus].valueCodeableConcept = NCIT#C114854

Extension: MilitaryStatus
Id: icsr-ext-militarystatus
Description: "Information on the military status of the ICSR Patient"
* ^context.type = #element
* ^context.expression = "Patient"
* value[x] 1..1 MS
* value[x] only CodeableConcept
* valueCodeableConcept from PatientMilitaryStatus

/*
	PATIENT OBSERVATION PROFILES
*/
Profile: PatientHeight
Parent: http://hl7.org/fhir/us/core/StructureDefinition/us-core-body-height
Id: icsr-patientheight
Title: "Patient Body Height in cm"
Description: "Patient Body Height in cm"
* valueQuantity.code = #cm

Profile: PatientWeight
Parent: http://hl7.org/fhir/us/core/StructureDefinition/us-core-body-weight
Id: icsr-patientweight
Title: "Patient Body Weight in kg"
Description: "Patient Body Weight in kg"
* valueQuantity.code = #kg

Profile: PatientLastMenstrualPeriod
Parent: http://hl7.org/fhir/us/core/StructureDefinition/us-core-vital-signs
Id: icsr-patientlastmenstrualperiod
Title: "Patient's Date of Last Menstrual Period"
Description: "Patient's Date of Last Menstrual Period"
* code = LOINC#8665-2 "Last Menstrual Period Start Date"
* value[x] only dateTime

Profile: PatientAgeGroup
Parent: Observation
Id: icsr-patientagegroup
Title: "Descriptive Age Group for the Patient"
Description: "A descriptive Age Group for the Patient"
* code 1..1 MS
* code = LOINC#46251-5 "Age group"
* value[x] 1..1 MS
* value[x] only CodeableConcept
* valueCodeableConcept from PatientAgeGroupVS

ValueSet: PatientAgeGroupVS
Title: "Patient Age Group"
Description: "Codes that represent a patient's age group"
* ^experimental = false
* codes from system AgeGroup

ValueSet: PatientMilitaryStatus
Title: "Patient Military Status"
Description: "Codes that represent a patient's military status"
* ^experimental = false
* NCIT#C114854 "Active Duty"
* NCIT#C114857 "Reserve"
* NCIT#C114858 "National Guard"
* NCIT#C114859 "TRICARE Beneficiary"