
/*
 * Library: IMMZD18STBEEncepurLogic (IMMZ.D18.S.TBE.Encepur schedule)
 * Schedule Table: Encepur, 3-dose schedule
 */
library IMMZD18STBEEncepurLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTTBEEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Tick-borne encephalitis (TBE) Encepur dose 1
@description: Provision of the TBE Encepur dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Tick-borne encephalitis (TBE) Encepur dose 1":
  Encounter."No TBE primary series doses were administered"
  and not "First TBE dose from the primary series was administered"

/*
@output: Tick-borne encephalitis (TBE) Encepur dose 1 Create
@create: The vaccine can be given from > 1 year of age.
*/
define "Tick-borne encephalitis (TBE) Encepur dose 1 Create":
  if "Tick-borne encephalitis (TBE) Encepur dose 1" 
  then 'The vaccine can be given from > 1 year of age.' + '
Due Date: ' + ToString("Tick-borne encephalitis (TBE) Encepur dose 1 Due Date")
  else ''

/*
@dynamicValue: Tick-borne encephalitis (TBE) Encepur dose 1 Due Date
@pseudocode: "Date of birth" + 1 year
*/
define "Tick-borne encephalitis (TBE) Encepur dose 1 Due Date":
  if "Tick-borne encephalitis (TBE) Encepur dose 1" then Patient.birthDate + 1 year
  else null

/*
@dynamicValue: Tick-borne encephalitis (TBE) Encepur dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Tick-borne encephalitis (TBE) Encepur dose 1 Overdue":
  null

/*
@dynamicValue: Tick-borne encephalitis (TBE) Encepur dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Tick-borne encephalitis (TBE) Encepur dose 1 Expiration":
  null
  
/*
@complete: First TBE dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First TBE dose from the primary series was administered":
  Encounter."One TBE primary series dose was administered"


/*
@output: TBE Encepur dose 2
@description: Provision of the TBE Encepur dose 2
@trigger: First TBE dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
*/
define "TBE Encepur dose 2":
  "First TBE dose from the primary series was administered"
  and not "Second TBE dose from the primary series was administered"

/*
@output: TBE Encepur dose 2 Create
@create: An interval of 1–3 months is recommended between the first 2 doses.
*/
define "TBE Encepur dose 2 Create":
  if "TBE Encepur dose 2" 
  then 'An interval of 1–3 months is recommended between the first 2 doses.' + '
Due Date: ' + ToString("TBE Encepur dose 2 Due Date") + '
Overdue: ' + ToString("TBE Encepur dose 2 Overdue")
  else ''

/*
@dynamicValue: TBE Encepur dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") + 1 month
*/
define "TBE Encepur dose 2 Due Date":
  if "TBE Encepur dose 2" then Encounter."Date of Latest TBE Dose" + 1 month
  else null

/*
@dynamicValue: TBE Encepur dose 2 Overdue
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") + 3 months
*/
define "TBE Encepur dose 2 Overdue":
  if "TBE Encepur dose 2" then Encounter."Date of Latest TBE Dose" + 3 months
  else null

/*
@dynamicValue: TBE Encepur dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "TBE Encepur dose 2 Expiration":
  null
  
/*
@complete: Second TBE dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 2
*/
define "Second TBE dose from the primary series was administered":
  Encounter."Two TBE primary series doses were administered"

/*
@output: TBE Encepur dose 3
@description: Provision of the TBE Encepur dose 3
@trigger: Second TBE dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 2
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
*/
define "TBE Encepur dose 3":
  "Second TBE dose from the primary series was administered"
  and not "Third TBE dose from the primary series was administered. The primary series has been completed"

/*
@output: TBE Encepur dose 3 Create
@create: For Encepur, the requirement is 9–12 months between doses 2 and 3.
*/
define "TBE Encepur dose 3 Create":
  if "TBE Encepur dose 3" 
  then 'For Encepur, the requirement is 9–12 months between doses 2 and 3.' + '
Due Date: ' + ToString("TBE Encepur dose 3 Due Date") + '
Overdue: ' + ToString("TBE Encepur dose 3 Overdue")
  else ''

/*
@dynamicValue: TBE Encepur dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") + 9 months
*/
define "TBE Encepur dose 3 Due Date":
  if "TBE Encepur dose 3" then Encounter."Date of Latest TBE Dose" + 9 months
  else null

/*
@dynamicValue: TBE Encepur dose 3 Overdue
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") + 12 months
*/
define "TBE Encepur dose 3 Overdue":
  if "TBE Encepur dose 3" then Encounter."Date of Latest TBE Dose" + 12 months
  else null

/*
@dynamicValue: TBE Encepur dose 3 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "TBE Encepur dose 3 Expiration":
  null
  
/*
@complete: Third TBE dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "TBE vaccines")
*/
define "Third TBE dose from the primary series was administered. The primary series has been completed":
  Encounter."Three TBE primary series doses were administered"

/*
@output: TBE Encepur booster dose
@description: Provision of the TBE Encepur booster dose
@trigger: The primary series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "TBE vaccines")
@triggerDate: "Date when primary vaccination series was completed"
*/
define "TBE Encepur booster dose":
  "Third TBE dose from the primary series was administered. The primary series has been completed"
  and not "TBE booster dose was administered"

/*
@output: TBE Encepur booster dose Create
@create: The manufacturer recommends a booster dose to be administered 3 years after completion of the primary series.
*/
define "TBE Encepur booster dose Create":
  if "TBE Encepur booster dose" 
  then 'The manufacturer recommends a booster dose to be administered 3 years after completion of the primary series.' + '
Due Date: ' + ToString("TBE Encepur booster dose Due Date") + '
Overdue: ' + ToString("TBE Encepur booster dose Overdue")
  else ''

/*
@dynamicValue: TBE Encepur booster dose Due Date
@pseudocode: "Date when primary vaccination series was completed" + 3 years
*/
define "TBE Encepur booster dose Due Date":
  if "TBE Encepur booster dose" then Encounter."Date of Latest TBE Dose" + 3 years
  else null

/*
@dynamicValue: TBE Encepur booster dose Overdue
@pseudocode: "Date when primary vaccination series was completed" + 5 years
*/
define "TBE Encepur booster dose Overdue":
  if "TBE Encepur booster dose" then Encounter."Date of Latest TBE Dose" + 5 years
  else null

/*
@dynamicValue: TBE Encepur booster dose Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "TBE Encepur booster dose Expiration":
  null
  
/*
@complete: TBE booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Booster dose")  = 1
*/
define "TBE booster dose was administered":
  Encounter."At least one booster dose was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '24.1' then "Tick-borne encephalitis (TBE) Encepur dose 1"
    when Patient.id = '25.01' then "Tick-borne encephalitis (TBE) Encepur dose 1"
    when Patient.id = '26.03' then "TBE Encepur dose 2"
    when Patient.id = '27.03' then "TBE Encepur dose 2"
    when Patient.id = '28.03' then "TBE Encepur dose 3"
    when Patient.id = '29.03' then "TBE Encepur dose 3"
    when Patient.id = '30.023' then "TBE Encepur booster dose"
    when Patient.id = '31.023' then "TBE Encepur booster dose"
    when Patient.id = '32.02' then "TBE booster dose was administered"
    else 'No test case set'
  end
