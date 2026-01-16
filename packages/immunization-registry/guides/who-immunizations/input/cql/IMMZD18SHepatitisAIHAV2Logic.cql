
/*
 * Library: IMMZD18SHepatitisAIHAV2Logic (IMMZ.D18.S.Hepatitis A.Inactivated HAV 2-dose schedule)
 * Schedule Table: Inactivated hepatitis A virus (HAV), 2-dose schedule
 */
library IMMZD18SHepatitisAIHAV2Logic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTHepatitisAEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Hepatitis A dose 1
@description: Provision of the hepatitis A dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Hepatitis A dose 1":
  Encounter."No hepatitis A primary series doses were administered"
  and not "First hepatitis A dose from the primary series was administered"

/*
@output: Hepatitis A dose 1 Create
@create: With a 2-dose schedule, the first dose should be given from ≥ 12 months of age.
*/
define "Hepatitis A dose 1 Create":
  if "Hepatitis A dose 1" 
  then 'With a 2-dose schedule, the first dose should be given from ≥ 12 months of age.' + '
Due Date: ' + ToString("Hepatitis A dose 1 Due Date")
  else ''

/*
@dynamicValue: Hepatitis A dose 1 Due Date
@pseudocode: "Date of birth" + 12 months
*/
define "Hepatitis A dose 1 Due Date":
  if "Hepatitis A dose 1" then Patient.birthDate + 12 months
  else null

/*
@dynamicValue: Hepatitis A dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Hepatitis A dose 1 Overdue":
  null

/*
@dynamicValue: Hepatitis A dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Hepatitis A dose 1 Expiration":
  null
  
/*
@complete: First hepatitis A dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis A-containing vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First hepatitis A dose from the primary series was administered":
  Encounter."One hepatitis A primary series dose was administered"

/*
@output: Hepatitis A dose 2
@description: Provision of the hepatitis A dose 2
@trigger: First hepatitis A dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Hepatitis A-containing vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Hepatitis A-containing vaccines")
*/
define "Hepatitis A dose 2":
  "First hepatitis A dose from the primary series was administered"
  and not "Second hepatitis A dose from the primary series was administered. The primary series has been completed"

/*
@output: Hepatitis A dose 2 Create
@create: The interval between doses is flexible, from 6 months to 4–5 years or more, but is usually 6–18 months.
*/
define "Hepatitis A dose 2 Create":
  if "Hepatitis A dose 2" 
  then 'The interval between doses is flexible, from 6 months to 4–5 years or more, but is usually 6–18 months.' + '
Due Date: ' + ToString("Hepatitis A dose 2 Due Date")
  else ''

/*
@dynamicValue: Hepatitis A dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Hepatitis A-containing vaccines") + 6 months
*/
define "Hepatitis A dose 2 Due Date":
  if "Hepatitis A dose 2" then Encounter."Date of Latest Hepatitis A Dose" + 6 months
  else null

/*
@dynamicValue: Hepatitis A dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Hepatitis A dose 2 Overdue":
  null

/*
@dynamicValue: Hepatitis A dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Hepatitis A dose 2 Expiration":
  null
  
/*
@complete: Second hepatitis A dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Hepatitis A-containing vaccines")
*/
define "Second hepatitis A dose from the primary series was administered. The primary series has been completed":
  Encounter."Two hepatitis A primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.1' then "Hepatitis A dose 1"
    when Patient.id = '09.01' then "Hepatitis A dose 1"
    when Patient.id = '10.02' then "Hepatitis A dose 2"
    when Patient.id = '11.02' then "Hepatitis A dose 2"
    when Patient.id = '12.0' then "Second hepatitis A dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
