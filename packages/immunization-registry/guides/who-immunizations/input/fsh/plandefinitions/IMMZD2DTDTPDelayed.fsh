
Instance: IMMZD2DTDTPDelayed
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "IMMZ.D2.DT.DTP.Delayed or interrupted series"
Description: """
IMMZ.D2.DT.DTP.Delayed or interrupted series
DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
"""
Usage: #definition

* insert PlanDefMain( IMMZD2DTDTPDelayed, 0.1.0 )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for DTP.]], [["""
    Determine if the client is due for DTP vaccine according to the national immunization protocol.
    DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age"""]], [["""Delayed or interrupted DTP-containing series: for children whose vaccination series has been interrupted, 
  the series should be resumed without repeating previous doses. Children aged between 1 year and 7 years who have not 
  previously been vaccinated should receive 3 doses of vaccine following a 0, 1, 6-month schedule. Two subsequent booster 
  doses using tetanus toxoid with reduced diphtheria toxoid (Td) or Td with acellular pertussis (TdaP) combination vaccines 
  are needed with an interval of at least 1 year between doses.  For those starting a tetanus and diphtheria-containing 
  vaccination series in adolescence or adulthood: from 7 years of age only Td combinations should be used. Age-appropriate 
  combinations-containing pertussis vaccine with reduced diphtheria toxoid are also available. If tetanus vaccination is 
  started during adolescence or adulthood, a total of only 5 appropriately spaced doses are required to obtain lifelong 
  protection.  Pregnant women and their newborn infants are protected from birth-associated tetanus if the mother received 
  either 6 tetanus-containing vaccine doses during childhood or 5 doses if first vaccinated during adolescence/adulthood 
  (documented by card, immunization registry and/or history) before the time of reproductive age. Vaccination history should 
  be verified in order to determine whether a dose of tetanus-containing vaccine is needed in the current pregnancy.  In 
  countries where maternal and neonatal tetanus remains a public health problem, pregnant women for whom reliable information 
  on previous tetanus vaccinations is not available should receive at least 2 doses of tetanus-containing vaccines, preferably 
  Td, with an interval of at least 4 weeks between doses and the second dose at least 2 weeks before the birth. To ensure 
  protection for a minimum of 5 years, a third dose should be given at least 6 months later. A fourth and fifth dose should 
  be given at intervals of at least 1 year, or in subsequent pregnancies, in order to ensure lifelong protection.  In 
  countries where maternal and neonatal tetanus is not a public health problem (low prevalence/high-income settings), 
  policy-makers may choose not to include tetanus vaccination among antenatal care interventions if effective tetanus 
  immunization programmes and good post-exposure prophylaxis exist outside of pregnancy. In countries where maternal 
  and neonatal tetanus is not a public health problem, the strategy may be to protect against tetanus via the infant 
  (3 DTP-containing vaccinations) and boosters programme. For more information, see the WHO guide Protecting all against 
  tetanus (5).  For children aged under 7 years, diphtheria and tetanus toxoids and whole-cell pertussis (DTwP) or DTaP 
  combinations may be used. For children aged 4 years and older, Td-containing vaccine may be used and is preferred. For 
  children aged 7 years and older, only Td combinations should be used. Age-appropriate combinations-containing pertussis 
  vaccine with low-dose diphtheria antigen are also available. Only aP-containing vaccines should be used for vaccination 
  of persons aged 7 years and older.
  """]], Client is due for DTP vaccination, IMMZD2DTDTPMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for DTP.]], [["""
    Determine if the client is due for DTP vaccine according to the national immunization protocol.
    DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age"""]], [["""Delayed or interrupted DTP-containing series: for children whose vaccination series has been interrupted, 
  the series should be resumed without repeating previous doses. Children aged between 1 year and 7 years who have not 
  previously been vaccinated should receive 3 doses of vaccine following a 0, 1, 6-month schedule. Two subsequent booster 
  doses using tetanus toxoid with reduced diphtheria toxoid (Td) or Td with acellular pertussis (TdaP) combination vaccines 
  are needed with an interval of at least 1 year between doses.  For those starting a tetanus and diphtheria-containing 
  vaccination series in adolescence or adulthood: from 7 years of age only Td combinations should be used. Age-appropriate 
  combinations-containing pertussis vaccine with reduced diphtheria toxoid are also available. If tetanus vaccination is 
  started during adolescence or adulthood, a total of only 5 appropriately spaced doses are required to obtain lifelong 
  protection.  Pregnant women and their newborn infants are protected from birth-associated tetanus if the mother received 
  either 6 tetanus-containing vaccine doses during childhood or 5 doses if first vaccinated during adolescence/adulthood 
  (documented by card, immunization registry and/or history) before the time of reproductive age. Vaccination history should 
  be verified in order to determine whether a dose of tetanus-containing vaccine is needed in the current pregnancy.  In 
  countries where maternal and neonatal tetanus remains a public health problem, pregnant women for whom reliable information 
  on previous tetanus vaccinations is not available should receive at least 2 doses of tetanus-containing vaccines, preferably 
  Td, with an interval of at least 4 weeks between doses and the second dose at least 2 weeks before the birth. To ensure 
  protection for a minimum of 5 years, a third dose should be given at least 6 months later. A fourth and fifth dose should 
  be given at intervals of at least 1 year, or in subsequent pregnancies, in order to ensure lifelong protection.  In 
  countries where maternal and neonatal tetanus is not a public health problem (low prevalence/high-income settings), 
  policy-makers may choose not to include tetanus vaccination among antenatal care interventions if effective tetanus 
  immunization programmes and good post-exposure prophylaxis exist outside of pregnancy. In countries where maternal 
  and neonatal tetanus is not a public health problem, the strategy may be to protect against tetanus via the infant 
  (3 DTP-containing vaccinations) and boosters programme. For more information, see the WHO guide Protecting all against 
  tetanus (5).  For children aged under 7 years, diphtheria and tetanus toxoids and whole-cell pertussis (DTwP) or DTaP 
  combinations may be used. For children aged 4 years and older, Td-containing vaccine may be used and is preferred. For 
  children aged 7 years and older, only Td combinations should be used. Age-appropriate combinations-containing pertussis 
  vaccine with low-dose diphtheria antigen are also available. Only aP-containing vaccines should be used for vaccination 
  of persons aged 7 years and older.
  """]], Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose, IMMZD2DTDTPTdMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for DTP.]], [["""
    Determine if the client is due for DTP vaccine according to the national immunization protocol.
    DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age"""]], [["""Delayed or interrupted DTP-containing series: for children whose vaccination series has been interrupted, 
  the series should be resumed without repeating previous doses. Children aged between 1 year and 7 years who have not 
  previously been vaccinated should receive 3 doses of vaccine following a 0, 1, 6-month schedule. Two subsequent booster 
  doses using tetanus toxoid with reduced diphtheria toxoid (Td) or Td with acellular pertussis (TdaP) combination vaccines 
  are needed with an interval of at least 1 year between doses.  For those starting a tetanus and diphtheria-containing 
  vaccination series in adolescence or adulthood: from 7 years of age only Td combinations should be used. Age-appropriate 
  combinations-containing pertussis vaccine with reduced diphtheria toxoid are also available. If tetanus vaccination is 
  started during adolescence or adulthood, a total of only 5 appropriately spaced doses are required to obtain lifelong 
  protection.  Pregnant women and their newborn infants are protected from birth-associated tetanus if the mother received 
  either 6 tetanus-containing vaccine doses during childhood or 5 doses if first vaccinated during adolescence/adulthood 
  (documented by card, immunization registry and/or history) before the time of reproductive age. Vaccination history should 
  be verified in order to determine whether a dose of tetanus-containing vaccine is needed in the current pregnancy.  In 
  countries where maternal and neonatal tetanus remains a public health problem, pregnant women for whom reliable information 
  on previous tetanus vaccinations is not available should receive at least 2 doses of tetanus-containing vaccines, preferably 
  Td, with an interval of at least 4 weeks between doses and the second dose at least 2 weeks before the birth. To ensure 
  protection for a minimum of 5 years, a third dose should be given at least 6 months later. A fourth and fifth dose should 
  be given at intervals of at least 1 year, or in subsequent pregnancies, in order to ensure lifelong protection.  In 
  countries where maternal and neonatal tetanus is not a public health problem (low prevalence/high-income settings), 
  policy-makers may choose not to include tetanus vaccination among antenatal care interventions if effective tetanus 
  immunization programmes and good post-exposure prophylaxis exist outside of pregnancy. In countries where maternal 
  and neonatal tetanus is not a public health problem, the strategy may be to protect against tetanus via the infant 
  (3 DTP-containing vaccinations) and boosters programme. For more information, see the WHO guide Protecting all against 
  tetanus (5).  For children aged under 7 years, diphtheria and tetanus toxoids and whole-cell pertussis (DTwP) or DTaP 
  combinations may be used. For children aged 4 years and older, Td-containing vaccine may be used and is preferred. For 
  children aged 7 years and older, only Td combinations should be used. Age-appropriate combinations-containing pertussis 
  vaccine with low-dose diphtheria antigen are also available. Only aP-containing vaccines should be used for vaccination 
  of persons aged 7 years and older.
  """]], Client is due for tetanus and diphtheria booster dose, IMMZD2DTDTPTdMR )
