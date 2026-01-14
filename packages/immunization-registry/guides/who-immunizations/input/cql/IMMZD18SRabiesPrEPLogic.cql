
/*
 * Library: IMMZD18SRabiesPrEPLogic (IMMZ.D18.S.Rabies schedule)
 * Schedule Table: Rabies schedule (2-dose scheme)
 */
library IMMZD18SRabiesPrEPLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTRabiesEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Rabies dose 1
@description: Provision of rabies dose 1
@trigger: To be determined by Member States
@triggerDate: To be determined by Member States
*/
define "Rabies dose 1":
  // Member state must define the trigger for if the first dose is needed.
  Encounter."No rabies primary series doses were administered"
  and not "First rabies dose from the primary series was administered"

/*
@output: Rabies dose 1 Create
@create: Rabies dose 1 should be provided if the client is at a high risk of rabies virus exposure
*/
define "Rabies dose 1 Create":
  if "Rabies dose 1" 
  then 'Rabies dose 1 should be provided if the client is at a high risk of rabies virus exposure'
  else ''

/*
@dynamicValue: Rabies dose 1 Due Date
@pseudocode: To be determined by Member States
*/
define "Rabies dose 1 Due Date":
  null

/*
@dynamicValue: Rabies dose 1 Overdue
@pseudocode: To be determined by Member States
*/
define "Rabies dose 1 Overdue":
  null

/*
@dynamicValue: Rabies dose 1 Expiration
@pseudocode: To be determined by Member States
*/
define "Rabies dose 1 Expiration":
  null
  
/*
@complete: First rabies dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rabies vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First rabies dose from the primary series was administered":
  Encounter."One rabies primary series doses were administered"

/*
@output: Rabies dose 2
@description: Provision of rabies dose 2
@trigger: First rabies dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Rabies vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Rabies vaccines")
*/
define "Rabies dose 2":
  "First rabies dose from the primary series was administered"
  and not "Second rabies dose from the primary series was administered. The primary series has been completed"

/*
@output: Rabies dose 2 Create
@create: Rabies dose 2 should be provided if previous dose was given more than 1 week ago
*/
define "Rabies dose 2 Create":
  if "Rabies dose 2" 
  then 'Rabies dose 2 should be provided if previous dose was given more than 1 week ago' + '
Due Date: ' + ToString("Rabies dose 2 Due Date")
  else ''

/*
@dynamicValue: Rabies dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Rabies vaccines") + 7 days
*/
define "Rabies dose 2 Due Date":
  if "Rabies dose 2" then Encounter."Date of Latest Rabies Dose" + 7 days
  else null

/*
@dynamicValue: Rabies dose 2 Overdue
@pseudocode: To be determined by Member States
*/
define "Rabies dose 2 Overdue":
  null

/*
@dynamicValue: Rabies dose 2 Expiration
@pseudocode: To be determined by Member States
*/
define "Rabies dose 2 Expiration":
  null
  
/*
@complete: Second rabies dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Rabies vaccines")
*/
define "Second rabies dose from the primary series was administered. The primary series has been completed":
  Encounter."Two rabies primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.1' then "Rabies dose 1"
    when Patient.id = '09.12' then "Rabies dose 2"
    when Patient.id = '10.12' then "Rabies dose 2"
    when Patient.id = '11.1' then "Second rabies dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
