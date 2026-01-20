
Instance: IMMZD5DTRotavirusCI
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D5.DT.Rotavirus contraindications"
Description: """
IMMZ.D5.DT.Rotavirus contraindications
Potential contraindications
"""
Usage: #definition

* insert PlanDefMain( IMMZD5DTRotavirusCI, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D5.DT.Rotavirus contraindications.]], [["""
    Show Guidance for the patient regarding IMMZ.D5.DT.Rotavirus contraindications.
  """]], Has Guidance, Guidance)
* insert PlanDefMedicationRequestUpdate([[Check for contraindications before administering the vaccine(s) due]], [["""
    Contraindication for Rotavirus immunization
  """]], Rotavirus vaccination is contraindicated, IMMZD5DTRotavirusMR, Draft Medication Request ID for Rotavirus dose )
