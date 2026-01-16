Instance: IMMZD5DTMeaslesCI
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D5.DT.Measles contraindications"
Description: "Check contraindications for Measles vaccine"
Usage: #definition

* insert PlanDefMain( IMMZD5DTMeaslesCI, 0.1.0 )
* insert PlanDefCommunicationRequestAction([[Check for contraindications before administering the vaccine(s) due]], [["""
    Show Guidance for the patient regarding MCV contraindication.
  """]], Has Guidance, Guidance)
* insert PlanDefMedicationRequestUpdate([[Check for contraindications before administering the vaccine(s) due]], [["""
    Contraindication for measles immunization
  """]], Measles vaccination contraindicated, IMMZD5DTMeaslesMR, Draft Medication Request ID for MCV dose )
