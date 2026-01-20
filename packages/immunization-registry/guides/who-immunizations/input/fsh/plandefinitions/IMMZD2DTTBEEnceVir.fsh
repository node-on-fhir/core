
Instance: IMMZD2DTTBEEnceVir
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.TBE.EnceVir"
Description: """
IMMZ.D2.DT.TBE.EnceVir
EnceVir schedule
(In areas where the disease is highly endemic, implying that there is a high individual risk of infection, WHO recommends that vaccination be offered to all age groups, including children					)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTTBEEnceVir, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for TBE.]], [["""
Determine if the client is due for TBE vaccine according to the national immunization protocol.
EnceVir schedule 
(In areas where the disease is highly endemic, implying that there is a high individual risk of infection, 
WHO recommends that vaccination be offered to all age groups, including children)
"""]], [["""The EnceVir vaccine is licensed for use in people aged 3 years and older.
The manufacturer of EnceVir recommends 2 doses given at an interval of 5–7 months. For EnceVir, 
there is a rapid schedule for emergency situations: an interval of 1–2 months between the first 2 doses. 
The manufacturer of EnceVir recommends 2 doses given at an interval of 5-7 months.
The recommended interval is 12 months between the second and third doses.
"""]], Client is due for TBE vaccination, IMMZD2DTTBEMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for TBE.]], [["""
Determine if the client is due for TBE vaccine according to the national immunization protocol.
EnceVir schedule 
(In areas where the disease is highly endemic, implying that there is a high individual risk of infection, 
WHO recommends that vaccination be offered to all age groups, including children)
"""]], [["""Further booster doses are recommended at 3-year intervals.
"""]], Primary series is complete. Client is due for TBE booster dose, IMMZD2DTTBEMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.TBE.EnceVir.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.TBE.EnceVir.
  """]], Has Guidance, Guidance)
