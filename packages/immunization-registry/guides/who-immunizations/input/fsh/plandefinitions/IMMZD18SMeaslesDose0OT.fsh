
Instance: IMMZD18SMeaslesDose0OT
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D18.S.Measles.MCV dose 0 schedule"
Description: """
IMMZ.D18.S.Measles.MCV dose 0 schedule
Measles-containing vaccine dose 0 (MCV0) schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD18SMeaslesDose0OT, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[MCV0]], [["""
Provision of the MCV0
Trigger event: Child's birth
Trigger date: "Date of birth"
Create condition: In the following situations, a supplementary dose of MCV should be given to infants from 6 months of age: 
• during a measles outbreak as part of intensified service delivery;
• during campaigns in settings where the risk of measles among infants aged under 9 months remains high (e.g. in endemic countries experiencing regular outbreaks);
• for internally displaced populations and refugees, and populations in conflict zones;
• for individual infants at high risk of contracting measles (e.g. contacts of known measles cases or in settings with increased risk of exposure during outbreaks such as day-care facilities);
• for infants travelling to countries experiencing measles outbreaks;
• for infants known to be HIV-infected or exposed (i.e. born to a woman infected with HIV).
"""]], [[MCV0]], [[MCV0 Create]])
