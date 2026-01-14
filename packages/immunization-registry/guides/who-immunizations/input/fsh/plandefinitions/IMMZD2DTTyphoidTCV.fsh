
Instance: IMMZD2DTTyphoidTCV
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Typhoid.TCV"
Description: """
IMMZ.D2.DT.Typhoid.TCV
Typhoid conjugate vaccine (TCV) schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTTyphoidTCV, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Typhoid.]], [["""
    Determine if the client is due for Typhoid vaccine according to the national immunization protocol.
    Typhoid conjugate vaccine (TCV) schedule
  """]], [["""WHO recommends the TCV as a 0.5 mL single dose for infants and children from 6 months of 
  age and in adults up to 45 years in typhoid endemic regions.
  """]], Client is due for Typhoid vaccination, IMMZD2DTTyphoidMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Typhoid.TCV.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Typhoid.TCV.
  """]], Has Guidance, Guidance)
