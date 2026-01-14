
/*
 * Library: IMMZD18SDengue3DoseLogic (IMMZ.D18.S.Dengue schedule)
 * Schedule Table: CYD-TDV (Dengvaxia), 3-dose schedule
 */
library IMMZD18SDengue3DoseLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTDengueEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Dengue dose 1
@description: Provision of dengue dose 1
@trigger: No dengue doses from primary series were administered
Count of vaccines administered (where "Vaccine type" = "Dengue vaccines" and "Type of dose" = "Primary series") = 0
@triggerDate: To be determined by Member States based on vaccination strategy
*/
define "Dengue dose 1":
  // Member state determines if this is necessary
  Encounter."Client's age is between 9 years and 45 years"
  and "Dengue dose 1 Expiration" > Today
  and Encounter."No dengue primary series doses were administered"
  and not "First dengue dose from the primary series was administered"

/*
@output: Dengue dose 1 Create
@create: Dengue dose 1 should be provided based on vaccination strategy
*/
define "Dengue dose 1 Create":
  if "Dengue dose 1" 
  then 'Dengue dose 1 should be provided based on vaccination strategy' + '
Due Date: ' + ToString("Dengue dose 1 Due Date") + '
Expiration: ' + ToString("Dengue dose 1 Expiration")
  else ''

/*
@dynamicValue: Dengue dose 1 Due Date
@pseudocode: "Date of birth" + 9 years
*/
define "Dengue dose 1 Due Date":
  if "Dengue dose 1" then Patient.birthDate + 9 years
  else null

/*
@dynamicValue: Dengue dose 1 Overdue
@pseudocode: To be determined by Member States
*/
define "Dengue dose 1 Overdue":
  null

/*
@dynamicValue: Dengue dose 1 Expiration
@pseudocode: "Date of birth" + 46 years
*/
define "Dengue dose 1 Expiration":
  Patient.birthDate + 46 years
  
/*
@complete: First dengue dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Dengue vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First dengue dose from the primary series was administered":
  Encounter."One dengue primary series dose was administered"

/*
@output: Dengue dose 2
@description: Provision of the dengue dose 2
@trigger: First dengue dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Dengue vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Dengue vaccines")
*/
define "Dengue dose 2":
  "Dengue dose 2 Expiration" > Today
  and "First dengue dose from the primary series was administered"
  and not "Second dengue dose from the primary series was administered"

/*
@output: Dengue dose 2 Create
@create: Dengue dose 2 should be provided if the previous dose was provide more than 6 months ago
*/
define "Dengue dose 2 Create":
  if "Dengue dose 2" 
  then 'Dengue dose 2 should be provided if the previous dose was provide more than 6 months ago' + '
Due Date: ' + ToString("Dengue dose 2 Due Date") + '
Expiration: ' + ToString("Dengue dose 2 Expiration")
  else ''

/*
@dynamicValue: Dengue dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Dengue vaccines") + 6 months
*/
define "Dengue dose 2 Due Date":
  if "Dengue dose 2" then Encounter."Date of Latest Dengue Dose" + 6 months
  else null

/*
@dynamicValue: Dengue dose 2 Overdue
@pseudocode: To be determined by Member States
*/
define "Dengue dose 2 Overdue":
  null

/*
@dynamicValue: Dengue dose 2 Expiration
@pseudocode: "Date of birth" + 46 years
*/
define "Dengue dose 2 Expiration":
  Patient.birthDate + 46 years
  
/*
@complete: Second dengue dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Dengue vaccines" and "Type of dose" = "Primary series") = 2
*/
define "Second dengue dose from the primary series was administered":
  Encounter."Two dengue primary series doses were administered"

/*
@output: Dengue dose 3
@description: Provision of dengue dose 3
@trigger: Second dengue dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Dengue vaccines" and "Type of dose" = "Primary series") = 2
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Dengue vaccines")
*/
define "Dengue dose 3":
  "Dengue dose 2 Expiration" > Today
  and "Second dengue dose from the primary series was administered"
  and not "Third dengue dose from the primary series was administered. The primary series has been completed"

/*
@output: Dengue dose 3 Create
@create: Dengue dose 3 should be provided if the previous dose was provide more than 6 months ago
*/
define "Dengue dose 3 Create":
  if "Dengue dose 3" 
  then 'Dengue dose 3 should be provided if the previous dose was provide more than 6 months ago' + '
Due Date: ' + ToString("Dengue dose 3 Due Date") + '
Expiration: ' + ToString("Dengue dose 3 Expiration")
  else ''

/*
@dynamicValue: Dengue dose 3 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Dengue vaccines") + 6 months
*/
define "Dengue dose 3 Due Date":
  if "Dengue dose 3" then Encounter."Date of Latest Dengue Dose" + 6 months
  else null

/*
@dynamicValue: Dengue dose 3 Overdue
@pseudocode: To be determined by Member States
*/
define "Dengue dose 3 Overdue":
  null

/*
@dynamicValue: Dengue dose 3 Expiration
@pseudocode: "Date of birth" + 46 years
*/
define "Dengue dose 3 Expiration":
  Patient.birthDate + 46 years
  
/*
@complete: Third dengue dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Dengue vaccines")"
*/
define "Third dengue dose from the primary series was administered. The primary series has been completed":
  Encounter."Three dengue primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.2' then not "Dengue dose 1"
    when Patient.id = '09.2' then not "Dengue dose 1"
    when Patient.id = '10.3' then "Dengue dose 1"
    when Patient.id = '11.123' then "Dengue dose 1"
    when Patient.id = '12.1234' then "Dengue dose 2"
    when Patient.id = '13.1234' then "Dengue dose 2"
    when Patient.id = '14.1234' then "Dengue dose 3"
    when Patient.id = '15.1234' then "Dengue dose 3"
    when Patient.id = '16.12' then "Third dengue dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
