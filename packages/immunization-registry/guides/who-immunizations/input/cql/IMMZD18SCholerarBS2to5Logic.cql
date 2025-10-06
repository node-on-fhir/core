
/*
 * Library: IMMZD18SCholerarBS2to5Logic (IMMZ.D18.S.Cholera.WC-rBS vaccine 3-dose schedule)
 * Schedule Table: Whole cell-recombinant B subunit (WC-rBS) vaccine (Dukoral), 3-dose schedule for clients aged 2–5 years
 */
library IMMZD18SCholerarBS2to5Logic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTCholeraEncounterElements called Encounter

parameter CholeraLowerLimitDays Integer default 150
parameter CholeraExactIntervalDays Integer default 0
parameter Today Date default Today()

context Patient


/*
@output: Cholera dose 1
@description: Provision of the cholera dose 1
@trigger: Child's birth 
Count of vaccines administered (where "Vaccine type" = "Cholera vaccines") = 0 AND (2 years ≤ Today's date − "Date of birth" ≤ 5 years)
OR Primary series interrupted for 6 or more weeks
"Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = FALSE AND Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≥ 6 weeks AND (2 years ≤ Today's date − "Date of birth" ≤ 5 years)
OR more than 6 months have passed since completion of primary vaccination series
"Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = TRUE AND Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") > 6 months AND (2 years ≤ Today's date − "Date of birth" ≤ 5 years)
@triggerDate: "Date of birth"
OR
Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
*/
define "Cholera dose 1":
  ( Encounter."Client's age is less than 2 years"
    or Encounter."Client's age is 2–5 years" )
  and ( Encounter."No cholera primary series dose was administered"
    or ( Encounter."Dose number of the latest primary series dose is less than three"
      and Encounter."The latest cholera dose was administered more than 6 weeks ago")
    or Encounter."The latest cholera dose was administered approximately more than 6 months ago {Member States defined exact interval}"
  )

/*
@output: Cholera dose 1 Create
@create: For WC-rBS vaccine (Dukoral), 3 doses should be given to children 2–5 years of age, with an interval of 1-6 weeks between doses. If the interval since the last dose ≥ 6 weeks, restart the primary series.

Revaccination for children aged 2–5 years: If more than 6 months have passed since completion of primary vaccination series, the primary series of 3 doses should be repeated.
*/
define "Cholera dose 1 Create":
  if "Cholera dose 1" 
  then 'For WC-rBS vaccine (Dukoral), 3 doses should be given to children 2–5 years of age, with an interval of 1-6 weeks between doses. If the interval since the last dose ≥ 6 weeks, restart the primary series.

Revaccination for children aged 2–5 years: If more than 6 months have passed since completion of primary vaccination series, the primary series of 3 doses should be repeated.' + '
Due Date: ' + ToString("Cholera dose 1 Due Date")
  else ''

