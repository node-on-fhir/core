
Instance: IMMZD2DTYellowfever
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Yellow fever"
Description: """
IMMZ.D2.DT.Yellow fever
IMMZ.D2.DT.Yellow fever
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTYellowfever, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Yellow fever.]], [["""
Determine if the client is due for Yellow fever vaccine according to the national immunization protocol.
"""]], [["""In endemic countries, it is recommended that yellow fever vaccine be given to children aged 
9–12 months at the same time as the measles vaccine. Preventive mass vaccination campaigns are recommended 
for inhabitants of areas at risk of yellow fever where there is low vaccination coverage.

Vaccination should be provided to everyone aged 9 months and older in any area with reported cases.

Vaccination should also be offered if the individual is travelling to and from at-risk areas, if not contraindicated.

As a general rule, any live vaccine may be given either simultaneously or at an interval of 4 weeks. Oral 
poliovirus vaccine may be given at any time in relation to yellow fever vaccination. 
"""]], Client is due for yellow fever vaccination, IMMZD2DTYellowfeverMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Yellow fever.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Yellow fever.
  """]], Has Guidance, Guidance)
