
/*
 * Library: IMMZD18STyphoidVIPSLogic (IMMZ.D18.S.Typhoid.ViPS schedule)
 * Schedule Table: Unconjugated Vi polysaccharide (ViPS), 1 dose schedule
 */
library IMMZD18STyphoidVIPSLogic

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
@output: Typhoid dose 1
@description: Provision of the typhoid ViPS dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Typhoid dose 1":
  Encounter."No typhoid primary series doses were administered"
  and not "One typhoid dose from the primary series was administered. The primary series has been completed"

/*
@output: Typhoid dose 1 Create
@create: Typhoid dose 1 should be provided if the client's age is over 2 years, and the region recommends typhoid vaccination.
*/
define "Typhoid dose 1 Create":
  if "Typhoid dose 1" 
  then 'Typhoid dose 1 should be provided if the client\'s age is over 2 years, and the region recommends typhoid vaccination.' + '
Due Date: ' + ToString("Typhoid dose 1 Due Date")
  else ''

/*
@dynamicValue: Typhoid dose 1 Due Date
@pseudocode: "Date of birth" + 2 years
*/
define "Typhoid dose 1 Due Date":
  if "Typhoid dose 1" then Patient.birthDate + 2 years
  else null

/*
@dynamicValue: Typhoid dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Typhoid dose 1 Overdue":
  null

/*
@dynamicValue: Typhoid dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Typhoid dose 1 Expiration":
  null
  
/*
@complete: One typhoid dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Typhoid vaccines")
*/
define "One typhoid dose from the primary series was administered. The primary series has been completed":
  Encounter."One typhoid primary series dose was administered"

/*
@output: Typhoid booster dose(s)
@description: Provision of the typhoid ViPS booster dose
@trigger: The primary series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Typhoid vaccines")
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Typhoid vaccines")
*/
define "Typhoid booster dose(s)":
  "One typhoid dose from the primary series was administered. The primary series has been completed"

/*
@output: Typhoid booster dose(s) Create
@create: Revaccination is recommended every 3 years for ViPS.
*/
define "Typhoid booster dose(s) Create":
  if "Typhoid booster dose(s)" 
  then 'Revaccination is recommended every 3 years for ViPS.' + '
Due Date: ' + ToString("Typhoid booster dose(s) Due Date")
  else ''

/*
@dynamicValue: Typhoid booster dose(s) Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Typhoid vaccines") + 3 years
*/
define "Typhoid booster dose(s) Due Date":
  if "Typhoid booster dose(s)" then Encounter."Date of Latest Typhoid Dose" + 3 years
  else null

/*
@dynamicValue: Typhoid booster dose(s) Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Typhoid booster dose(s) Overdue":
  null

/*
@dynamicValue: Typhoid booster dose(s) Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Typhoid booster dose(s) Expiration":
  null
  
/*
@complete: Typhoid booster dose was administered less than 3 years ago
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Typhoid vaccines" and "Type of dose" = "Booster dose")  ≥ 1 AND Today's date - Latest "Date and time of vaccination" (where "Vaccine type" = "Typhoid vaccines") < 3 years
*/
define "Typhoid booster dose was administered less than 3 years ago":
  Encounter."Date of Latest Typhoid Dose" is not null
  and duration in years between Encounter."Date of Latest Typhoid Dose" and Today < 3

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '19.2' then "Typhoid dose 1"
    when Patient.id = '20.12' then "Typhoid dose 1"
    when Patient.id = '21.13' then "Typhoid booster dose(s)"
    when Patient.id = '22.13' then "Typhoid booster dose(s)"
    else 'No test case set'
  end
