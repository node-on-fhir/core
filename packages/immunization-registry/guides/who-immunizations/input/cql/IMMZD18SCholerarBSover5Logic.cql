
/*
 * Library: IMMZD18SCholerarBSover5Logic (IMMZ.D18.S.Cholera.WC-rBS vaccine 2-dose schedule)
 * Schedule Table: Whole cell-recombinant B subunit (WC-rBS) vaccine (Dukoral), 2-dose schedule for clients aged ≥ 6 years
 */
library IMMZD18SCholerarBSover5Logic

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
@trigger: Child's birth 
Count of vaccines administered (where "Vaccine type" = "Cholera vaccines") = 0 AND (Today's date − "Date of birth" ≥ 6 years)
OR Primary series interrupted for 6 or more weeks
"Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = FALSE AND Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≥ 6 weeks AND (Today's date − "Date of birth" ≥ 6 years)
OR more than 6 months have passed since completion of primary vaccination series
"Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = TRUE AND Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") > 2 years AND (Today's date − "Date of birth" ≥ 6 years)
@triggerDate: "Date of birth"
OR
Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
*/
define "Cholera dose 1":
  Encounter."Client's age is more than 5 years"
  and ( Encounter."No cholera primary series dose was administered"
  or ( not Encounter."Dose number of the latest primary series dose is more than or equal to two"
    and Encounter."The latest cholera dose was administered more than 6 weeks ago"
  ) or Encounter."The latest cholera dose was administered approximately more than 2 years ago {Member States defined interval}"
  )

/*
@output: Cholera dose 1 Create
@create: For WC-rBS vaccine (Dukoral), 2 doses should be given to children aged ≥ 6 years and adults, with an interval of 1–6 weeks between doses. If the interval since the last dose ≥ 6 weeks, restart the primary series.

Revaccination for those aged ≥ 6 years: If more than 2 years have passed since completion of primary vaccination series, the primary series of 2 doses should be repeated.
*/
define "Cholera dose 1 Create":
  if "Cholera dose 1" 
  then 'For WC-rBS vaccine (Dukoral), 2 doses should be given to children aged ≥ 6 years and adults, with an interval of 1–6 weeks between doses. If the interval since the last dose ≥ 6 weeks, restart the primary series.

Revaccination for those aged ≥ 6 years: If more than 2 years have passed since completion of primary vaccination series, the primary series of 2 doses should be repeated.' + '
Due Date: ' + ToString("Cholera dose 1 Due Date")
  else ''

/*
@dynamicValue: Cholera dose 1 Due Date
@pseudocode: "Date of birth" + 2 years
*/
define "Cholera dose 1 Due Date":
  if "Cholera dose 1" then 
    case when Encounter."No cholera primary series dose was administered" then Patient.birthDate + 2 years
      when not Encounter."Dose number of the latest primary series dose is more than or equal to two"
        and Encounter."The latest cholera dose was administered more than 6 weeks ago" then Today
      when Encounter."The latest cholera dose was administered approximately more than 2 years ago {Member States defined interval}" then Encounter."Date of Latest Cholera Dose" + 2 years
      else null
    end
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
@pseudocode: Latest "Dose number" (where "Vaccine type" = "Cholera vaccines") = 1
*/
define "First cholera dose was administered":
  Encounter."Dose number of the latest primary series dose is one"

/*
@output: Cholera dose 2
@description: Provision of the cholera dose 2
@trigger: First cholera dose was administered
Latest "Dose number" (where "Vaccine type" = "Cholera vaccines") = 1 AND (Today's date − "Date of birth" ≥ 6 years)
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
*/
define "Cholera dose 2":
  Encounter."Client's age is more than 5 years"
  and "Cholera dose 2 Expiration" after day of Today
  and "First cholera dose was administered"
  and not "Second cholera dose was administered"

/*
@output: Cholera dose 2 Create
@create: For WC-rBS vaccine (Dukoral)  2 doses should be given to children aged ≥6 years and adults, with an interval of 1-6 weeks between doses.
*/
define "Cholera dose 2 Create":
  if "Cholera dose 2" 
  then 'For WC-rBS vaccine (Dukoral)  2 doses should be given to children aged ≥6 years and adults, with an interval of 1-6 weeks between doses.' + '
Due Date: ' + ToString("Cholera dose 2 Due Date") + '
Expiration: ' + ToString("Cholera dose 2 Expiration")
  else ''

/*
@dynamicValue: Cholera dose 2 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") + 1 week
*/
define "Cholera dose 2 Due Date":
  if "Cholera dose 2" then Encounter."Date of Latest Cholera Dose" + 1 week
  else null

/*
@dynamicValue: Cholera dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Cholera dose 2 Overdue":
  null

/*
@dynamicValue: Cholera dose 2 Expiration
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") + 6 weeks
*/
define "Cholera dose 2 Expiration":
  Encounter."Date of Latest Cholera Dose" + 6 weeks

/*
@complete: Second cholera dose was administered
@pseudocode: Latest "Dose number" (where "Vaccine type" = "Cholera vaccines") = 2
*/
define "Second cholera dose was administered":
  Encounter."Dose number of the latest primary series dose is two"

/*
@output: Cholera booster dose
@description: Provision of the cholera booster dose
@trigger: Primary series for cholera has been completed and latest cholera dose was administered approximately less than 2 years ago
"Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = TRUE AND Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≤ 2 years ± Member States defined interval AND (Today's date − "Date of birth" ≥ 6 years)
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
*/
define "Cholera booster dose":
  "Second cholera dose was administered"
  and not Encounter."The latest cholera dose was administered approximately more than 2 years ago {Member States defined interval}"

/*
@output: Cholera booster dose Create
@create: For WC-rBS vaccine, for those aged ≥ 6 years of age, if less than 2 years have passed since completion of primary vaccination series, 1 dose for revaccination.
*/
define "Cholera booster dose Create":
  if "Cholera booster dose" 
  then 'For WC-rBS vaccine, for those aged ≥ 6 years of age, if less than 2 years have passed since completion of primary vaccination series, 1 dose for revaccination.' + '
Due Date: ' + ToString("Cholera booster dose Due Date") + '
Expiration: ' + ToString("Cholera booster dose Expiration")
  else ''

/*
@dynamicValue: Cholera booster dose Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ± Member States defined interval
*/
define "Cholera booster dose Due Date":
  if "Cholera booster dose" then Encounter."Date of Latest Cholera Dose" + 22 months
  else null

/*
@dynamicValue: Cholera booster dose Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Cholera booster dose Overdue":
  null

/*
@dynamicValue: Cholera booster dose Expiration
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") + 2 years + Member states defined interval
*/
define "Cholera booster dose Expiration":
  if "Cholera booster dose" then Encounter."Date of Latest Cholera Dose" + 2 years
  else null
  
/*
@complete: Booster dose was administered approximately less than 2 years ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines" AND "Type of dose" = "Booster dose") ≤ 2 years ± Member States defined interval
*/
define "Booster dose was administered approximately less than 2 years ago":
  not Encounter."The latest cholera dose was administered approximately more than 2 years ago {Member States defined interval}"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '44.01' then "Cholera dose 1"
    when Patient.id = '45.0123' then "Cholera dose 2"
    when Patient.id = '46.0123' then "Cholera dose 2"
    when Patient.id = '47.0123' then "Cholera dose 1"
    when Patient.id = '48.0123' then "Cholera booster dose"
    when Patient.id = '49.0123' then "Cholera dose 1"
    else 'No test case set'
  end
