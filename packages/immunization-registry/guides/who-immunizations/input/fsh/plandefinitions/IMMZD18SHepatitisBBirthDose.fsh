Instance: IMMZD18SHepatitisBBirthDose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Hepatitis B.Birth dose schedule"
Description: """
IMMZ.D18.S.Hepatitis B.Birth dose schedule
Birth dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SHepatitisBBirthDose, 0.1.0 )


* insert PlanDefCommunicationRequestAction([[Hepatitis B birth dose]], [["""
Provision of hepatitis B birth dose
Trigger event: Child's birth
Trigger pseudo: 
Trigger date: "Date of birth"
Create condition: All infants should receive a first dose of the hepatitis B-containing vaccine as soon as possible after birth, ideally within 24 hours
"""]], [[Hepatitis B birth dose]], [[Hepatitis B birth dose Create]])
