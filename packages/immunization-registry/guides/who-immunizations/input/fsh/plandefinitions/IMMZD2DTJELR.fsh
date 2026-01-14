
Instance: IMMZD2DTJELR
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.JE.Live recombinant vaccine"
Description: """
IMMZ.D2.DT.JE.Live recombinant vaccine
Live recombinant vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTJELR, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for JE.]], [["""
Determine if the client is due for JE vaccine according to the national immunization protocol.
Live recombinant vaccination schedule (1-dose scheme) 
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
"""]], [["""Live recombinant vaccine: Single dose administered at ≥ 9 months of age. As a general rule, any live vaccine may be 
given either simultaneously or at an interval of 4 weeks.
"""]], Client is due for JE vaccination, IMMZD2DTJEMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.JE.Live recombinant vaccine.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.JE.Live recombinant vaccine.
  """]], Has Guidance, Guidance)
