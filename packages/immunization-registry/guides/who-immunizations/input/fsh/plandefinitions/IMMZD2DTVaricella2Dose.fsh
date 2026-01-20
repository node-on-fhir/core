
Instance: IMMZD2DTVaricella2Dose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Varicella.2 doses"
Description: """
IMMZ.D2.DT.Varicella.2 doses
2-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTVaricella2Dose, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Varicella.]], [["""
Determine if the client is due for Varicella vaccine according to the national immunization protocol.
2-dose schedule
"""]], [["""Countries where varicella is an important public health burden could consider introducing 
varicella vaccination in the routine childhood immunization programme. However, resources should be 
sufficient to ensure reaching and sustaining vaccine coverage ≥ 80%. Decision-making on childhood 
varicella vaccination should also include consideration of the possible impact on herpes zoster. 
The number of doses recommended is dependent on the goal of the vaccination programme. One dose is 
sufficient to reduce mortality and severe morbidity from varicella but not to prevent limited virus 
circulation and outbreaks. Two doses have higher effectiveness and should therefore be recommended in 
countries where the programmatic goal is, in addition to decreasing mortality and severe morbidity, to 
further reduce the number of cases and outbreaks.

Depending on the goal of the vaccination programme, 1–2 doses should be given with the first dose administered 
at 12–18 months of age.

Varicella-containing vaccine can be administered concomitantly with other vaccines included in the routine 
childhood immunization programme. Unless given together with other live viral vaccines (measles, MR 
[measles and rubella], MMR [measles, mumps and rubella]), it should be administered at a minimum interval 
of 28 days.

The minimum interval between doses should be as recommended by the manufacturer, ranging from 4 weeks to 3 months.
"""]], Client is due for varicella vaccination, IMMZD2DTVaricellaMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Varicella.2 doses.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Varicella.2 doses.
  """]], Has Guidance, Guidance)
