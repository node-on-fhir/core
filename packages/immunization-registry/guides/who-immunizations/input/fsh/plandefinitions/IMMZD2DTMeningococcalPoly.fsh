
Instance: IMMZD2DTMeningococcalPoly
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines"
Description: """
IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines
Polysaccharide vaccines schedule
(Polysaccharide vaccines can be used to control outbreaks in countries where limited economic resources or insufficient supply restrict the use of meningococcal conjugate vaccines)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTMeningococcalPoly, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for Meningococcal.]], [["""
Determine if the client is due for Meningococcal vaccine according to the national immunization protocol.
Polysaccharide vaccines schedule 
(Polysaccharide vaccines can be used to control outbreaks in countries where limited economic resources 
or insufficient supply restrict the use of meningococcal conjugate vaccines)
"""]], [["""Polysaccharide vaccines should be administered to individuals aged ≥ 2 years as one single dose.
One booster 3–5 years after the primary dose may be given to persons considered to be a continued high risk of exposure, including some health workers.
"""]], Client is due for meningococcal vaccination, IMMZD2DTMeningococcalMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines.
  """]], Has Guidance, Guidance)
