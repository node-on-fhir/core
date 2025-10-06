Instance: IMMZD2DTHepatitisBBirthDose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Hepatitis B.Birth dose"
Description: """
IMMZ.D2.DT.Hepatitis B.Birth dose
Birth dose administration
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTHepatitisBBirthDose, 0.1.0 )

* insert PlanDefMedicationRequestAction( [[Determine if the client is due for a hepatitis B vaccination according to the national immunization schedule]], [["""
    Determine if the client is due for a hepatitis B vaccination according to the national immunization schedule
    Birth dose administration
  """]], [["""Hepatitis B vaccination is recommended for all children worldwide. Since perinatal or early postnatal transmission 
  is the most important source of chronic hepatitis B virus infection globally, all infants (including low-birth-weight and premature 
  infants) should receive their first dose of hepatitis B-containing vaccine as soon as possible after birth, ideally within 24 hours.  
  If administration within 24 hours is not feasible, a late birth dose has some effectiveness. WHO recommends that all infants receive 
  the late birth dose during the first contact with health-care providers at any time up to the time of the next dose of the primary 
  schedule.
  """]], Client is due for hepatitis B monovalent vaccine, IMMZD2DTHepatitisBMR )

* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Hepatitis B.Birth dose.]], [["""
Show Guidance for the patient regarding IMMZ.D2.DT.Hepatitis B.Birth dose.
"""]], Has Guidance, Guidance)
