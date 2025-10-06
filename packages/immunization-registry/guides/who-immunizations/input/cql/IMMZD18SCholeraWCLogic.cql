
/*
 * Library: IMMZD18SCholeraWCLogic (IMMZ.D18.S.Cholera.WC vaccines schedule)
 * Schedule Table: Whole-cell (WC) vaccines (Shanchol, Euvchol and mORCVAX), 2-dose schedule
 */
library IMMZD18SCholeraWCLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTCholeraEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
@output: Cholera dose 1
@description: Provision of the cholera dose 1
@trigger: Child's birth and no cholera doses have been administered
Child's birth AND Count of vaccines administered (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Primary series") = 0
@triggerDate: "Date of birth"
OR
Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
*/
define "Cholera dose 1":
  Encounter."No cholera primary series dose was administered"
  and not "First cholera dose was administered"

/*
@output: Cholera dose 1 Create
@create: WC vaccines: 2 doses should be given 14 days apart to individuals aged ≥ 1 year.
Revaccination is recommended where there is continued risk of Vibrio cholerae infection. For WC vaccines, revaccination is recommended after 3 years.
*/
define "Cholera dose 1 Create":
  if "Cholera dose 1" 
  then 'WC vaccines: 2 doses should be given 14 days apart to individuals aged ≥ 1 year.
Revaccination is recommended where there is continued risk of Vibrio cholerae infection. For WC vaccines, revaccination is recommended after 3 years.' + '
Due Date: ' + ToString("Cholera dose 1 Due Date")
  else ''

/*
@dynamicValue: Cholera dose 1 Due Date
@pseudocode: "Date of birth" + 1 year
*/
define "Cholera dose 1 Due Date":
  if "Cholera dose 1" then Patient.birthDate + 1 year
  else null

/*
@dynamicValue: Cholera dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Cholera dose 1 Overdue":
  null

/*
@dynamicValue: Cholera dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Cholera dose 1 Expiration":
  null
  
/*
@complete: First cholera dose was administered
@pseudocode: 'Latest "Dose number" (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First cholera dose was administered":
  Encounter."One cholera primary series dose was administered"


/*
@output: Cholera dose 2
@description: Provision of the cholera dose 2
@trigger: First cholera dose administered
Latest "Dose number" (where "Vaccine type" = "Cholera vaccines"and "Type of dose" = "Primary series") = 1
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
*/
define "Cholera dose 2":
  "First cholera dose was administered"
  and not "The primary series has been completed"

/*
@output: Cholera dose 2 Create
@create: WC vaccines: 2 doses should be given 14 days apart to individuals aged ≥ 1 year.
*/
define "Cholera dose 2 Create":
  if "Cholera dose 2" 
  then 'WC vaccines: 2 doses should be given 14 days apart to individuals aged ≥ 1 year.' + '
Due Date: ' + ToString("Cholera dose 2 Due Date")
  else ''

/*
@dynamicValue: Cholera dose 2 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") + 2 weeks
*/
define "Cholera dose 2 Due Date":
  if "Cholera dose 2" then Encounter."Date of Latest Cholera Dose" + 2 weeks
  else null

/*
@dynamicValue: Cholera dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Cholera dose 2 Overdue":
  null

/*
@dynamicValue: Cholera dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Cholera dose 2 Expiration":
  null
  
/*
@complete: The primary series has been completed
@pseudocode: "Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = TRUE
*/
define "The primary series has been completed":
  Encounter."Two cholera primary series doses were administered"

/*
@output: Cholera booster dose 1
@description: Provision of the cholera booster dose 1
@trigger: Primary series for cholera has been completed and latest cholera dose was administered more than 3 years ago
"Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = TRUE AND Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≥ 3 years
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
*/
define "Cholera booster dose 1":
  "The primary series has been completed"
  and not "First cholera booster dose was administered"

/*
@output: Cholera booster dose 1 Create
@create: For WC vaccines, revaccination is recommended after 3 years.
*/
define "Cholera booster dose 1 Create":
  if "Cholera booster dose 1" 
  then 'For WC vaccines, revaccination is recommended after 3 years.' + '
Due Date: ' + ToString("Cholera booster dose 1 Due Date")
  else ''

/*
@dynamicValue: Cholera booster dose 1 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") + 3 years
*/
define "Cholera booster dose 1 Due Date":
  if "Cholera booster dose 1" then Encounter."Date of Latest Cholera Dose" + 3 years
  else null

/*
@dynamicValue: Cholera booster dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Cholera booster dose 1 Overdue":
  null

/*
@dynamicValue: Cholera booster dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Cholera booster dose 1 Expiration":
  null
  
/*
@complete: First cholera booster dose was administered
@pseudocode: 'Latest "Dose number" (where "Vaccine type" = "Cholera vaccines" and "Type of dose" = "Booster dose") = 1
*/
define "First cholera booster dose was administered":
  Encounter."At least one booster series dose was administered"
  and Encounter."Dose number of the latest dose is one"

/*
@output: Cholera booster dose 2
@description: Provision of the cholera booster dose 1
@trigger: First cholera booster dose administered
Latest "Dose number" (where "Vaccine type" = "Cholera vaccines"and "Type of dose" = "Booster dose") = 1
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
*/
define "Cholera booster dose 2":
  "First cholera booster dose was administered"
  and not "Revaccination with booster series has been completed in the last 3 years"

/*
@output: Cholera booster dose 2 Create
@create: For WC vaccines, revaccination is recommended after 3 years.
*/
define "Cholera booster dose 2 Create":
  if "Cholera booster dose 2" 
  then 'For WC vaccines, revaccination is recommended after 3 years.' + '
Due Date: ' + ToString("Cholera booster dose 2 Due Date")
  else ''

/*
@dynamicValue: Cholera booster dose 2 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") + 2 weeks
*/
define "Cholera booster dose 2 Due Date":
  if "Cholera booster dose 2" then Encounter."Date of Latest Cholera Dose" + 2 weeks
  else null

/*
@dynamicValue: Cholera booster dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Cholera booster dose 2 Overdue":
  null

/*
@dynamicValue: Cholera booster dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Cholera booster dose 2 Expiration":
  null
  
/*
@complete: Revaccination with booster series has been completed in the last 3 years
@pseudocode: "Completed the booster series" (where "Vaccine type" = "Cholera vaccines") = TRUE AND Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccine") < 3 years
*/
define "Revaccination with booster series has been completed in the last 3 years":
  Encounter."At least one booster series dose was administered"
  and Encounter."Dose number of the latest dose is two"


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.0' then "Cholera dose 1"
    when Patient.id = '09.01' then "Cholera dose 1"
    when Patient.id = '10.014' then "Cholera dose 2"
    when Patient.id = '11.014' then "Cholera dose 2"
    when Patient.id = '12.0124' then "Cholera booster dose 1"
    when Patient.id = '13.0124' then "Cholera booster dose 1"
    when Patient.id = '14.01234' then "Cholera booster dose 2"
    when Patient.id = '15.01234' then "Cholera booster dose 2"
    when Patient.id = '16.01234' then "Cholera booster dose 1"
    when Patient.id = '17.0124' then "Cholera booster dose 1"
    else 'No test case set'
  end
