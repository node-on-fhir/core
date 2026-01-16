
Instance: IMMZD5DTPolioCI
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D5.DT.Polio contraindications"
Description: """
IMMZ.D5.DT.Polio contraindications
Potential contraindications
"""
Usage: #definition

* insert PlanDefMain( IMMZD5DTPolioCI, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D5.DT.Polio contraindications.]], [["""
    Show Guidance for the patient regarding IMMZ.D5.DT.Polio contraindications.
  """]], Has Guidance, Guidance)
* insert PlanDefMedicationRequestUpdate([[Check for contraindications before administering the vaccine(s) due]], [["""
    Contraindication for bOPV immunization
  """]], Poliovirus vaccination with bOPV is contraindicated, IMMZD5DTPolioMR, Draft Medication Request ID for bOPV dose )
