
/*
 * Library: IMMZD18SMeningococcalMenCLogic (IMMZ.D18.S.Meningococcal.Monovalent MenC conjugate vaccine schedule)
 * Schedule Table: Monovalent MenC conjugate schedule
 */
library IMMZD18SMeningococcalMenCLogic

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
  and not "First meningococcal dose from the primary series was administered"

/*
@output: Meningococcal dose 1 Create
@create: For monovalent MenC conjugate vaccine, one single intramuscular dose is recommended for children aged ≥ 12 months, teenagers and adults. Children aged 2–11 months require 2 doses administered.
*/
define "Meningococcal dose 1 Create":
  if "Meningococcal dose 1" 
  then 'For monovalent MenC conjugate vaccine, one single intramuscular dose is recommended for children aged ≥ 12 months, teenagers and adults. Children aged 2–11 months require 2 doses administered.' + '
Due Date: ' + ToString("Meningococcal dose 1 Due Date")
  else ''

/*
@dynamicValue: Meningococcal dose 1 Due Date
@pseudocode: "Date of birth" + 2 months
*/
define "Meningococcal dose 1 Due Date":
  if "Meningococcal dose 1" then Patient.birthDate + 2 months
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
@complete: First meningococcal dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First meningococcal dose from the primary series was administered":
  Encounter."One meningococcal primary series dose was administered"

/*
@output: Meningococcal dose 2
@description: Provision of the meningococcal dose 2 for clients that start the series when aged ≤ 11 months
@trigger: First meningococcal dose from the primary series was administered and client started the series when client's age was less than or equal to 11 months
Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines" and "Type of dose" = "Primary series") = 1 and "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") - "Date of birth" ≤ 11 months
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines")
*/
define "Meningococcal dose 2":
  "First meningococcal dose from the primary series was administered"
  and Encounter."Client's age was less than or equal to 11 months when the primary series was started"
  and not "Second meningococcal dose from the primary series was administered. The primary series has been completed for clients that started the series when client's age was less than or equal to 11 months"

/*
@output: Meningococcal dose 2 Create
@create: Children 2–11 months require 2 doses administered at an interval of at least 2 months and a booster about 1 year after.
*/
define "Meningococcal dose 2 Create":
  if "Meningococcal dose 2" 
  then 'Children 2–11 months require 2 doses administered at an interval of at least 2 months and a booster about 1 year after.' + '
Due Date: ' + ToString("Meningococcal dose 2 Due Date")
  else ''

/*
@dynamicValue: Meningococcal dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") + 2 months
*/
define "Meningococcal dose 2 Due Date":
  if "Meningococcal dose 2" then Encounter."Date of Latest Meningococcal Dose" + 2 months
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
@complete: Second meningococcal dose from the primary series was administered. The primary series has been completed for clients that started the series when client's age was less than or equal to 11 months
@pseudocode: "Completed the primary vaccination series" (where "Vaccine type" = "Meningococcal vaccines") = TRUE
*/
define "Second meningococcal dose from the primary series was administered. The primary series has been completed for clients that started the series when client's age was less than or equal to 11 months":
  Encounter."Two meningococcal primary series doses were administered"

/*
@output: Meningococcal booster dose
@description: Provision of the meningococcal booster dose for clients that start the series when aged ≤ 11 months
@trigger: The primary series has been completed and client started the series when client's age was less than or equal to 11 months
"Completed the primary vaccination series" (where "Vaccine type" = "Meningococcal vaccines") = TRUE and "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines" and "Dose number" = 1) - "Date of birth" ≤ 11 months
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines")
*/
define "Meningococcal booster dose":
  "Second meningococcal dose from the primary series was administered. The primary series has been completed for clients that started the series when client's age was less than or equal to 11 months"
  and not "Meningococcal booster dose was administered for the client that started the series when client's age was less than or equal to 11 months. Immunization schedule has been completed"

/*
@output: Meningococcal booster dose Create
@create: Children 2–11 months require 2 doses administered at an interval of at least 2 months and a booster about 1 year after.
*/
define "Meningococcal booster dose Create":
  if "Meningococcal booster dose" 
  then 'Children 2–11 months require 2 doses administered at an interval of at least 2 months and a booster about 1 year after.' + '
Due Date: ' + ToString("Meningococcal booster dose Due Date")
  else ''

/*
@dynamicValue: Meningococcal booster dose Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Meningococcal vaccines") + 1 year
*/
define "Meningococcal booster dose Due Date":
  if "Meningococcal booster dose" then Encounter."Date of Latest Meningococcal Dose" + 1 year
  else null

/*
@dynamicValue: Meningococcal booster dose Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Meningococcal booster dose Overdue":
  null

/*
@dynamicValue: Meningococcal booster dose Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Meningococcal booster dose Expiration":
  null
  
/*
@complete: Meningococcal booster dose was administered for the client that started the series when client's age was less than or equal to 11 months. Immunization schedule has been completed
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Meningococcal vaccines" AND "Type of dose" = "Booster dose") = 1
*/
define "Meningococcal booster dose was administered for the client that started the series when client's age was less than or equal to 11 months. Immunization schedule has been completed":
  Encounter."Meningococcal booster dose was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '30.1' then "Meningococcal dose 1"
    when Patient.id = '31.01' then "Meningococcal dose 1"
    when Patient.id = '32.023' then "Meningococcal dose 2"
    when Patient.id = '33.023' then "Meningococcal dose 2"
    when Patient.id = '34.02' then "First meningococcal dose from the primary series was administered" and not "Meningococcal dose 2"
    when Patient.id = '35.034' then "Meningococcal booster dose"
    when Patient.id = '36.034' then "Meningococcal booster dose"
    when Patient.id = '37.04' then "Meningococcal booster dose was administered for the client that started the series when client's age was less than or equal to 11 months. Immunization schedule has been completed"
    else 'No test case set'
  end
