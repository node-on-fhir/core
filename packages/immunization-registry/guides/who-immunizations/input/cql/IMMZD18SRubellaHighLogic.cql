
/*
 * Library: IMMZD18SRubellaHighLogic (IMMZ.D18.S.Rubella.High incidence schedule)
 * Schedule Table: Schedule for countries with high incidence and mortality from rubella
 */
library IMMZD18SRubellaHighLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTRubellaEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Rubella dose 1
@description: Provision of the rubella dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Rubella dose 1":
  Encounter."No rubella primary series dose was administered"
  and not "One rubella dose from the primary series was administered. The primary series has been completed"

/*
@output: Rubella dose 1 Create
@create: Rubella dose 1 should be provided if the client's age is at least 9 months
*/
define "Rubella dose 1 Create":
  if "Rubella dose 1" 
  then 'Rubella dose 1 should be provided if the client\'s age is at least 9 months' + '
Due Date: ' + ToString("Rubella dose 1 Due Date")
  else ''

/*
@dynamicValue: Rubella dose 1 Due Date
@pseudocode: "Date of birth" + 9 months
*/
define "Rubella dose 1 Due Date":
  if "Rubella dose 1" then Patient.birthDate + 9 months
  else null

/*
@dynamicValue: Rubella dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Rubella dose 1 Overdue":
  null

/*
@dynamicValue: Rubella dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Rubella dose 1 Expiration":
  null
  
/*
@complete: One rubella dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Rubella–containing vaccines")
*/
define "One rubella dose from the primary series was administered. The primary series has been completed":
  Encounter."One rubella primary series dose was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.2' then "Rubella dose 1"
    when Patient.id = '09.123' then "Rubella dose 1"
    when Patient.id = '10.123' then "Rubella dose 1"
    when Patient.id = '11.1' then "One rubella dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
