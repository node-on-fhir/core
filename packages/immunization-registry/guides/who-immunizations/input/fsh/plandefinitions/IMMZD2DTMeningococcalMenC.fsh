
Instance: IMMZD2DTMeningococcalMenC
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine"
Description: """
IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine
Monovalent MenC conjugate vaccine schedule
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTMeningococcalMenC, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Meningococcal.]], [["""
Determine if the client is due for Meningococcal vaccine according to the national immunization protocol.
Monovalent MenC conjugate vaccine schedule
"""]], [["""Children aged 2–11 months require 2 doses administered. 
For monovalent MenC conjugate vaccine, one single intramuscular dose is recommended for children aged ≥ 12 months, 
teenagers and adults. Children aged 2–11 months require 2 doses administered. 
Children aged 2–11 months require 2 doses administered at an interval of at least 2 months.
For monovalent MenC conjugate vaccine, one single intramuscular dose is recommended for children aged ≥ 12 months, teenagers and adults.
It is not yet known whether booster doses will be needed for long-term protection in healthy individuals who received primary vaccination when aged ≥ 12 months. 
"""]], Client is due for meningococcal vaccination, IMMZD2DTMeningococcalMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Meningococcal.]], [["""
Determine if the client is due for Meningococcal vaccine according to the national immunization protocol.
Monovalent MenC conjugate vaccine schedule
"""]], [["""Children aged 2–11 months require 2 doses administered at an interval of at least 2 months and a booster about 1 year after.
"""]], The primary series is complete. Client is due for meningococcal booster dose, IMMZD2DTMeningococcalMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine.
  """]], Has Guidance, Guidance)
