
Instance: IMMZD18STyphoidTy21a
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Typhoid.Ty21a schedule"
Description: """
IMMZ.D18.S.Typhoid.Ty21a schedule
Live attenuated Ty21a vaccine, 3-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18STyphoidTy21a, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Typhoid Ty21a primary series]], [["""
Provision of the typhoid Ty21a, 3-dose oral primary series immunization
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: Ty21a – 3-doses to be administered orally every second day from 6 years of age.
"""]], [[Typhoid Ty21a primary series]], [[Typhoid Ty21a primary series Create]])

* insert PlanDefCommunicationRequestAction([[Typhoid booster dose(s): repeat 3-doses series]], [["""
Provision of the typhoid booster dose(s): revaccination
Trigger event: The primary series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Typhoid vaccines")
Trigger date: Latest "Date and time of vaccination" (where "Vaccine type" = "Typhoid vaccines")
Create condition: Revaccination (3-doses) is recommended every 3–7 years for Ty21a.
"""]], [[Typhoid booster dose(s): repeat 3-doses series]], [[Typhoid booster dose(s): repeat 3-doses series Create]])
