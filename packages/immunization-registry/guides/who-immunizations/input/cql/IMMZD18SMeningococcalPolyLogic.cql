
/*
 * Library: IMMZD18SMeningococcalPolyLogic (IMMZ.D18.S.Meningococcal.Polysaccharide vaccines schedule)
 * Schedule Table: Polysaccharide vaccines, 1-dose and booster dose schedule
 */
library IMMZD18SMeningococcalPolyLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTMeningococcalEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Meningococcal dose 1
@description: Provision of the meningococcal dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Meningococcal dose 1":
  Encounter."No meningococcal primary series dose was administered"
  and not "One meningococcal dose from primary series was administered. The primary series has been completed"

/*
@output: Meningococcal dose 1 Create
@create: Polysaccharide vaccines should be administered to individuals aged ≥ 2 years.
*/
define "Meningococcal dose 1 Create":
  if "Meningococcal dose 1" 
  then 'Polysaccharide vaccines should be administered to individuals aged ≥ 2 years.' + '
Due Date: ' + ToString("Meningococcal dose 1 Due Date")
  else ''

/*
@dynamicValue: Meningococcal dose 1 Due Date
@pseudocode: "Date of birth" + 2 years
*/
define "Meningococcal dose 1 Due Date":
  if "Meningococcal dose 1" then Patient.birthDate + 2 years
  else null

/*
@dynamicValue: Meningococcal dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Meningococcal dose 1 Overdue":
  null

/*
@dynamicValue: Meningococcal dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Meningococcal dose 1 Expiration":
  null
  
/*
@complete: One meningococcal dose from primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" (where "Vaccine type" = "Meningococcal vaccines") = TRUE
*/
define "One meningococcal dose from primary series was administered. The primary series has been completed":
  Encounter."One meningococcal primary series dose was administered"

/*
@output: Meningococcal booster dose
@description: Provision of the meningococcal booster dose
@trigger: Primary series has been completed
"Completed the primary vaccination series" (where "Vaccine type" = "Meningococcal vaccines") = TRUE
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines")
*/
define "Meningococcal booster dose":
  "One meningococcal dose from primary series was administered. The primary series has been completed"
  and not "Meningococcal booster dose was administered. The immunization schedule has been completed"

/*
@output: Meningococcal booster dose Create
@create: One booster 3–5 years after the primary dose may be given to persons considered to be a continued high risk of exposure, including some health workers.
*/
define "Meningococcal booster dose Create":
  if "Meningococcal booster dose" 
  then 'One booster 3–5 years after the primary dose may be given to persons considered to be a continued high risk of exposure, including some health workers.' + '
Due Date: ' + ToString("Meningococcal booster dose Due Date") + '
Overdue: ' + ToString("Meningococcal booster dose Overdue")
  else ''

/*
@dynamicValue: Meningococcal booster dose Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") + 3 years
*/
define "Meningococcal booster dose Due Date":
  if "Meningococcal booster dose" then Encounter."Date of Latest Meningococcal Dose" + 3 years
  else null

/*
@dynamicValue: Meningococcal booster dose Overdue
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") + 5 years
*/
define "Meningococcal booster dose Overdue":
  if "Meningococcal booster dose" then Encounter."Date of Latest Meningococcal Dose" + 5 years
  else null

/*
@dynamicValue: Meningococcal booster dose Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Meningococcal booster dose Expiration":
  null
  
/*
@complete: Meningococcal booster dose was administered. The immunization schedule has been completed
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines" AND "Type of dose" = "Booster dose") = 1
*/
define "Meningococcal booster dose was administered. The immunization schedule has been completed":
  Encounter."Meningococcal booster dose was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '68.1' then "Meningococcal dose 1"
    when Patient.id = '69.01' then "Meningococcal dose 1"
    when Patient.id = '70.02' then "Meningococcal booster dose"
    when Patient.id = '71.023' then "Meningococcal booster dose"
    when Patient.id = '72.023' then "Meningococcal booster dose was administered. The immunization schedule has been completed"
    else 'No test case set'
  end
