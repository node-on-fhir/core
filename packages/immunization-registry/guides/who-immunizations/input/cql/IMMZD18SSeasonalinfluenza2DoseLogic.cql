
/*
 * Library: IMMZD18SSeasonalinfluenza2DoseLogic (IMMZ.D18.S.Seasonal influenza schedule)
 * Schedule Table: Inactivated trivalent and quadrivalent vaccines, 2-dose schedule for children aged under 9 years
 */
library IMMZD18SSeasonalinfluenza2DoseLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTSeasonalinfluenzaEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Seasonal influenza dose 1
@description: Provision of the seasonal influenza vaccine dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Seasonal influenza dose 1":
  Encounter."No seasonal influenza primary series doses were administered"
  and not "First seasonal influenza dose from the primary series was administered"

/*
@output: Seasonal influenza dose 1 Create
@create: Influenza vaccines are safe and effective in children from 6 months of age
*/
define "Seasonal influenza dose 1 Create":
  if "Seasonal influenza dose 1" 
  then 'Influenza vaccines are safe and effective in children from 6 months of age' + '
Due Date: ' + ToString("Seasonal influenza dose 1 Due Date")
  else ''

/*
@dynamicValue: Seasonal influenza dose 1 Due Date
@pseudocode: "Date of birth" + 6 months
*/
define "Seasonal influenza dose 1 Due Date":
  if "Seasonal influenza dose 1" then Patient.birthDate + 6 months
  else null

/*
@dynamicValue: Seasonal influenza dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated
*/
define "Seasonal influenza dose 1 Overdue":
  null

/*
@dynamicValue: Seasonal influenza dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated
*/
define "Seasonal influenza dose 1 Expiration":
  null
  
/*
@complete: First seasonal influenza dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Seasonal influenza vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First seasonal influenza dose from the primary series was administered":
  Encounter."One seasonal influenza primary series doses were administered"

/*
@output: Seasonal influenza dose 2
@description: Provision of the seasonal influenza vaccine dose 2
@trigger: First seasonal influenza dose from the primary series was administered and client is less than 9 years
Count of vaccines administered (where "Vaccine type" = "Seasonal influenza vaccines" and "Type of dose" = "Primary series") = 1 AND (Today's date − "Date of birth" < 9 years)
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Seasonal influenza vaccines")
*/
define "Seasonal influenza dose 2":
  "First seasonal influenza dose from the primary series was administered"
  and Encounter."Client's age is less than 9 years"
  and not "Second seasonal influenza dose from the primary series was administered. The primary series has been completed"

/*
@output: Seasonal influenza dose 2 Create
@create: Children aged 6 months to 8 years should receive 2 doses at least 4 weeks apart
*/
define "Seasonal influenza dose 2 Create":
  if "Seasonal influenza dose 2" 
  then 'Children aged 6 months to 8 years should receive 2 doses at least 4 weeks apart' + '
Due Date: ' + ToString("Seasonal influenza dose 2 Due Date") + '
Expiration: ' + ToString("Seasonal influenza dose 2 Expiration")
  else ''

/*
@dynamicValue: Seasonal influenza dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Seasonal influenza vaccines") + 4 weeks
*/
define "Seasonal influenza dose 2 Due Date":
  if "Seasonal influenza dose 2" then Encounter."Date of Latest Seasonal influenza Dose" + 4 weeks
  else null

/*
@dynamicValue: Seasonal influenza dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated
*/
define "Seasonal influenza dose 2 Overdue":
  null

/*
@dynamicValue: Seasonal influenza dose 2 Expiration
@pseudocode: "Date of birth" + 9 years
*/
define "Seasonal influenza dose 2 Expiration":
  if "Seasonal influenza dose 2" then Patient.birthDate + 9 years
  else null
  
/*
@complete: Second seasonal influenza dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Seasonal influenza vaccines")
*/
define "Second seasonal influenza dose from the primary series was administered. The primary series has been completed":
  Encounter."Two seasonal influenza primary series doses were administered"

/*
@output: Seasonal influenza annual dose
@description: Provision of the seasonal influenza vaccine annual dose
@trigger: The primary series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Seasonal influenza vaccines")
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Seasonal influenza vaccines")
*/
define "Seasonal influenza annual dose":
  ( "Second seasonal influenza dose from the primary series was administered. The primary series has been completed"
  or ( "First seasonal influenza dose from the primary series was administered"
    and Encounter."Client's age is more than or equal to 9 years"
   ) )

/*
@output: Seasonal influenza annual dose Create
@create: Seasonal influenza vaccine annual dose should be provided 1 year after the previous dose
*/
define "Seasonal influenza annual dose Create":
  if "Seasonal influenza annual dose" 
  then 'Seasonal influenza vaccine annual dose should be provided 1 year after the previous dose' + '
Due Date: ' + ToString("Seasonal influenza annual dose Due Date")
  else ''

/*
@dynamicValue: Seasonal influenza annual dose Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Seasonal influenza vaccines") + 1 year
*/
define "Seasonal influenza annual dose Due Date":
  if "Seasonal influenza annual dose" then Encounter."Date of Latest Seasonal influenza Dose" + 1 year
  else null

/*
@dynamicValue: Seasonal influenza annual dose Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated
*/
define "Seasonal influenza annual dose Overdue":
  null

/*
@dynamicValue: Seasonal influenza annual dose Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated
*/
define "Seasonal influenza annual dose Expiration":
  null
  
/*
@complete: Seasonal influenza annual dose was administered less than 1 year ago
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Seasonal influenza vaccines" and "Type of dose" = "Booster dose")  ≥ 1 AND Today's date - Latest "Date and time of vaccination" (where "Vaccine type" = "Seasonal influenza vaccines") < 1 year
*/
define "Seasonal influenza annual dose was administered less than 1 year ago":
  Encounter."The latest seasonal influenza dose was  administered less than 1 year ago"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.1' then "Seasonal influenza dose 1"
    when Patient.id = '09.01' then "Seasonal influenza dose 1"
    when Patient.id = '10.012' then "Seasonal influenza dose 2"
    when Patient.id = '11.012' then "Seasonal influenza dose 2"
    when Patient.id = '12.012' then "Seasonal influenza annual dose"
    when Patient.id = '13.012' then "Seasonal influenza annual dose"
    when Patient.id = '14.02' then "Seasonal influenza annual dose"
    when Patient.id = '15.02' then "Seasonal influenza annual dose"
    else 'No test case set'
  end
