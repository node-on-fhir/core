
Instance: IMMZD2DTTyphoidVIPS
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Typhoid.ViPS"
Description: """
IMMZ.D2.DT.Typhoid.ViPS
Unconjugated Vi polysaccharide (ViPS) schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTTyphoidVIPS, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Typhoid.]], [["""
    Determine if the client is due for Typhoid vaccine according to the national immunization protocol.
    Unconjugated Vi polysaccharide (ViPS) schedule
  """]], [["""Countries may consider the routine use of ViPS vaccine in individuals aged 2 years and older.
  """]], Client is due for Typhoid vaccination, IMMZD2DTTyphoidMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Typhoid.]], [["""
    Determine if the client is due for Typhoid vaccine according to the national immunization protocol.
    Unconjugated Vi polysaccharide (ViPS) schedule
  """]], [["""Revaccination is recommended every 3 years for ViPS.
  """]], Primary series is complete. Client is due for typhoid booster dose, IMMZD2DTTyphoidMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Typhoid.ViPS.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Typhoid.ViPS.
  """]], Has Guidance, Guidance)
