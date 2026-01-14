
Instance: IMMZD2DTDengueNoScreen
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening"
Description: """
IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening
CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTDengueNoScreen, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Dengue.]], [["""
Determine if the client is due for Dengue vaccine according to the national immunization protocol.
CYD-TDV (Dengvaxia), 3-dose schedule without pre-vaccination screening [when pre-vaccination screening is not feasible and in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years]
"""]], [["""Currently, the dengue vaccine should be used within the indicated age range, which in 
most countries is 9–45 years. 

If pre-vaccination screening is not feasible, vaccination without individual screening could be 
considered in areas with recent documentation of seroprevalence rates of at least 80% by age 9 
years. Communication needs to ensure appropriate and full disclosure of the risks of vaccination 
of persons with unknown serostatus.

CYD-TDV is recommended as a 3-dose series given 6 months apart. Should a vaccine dose be delayed 
for any reason, it is not necessary to restart the course and the next dose in the series should 
be administered as soon as possible.
"""]], Client is due for dengue vaccination, IMMZD2DTDengueMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening.
  """]], Has Guidance, Guidance)
