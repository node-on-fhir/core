
/*
 * Library: IMMZD18SMeningococcalMenA1Logic (IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 1-dose schedule)
 * Schedule Table: MenA conjugate vaccine, 1-dose schedule
 */
library IMMZD18SMeningococcalMenA1Logic

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
  and not "One meningococcal dose from the primary series was administered. The primary series has been completed"

/*
@output: Meningococcal dose 1 Create
@create: For MenA conjugate vaccine (5µg), a 1-dose schedule is recommended at 9–18 months of age
*/
define "Meningococcal dose 1 Create":
  if "Meningococcal dose 1" 
  then 'For MenA conjugate vaccine (5µg), a 1-dose schedule is recommended at 9–18 months of age' + '
Due Date: ' + ToString("Meningococcal dose 1 Due Date") + '
Overdue: ' + ToString("Meningococcal dose 1 Overdue")
  else ''

/*
@dynamicValue: Meningococcal dose 1 Due Date
@pseudocode: "Date of birth" + 9 months
*/
define "Meningococcal dose 1 Due Date":
  if "Meningococcal dose 1" then Patient.birthDate + 9 months
  else null

/*
@dynamicValue: Meningococcal dose 1 Overdue
@pseudocode: "Date of birth" + 18 months
*/
define "Meningococcal dose 1 Overdue":
  if "Meningococcal dose 1" then Patient.birthDate + 18 months
  else null

/*
@dynamicValue: Meningococcal dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Meningococcal dose 1 Expiration":
  null
  
/*
@complete: One meningococcal dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Meningococcal vaccines")
*/
define "One meningococcal dose from the primary series was administered. The primary series has been completed":
  Encounter."One meningococcal primary series dose was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.1' then "Meningococcal dose 1"
    when Patient.id = '09.01' then "Meningococcal dose 1"
    when Patient.id = '10.0' then "One meningococcal dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
