
Instance: IMMZD18SHepatitisALHAV1
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Hepatitis A.Live attenuated HAV 1-dose schedule"
Description: """
IMMZ.D18.S.Hepatitis A.Live attenuated HAV 1-dose schedule
Live attenuated hepatitis A virus (HAV), 1 dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SHepatitisALHAV1, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Hepatitis A dose 1]], [["""
Provision of the hepatitis A dose 1
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Live vaccines are licensed for individuals aged ≥ 18 months and are administered as a single subcutaneous dose.
"""]], [[Hepatitis A dose 1]], [[Hepatitis A dose 1 Create]])
