Instance: IMMZD2DTMeaslesOngoingTx
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Measles Ongoing Transmission"
Description: "Countries with ongoing transmission in which the risk of measles mortality remains high (countries that provide first dose of measles-containing vaccine (MCV) at 9 months and second dose of MCV at 15 months)"
Usage: #definition

* insert PlanDefMain( IMMZD2DTMeaslesOngoingTx, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for MCV1 in countries with ongoing transmission.]], [["""
    Determine if the client is due for measles vaccination MCV1 according to the national immunization protocol.
    Countries with ongoing transmission in which the risk of measles mortality remains high.
  """]], [["""In countries with ongoing transmission in which the risk of measles mortality remains high, MCV1 
  should be given at 9 months of age. As a general rule, live vaccines should be given either simultaneously or 
  at intervals of 4 weeks. An exception to this rule is oral poliovirus vaccine (OPV), which can be given at any 
  time before or after measles vaccination without interference in the response to either vaccine.
  """]], Client is due for MCV1, IMMZD2DTMeaslesMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for MCV2 in countries with ongoing transmission.]], [["""
    Determine if the client is due for measles vaccination MCV2 according to the national immunization protocol.
    Countries with ongoing transmission in which the risk of measles mortality remains high.
"""]], [["""In countries with ongoing transmission in which the risk of measles mortality remains high, MCV2 
should be given at 15–18 months. The minimum interval between MCV1 and MCV2 is 4 weeks. As a general rule, 
live vaccines should be given either simultaneously or at intervals of 4 weeks. An exception to this rule is 
OPV, which can be given at any time before or after measles vaccination without interference in the response 
to either vaccine.
"""]], Client is due for MCV2, IMMZD2DTMeaslesMR)
* insert PlanDefCommunicationRequestAction([[Send Guidance for the patient regarding MCV primary series.]], [["""
    Send Guidance for the patient regarding MCV primary series.
  """]], Has Guidance, Guidance)