
Instance: IMMZD2DTMumps2Dose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Mumps"
Description: """
IMMZ.D2.DT.Mumps
2-dose schedule (countries with mumps in schedule and low transmission of measles)									
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTMumps2Dose, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Mumps.]], [["""
Determine if the client is due for Mumps vaccine according to the national immunization protocol.
2-dose schedule (countries with mumps in schedule and low transmission of measles)
"""]], [["""The first dose of the mumps-containing vaccine (monovalent or MMR [measles, mumps and rubella]) 
should be given at the age of 12–18 months. As a general rule, live vaccines should be given either simultaneously 
or at intervals of 4 weeks.

The age of administration of the second dose may range from the second year of life to age at school entry. 
The minimum interval between the first and the second doses is 1 month. As a general rule, live vaccines 
should be given either simultaneously or at intervals of 4 weeks.
"""]], Client is due for mumps vaccination, IMMZD2DTMumpsMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Mumps.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Mumps.
  """]], Has Guidance, Guidance)
