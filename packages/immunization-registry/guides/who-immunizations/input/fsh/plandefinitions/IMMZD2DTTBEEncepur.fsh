
Instance: IMMZD2DTTBEEncepur
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.TBE.Encepur"
Description: """
IMMZ.D2.DT.TBE.Encepur
Encepur schedule
(In areas where the disease is highly endemic, implying that there is a high individual risk of infection, WHO recommends that vaccination be offered to all age groups, including children		)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTTBEEncepur, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for TBE.]], [["""
Determine if the client is due for TBE vaccine according to the national immunization protocol.
Encepur schedule (In areas where the disease is highly endemic, implying that there is a high 
individual risk of infection, WHO recommends that vaccination be offered to all age groups, including children)
"""]], [["""The vaccines manufactured in Austria and Germany (FSME-Immun and Encepur) can be given from > 1 year of age.
For the conventional vaccination schedule the dose interval is 1–3 months between doses 1 and 2. For Encepur, the 
accelerated schedule requires vaccination on days 0 and 14, followed by a third dose delivered 9–12 months later. 
In addition, Encepur may be used on a rapid schedule, with vaccination on days 0, 7 and 21, followed by a fourth dose delivered 12–18 months later.
For the conventional vaccination schedule, the dose interval is 1–3 months between doses 1 and 2.
For Encepur, the requirement is 9–12 months between doses 2 and 3.
"""]], Client is due for TBE vaccination, IMMZD2DTTBEMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for TBE.]], [["""
Determine if the client is due for TBE vaccine according to the national immunization protocol.
Encepur schedule (In areas where the disease is highly endemic, implying that there is a high 
individual risk of infection, WHO recommends that vaccination be offered to all age groups, including children)
"""]], [["""Vaccination against the disease requires a primary series of 3 doses; those who will continue to be at risk 
should probably have ≥1 booster doses. For both vaccines (FSME-Immun and Encepur) the manufacturers recommend a booster 
dose to be administered 3 years after completion of the primary series. 
Vaccination against the disease requires a primary series of 3 doses; those who will continue to be at risk should 
probably have ≥1 booster doses. Although there is a strong indication that the spacing of boosters could be expanded 
considerably from the intervals currently recommended by the manufacturers (every 3–5 years), the evidence is still
insufficient for a definitive recommendation on the optimal frequency and number of booster doses.
"""]], The primary series is complete, IMMZD2DTTBEMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.TBE.Encepur.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.TBE.Encepur.
  """]], Has Guidance, Guidance)
