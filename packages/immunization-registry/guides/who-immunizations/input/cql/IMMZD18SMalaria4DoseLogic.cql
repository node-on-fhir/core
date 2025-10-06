
/*
 * Library: IMMZD18SMalaria4DoseLogic (IMMZ.D18.S.Malaria schedule)
 * Schedule Table: 4-dose schedule
 */
library IMMZD18SMalaria4DoseLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTMalariaEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Malaria dose 1
@description: Provision of the malaria dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Malaria dose 1":
  Encounter."No malaria primary series doses were administered"
  and not "First malaria dose from the primary series was administered"

/*
@output: Malaria dose 1 Create
@create: WHO recommends that the first dose of vaccine be administered from 5 months of age.
*/
define "Malaria dose 1 Create":
  if "Malaria dose 1" 
  then 'WHO recommends that the first dose of vaccine be administered from 5 months of age.' + '
Due Date: ' + ToString("Malaria dose 1 Due Date")
  else ''

/*
@dynamicValue: Malaria dose 1 Due Date
@pseudocode: "Date of birth" + 5 months
*/
define "Malaria dose 1 Due Date":
  if "Malaria dose 1" then Patient.birthDate + 5 months
  else null

/*
@dynamicValue: Malaria dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Malaria dose 1 Overdue":
  null

/*
@dynamicValue: Malaria dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date.
*/
define "Malaria dose 1 Expiration":
  null
  
/*
@complete: First malaria dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First malaria dose from the primary series was administered":
  Encounter."One malaria primary series dose was administered"

/*
@output: Malaria dose 2
@description: Provision of the malaria dose 2
@trigger: First malaria dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Malaria vaccines")
*/
define "Malaria dose 2":
  "First malaria dose from the primary series was administered"
  and not "Second malaria dose from the primary series was administered"

/*
@output: Malaria dose 2 Create
@create: There should be a minimum interval of 4 weeks between doses.
*/
define "Malaria dose 2 Create":
  if "Malaria dose 2" 
  then 'There should be a minimum interval of 4 weeks between doses.' + '
Due Date: ' + ToString("Malaria dose 2 Due Date")
  else ''

/*
@dynamicValue: Malaria dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Malaria vaccines") + 4 weeks
*/
define "Malaria dose 2 Due Date":
  if "Malaria dose 2" then Encounter."Date of Latest Malaria Dose" + 4 weeks
  else null

/*
@dynamicValue: Malaria dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Malaria dose 2 Overdue":
  null

/*
@dynamicValue: Malaria dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date.
*/
define "Malaria dose 2 Expiration":
  null
  
/*
@complete: Second malaria dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 2
*/
define "Second malaria dose from the primary series was administered":
  Encounter."Two malaria primary series doses were administered"

/*
@output: Malaria dose 3
@description: Provision of the malaria dose 3
@trigger: Second malaria dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 2
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Malaria vaccines")
*/
define "Malaria dose 3":
  "Second malaria dose from the primary series was administered"
  and not "Third malaria dose from the primary series was administered"

/*
@output: Malaria dose 3 Create
@create: There should be a minimum interval of 4 weeks between doses.
*/
define "Malaria dose 3 Create":
  if "Malaria dose 3" 
  then 'There should be a minimum interval of 4 weeks between doses.' + '
Due Date: ' + ToString("Malaria dose 3 Due Date")
  else ''

/*
@dynamicValue: Malaria dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Malaria vaccines") + 4 weeks
*/
define "Malaria dose 3 Due Date":
  if "Malaria dose 3" then Encounter."Date of Latest Malaria Dose" + 4 weeks
  else null

/*
@dynamicValue: Malaria dose 3 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Malaria dose 3 Overdue":
  null

/*
@dynamicValue: Malaria dose 3 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date.
*/
define "Malaria dose 3 Expiration":
  null
  
/*
@complete: Third malaria dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 3
*/
define "Third malaria dose from the primary series was administered":
  Encounter."Three malaria primary series doses were administered"

/*
@output: Malaria dose 4
@description: Provision of the malaria dose 4
@trigger: Third malaria dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Malaria vaccines" and "Type of dose" = "Primary series") = 3
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Malaria vaccines")
*/
define "Malaria dose 4":
  "Third malaria dose from the primary series was administered"
  and not "Fourth malaria dose from the primary series was administered. The primary series has been completed"

/*
@output: Malaria dose 4 Create
@create: There should be a minimum interval of 4 weeks between doses. The fourth dose should be provided approximately 12–18 months after the third dose to prolong the duration of protection.
*/
define "Malaria dose 4 Create":
  if "Malaria dose 4" 
  then 'There should be a minimum interval of 4 weeks between doses. The fourth dose should be provided approximately 12–18 months after the third dose to prolong the duration of protection.' + '
Due Date: ' + ToString("Malaria dose 4 Due Date") + '
Overdue: ' + ToString("Malaria dose 4 Overdue")
  else ''

/*
@dynamicValue: Malaria dose 4 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Malaria vaccines") + 4 weeks
*/
define "Malaria dose 4 Due Date":
  if "Malaria dose 4" then Encounter."Date of Latest Malaria Dose" + 4 weeks
  else null

/*
@dynamicValue: Malaria dose 4 Overdue
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Malaria vaccines") + 18 months
*/
define "Malaria dose 4 Overdue":
  if "Malaria dose 4" then Encounter."Date of Latest Malaria Dose" + 18 months
  else null

/*
@dynamicValue: Malaria dose 4 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date.
*/
define "Malaria dose 4 Expiration":
  null
  
/*
@complete: Fourth malaria dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Malaria vaccines")"
*/
define "Fourth malaria dose from the primary series was administered. The primary series has been completed":
  Encounter."Four malaria primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.1' then "Malaria dose 1"
    when Patient.id = '09.01' then "Malaria dose 1"
    when Patient.id = '10.02' then "Malaria dose 2"
    when Patient.id = '11.02' then "Malaria dose 2"
    when Patient.id = '12.02' then "Malaria dose 3"
    when Patient.id = '13.02' then "Malaria dose 3"
    when Patient.id = '14.02' then "Malaria dose 4"
    when Patient.id = '15.02' then "Malaria dose 4"
    when Patient.id = '16.0' then "Fourth malaria dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
