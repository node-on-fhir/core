
/*
 * Library: IMMZD18STBEMoscowLogic (IMMZ.D18.S.TBE.TBE-Moscow schedule)
 * Schedule Table: TBE-Moscow, 3-dose schedule
 */
library IMMZD18STBEMoscowLogic

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
@output: Tick-borne encephalitis (TBE)-Moscow dose 1
@description: Provision of the TBE-Moscow dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Tick-borne encephalitis (TBE)-Moscow dose 1":
  Encounter."No TBE primary series doses were administered"
  and not "First TBE dose from the primary series was administered"

/*
@output: Tick-borne encephalitis (TBE)-Moscow dose 1 Create
@create: The TBE-Moscow vaccine is not licensed for use in children aged under 3 years.
*/
define "Tick-borne encephalitis (TBE)-Moscow dose 1 Create":
  if "Tick-borne encephalitis (TBE)-Moscow dose 1" 
  then 'The TBE-Moscow vaccine is not licensed for use in children aged under 3 years.' + '
Due Date: ' + ToString("Tick-borne encephalitis (TBE)-Moscow dose 1 Due Date")
  else ''

/*
@dynamicValue: Tick-borne encephalitis (TBE)-Moscow dose 1 Due Date
@pseudocode: "Date of birth" + 3 years
*/
define "Tick-borne encephalitis (TBE)-Moscow dose 1 Due Date":
  if "Tick-borne encephalitis (TBE)-Moscow dose 1" then Patient.birthDate + 3 years
  else null

/*
@dynamicValue: Tick-borne encephalitis (TBE)-Moscow dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "Tick-borne encephalitis (TBE)-Moscow dose 1 Overdue":
  null

/*
@dynamicValue: Tick-borne encephalitis (TBE)-Moscow dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Tick-borne encephalitis (TBE)-Moscow dose 1 Expiration":
  null
  
/*
@complete: First TBE dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First TBE dose from the primary series was administered":
  Encounter."One TBE primary series dose was administered"

/*
@output: TBE-Moscow dose 2
@description: Provision of the TBE-Moscow dose 2
@trigger: First TBE dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
*/
define "TBE-Moscow dose 2":
  "First TBE dose from the primary series was administered"
  and not "Second TBE dose from the primary series was administered"

/*
@output: TBE-Moscow dose 2 Create
@create: The manufacturer of TBE-Moscow recommends a standard primary immunization schedule of 2 doses given at an interval of 1–7 months.
*/
define "TBE-Moscow dose 2 Create":
  if "TBE-Moscow dose 2" 
  then 'The manufacturer of TBE-Moscow recommends a standard primary immunization schedule of 2 doses given at an interval of 1–7 months.' + '
Due Date: ' + ToString("TBE-Moscow dose 2 Due Date") + '
Overdue: ' + ToString("TBE-Moscow dose 2 Overdue")
  else ''

/*
@dynamicValue: TBE-Moscow dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") + 1 month
*/
define "TBE-Moscow dose 2 Due Date":
  if "TBE-Moscow dose 2" then Encounter."Date of Latest TBE Dose" + 1 month
  else null

/*
@dynamicValue: TBE-Moscow dose 2 Overdue
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") + 7 months
*/
define "TBE-Moscow dose 2 Overdue":
  if "TBE-Moscow dose 2" then Encounter."Date of Latest TBE Dose" + 7 months
  else null

/*
@dynamicValue: TBE-Moscow dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "TBE-Moscow dose 2 Expiration":
  null
  
/*
@complete: Second TBE dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 2
*/
define "Second TBE dose from the primary series was administered":
  Encounter."Two TBE primary series doses were administered"

/*
@output: TBE-Moscow dose 3
@description: Provision of the TBE-Moscow dose 3
@trigger: Second TBE dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Primary series") = 2
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
*/
define "TBE-Moscow dose 3":
  "Second TBE dose from the primary series was administered"
  and not "Third TBE dose from the primary series was administered. The primary series has been completed"

/*
@output: TBE-Moscow dose 3 Create
@create: The recommended interval is 12 months between the second and third doses.
*/
define "TBE-Moscow dose 3 Create":
  if "TBE-Moscow dose 3" 
  then 'The recommended interval is 12 months between the second and third doses.' + '
Due Date: ' + ToString("TBE-Moscow dose 3 Due Date")
  else ''

/*
@dynamicValue: TBE-Moscow dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") + 12 months
*/
define "TBE-Moscow dose 3 Due Date":
  if "TBE-Moscow dose 3" then Encounter."Date of Latest TBE Dose" + 12 months
  else null

/*
@dynamicValue: TBE-Moscow dose 3 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "TBE-Moscow dose 3 Overdue":
  null

/*
@dynamicValue: TBE-Moscow dose 3 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "TBE-Moscow dose 3 Expiration":
  null
  
/*
@complete: Third TBE dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "TBE vaccines")
*/
define "Third TBE dose from the primary series was administered. The primary series has been completed":
  Encounter."Three TBE primary series doses were administered"

/*
@output: TBE-Moscow booster dose(s)
@description: Provision of the TBE-Moscow booster dose (s)
@trigger: The primary series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "TBE vaccines")
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines")
*/
define "TBE-Moscow booster dose(s)":
  "Third TBE dose from the primary series was administered. The primary series has been completed"

/*
@output: TBE-Moscow booster dose(s) Create
@create: TBE booster dose should be provided every 3 years to the client if the country recognizes TBE as a priority and the client has completed the primary series.
*/
define "TBE-Moscow booster dose(s) Create":
  if "TBE-Moscow booster dose(s)" 
  then 'TBE booster dose should be provided every 3 years to the client if the country recognizes TBE as a priority and the client has completed the primary series.' + '
Due Date: ' + ToString("TBE-Moscow booster dose(s) Due Date")
  else ''

/*
@dynamicValue: TBE-Moscow booster dose(s) Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") + 3 years
*/
define "TBE-Moscow booster dose(s) Due Date":
  if "TBE-Moscow booster dose(s)" then Encounter."Date of Latest TBE Dose" + 3 years
  else null

/*
@dynamicValue: TBE-Moscow booster dose(s) Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "TBE-Moscow booster dose(s) Overdue":
  null

/*
@dynamicValue: TBE-Moscow booster dose(s) Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "TBE-Moscow booster dose(s) Expiration":
  null
  
/*
@complete: TBE booster dose was administered less than 3 years ago
@pseudocode: Count of vaccines administered (where "Vaccine type" = "TBE vaccines" and "Type of dose" = "Booster dose")  ≥ 1 AND Today's date - Latest "Date and time of vaccination" (where "Vaccine type" = "TBE vaccines") < 3 'year'
*/
define "TBE booster dose was administered less than 3 years ago":
  Encounter."At least one booster dose was administered"
  and Encounter."The latest TBE dose was administered less than 3 years ago"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '40.1' then "Tick-borne encephalitis (TBE)-Moscow dose 1"
    when Patient.id = '41.01' then "Tick-borne encephalitis (TBE)-Moscow dose 1"
    when Patient.id = '42.02' then "TBE-Moscow dose 2"
    when Patient.id = '43.02' then "TBE-Moscow dose 2"
    when Patient.id = '44.02' then "TBE-Moscow dose 3"
    when Patient.id = '45.02' then "TBE-Moscow dose 3"
    when Patient.id = '46.02' then "TBE-Moscow booster dose(s)"
    when Patient.id = '47.02' then "TBE-Moscow booster dose(s)"
    else 'No test case set'
  end
