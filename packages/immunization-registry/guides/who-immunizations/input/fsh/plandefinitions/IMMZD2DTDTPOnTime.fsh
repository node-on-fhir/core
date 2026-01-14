
Instance: IMMZD2DTDTPOnTime
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.DTP.On-time start"
Description: """
IMMZ.D2.DT.DTP.On-time start
DTP vaccination schedule, on-time start (at ≤ 12 months of age)
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTDTPOnTime, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for DTP.]], [["""
    Determine if the client is due for DTP vaccine according to the national immunization protocol.
    DTP vaccination schedule, on-time start (at ≤ 12 months of age)
  """]], [["""A primary series of 3 doses of DTP-containing vaccine is recommended, with the first 
  dose administered as early as 6 weeks of age. Subsequent doses should be given with an interval of at least 4 weeks between doses.
  """]], Client is due for DTP vaccination, IMMZD2DTDTPMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for DTP.]], [["""
    Determine if the client is due for DTP vaccine according to the national immunization protocol.
    DTP vaccination schedule, on-time start (at ≤ 12 months of age)
  """]], [["""Three booster doses of diphtheria toxoid-containing vaccine should be provided during childhood and adolescence. The 
  diphtheria booster doses should be given in combination with tetanus toxoid using the same schedule (i.e at 12–23 months of age, 
  4–7 years of age and 9–15 years of age, using age-appropriate vaccine formulations). Ideally, there should be at least 4 years 
  between booster doses. Member States may update this schedule based on their country context.  For children aged under 7 years, 
  diphtheria and tetanus toxoids and whole-cell pertussis (DTwP) vaccine or diphtheria and tetanus toxoids and acellular pertussis 
  (DTaP) combinations may be used. For children aged 4 years and older, tetanus toxoid, reduced diphtheria toxoid (Td)-containing 
  vaccine may be used and is preferred. From 7 years of age, only Td combinations should be used. Age-appropriate combinations-containing 
  pertussis vaccine with low-dose diphtheria antigen are also available. Only aP-containing vaccines should be used for vaccination of 
  persons aged 7 years and older.  National vaccination schedules can be adjusted within the age limits specified above to enable 
  programmes to tailor their schedules based on local epidemiology, the objectives of the immunization programme, any particular 
  programmatic issues and to better align tetanus vaccination with the immunological requirements of other vaccines (particularly 
  for pertussis and diphtheria).
  """]], Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose, IMMZD2DTDTPTdMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for DTP.]], [["""
    Determine if the client is due for DTP vaccine according to the national immunization protocol.
    DTP vaccination schedule, on-time start (at ≤ 12 months of age)
  """]], [["""Three booster doses of diphtheria toxoid-containing vaccine should be provided during childhood and adolescence. The 
  diphtheria booster doses should be given in combination with tetanus toxoid using the same schedule (i.e at 12–23 months of age, 
  4–7 years of age and 9–15 years of age, using age-appropriate vaccine formulations). Ideally, there should be at least 4 years 
  between booster doses. Member States may update this schedule based on their country context.  For children aged under 7 years, 
  diphtheria and tetanus toxoids and whole-cell pertussis (DTwP) vaccine or diphtheria and tetanus toxoids and acellular pertussis 
  (DTaP) combinations may be used. For children aged 4 years and older, tetanus toxoid, reduced diphtheria toxoid (Td)-containing 
  vaccine may be used and is preferred. From 7 years of age, only Td combinations should be used. Age-appropriate combinations-containing 
  pertussis vaccine with low-dose diphtheria antigen are also available. Only aP-containing vaccines should be used for vaccination of 
  persons aged 7 years and older.  National vaccination schedules can be adjusted within the age limits specified above to enable 
  programmes to tailor their schedules based on local epidemiology, the objectives of the immunization programme, any particular 
  programmatic issues and to better align tetanus vaccination with the immunological requirements of other vaccines (particularly 
  for pertussis and diphtheria).
  """]], Client is due for tetanus and diphtheria booster dose, IMMZD2DTDTPTdMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for DTP.]], [["""
    Determine if the client is due for DTP vaccine according to the national immunization protocol.
    DTP vaccination schedule, on-time start (at ≤ 12 months of age)
  """]], [["""A pertussis booster dose is recommended for children aged 1–6 years, preferably during the second year of life (≥ 6 
  months after last primary dose), unless otherwise indicated by local epidemiology; the contact could also be used to catch up on 
  any missed doses of other vaccines. This schedule should provide protection for at least 6 years for countries using wP-containing 
  vaccine. For countries using aP-containing vaccine, protection may decline appreciably before 6 years of age.  Only aP-containing 
  vaccines should be used for vaccination of persons aged 7 years and over. Although a booster dose in adolescence has been shown to 
  decrease disease in adolescents, this is not generally recommended as a means of controlling pertussis in infants.
  """]], Primary DTP series is complete. Client is due for pertussis booster dose, IMMZD2DTDTPPMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.DTP.On-time start.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.DTP.On-time start.
  """]], Has Guidance, Guidance)