/*
@dynamicValue: Cholera dose 1 Due Date
@pseudocode: "Date of birth" + 2 years
*/
define "Cholera dose 1 Due Date":
  if "Cholera dose 1" then Patient.birthDate + 2 years
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
Latest "Dose number" (where "Vaccine type" = "Cholera vaccines") = 1 AND (2 years ≤ Today's date − "Date of birth" ≤ 5 years)
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
*/
define "Cholera dose 2":
  Encounter."Client's age is 2–5 years"
  and "First cholera dose was administered"
  and "Cholera dose 2 Expiration" after day of Today
  and not "Second cholera dose was administered"

/*
@output: Cholera dose 2 Create
@create: For WC-rBS vaccine (Dukoral), 3 doses should be given to children aged 2–5 years, with an interval of 1–6 weeks between doses.
*/
define "Cholera dose 2 Create":
  if "Cholera dose 2" 
  then 'For WC-rBS vaccine (Dukoral), 3 doses should be given to children aged 2–5 years, with an interval of 1–6 weeks between doses.' + '
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
@output: Cholera dose 3
@description: Provision of the cholera dose 3
@trigger: Second cholera dose was administered
Latest "Dose number" (where "Vaccine type" = "Cholera vaccines") = 2 AND (2 years ≤ Today's date − "Date of birth" ≤ 5 years)
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
*/
define "Cholera dose 3":
  Encounter."Client's age is 2–5 years"
  and "Second cholera dose was administered"
  and "Cholera dose 3 Expiration" after day of Today
  and not "Three doses from primary series were administered. The primary series has been completed"

/*
@output: Cholera dose 3 Create
@create: For WC-rBS vaccine (Dukoral), 3 doses should be given to children aged 2–5 years, with an interval of 1–6 weeks between doses.
*/
define "Cholera dose 3 Create":
  if "Cholera dose 3" 
  then 'For WC-rBS vaccine (Dukoral), 3 doses should be given to children aged 2–5 years, with an interval of 1–6 weeks between doses.' + '
Due Date: ' + ToString("Cholera dose 3 Due Date") + '
Expiration: ' + ToString("Cholera dose 3 Expiration")
  else ''

/*
@dynamicValue: Cholera dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") + 1 week
*/
define "Cholera dose 3 Due Date":
  if "Cholera dose 3" then Encounter."Date of Latest Cholera Dose" + 1 week
  else null

/*
@dynamicValue: Cholera dose 3 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Cholera dose 3 Overdue":
  null

/*
@dynamicValue: Cholera dose 3 Expiration
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") + 6 weeks
*/
define "Cholera dose 3 Expiration":
  Encounter."Date of Latest Cholera Dose" + 6 weeks

/*
@complete: Three doses from primary series were administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = TRUE
*/
define "Three doses from primary series were administered. The primary series has been completed":
  Encounter."Dose number of the latest primary series dose is three"

/*
@output: Cholera booster dose
@description: Provision of the cholera booster dose
@trigger: Primary series for cholera has been completed and latest cholera dose was administered approximately less than 6 months ago
"Completed the primary vaccination series" (where "Vaccine type" = "Cholera vaccines") = TRUE AND Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ≤ 6 months  ± Member States defined interval AND (2 years ≤ Today's date − "Date of birth" ≤ 5 years)
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines")
*/
define "Cholera booster dose":
  Encounter."Dose number of the latest primary series dose is three"
  and "Cholera booster dose Expiration" after day of Today

/*
@output: Cholera booster dose Create
@create: For WC-rBS vaccine, for children aged 2–5 years, if less than 6 months have passed since completion of primary vaccination series, 1 dose for revaccination.
*/
define "Cholera booster dose Create":
  if "Cholera booster dose" 
  then 'For WC-rBS vaccine, for children aged 2–5 years, if less than 6 months have passed since completion of primary vaccination series, 1 dose for revaccination.' + '
Due Date: ' + ToString("Cholera booster dose Due Date") + '
Expiration: ' + ToString("Cholera booster dose Expiration")
  else ''

/*
@dynamicValue: Cholera booster dose Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") ± Member States defined interval
*/
define "Cholera booster dose Due Date":
  if "Cholera booster dose" then Encounter."Date of Latest Cholera Dose" + (CholeraLowerLimitDays * 1 days)
  else null

/*
@dynamicValue: Cholera booster dose Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Cholera booster dose Overdue":
  null

/*
@dynamicValue: Cholera booster dose Expiration
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines") + 6 months ± Member States defined interval
*/
define "Cholera booster dose Expiration":
  Encounter."Date of Latest Cholera Dose" + 6 months + (CholeraExactIntervalDays * 1 days)
  
/*
@complete: Booster dose was administered approximately less than 6 months ago
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "Cholera vaccines" AND "Type of dose" = "Booster dose") ≤ 6 months ± Member States defined interval
*/
define "Booster dose was administered approximately less than 6 months ago":
  Encounter."The latest cholera dose was administered approximately less than 6 months ago {Member States defined exact interval}"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '25.0' then "Cholera dose 1"
    when Patient.id = '26.01' then "Cholera dose 1"
    when Patient.id = '27.0123' then "Cholera dose 2"
    when Patient.id = '28.0123' then "Cholera dose 2"
    when Patient.id = '29.0123' then "Cholera dose 3"
    when Patient.id = '30.0123' then "Cholera dose 3"
    when Patient.id = '31.0123' then "Cholera dose 1"
    when Patient.id = '32.0123' then "Cholera booster dose"
    when Patient.id = '33.0123' then "Cholera booster dose"
    when Patient.id = '34.0123' then "Cholera dose 1"
    else 'No test case set'
  end
