
/*
 * Library: IMMZD18SVaricella1DoseLogic (IMMZ.D18.S.Varicella.1-dose schedule)
 * Schedule Table: 1-dose schedule
 */
library IMMZD18SVaricella1DoseLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTVaricellaEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Varicella dose 1
@description: Provision of the varicella dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Varicella dose 1":
  Encounter."No varicella primary series dose was administered"
  and not "One varicella dose from primary series was administered. The primary series has been completed"

/*
@output: Varicella dose 1 Create
@create: Depending on the goal of the vaccination programme, 1–2 doses should be given with the first dose administered at 12–18 months of age.
*/
define "Varicella dose 1 Create":
  if "Varicella dose 1" 
  then 'Depending on the goal of the vaccination programme, 1–2 doses should be given with the first dose administered at 12–18 months of age.' + '
Due Date: ' + ToString("Varicella dose 1 Due Date") + '
Overdue: ' + ToString("Varicella dose 1 Overdue")
  else ''

/*
@dynamicValue: Varicella dose 1 Due Date
@pseudocode: "Date of birth" + 12 months
*/
define "Varicella dose 1 Due Date":
  if "Varicella dose 1" then Patient.birthDate + 12 months
  else null

/*
@dynamicValue: Varicella dose 1 Overdue
@pseudocode: "Date of birth" + 18 months
*/
define "Varicella dose 1 Overdue":
  if "Varicella dose 1" then Patient.birthDate + 18 months
  else null

/*
@dynamicValue: Varicella dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Varicella dose 1 Expiration":
  null
  
/*
@complete: One varicella dose from primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Varicella-containing vaccines")
*/
define "One varicella dose from primary series was administered. The primary series has been completed":
  Encounter."One varicella primary series dose was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '09.2' then "Varicella dose 1"
    when Patient.id = '10.123' then "Varicella dose 1"
    when Patient.id = '11.123' then "Varicella dose 1"
    when Patient.id = '12.1' then "One varicella dose from primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
