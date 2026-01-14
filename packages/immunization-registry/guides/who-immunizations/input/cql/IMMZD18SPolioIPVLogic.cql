
/*
 * Library: IMMZD18SPolioIPVLogic (IMMZ.D18.S.Polio.IPV-only schedule)
 * Schedule Table: Inactivated polio vaccine (IPV)-only schedule
 */
library IMMZD18SPolioIPVLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTPolioEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: IPV dose 1
@description: Provision of IPV dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "IPV dose 1":
  not "First IPV dose from the primary series was administered"

/*
@output: IPV dose 1 Create
@create: A primary 3-dose series of IPV administered beginning at 6 or 8 weeks of age, with a minimum 4 week-interval between doses, is recommended.
*/
define "IPV dose 1 Create":
  if "IPV dose 1" 
  then 'A primary 3-dose series of IPV administered beginning at 6 or 8 weeks of age, with a minimum 4 week-interval between doses, is recommended.' + '
Due Date: ' + ToString("IPV dose 1 Due Date")
  else ''

/*
@dynamicValue: IPV dose 1 Due Date
@pseudocode: "Date of birth" + 6 weeks
*/
define "IPV dose 1 Due Date":
  if "IPV dose 1" then Patient.birthDate + 6 weeks
  else null

/*
@dynamicValue: IPV dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "IPV dose 1 Overdue":
  null

/*
@dynamicValue: IPV dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "IPV dose 1 Expiration":
  null

/*
@complete: First IPV dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines") = 1
*/
define "First IPV dose from the primary series was administered":
  Encounter."Number of Polio IPV Primary Series Doses Administered" >= 1


/*
@output: IPV dose 2
@description: Provision of IPV dose 2
@trigger: First IPV dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines") = 1
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines")
*/
define "IPV dose 2":
  "First IPV dose from the primary series was administered" and not "Second IPV dose from the primary series was administered"

/*
@output: IPV dose 2 Create
@create: A primary 3-dose series of IPV administered beginning at 6 or 8 weeks of age, with a minimum 4 week-interval between doses, is recommended.
*/
define "IPV dose 2 Create":
  if "IPV dose 2" 
  then 'A primary 3-dose series of IPV administered beginning at 6 or 8 weeks of age, with a minimum 4 week-interval between doses, is recommended.' + '
Due Date: ' + ToString("IPV dose 2 Due Date")
  else ''

/*
@dynamicValue: IPV dose 2 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "IPV") + 4 weeks
*/
define "IPV dose 2 Due Date":
  if "IPV dose 2" then Encounter."Date of Latest IPV Dose" + 4 weeks
  else null

/*
@dynamicValue: IPV dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "IPV dose 2 Overdue":
  null

/*
@dynamicValue: IPV dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "IPV dose 2 Expiration":
  null

/*
@complete: Second IPV dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines") = 2
*/
define "Second IPV dose from the primary series was administered":
  Encounter."Number of Polio IPV Primary Series Doses Administered" >= 2

/*
@output: IPV dose 3
@description: Provision of IPV dose 3
@trigger: Second IPV dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines") = 2
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines")
*/
define "IPV dose 3":
  "Second IPV dose from the primary series was administered" and not "Third IPV dose from the primary series was administered. The primary series has been completed"

/*
@output: IPV dose 3 Create
@create: A primary 3-dose series of IPV administered beginning at 6 or 8 weeks of age, with a minimum 4 week-interval between doses, is recommended.
*/
define "IPV dose 3 Create":
  if "IPV dose 3" 
  then 'A primary 3-dose series of IPV administered beginning at 6 or 8 weeks of age, with a minimum 4 week-interval between doses, is recommended.' + '
Due Date: ' + ToString("IPV dose 3 Due Date")
  else ''

/*
@dynamicValue: IPV dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "IPV") + 4 weeks
*/
define "IPV dose 3 Due Date":
  if "IPV dose 2" then Encounter."Date of Latest IPV Dose" + 4 weeks
  else null

/*
@dynamicValue: IPV dose 3 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "IPV dose 3 Overdue":
  null

/*
@dynamicValue: IPV dose 3 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "IPV dose 3 Expiration":
  null

/*
@complete: Third IPV dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Poliovirus-containing vaccines")
*/
define "Third IPV dose from the primary series was administered. The primary series has been completed":
  Encounter."Number of Polio IPV Primary Series Doses Administered" >= 3

/*
@output: IPV booster
@description: Provision of IPV booster
@trigger: Third IPV dose from the primary series was administered and the client's age was 6 weeks when the primary series was started
Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines") = 3 AND "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines" AND "Dose number" = 1) − "Date of birth" = 6 weeks
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines")
*/
define "IPV booster":
  "Third IPV dose from the primary series was administered. The primary series has been completed" and not "Booster IPV dose was administered. Polio immunization schedule has been completed"

/*
@output: IPV booster Create
@create: If the primary series begins at 6 weeks, a booster dose should be given 6 months or more after the third dose
*/
define "IPV booster Create":
  if "IPV booster" 
  then 'If the primary series begins at 6 weeks, a booster dose should be given 6 months or more after the third dose' + '
Due Date: ' + ToString("IPV booster Due Date")
  else ''

/*
@dynamicValue: IPV booster Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Poliovirus-containing vaccines") + 6 months
*/
define "IPV booster Due Date":
  if "IPV dose 2" then Encounter."Date of Latest Polio Dose" + 6 months
  else null

/*
@dynamicValue: IPV booster Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "IPV booster Overdue":
  null

/*
@dynamicValue: IPV booster Expiration
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "IPV booster Expiration":
  null

/*
@complete: Booster IPV dose was administered. Polio immunization schedule has been completed
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "IPV" and "Type of dose" = "Booster dose") = 1
*/
define "Booster IPV dose was administered. Polio immunization schedule has been completed":
  Encounter."Number of Polio Booster Series Doses Administered" >= 1

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '71.Alt6w' then "IPV dose 1"
    when Patient.id = '72.Agt6w' then "IPV dose 1"
    when Patient.id = '73.D1PDlt4w' then "IPV dose 2"
    when Patient.id = '74.D1PDgt4w' then "IPV dose 2"
    when Patient.id = '75.D2PDlt4w' then "IPV dose 3"
    when Patient.id = '76.D2PDgt4w' then "IPV dose 3"
    when Patient.id = '77.D3FDAgt6w' then "IPV booster"
    when Patient.id = '78.D3FDA6wPDlt6m' then "IPV booster"
    when Patient.id = '79.D3FDA6wPDgt6mBF' then "IPV booster"
    when Patient.id = '80.D3FDA6wPDgt6mBT' then "Booster IPV dose was administered. Polio immunization schedule has been completed"
    else 'No test case set'
  end
