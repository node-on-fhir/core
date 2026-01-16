/*
 * Library: IMMZD18SBCGLogic (IMMZ.D18.S.BCG schedule)
 * Schedule Table: IMMZ.D18.S.BCG schedule
 */
library IMMZD18SBCGLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTBCGEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Bacille Calmette–Guérin (BCG) dose 1
@description: Provision of the BCG dose
@trigger: Child's birth
@pseudo: 
@triggerDate: "Date of birth"
*/
define "Bacille Calmette–Guérin (BCG) dose 1":
  not "One BCG dose from the primary series was administered. The primary series has been completed"


/*
@output: Bacille Calmette–Guérin (BCG) dose 1 Create
@create: BCG dose should be provided if the client has not received any BCG doses and is in a high incidence of tuberculosis (TB) and/or high leprosy burden. It should also be provided after a negative test result for tuberculin skin test (TST) or interferon-gamma release assay (IGRA) tests. The client should also receive vaccination if they are infected with HIV, on antiretroviral therapy (ART) and clinically well and immunologically stable. This dose also applies to neonates born to women with an unknown HIV status, as well as neonates with an unknown HIV status who were born to women infected with HIV.
*/
define "Bacille Calmette–Guérin (BCG) dose 1 Create":
  if "Bacille Calmette–Guérin (BCG) dose 1"
  then 'BCG dose should be provided if the client has not received any BCG doses and is in a high incidence of tuberculosis (TB) and/or high leprosy burden. It should also be provided after a negative test result for tuberculin skin test (TST) or interferon-gamma release assay (IGRA) tests. The client should also receive vaccination if they are infected with HIV, on antiretroviral therapy (ART) and clinically well and immunologically stable. This dose also applies to neonates born to women with an unknown HIV status, as well as neonates with an unknown HIV status who were born to women infected with HIV.' + '
Due Date: ' + ToString("Bacille Calmette–Guérin (BCG) dose 1 Due Date")
  else ''


/*
@dynamicValue: Bacille Calmette–Guérin (BCG) dose 1 Due Date
@pseudocode: "Date of birth"
*/
define "Bacille Calmette–Guérin (BCG) dose 1 Due Date":
  Patient.birthDate


/*
@dynamicValue: Bacille Calmette–Guérin (BCG) dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated
*/
define "Bacille Calmette–Guérin (BCG) dose 1 Overdue":
  null


/*
@dynamicValue: Bacille Calmette–Guérin (BCG) dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated
*/
define "Bacille Calmette–Guérin (BCG) dose 1 Expiration":
  null

  
/*
@complete: One BCG dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "BCG vaccines")
*/
define "One BCG dose from the primary series was administered. The primary series has been completed":
  Encounter."One BCG primary series dose was administered"



/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = 'BCG07.4' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG08.4' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG09.6' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG10.6' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG11.5' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG12.4' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG13.5' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG14.5' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG15.4' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG16.4' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG17.5' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG18.5' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG19.7' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG20.7' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG21.4' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG22.5' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG23.5' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG24.4' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG25.4' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG26.5' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG27.5' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG28.7' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG29.7' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG30.4' then "Bacille Calmette–Guérin (BCG) dose 1"
    when Patient.id = 'BCG31.1' then not "Bacille Calmette–Guérin (BCG) dose 1"
      and "One BCG dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