* insert PlanDefMedicationRequestAction( [[Determine if the client is due for DTP.]], [["""
    Determine if the client is due for DTP vaccine according to the national immunization protocol.
    DTP vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age"""]], [[""" The duration of protection following primary immunization varies considerably 
    depending upon factors such as local epidemiology, vaccination schedule and choice of vaccine. Therefore, a booster 
    dose is recommended for children aged 1–6 years, preferably during the second year of life (≥ 6 months after last 
    primary dose), unless otherwise indicated by local epidemiology; the contact could also be used to catch up on any 
    missed doses of other vaccines.  This schedule should provide protection for at least 6 years for countries using 
    wP-containing vaccine. For countries using aP-containing vaccine, protection may decline appreciably before 6 years 
    of age. Only aP-containing vaccines should be used for vaccination of persons aged 7 years and older.  Although a 
    booster dose in adolescence was shown to decrease disease in adolescents, this is not generally recommended as a 
    means of controlling pertussis in infants. A decision to introduce adolescent and/or adult boosters should only 
    be taken after careful assessment of local epidemiology, estimation of the contribution of adolescents as source 
    of infections of young infants, and selection of adolescents and/or adults as target groups for vaccination. Decisions 
    concerning such programmes should be based on the incidence and cost–effectiveness data. High coverage of routine 
    immunization in infants must be in place prior to the introduction of vaccination of adolescents and adults. 
  """]], Primary DTP series is complete. Client is due for pertussis booster dose, IMMZD2DTDTPPMR )
* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding IMMZ.D2.DT.DTP.Delayed or interrupted series.]], [["""
    Show Guidance for the patient regarding IMMZ.D2.DT.DTP.Delayed or interrupted series.
  """]], Has Guidance, Guidance)
