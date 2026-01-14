
Instance: IMMZD5DTMumpsCI
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D5.DT.Mumps contraindications"
Description: """
IMMZ.D5.DT.Mumps contraindications
Potential contraindications
"""
Usage: #definition

* insert PlanDefMain( IMMZD5DTMumpsCI, 0.1.0 )
* insert PlanDefMedicationRequestUpdate([[Check for contraindications before administering the vaccine(s) due]], [["""
  Contraindication for Mumps immunization
"""]], Mumps vaccination is contraindicated, IMMZD5DTMumpsMR, Draft Medication Request ID for Mumps dose )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D5.DT.Mumps contraindications.]], [["""
    Show Guidance for the patient regarding IMMZ.D5.DT.Mumps contraindications.
  """]], Has Guidance, Guidance)
