
Instance: IMMZD2DTTBEFSME
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.TBE.FSME-Immun"
Description: """
IMMZ.D2.DT.TBE.FSME-Immun
FSME-Immun schedule
(In areas where the disease is highly endemic, implying that there is a high individual risk of infection, WHO recommends that vaccination be offered to all age groups, including children)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTTBEFSME, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for TBE.]], [["""
Determine if the client is due for TBE vaccine according to the national immunization protocol.
FSME-Immun schedule 
(In areas where the disease is highly endemic, implying that there is a high 
individual risk of infection, WHO recommends that vaccination be offered to all age groups, including children)
"""]], [["""The vaccines manufactured in Austria and Germany (FSME-Immun and Encepur) can be given from > 1 year of age.
For the vaccines manufactured in Austria and Germany (FSME-Immun and Encepur), an interval of 1–3 months is recommended between the first 2 doses.
"""]], Client is due for TBE vaccination, IMMZD2DTTBEMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for TBE.]], [["""
Determine if the client is due for TBE vaccine according to the national immunization protocol.
FSME-Immun schedule 
(In areas where the disease is highly endemic, implying that there is a high 
individual risk of infection, WHO recommends that vaccination be offered to all age groups, including children)
"""]], [["""For both vaccines (FSME-Immun and Encepur), the manufacturers recommend a booster dose to be administered 
3 years after completion of the primary series. Although there is a strong indication that the spacing of boosters could 
be expanded considerably from the intervals currently recommended by the manufacturers (every 3–5 years), the evidence 
is still insufficient for a definitive recommendation on the optimal frequency and number of booster doses.
"""]], Primary series is complete. Client is due for TBE booster dose, IMMZD2DTTBEMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.TBE.FSME-Immun.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.TBE.FSME-Immun.
  """]], Has Guidance, Guidance)
