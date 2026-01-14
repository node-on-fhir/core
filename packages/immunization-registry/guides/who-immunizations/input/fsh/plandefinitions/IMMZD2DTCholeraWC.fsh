
Instance: IMMZD2DTCholeraWC
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Cholera.WC vaccines"
Description: """
IMMZ.D2.DT.Cholera.WC vaccines
Whole-cell (WC) vaccines schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTCholeraWC, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Cholera.]], [["""
Determine if the client is due for Cholera vaccine according to the national immunization protocol.
Whole-cell (WC) vaccines schedule
"""]], [["""For WC vaccines (Shanchol, Euvchol and mORCVAX), 2 doses should be given 14 days apart to individuals aged ≥ 1 year.
"""]], Client is due for cholera vaccination, IMMZD2DTCholeraMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Cholera.]], [["""
Determine if the client is due for Cholera vaccine according to the national immunization protocol.
Whole-cell (WC) vaccines schedule
"""]], [["""Revaccination is recommended where there is continued risk of Vibrio cholerae infection. For WC vaccines, revaccination is recommended after 3 years.
"""]], Primary series is complete. Client is due for cholera booster dose, IMMZD2DTCholeraMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Cholera.]], [["""
Determine if the client is due for Cholera vaccine according to the national immunization protocol.
Whole-cell (WC) vaccines schedule
"""]], [["""Revaccination is recommended where there is continued risk of Vibrio cholerae infection. For WC vaccines, revaccination is recommended after 3 years.
"""]], Client is due for cholera booster dose, IMMZD2DTCholeraMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Cholera.WC vaccines.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Cholera.WC vaccines.
  """]], Has Guidance, Guidance)
