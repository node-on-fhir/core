
Instance: IMMZD2DTSeasonalinfluenza2Dose
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Seasonal influenza"
Description: """
IMMZ.D2.DT.Seasonal influenza
Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTSeasonalinfluenza2Dose, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Seasonal influenza.]], [["""
Determine if the client is due for Seasonal influenza vaccine according to the national immunization protocol.
Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
"""]], [["""Influenza vaccines are safe and effective in children from 6 months of age. Children aged under 6 months can be protected through maternal 
immunization during pregnancy. 
Children aged 6 months to 8 years should receive 2 doses at least 4 weeks apart. A single dose is appropriate for those ≥ 9 years of age and healthy adults.
Children aged 6 months to 8 years should receive 2 doses at least 4 weeks apart.
"""]], Client is due for seasonal influenza vaccination, IMMZD2DTSeasonalinfluenzaMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Seasonal influenza.]], [["""
Determine if the client is due for Seasonal influenza vaccine according to the national immunization protocol.
Inactivated trivalent and quadrivalent vaccines, 2-dose schedule
"""]], [["""A single dose is appropriate for children aged ≥ 9 years and healthy adults. Those who have previously 
been vaccinated at least once should subsequently receive an annual dose, as should children and adolescents aged
 9 years or over and healthy adults.
"""]], The primary series is complete. Client is due for seasonal influenza annual dose, IMMZD2DTSeasonalinfluenzaMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Seasonal influenza.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Seasonal influenza.
  """]], Has Guidance, Guidance)
