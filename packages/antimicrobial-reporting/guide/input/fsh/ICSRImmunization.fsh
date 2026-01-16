Profile: ICSRImmunization
Parent: USCoreImmunization
Id: icsr-immunization
Title: "ICSR Immunization"
Description: "The fields needed to submit an Immunization for a ICSR Report."

* extension contains AgeAtVaccination named ageAtVaccination 0..1 MS
* status MS
* status = #completed (exactly)
* patient MS
* patient only Reference(ICSRPatient)
* manufacturer MS
* location MS
* location only Reference(USCoreLocation)
* lotNumber MS
* expirationDate MS
* site MS
* route MS
* doseQuantity MS
* vaccineCode MS
* vaccineCode from VaccineCodeVS (extensible)


Extension: AgeAtVaccination
Id: icsr-ext-ageatvaccination
Description: "The patient's age when the vaccination was given."
* ^context.type = #element
* ^context.expression = "Immunization"
* value[x] 1..1 MS
* value[x] only Age
