
Instance: IMMZD18SHepatitisAIHAV1
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Hepatitis A.Inactivated HAV 1-dose schedule"
Description: """
IMMZ.D18.S.Hepatitis A.Inactivated HAV 1-dose schedule
Inactivated hepatitis A virus (HAV), 1-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SHepatitisAIHAV1, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Hepatitis A dose 1]], [["""
Provision of the hepatitis A dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: WHO recommends that vaccination against HAV be introduced into national immunization schedules for individuals aged ≥ 12 months.
"""]], [[Hepatitis A dose 1]], [[Hepatitis A dose 1 Create]])
