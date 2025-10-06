
Instance: IMMZD2DTRabiesPrEP
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Rabies"
Description: """
IMMZ.D2.DT.Rabies
Pre-exposure prophylaxis (PrEP), 2-dose scheme; high risk of rabies virus exposure
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTRabiesPrEP, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Rabies.]], [["""
Determine if the client is due for Rabies vaccine according to the national immunization protocol.
Pre-exposure prophylaxis (PrEP), 2-dose scheme; high risk of rabies virus exposure
"""]], [["""The schedule is for a 2-site intradermal vaccine administered on days 0 and 7. 
If intramuscular administration is used, WHO recommends a 1-site intramuscular vaccine administration on days 0 and 7.

Note: This PrEP dose is recommended for individuals at high risk of rabies virus exposure. These include subpopulations 
in highly endemic settings with limited access to timely and adequate PrEP, individuals at occupational risk and travellers 
who may be at risk of exposure. WHO recommendations apply only to inactivated modern, concentrated, purified cell culture and 
embryonated egg-based rabies vaccines (CCEEVs).

PrEP schedule: 2-site intradermal vaccine administered on days 0 and 7. If intramuscular administration is used, WHO 
recommends a 1-site intramuscular vaccine administration on days 0 and 7.

If any doses are delayed, vaccination should be resumed, not restarted. A change in the route of administration or in 
vaccine product during a course is acceptable if such a change is unavoidable.
The schedule is for a 2-site intradermal vaccine administered on days 0 and 7. If intramuscular administration is used, 
WHO recommends a 1-site intramuscular vaccine administration on days 0 and 7.
"""]], Client is due for rabies vaccination, IMMZD2DTRabiesMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Rabies.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Rabies.
  """]], Has Guidance, Guidance)
