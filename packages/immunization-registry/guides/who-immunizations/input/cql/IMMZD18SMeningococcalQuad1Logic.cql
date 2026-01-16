
/*
 * Library: IMMZD18SMeningococcalQuad1Logic (IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 1-dose schedule)
 * Schedule Table: Quadrivalent conjugate vaccines (A,C,W135,Y-D and A,C,W135,Y-CRM), 1-dose schedule
 */
library IMMZD18SMeningococcalQuad1Logic

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
@create: Quadrivalent conjugate vaccines (A,C,W135,Y-D and A,C,W135,Y-CRM) should be administered as one single intramuscular dose to individuals aged ≥2 years.
*/
define "Meningococcal dose 1 Create":
  if "Meningococcal dose 1" 
  then 'Quadrivalent conjugate vaccines (A,C,W135,Y-D and A,C,W135,Y-CRM) should be administered as one single intramuscular dose to individuals aged ≥2 years.' + '
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
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '45.1' then "Meningococcal dose 1"
    when Patient.id = '46.01' then "Meningococcal dose 1"
    when Patient.id = '47.0' then "One meningococcal dose from primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
