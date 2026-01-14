
Instance: IMMZD2DTDengueSeropos
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening"
Description: """
IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening
CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTDengueSeropos, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Dengue.]], [["""
Determine if the client is due for Dengue vaccine according to the national immunization protocol.
CYD-TDV (Dengvaxia), 3-dose schedule with pre-vaccination screening, the recommended strategy where 
feasible (pre-vaccination screening whereby only those tested seropositive would be vaccinated)
"""]], [["""Currently, the dengue vaccine should be used within the indicated age range, which in most countries is 9–45 years. 

Because of the excess risk of hospitalized dengue identified among seronegative trial 
participants who became infected after vaccination, the WHO Global Advisory Committee on Vaccine 
Safety (GACVS) concluded that individuals who have not been infected with the wild dengue virus 
(i.e. who are seronegative) should not be vaccinated with CYD-TDV (Dengvaxia).

If pre-vaccination screening is not feasible, vaccination without individual screening could be 
considered in areas with recent documentation of seroprevalence rates of at least 80% by age 9 years. 
Communication needs to ensure appropriate and full disclosure of the risks of vaccination of persons 
with unknown serostatus.

Pre-vaccination screening is necessary to avoid vaccinating truly seronegative persons.

CYD-TDV is recommended as a 3-dose series given 6 months apart. Should a vaccine dose be delayed for any reason, it is not 
necessary to restart the course and the next dose in the series should be administered as soon as possible.
"""]], Client is due for dengue vaccination, IMMZD2DTDengueMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening.
  """]], Has Guidance, Guidance)
