
/*
 * Library: IMMZD18SYellowfeverLogic (IMMZ.D18.S.Yellow fever schedule)
 * Schedule Table: IMMZ.D18.S.Yellow fever schedule
 */
library IMMZD18SYellowfeverLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTYellowfeverEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Yellow fever dose 1
@description: Provision of yellow fever dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Yellow fever dose 1":
  Encounter."No yellow fever primary series doses were administered"
  and not "One yellow fever dose from primary series was administered. The primary series has been completed"

/*
@output: Yellow fever dose 1 Create
@create: The client is due for yellow fever dose 1 if the client's age is at least 9 months and living in a yellow fever endemic area.
*/
define "Yellow fever dose 1 Create":
  if "Yellow fever dose 1" 
  then 'The client is due for yellow fever dose 1 if the client\'s age is at least 9 months and living in a yellow fever endemic area.' + '
Due Date: ' + ToString("Yellow fever dose 1 Due Date") + '
Overdue: ' + ToString("Yellow fever dose 1 Overdue")
  else ''

/*
@dynamicValue: Yellow fever dose 1 Due Date
@pseudocode: "Date of birth" + 9 months
*/
define "Yellow fever dose 1 Due Date":
  if "Yellow fever dose 1" then Patient.birthDate + 9 months
  else null

/*
@dynamicValue: Yellow fever dose 1 Overdue
@pseudocode: "Date of birth" + 12 months
*/
define "Yellow fever dose 1 Overdue":
  if "Yellow fever dose 1" then Patient.birthDate + 12 months
  else null

/*
@dynamicValue: Yellow fever dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date.
*/
define "Yellow fever dose 1 Expiration":
  null
  
/*
@complete: One yellow fever dose from primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Yellow fever vaccines")
*/
define "One yellow fever dose from primary series was administered. The primary series has been completed":
  Encounter."One yellow fever primary series dose was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '07.01' then "Yellow fever dose 1"
    when Patient.id = '08.012' then "Yellow fever dose 1"
    when Patient.id = '09.012' then "Yellow fever dose 1"
    when Patient.id = '10.0' then "One yellow fever dose from primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
