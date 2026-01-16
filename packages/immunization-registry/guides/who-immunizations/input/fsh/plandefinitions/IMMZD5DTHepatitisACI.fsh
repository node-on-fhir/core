
Instance: IMMZD5DTHepatitisACI
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D5.DT.Hepatitis A contraindications"
Description: """
IMMZ.D5.DT.Hepatitis A contraindications
Potential contraindications
"""
Usage: #definition

* insert PlanDefMain( IMMZD5DTHepatitisACI, 0.1.0 )
* insert PlanDefMedicationRequestUpdate([[Check for contraindications before administering the vaccine(s) due]], [["""
  Contraindication for HepatitisA immunization
"""]], Live attentuated Hepatitis A-containing vaccine is contraindicated, IMMZD5DTHepatitisAMR, Draft Medication Request ID for HepatitisA dose )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D5.DT.Hepatitis A contraindications.]], [["""
    Show Guidance for the patient regarding IMMZ.D5.DT.Hepatitis A contraindications.
  """]], Has Guidance, Guidance)
