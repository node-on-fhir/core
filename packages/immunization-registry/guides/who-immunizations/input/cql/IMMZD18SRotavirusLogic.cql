
/*
 * Library: IMMZD18SRotavirusLogic (IMMZ.D18.S.Rotavirus schedule)
 * Schedule Table: IMMZ.D18.S.Rotavirus schedule
 */
library IMMZD18SRotavirusLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTRotavirusEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Rotavirus dose 1
@description: Provision of the rotavirus first dose
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Rotavirus dose 1":
  Encounter."No rotavirus primary series doses were administered"
  and "Rotavirus dose 1 Expiration" after day of Today
  and not "First rotavirus dose from the primary series was administered"

/*
@output: Rotavirus dose 1 Create
@create: WHO recommends that the first dose of rotavirus vaccine be administered as soon as possible after 6 weeks of age.
*/
define "Rotavirus dose 1 Create":
  if "Rotavirus dose 1" 
  then 'WHO recommends that the first dose of rotavirus vaccine be administered as soon as possible after 6 weeks of age.' + '
Due Date: ' + ToString("Rotavirus dose 1 Due Date") + '
Expiration: ' + ToString("Rotavirus dose 1 Expiration")
  else ''

/*
@dynamicValue: Rotavirus dose 1 Due Date
@pseudocode: "Date of birth" +  6 weeks
*/
define "Rotavirus dose 1 Due Date":
  if "Rotavirus dose 1" then Patient.birthDate + 6 weeks
  else null

/*
@dynamicValue: Rotavirus dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Rotavirus dose 1 Overdue":
  null

/*
@dynamicValue: Rotavirus dose 1 Expiration
@pseudocode: "Date of birth" + 24 months
*/
define "Rotavirus dose 1 Expiration":
  Patient.birthDate + 24 months
  
/*
@complete: First rotavirus dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rotavirus vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First rotavirus dose from the primary series was administered":
  Encounter."One rotavirus primary series dose was administered"

/*
@output: Rotavirus dose 2
@description: Provision of the rotavirus second dose
@trigger: First rotavirus dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Rotavirus vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: Latest "Date and time of vaccination" where "Vaccine type" = "Rotavirus vaccines"
*/
define "Rotavirus dose 2":
  "First rotavirus dose from the primary series was administered"
  and "Rotavirus dose 2 Expiration" after day of Today
  and not "Second rotavirus dose from the primary series was administered"

/*
@output: Rotavirus dose 2 Create
@create: A minimum interval of 4 weeks should be maintained between doses.
*/
define "Rotavirus dose 2 Create":
  if "Rotavirus dose 2" 
  then 'A minimum interval of 4 weeks should be maintained between doses.' + '
Due Date: ' + ToString("Rotavirus dose 2 Due Date") + '
Expiration: ' + ToString("Rotavirus dose 2 Expiration")
  else ''

/*
@dynamicValue: Rotavirus dose 2 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Rotavirus vaccines") + 4 weeks
*/
define "Rotavirus dose 2 Due Date":
  if "Rotavirus dose 2" then Encounter."Date of Latest Rotavirus Dose" + 4 weeks
  else null

/*
@dynamicValue: Rotavirus dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Rotavirus dose 2 Overdue":
  null

/*
@dynamicValue: Rotavirus dose 2 Expiration
@pseudocode: "Date of birth" + 24 months
*/
define "Rotavirus dose 2 Expiration":
  Patient.birthDate + 24 months
  
/*
@complete: Second rotavirus dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rotavirus vaccines" and "Type of dose" = "Primary series") = 2
*/
define "Second rotavirus dose from the primary series was administered":
  Encounter."Two rotavirus primary series doses were administered"

/*
@output: Rotavirus dose 3
@description: Provision of a rotavirus third dose
@trigger: For a series containing more than two doses, two rotavirus primary series doses of mixed series or a series with unknown vaccine products were administered
Count of vaccines administered (where "Vaccine type" = "Rotavirus vaccines"and "Type of dose" = "Primary series" ) = 2 
AND "Vaccine brand" (where "Vaccine type" = "Rotavirus vaccines" AND "Dose number" = 1) ≠ "Vaccine brand" (where "Vaccine type" = "Rotavirus vaccines" AND "Dose number" = 2) OR "Total doses in series" > 2
@triggerDate: Latest "Date and time of vaccination" where "Vaccine type" = "Rotavirus vaccines"
*/
define "Rotavirus dose 3":
  "Second rotavirus dose from the primary series was administered"
  and (
    Encounter."The series administered to the client is a mixed series or a series with unknown vaccine products"
    or Encounter."The series contain more than two doses"
  )
  and "Rotavirus dose 3 Expiration" after day of Today
  and not "Third rotavirus dose from the primary series was administered"

/*
@output: Rotavirus dose 3 Create
@create: For a mixed series or a series with any unknown vaccine products, a total of 3 doses of rotavirus vaccine should be administered for a complete vaccination series.
RotaTeq, Rotavac and Rotasiil should be administered in a 3-dose schedule.
*/
define "Rotavirus dose 3 Create":
  if "Rotavirus dose 3" 
  then 'For a mixed series or a series with any unknown vaccine products, a total of 3 doses of rotavirus vaccine should be administered for a complete vaccination series.
RotaTeq, Rotavac and Rotasiil should be administered in a 3-dose schedule.' + '
Due Date: ' + ToString("Rotavirus dose 3 Due Date") + '
Expiration: ' + ToString("Rotavirus dose 3 Expiration")
  else ''

/*
@dynamicValue: Rotavirus dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Rotavirus vaccines") + 4 weeks
*/
define "Rotavirus dose 3 Due Date":
  if "Rotavirus dose 3" then Encounter."Date of Latest Rotavirus Dose" + 4 weeks
  else null

/*
@dynamicValue: Rotavirus dose 3 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Rotavirus dose 3 Overdue":
  null

/*
@dynamicValue: Rotavirus dose 3 Expiration
@pseudocode: "Date of birth" + 24 months
*/
define "Rotavirus dose 3 Expiration":
  Patient.birthDate + 24 months
  
/*
@complete: Third rotavirus dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Rotavirus vaccines" and "Type of dose" = "Primary series") = 3
*/
define "Third rotavirus dose from the primary series was administered":
  Encounter."Three rotavirus primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '07.1' then "Rotavirus dose 1"
    when Patient.id = '08.012' then "Rotavirus dose 1"
    when Patient.id = '09.012' then "Rotavirus dose 1"
    when Patient.id = '10.012' then "Rotavirus dose 2"
    when Patient.id = '11.012' then "Rotavirus dose 2"
    when Patient.id = '12.0123' then "Rotavirus dose 3"
    when Patient.id = '13.0123' then "Rotavirus dose 3"
    when Patient.id = '14.01234' then "Rotavirus dose 3"
    when Patient.id = '15.01234' then "Rotavirus dose 3"
    when Patient.id = '16.0134' then "Second rotavirus dose from the primary series was administered" and not "Rotavirus dose 3"
    when Patient.id = '17.0' then "Third rotavirus dose from the primary series was administered"
    when Patient.id = '18.1' then not "Rotavirus dose 1"
    else 'No test case set'
  end
