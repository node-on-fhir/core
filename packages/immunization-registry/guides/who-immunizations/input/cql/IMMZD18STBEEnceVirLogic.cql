
/*
 * Library: IMMZD18STBEEnceVirLogic (IMMZ.D18.S.TBE.EnceVir schedule)
 * Schedule Table: EnceVir, 3-dose schedule
 */
library IMMZD18STBEEnceVirLogic

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
@output: Tick-borne encephalitis (TBE) EnceVir dose 1
@description: Provision of the TBE EnceVir dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Tick-borne encephalitis (TBE) EnceVir dose 1":
  Encounter."No TBE primary series doses were administered"
  and not "First TBE dose from the primary series was administered"

/*
@output: Tick-borne encephalitis (TBE) EnceVir dose 1 Create
@create: The TBE-Moscow vaccine is not licensed for use in children aged under 3 years.
*/
define "Tick-borne encephalitis (TBE) EnceVir dose 1 Create":
  if "Tick-borne encephalitis (TBE) EnceVir dose 1" 
  then 'The TBE-Moscow vaccine is not licensed for use in children aged under 3 years.' + '
Due Date: ' + ToString("Tick-borne encephalitis (TBE) EnceVir dose 1 Due Date")
  else ''

/*
@dynamicValue: Tick-borne encephalitis (TBE) EnceVir dose 1 Due Date
@pseudocode: "Date of birth" + 3 years
*/
define "Tick-borne encephalitis (TBE) EnceVir dose 1 Due Date":
  if "Tick-borne encephalitis (TBE) EnceVir dose 1" then Patient.birthDate + 3 years
  else null

/*
@dynamicValue: Tick-borne encephalitis (TBE) EnceVir dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Tick-borne encephalitis (TBE) EnceVir dose 1 Overdue":
  null

/*
@dynamicValue: Tick-borne encephalitis (TBE) EnceVir dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Tick-borne encephalitis (TBE) EnceVir dose 1 Expiration":
  null
  
/*
@complete: First TBE dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First TBE dose from the primary series was administered":
  Encounter."One TBE primary series dose was administered"

/*
@output: TBE EnceVir Dose 2
@description: Provision of the TBE EnceVir dose 2
@trigger: First TBE dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
*/
define "TBE EnceVir Dose 2":
  "First TBE dose from the primary series was administered"
  and not "Second TBE dose from the primary series was administered"

/*
@output: TBE EnceVir Dose 2 Create
@create: The manufacturer of EnceVir recommends 2 doses given at an interval of 5–7 months.
*/
define "TBE EnceVir Dose 2 Create":
  if "TBE EnceVir Dose 2" 
  then 'The manufacturer of EnceVir recommends 2 doses given at an interval of 5–7 months.' + '
Due Date: ' + ToString("TBE EnceVir Dose 2 Due Date") + '
Overdue: ' + ToString("TBE EnceVir Dose 2 Overdue")
  else ''

/*
@dynamicValue: TBE EnceVir Dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") + 5 months
*/
define "TBE EnceVir Dose 2 Due Date":
  if "TBE EnceVir Dose 2" then Encounter."Date of Latest TBE Dose" + 5 months
  else null

/*
@dynamicValue: TBE EnceVir Dose 2 Overdue
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") + 7 months
*/
define "TBE EnceVir Dose 2 Overdue":
  if "TBE EnceVir Dose 2" then Encounter."Date of Latest TBE Dose" + 7 months
  else null

/*
@dynamicValue: TBE EnceVir Dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "TBE EnceVir Dose 2 Expiration":
  null
  
/*
@complete: Second TBE dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 2
*/
define "Second TBE dose from the primary series was administered":
  Encounter."Two TBE primary series doses were administered"


/*
@output: TBE EnceVir dose 3
@description: Provision of the TBE EnceVir dose 3
@trigger: Second TBE dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 2
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
*/
define "TBE EnceVir dose 3":
  "Second TBE dose from the primary series was administered"
  and not "Third TBE dose from the primary series was administered. The primary series has been completed"

/*
@output: TBE EnceVir dose 3 Create
@create: The recommended interval is 12 months between the second and third doses.
*/
define "TBE EnceVir dose 3 Create":
  if "TBE EnceVir dose 3" 
  then 'The recommended interval is 12 months between the second and third doses.' + '
Due Date: ' + ToString("TBE EnceVir dose 3 Due Date")
  else ''

/*
@dynamicValue: TBE EnceVir dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") + 12 months
*/
define "TBE EnceVir dose 3 Due Date":
  if "TBE EnceVir dose 3" then Encounter."Date of Latest TBE Dose" + 12 months
  else null

/*
@dynamicValue: TBE EnceVir dose 3 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "TBE EnceVir dose 3 Overdue":
  null

/*
@dynamicValue: TBE EnceVir dose 3 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "TBE EnceVir dose 3 Expiration":
  null
  
/*
@complete: Third TBE dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "TBE vaccines")
*/
define "Third TBE dose from the primary series was administered. The primary series has been completed":
  Encounter."Three TBE primary series doses were administered"

/*
@output: TBE EnceVir booster dose
@description: Provision of the TBE EnceVir booster dose
@trigger: The primary series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "TBE vaccines")
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
*/
define "TBE EnceVir booster dose":
  "Third TBE dose from the primary series was administered. The primary series has been completed"

/*
@output: TBE EnceVir booster dose Create
@create: TBE booster dose should be provided every 3 years to the client if the country recognizes TBE as a priority and the client has completed the primary series.
*/
define "TBE EnceVir booster dose Create":
  if "TBE EnceVir booster dose" 
  then 'TBE booster dose should be provided every 3 years to the client if the country recognizes TBE as a priority and the client has completed the primary series.' + '
Due Date: ' + ToString("TBE EnceVir booster dose Due Date")
  else ''

/*
@dynamicValue: TBE EnceVir booster dose Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") + 3 years
*/
define "TBE EnceVir booster dose Due Date":
  if "TBE EnceVir booster dose" then Encounter."Date of Latest TBE Dose" + 3 years
  else null

/*
@dynamicValue: TBE EnceVir booster dose Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "TBE EnceVir booster dose Overdue":
  null

/*
@dynamicValue: TBE EnceVir booster dose Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "TBE EnceVir booster dose Expiration":
  null
  
/*
@complete: TBE booster dose was administered less than 3 years ago
@pseudocode: Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Booster dose")  ≥ 1 AND Today's date - Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") < 3 years
*/
define "TBE booster dose was administered less than 3 years ago":
  Encounter."At least one booster dose was administered"
  and Encounter."The latest TBE dose was administered less than 3 years ago"


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '55.1' then "Tick-borne encephalitis (TBE) EnceVir dose 1"
    when Patient.id = '56.01' then "Tick-borne encephalitis (TBE) EnceVir dose 1"
    when Patient.id = '57.02' then "TBE EnceVir Dose 2"
    when Patient.id = '58.02' then "TBE EnceVir Dose 2"
    when Patient.id = '59.02' then "TBE EnceVir dose 3"
    when Patient.id = '60.02' then "TBE EnceVir dose 3"
    when Patient.id = '61.02' then "TBE EnceVir booster dose"
    when Patient.id = '62.02' then "TBE EnceVir booster dose"
    else 'No test case set'
  end
