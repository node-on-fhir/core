
Instance: IMMZD5DTRubellaCI
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D5.DT.Rubella contraindications"
Description: """
IMMZ.D5.DT.Rubella contraindications
Potential contraindications
"""
Usage: #definition

* insert PlanDefMain( IMMZD5DTRubellaCI, 0.1.0 )
* insert PlanDefMedicationRequestUpdate([[Check for contraindications before administering the vaccine(s) due]], [["""
    Contraindication for rubella immunization
  """]], Rubella vaccination is contraindicated, IMMZD5DTRubellaMR, Draft Medication Request ID for Rubella dose )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D5.DT.Rubella contraindications.]], [["""
    Show Guidance for the patient regarding IMMZ.D5.DT.Rubella contraindications.
  """]], Has Guidance, Guidance)
