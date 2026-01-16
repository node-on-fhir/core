
/*
 * Library: IMMZD18SJEIVLogic (IMMZ.D18.S.JE.Inactivated Vero cell-derived vaccination schedule)
 * Schedule Table: Inactivated Vero cell-derived vaccination schedule (2-dose scheme)
 */
library IMMZD18SJEIVLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTJEEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Japanese encephalitis (JE) dose 1
@description: Provision of the JE dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Japanese encephalitis (JE) dose 1":
  Encounter."No JE primary series doses were administered"

/*
@output: Japanese encephalitis (JE) dose 1 Create
@create: JE dose 1 should be provided if the client's age is 6 months or older and the country is administering the Inactivated Vero cell-derived antigen.
*/
define "Japanese encephalitis (JE) dose 1 Create":
  if "Japanese encephalitis (JE) dose 1" 
  then 'JE dose 1 should be provided if the client\'s age is 6 months or older and the country is administering the Inactivated Vero cell-derived antigen.' + '
Due Date: ' + ToString("Japanese encephalitis (JE) dose 1 Due Date")
  else ''

/*
@dynamicValue: Japanese encephalitis (JE) dose 1 Due Date
@pseudocode: "Date of birth"+ 6 months
*/
define "Japanese encephalitis (JE) dose 1 Due Date":
  if "Japanese encephalitis (JE) dose 1" then Patient.birthDate + 6 months
  else null

/*
@dynamicValue: Japanese encephalitis (JE) dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Japanese encephalitis (JE) dose 1 Overdue":
  null

/*
@dynamicValue: Japanese encephalitis (JE) dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Japanese encephalitis (JE) dose 1 Expiration":
  null
  
/*
@complete: One JE primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "JE vaccines" and "Type of dose" = "Primary series") = 1
*/
define "One JE primary series dose was administered":
  Encounter."One JE primary series dose was administered"

/*
@output: JE dose 2
@description: Provision of the JE dose 2
@trigger: One JE primary series dose was administered
Count of vaccines administered (where "Vaccine type" = "JE vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: "Date and time of vaccination" where "Vaccine type" = "JE vaccines"
*/
define "JE dose 2":
  "One JE primary series dose was administered"
  and not "Second JE dose from the primary series was administered. The primary series has been completed"

/*
@output: JE dose 2 Create
@create: JE inactivated Vero cell-derived vaccine dose 2 should be provided if dose 1 was administered at least 4 weeks ago.
*/
define "JE dose 2 Create":
  if "JE dose 2" 
  then 'JE inactivated Vero cell-derived vaccine dose 2 should be provided if dose 1 was administered at least 4 weeks ago.' + '
Due Date: ' + ToString("JE dose 2 Due Date")
  else ''

/*
@dynamicValue: JE dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "JE vaccines") + 4 weeks
*/
define "JE dose 2 Due Date":
  if "JE dose 2" then Encounter."Date of Latest JE Dose" + 4 weeks
  else null

/*
@dynamicValue: JE dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "JE dose 2 Overdue":
  null

/*
@dynamicValue: JE dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "JE dose 2 Expiration":
  null
  
/*
@complete: Second JE dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "JE vaccines")
*/
define "Second JE dose from the primary series was administered. The primary series has been completed":
  Encounter."Two JE primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.1' then "Japanese encephalitis (JE) dose 1"
    when Patient.id = '09.01' then "Japanese encephalitis (JE) dose 1"
    when Patient.id = '10.02' then "JE dose 2"
    when Patient.id = '11.02' then "JE dose 2"
    when Patient.id = '12.0' then "Second JE dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
