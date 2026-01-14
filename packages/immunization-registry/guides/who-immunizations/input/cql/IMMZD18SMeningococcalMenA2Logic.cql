
/*
 * Library: IMMZD18SMeningococcalMenA2Logic (IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 2-dose schedule)
 * Schedule Table: MenA conjugate vaccine, 2-dose schedule (specific context where there is a compelling reason to vaccinate infants aged under 9 months)
 */
library IMMZD18SMeningococcalMenA2Logic

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
@create: If, in a specific context, there is a compelling reason to vaccinate infants aged under 9 months, a 2-priming dose infant schedule should be used starting at 3 months of age.
*/
define "Meningococcal dose 1 Create":
  if "Meningococcal dose 1" 
  then 'If, in a specific context, there is a compelling reason to vaccinate infants aged under 9 months, a 2-priming dose infant schedule should be used starting at 3 months of age.' + '
Due Date: ' + ToString("Meningococcal dose 1 Due Date") + '
Expiration: ' + ToString("Meningococcal dose 1 Expiration")
  else ''

/*
@dynamicValue: Meningococcal dose 1 Due Date
@pseudocode: "Date of birth" + 3 months
*/
define "Meningococcal dose 1 Due Date":
  if "Meningococcal dose 1" then Patient.birthDate + 3 months
  else null

/*
@dynamicValue: Meningococcal dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Meningococcal dose 1 Overdue":
  null

/*
@dynamicValue: Meningococcal dose 1 Expiration
@pseudocode: "Date of birth" + 9 months
*/
define "Meningococcal dose 1 Expiration":
  Patient.birthDate + 9 months
  
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
  and not "Second meningococcal dose from the primary series was administered. The primary series has been completed"

/*
@output: Meningococcal dose 2 Create
@create: Meningococcal dose 2 should be provided if the client's age is 3–9 months, 8 weeks after the first dose, and there is a compelling reason to vaccinate the infant.
*/
define "Meningococcal dose 2 Create":
  if "Meningococcal dose 2" 
  then 'Meningococcal dose 2 should be provided if the client\'s age is 3–9 months, 8 weeks after the first dose, and there is a compelling reason to vaccinate the infant.' + '
Due Date: ' + ToString("Meningococcal dose 2 Due Date")
  else ''

/*
@dynamicValue: Meningococcal dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") + 8 weeks
*/
define "Meningococcal dose 2 Due Date":
  if "Meningococcal dose 2" then Encounter."Date of Latest Meningococcal Dose" + 8 weeks
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
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Meningococcal vaccines")
*/
define "Second meningococcal dose from the primary series was administered. The primary series has been completed":
  Encounter."Two meningococcal primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '18.1' then "Meningococcal dose 1"
    when Patient.id = '19.01' then "Meningococcal dose 1"
    when Patient.id = '20.02' then "Meningococcal dose 2"
    when Patient.id = '21.02' then "Meningococcal dose 2"
    when Patient.id = '22.0' then "Second meningococcal dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
