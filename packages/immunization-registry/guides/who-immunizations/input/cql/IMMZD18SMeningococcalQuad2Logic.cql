
/*
 * Library: IMMZD18SMeningococcalQuad2Logic (IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 2-dose schedule)
 * Schedule Table: Quadrivalent conjugate vaccine (A,C,W135,Y-D), 2-dose schedule
 */
library IMMZD18SMeningococcalQuad2Logic

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
  and "Meningococcal dose 1 Expiration" after day of Today
  and not "First meningococcal dose from the primary series was administered"

/*
@output: Meningococcal dose 1 Create
@create: A,C,W135,Y-D is also licensed for children aged 9–23 months and given as a 2-dose series 3 months apart, beginning at 9 months of age.
*/
define "Meningococcal dose 1 Create":
  if "Meningococcal dose 1" 
  then 'A,C,W135,Y-D is also licensed for children aged 9–23 months and given as a 2-dose series 3 months apart, beginning at 9 months of age.' + '
Due Date: ' + ToString("Meningococcal dose 1 Due Date") + '
Expiration: ' + ToString("Meningococcal dose 1 Expiration")
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
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Meningococcal dose 1 Overdue":
  null

/*
@dynamicValue: Meningococcal dose 1 Expiration
@pseudocode: "Date of birth" + 23 months
*/
define "Meningococcal dose 1 Expiration":
  Patient.birthDate + 23 months
  
/*
@complete: First meningococcal dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines") = 1
*/
define "First meningococcal dose from the primary series was administered":
  Encounter."One meningococcal primary series dose was administered"

/*
@output: Meningococcal dose 2
@description: Provision of the meningococcal dose 2
@trigger: First meningococcal dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines") = 1
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines")
*/
define "Meningococcal dose 2":
  "First meningococcal dose from the primary series was administered"
  and Encounter."Client's age was less than or equal to 23 months when the primary series was started"
  and not "Second meningococcal dose from the primary series was administered. The primary series has been completed"

/*
@output: Meningococcal dose 2 Create
@create: A,C,W135,Y-D is also licensed for children aged 9–23 months and given as a 2-dose series 3 months apart, beginning at 9 months of age.
*/
define "Meningococcal dose 2 Create":
  if "Meningococcal dose 2" 
  then 'A,C,W135,Y-D is also licensed for children aged 9–23 months and given as a 2-dose series 3 months apart, beginning at 9 months of age.' + '
Due Date: ' + ToString("Meningococcal dose 2 Due Date")
  else ''

/*
@dynamicValue: Meningococcal dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") + 3 months
*/
define "Meningococcal dose 2 Due Date":
  if "Meningococcal dose 2" then Encounter."Date of Latest Meningococcal Dose" + 3 months
  else null

/*
@dynamicValue: Meningococcal dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Meningococcal dose 2 Overdue":
  null

/*
@dynamicValue: Meningococcal dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Meningococcal dose 2 Expiration":
  null
  
/*
@complete: Second meningococcal dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" (where "Vaccine type" = "Meningococcal vaccines") = TRUE
*/
define "Second meningococcal dose from the primary series was administered. The primary series has been completed":
  Encounter."Two meningococcal primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '55.1' then "Meningococcal dose 1"
    when Patient.id = '56.01' then "Meningococcal dose 1"
    when Patient.id = '57.023' then "Meningococcal dose 2"
    when Patient.id = '58.023' then "Meningococcal dose 2"
    when Patient.id = '59.02' then "First meningococcal dose from the primary series was administered" and not "Meningococcal dose 2"
    when Patient.id = '60.0' then "Second meningococcal dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
