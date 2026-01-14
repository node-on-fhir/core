
Instance: IMMZD2DTCholerarBS2to5
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses"
Description: """
IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses
Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTCholerarBS2to5, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Cholera.]], [["""
Determine if the client is due for Cholera vaccine according to the national immunization protocol.
Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
"""]], [["""For WC-rBS vaccine (Dukoral), 3 doses should be given to children aged 2–5 years of age, with an interval of 1–6 weeks between doses.

For WC-rBS vaccine, children aged 2–5 years revaccination is recommended within 6 months. 
If more than 6 months have passed, the primary series of 3 doses should be repeated.
"""]], Client is due for cholera vaccination, IMMZD2DTCholeraMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Cholera.]], [["""
Determine if the client is due for Cholera vaccine according to the national immunization protocol.
Whole cell-recombinant B subunit (WC-rBS) vaccine, 3-dose schedule for clients aged 2–5 years
"""]], [["""Revaccination is recommended where there is continued risk of Vibrio cholerae infection. For WC-rBS vaccine, 
children aged 2–5 years revaccination is recommended within 6 months. If less than 6 months have passed, 1 dose for revaccination.
"""]], Primary series is complete. Client is due for cholera booster dose, IMMZD2DTCholeraMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses.
  """]], Has Guidance, Guidance)
