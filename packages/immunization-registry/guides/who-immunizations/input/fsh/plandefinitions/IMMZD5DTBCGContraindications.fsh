Instance: IMMZD5DTBCGContraindications
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D5.DT.BCG contraindications"
Description: """
IMMZ.D5.DT.BCG contraindications
IMMZ.D5.DT.BCG contraindications
"""
Usage: #definition

* insert PlanDefMain( IMMZD5DTBCGContraindications, 0.1.0 )

* insert PlanDefMedicationRequestUpdate([[Check for contraindications before administering the vaccine(s) due]], [["""
    Contraindication for BCG immunization
  """]], BCG vaccination is contraindicated, IMMZD5DTBCGMR, Draft Medication Request ID for BCG dose )
* insert PlanDefMedicationRequestUpdate([[Check for contraindications before administering the vaccine(s) due]], [["""
    Contraindication for BCG immunization
  """]], [[Bacille Calmette–Guérin (BCG) vaccination is contraindicated]], IMMZD5DTBCGMR, Draft Medication Request ID for BCG dose )

* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D5.DT.BCG contraindications.]], [["""
Show Guidance for the patient regarding IMMZ.D5.DT.BCG contraindications.
"""]], Has Guidance, Guidance)
