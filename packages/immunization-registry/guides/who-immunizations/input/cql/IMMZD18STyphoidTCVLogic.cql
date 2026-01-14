
/*
 * Library: IMMZD18STyphoidTCVLogic (IMMZ.D18.S.Typhoid.TCV schedule)
 * Schedule Table: Typhoid conjugate vaccine (TCV), 1 dose schedule
 */
library IMMZD18STyphoidTCVLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTTyphoidEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: TCV dose 1
@description: Provision of the TCV dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "TCV dose 1":
  Encounter."No typhoid primary series doses were administered"
  and not "One typhoid dose from primary series was administered. The primary series has been completed"
  and "TCV dose 1 Expiration" after day of Today

/*
@output: TCV dose 1 Create
@create: TCV dose 1 should be provided if the client's age is over 6 months, and the region recommends typhoid vaccination.
*/
define "TCV dose 1 Create":
  if "TCV dose 1" 
  then 'TCV dose 1 should be provided if the client\'s age is over 6 months, and the region recommends typhoid vaccination.' + '
Due Date: ' + ToString("TCV dose 1 Due Date") + '
Expiration: ' + ToString("TCV dose 1 Expiration")
  else ''

/*
@dynamicValue: TCV dose 1 Due Date
@pseudocode: "Date of birth" + 6 months
*/
define "TCV dose 1 Due Date":
  if "TCV dose 1" then Patient.birthDate + 6 months
  else null

/*
@dynamicValue: TCV dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "TCV dose 1 Overdue":
  null

/*
@dynamicValue: TCV dose 1 Expiration
@pseudocode: "Date of birth" + 45 years
*/
define "TCV dose 1 Expiration":
  Patient.birthDate + 45 years
  
/*
@complete: One typhoid dose from primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Typhoid vaccines")
*/
define "One typhoid dose from primary series was administered. The primary series has been completed":
  Encounter."One typhoid primary series dose was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.2' then "TCV dose 1"
    when Patient.id = '09.12' then "TCV dose 1"
    when Patient.id = '10.12' then "TCV dose 1"
    when Patient.id = '11.1' then "One typhoid dose from primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
