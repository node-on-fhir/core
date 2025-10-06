
Instance: IMMZD5DTDengueCI
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D5.DT.Dengue contraindications"
Description: """
IMMZ.D5.DT.Dengue contraindications
Potential contraindications
"""
Usage: #definition

* insert PlanDefMain( IMMZD5DTDengueCI, 0.1.0 )
* insert PlanDefMedicationRequestUpdate([[Check for contraindications before administering the vaccine(s) due]], [["""
  Contraindication for Dengue immunization
"""]], Dengue vaccination is contraindicated, IMMZD5DTDengueMR, Draft Medication Request ID for Dengue dose )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D5.DT.Dengue contraindications.]], [["""
    Show Guidance for the patient regarding IMMZ.D5.DT.Dengue contraindications.
  """]], Has Guidance, Guidance)
