
/*
 * Library: IMMZD18SMeaslesLowTxLogic (IMMZ.D18.S.Measles.Low transmission schedule)
 * Schedule Table: Schedule for countries with low levels of measles transmission (countries that provide first dose of measles-containing vaccine (MCV) at 12 months and second dose of MCV at 15 months)
 */
library IMMZD18SMeaslesLowTxLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTMeaslesEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: MCV dose 1 (MCV1)
@description: Provision of MCV1 from the primary series
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "MCV dose 1 (MCV1)":
  Encounter."No measles primary series doses were administered"

/*
@output: MCV dose 1 (MCV1) Create
@create: The client is due for MCV1 if the client is at least 12 months
*/
define "MCV dose 1 (MCV1) Create":
  if "MCV dose 1 (MCV1)" 
  then 'The client is due for MCV1 if the client is at least 12 months' + '
Due Date: ' + ToString("MCV dose 1 (MCV1) Due Date")
  else ''

/*
@dynamicValue: MCV dose 1 (MCV1) Due Date
@pseudocode: "Date of birth" + 12 months
*/
define "MCV dose 1 (MCV1) Due Date":
  if "MCV dose 1 (MCV1)" then Patient.birthDate + 12 months
  else null

/*
@dynamicValue: MCV dose 1 (MCV1) Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "MCV dose 1 (MCV1) Overdue":
  null

/*
@dynamicValue: MCV dose 1 (MCV1) Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "MCV dose 1 (MCV1) Expiration":
  null

/*
@complete: MCV1 was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Measles-containing vaccines" and "Type of dose" = "Primary series") = 1
*/
define "MCV1 was administered":
   Encounter."MCV1 was administered"

/*
@output: MCV2
@description: Provision of MCV2 from the primary series
@trigger: MCV1 was administered
Count of vaccines administered (where "Vaccine type" = "Measles-containing vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: "Date of birth"
*/
define "MCV2":
  not "MCV2 was administered. The primary series has been completed"

/*
@output: MCV2 Create
@create: The client is due for MCV2 if the client is at least 15 months.
*/
define "MCV2 Create":
  if "MCV2" 
  then 'The client is due for MCV2 if the client is at least 15 months.' + '
Due Date: ' + ToString("MCV2 Due Date")
  else ''

/*
@dynamicValue: MCV2 Due Date
@pseudocode: "Date of birth" + 15 months
*/
define "MCV2 Due Date":
  if "MCV2" then Patient.birthDate + 15 months
  else null

/*
@dynamicValue: MCV2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "MCV2 Overdue":
  null

/*
@dynamicValue: MCV2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "MCV2 Expiration":
  null

/*
@complete: MCV2 was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Measles-containing vaccines")
*/
define "MCV2 was administered. The primary series has been completed":
  Encounter."MCV2 was administered"


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '21.Alt12m' then "MCV dose 1 (MCV1)"
    when Patient.id = '21.Agt12m' then "MCV dose 1 (MCV1)"
    when Patient.id = '21.Agt12mLVlt4w' then "MCV dose 1 (MCV1)"
    when Patient.id = '22.D1Alt15m' then "MCV2"
    when Patient.id = '22.D1Agt15mLVlt4w' then "MCV2"
    when Patient.id = '22.D2' then not "MCV2" and not "MCV dose 1 (MCV1)"
    else 'No test case set'
  end
