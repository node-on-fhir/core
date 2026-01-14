
Instance: IMMZD5DTYellowfeverCI
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D5.DT.Yellow fever contraindications"
Description: """
IMMZ.D5.DT.Yellow fever contraindications
Age
"""
Usage: #definition

* insert PlanDefMain( IMMZD5DTYellowfeverCI, 0.1.0 )
* insert PlanDefMedicationRequestUpdate([[Check for contraindications before administering the vaccine(s) due]], [["""
Contraindication for Yellow fever immunization
"""]], Yellow fever vaccination is contraindicated, IMMZD5DTYellowfeverMR, Draft Medication Request ID for Yellow fever dose )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D5.DT.Yellow fever contraindications.]], [["""
    Show Guidance for the patient regarding IMMZ.D5.DT.Yellow fever contraindications.
  """]], Has Guidance, Guidance)
