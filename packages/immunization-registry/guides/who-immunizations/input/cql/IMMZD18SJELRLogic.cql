
/*
 * Library: IMMZD18SJELRLogic (IMMZ.D18.S.JE.Live recombinant vaccination schedule)
 * Schedule Table: Live recombinant vaccination schedule (1-dose scheme)
 */
library IMMZD18SJELRLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTJEEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Japanese encephalitis (JE) dose 1
@description: Provision of the JE dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Japanese encephalitis (JE) dose 1":
  Encounter."No JE primary series doses were administered"
  and not "One JE dose from primary series was administered. The primary series has been completed"

/*
@output: Japanese encephalitis (JE) dose 1 Create
@create: Live recombinant vaccine: Single dose administered at ≥9 months of age
*/
define "Japanese encephalitis (JE) dose 1 Create":
  if "Japanese encephalitis (JE) dose 1" 
  then 'Live recombinant vaccine: Single dose administered at ≥9 months of age' + '
Due Date: ' + ToString("Japanese encephalitis (JE) dose 1 Due Date")
  else ''

/*
@dynamicValue: Japanese encephalitis (JE) dose 1 Due Date
@pseudocode: "Date of birth" + 9 months
*/
define "Japanese encephalitis (JE) dose 1 Due Date":
  if "Japanese encephalitis (JE) dose 1" then Patient.birthDate + 9 months
  else null

/*
@dynamicValue: Japanese encephalitis (JE) dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Japanese encephalitis (JE) dose 1 Overdue":
  null

/*
@dynamicValue: Japanese encephalitis (JE) dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Japanese encephalitis (JE) dose 1 Expiration":
  null
  
/*
@complete: One JE dose from primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "JE vaccines")
*/
define "One JE dose from primary series was administered. The primary series has been completed":
  Encounter."One JE primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '31.1' then "Japanese encephalitis (JE) dose 1"
    when Patient.id = '32.012' then "Japanese encephalitis (JE) dose 1"
    when Patient.id = '33.012' then "Japanese encephalitis (JE) dose 1"
    when Patient.id = '34.0' then "One JE dose from primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
