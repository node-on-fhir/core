
Instance: IMMZD2DTCholerarBSover5
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses"
Description: """
IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses
Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTCholerarBSover5, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Cholera.]], [["""
Determine if the client is due for Cholera vaccine according to the national immunization protocol.
Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
"""]], [["""For WC-rBS vaccine (Dukoral), 2 doses should be given to children aged ≥6 years and adults, 
with an interval of 1–6 weeks between doses. If the interval since the last dose ≥ 6 weeks, restart the primary series.

For those aged ≥6 years, if less than 2 years have passed, 1 dose for revaccination. If more than 2 years 
have passed, the primary series of 2 doses should be repeated.
"""]], Client is due for cholera vaccination, IMMZD2DTCholeraMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Cholera.]], [["""
Determine if the client is due for Cholera vaccine according to the national immunization protocol.
Whole cell-recombinant B subunit (WC-rBS) vaccine, 2-dose schedule for clients aged over 5 years
"""]], [["""For those aged ≥6 years, if less than 2 years have passed, 1 dose for revaccination. If more than 2 years 
have passed, the primary series of 2 doses should be repeated.
"""]], Primary series is complete. Client is due for cholera booster dose, IMMZD2DTCholeraMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses.
  """]], Has Guidance, Guidance)
