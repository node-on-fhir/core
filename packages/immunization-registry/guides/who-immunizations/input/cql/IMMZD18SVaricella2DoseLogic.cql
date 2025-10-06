
/*
 * Library: IMMZD18SVaricella2DoseLogic (IMMZ.D18.S.Varicella.2-dose schedule)
 * Schedule Table: 2-dose schedule
 */
library IMMZD18SVaricella2DoseLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTVaricellaEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Varicella dose 1
@description: Provision of the varicella dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Varicella dose 1":
  Encounter."No varicella primary series doses were administered"
  and not "First varicella dose from the primary series was administered"

/*
@output: Varicella dose 1 Create
@create: Depending on the goal of the vaccination programme, 1–2 doses should be given with the first dose administered at 12–18 months of age.
*/
define "Varicella dose 1 Create":
  if "Varicella dose 1" 
  then 'Depending on the goal of the vaccination programme, 1–2 doses should be given with the first dose administered at 12–18 months of age.' + '
Due Date: ' + ToString("Varicella dose 1 Due Date") + '
Overdue: ' + ToString("Varicella dose 1 Overdue")
  else ''

/*
@dynamicValue: Varicella dose 1 Due Date
@pseudocode: "Date of birth" + 12 months
*/
define "Varicella dose 1 Due Date":
  if "Varicella dose 1" then Patient.birthDate + 12 months
  else null

/*
@dynamicValue: Varicella dose 1 Overdue
@pseudocode: "Date of birth" + 18 months
*/
define "Varicella dose 1 Overdue":
  if "Varicella dose 1" then Patient.birthDate + 18 months
  else null

/*
@dynamicValue: Varicella dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Varicella dose 1 Expiration":
  null
  
/*
@complete: First varicella dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Varicella-containing vaccines" and "Type of dose" = "Primary series") =1
*/
define "First varicella dose from the primary series was administered":
  Encounter."One varicella primary series dose was administered"

/*
@output: Varicella dose 2
@description: Provision of the varicella dose 2
@trigger: First varicella dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Varicella-containing vaccines" and "Type of dose" = "Primary series") =1
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Varicella-containing vaccines")
*/
define "Varicella dose 2":
  "First varicella dose from the primary series was administered"
  and not "Second varicella dose from the primary series was administered. The primary series has been completed"

/*
@output: Varicella dose 2 Create
@create: The minimum interval between doses should be as recommended by the manufacturer, ranging from 4 weeks to 3 months.
*/
define "Varicella dose 2 Create":
  if "Varicella dose 2" 
  then 'The minimum interval between doses should be as recommended by the manufacturer, ranging from 4 weeks to 3 months.' + '
Due Date: ' + ToString("Varicella dose 2 Due Date")
  else ''

/*
@dynamicValue: Varicella dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Varicella-containing vaccines") + 4 weeks
*/
define "Varicella dose 2 Due Date":
  if "Varicella dose 2" then Encounter."Date of Latest Varicella Dose" + 4 weeks
  else null

/*
@dynamicValue: Varicella dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Varicella dose 2 Overdue":
  null

/*
@dynamicValue: Varicella dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Varicella dose 2 Expiration":
  null
  
/*
@complete: Second varicella dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Varicella-containing vaccines")"
*/
define "Second varicella dose from the primary series was administered. The primary series has been completed":
  Encounter."Two varicella primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '21.2' then "Varicella dose 1"
    when Patient.id = '22.124' then "Varicella dose 1"
    when Patient.id = '23.124' then "Varicella dose 1"
    when Patient.id = '24.13' then "Varicella dose 2"
    when Patient.id = '25.134' then "Varicella dose 2"
    when Patient.id = '26.134' then "Varicella dose 2"
    when Patient.id = '27.1' then "Second varicella dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
