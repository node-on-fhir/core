
Instance: IMMZD2DTJEIV
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine"
Description: """
IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine
Inactivated Vero cell-derived vaccination schedule (2-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTJEIV, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for JE.]], [["""
Determine if the client is due for JE vaccine according to the national immunization protocol.
Inactivated Vero cell-derived vaccination schedule (2-dose scheme) JE vaccination should be integrated 
into national immunization schedules in all areas where JE is recognized as a public health priority
"""]], [["""Inactivated Vero cell-derived vaccine: Primary series according to manufacturer’s recommendations 
(these vary by product), generally 2 doses at 4-week intervals starting the primary series at ≥ 6 months of age in endemic settings.
"""]], Client is due for JE vaccination, IMMZD2DTJEMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine.
  """]], Has Guidance, Guidance)
