
/*
 * Library: IMMZD18SMumps2DoseLogic (IMMZ.D18.S.Mumps schedule)
 * Schedule Table: 2-dose schedule
 */
library IMMZD18SMumps2DoseLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTMumpsEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Mumps dose 1
@description: Provision of the mumps dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Mumps dose 1":
  Encounter."No mumps primary series doses were administered"
  and not "First mumps dose from the primary series was administered"

/*
@output: Mumps dose 1 Create
@create: The first dose of the mumps-containing vaccine (monovalent or MMR [measles, mumps and rubella]) should be given at 12–18 months of age.
*/
define "Mumps dose 1 Create":
  if "Mumps dose 1" 
  then 'The first dose of the mumps-containing vaccine (monovalent or MMR [measles, mumps and rubella]) should be given at 12–18 months of age.' + '
Due Date: ' + ToString("Mumps dose 1 Due Date") + '
Overdue: ' + ToString("Mumps dose 1 Overdue")
  else ''

/*
@dynamicValue: Mumps dose 1 Due Date
@pseudocode: "Date of birth" + 12 months
*/
define "Mumps dose 1 Due Date":
  if "Mumps dose 1" then Patient.birthDate + 12 months
  else null

/*
@dynamicValue: Mumps dose 1 Overdue
@pseudocode: "Date of birth" + 18 months
*/
define "Mumps dose 1 Overdue":
  if "Mumps dose 1" then Patient.birthDate + 18 months
  else null

/*
@dynamicValue: Mumps dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Mumps dose 1 Expiration":
  null
  
/*
@complete: First mumps dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Mumps-containing vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First mumps dose from the primary series was administered":
  Encounter."One mumps primary series dose was administered"

/*
@output: Mumps dose 2
@description: Provision of the mumps dose 2
@trigger: First mumps dose from the primary series was administered
Count of vaccines administered (where "Vaccine type" = "Mumps-containing vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Mumps-containing vaccines")
*/
define "Mumps dose 2":
  "First mumps dose from the primary series was administered"
  and not "Second mumps dose from the primary series was administered. The primary series has been completed"

/*
@output: Mumps dose 2 Create
@create: The age of administration of the second dose may range from the second year of life to age at school entry (about 6 years of age). The minimum interval between the first and the second doses is 1 month.
*/
define "Mumps dose 2 Create":
  if "Mumps dose 2" 
  then 'The age of administration of the second dose may range from the second year of life to age at school entry (about 6 years of age). The minimum interval between the first and the second doses is 1 month.' + '
Due Date: ' + ToString("Mumps dose 2 Due Date") + '
Overdue: ' + ToString("Mumps dose 2 Overdue")
  else ''

/*
@dynamicValue: Mumps dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Mumps-containing vaccines") + 1 month
*/
define "Mumps dose 2 Due Date":
  if "Mumps dose 2" then Encounter."Date of Latest Mumps Dose" + 1 month
  else null

/*
@dynamicValue: Mumps dose 2 Overdue
@pseudocode: "Date of birth" + 6 years
*/
define "Mumps dose 2 Overdue":
  if "Mumps dose 2" then Patient.birthDate + 6 years
  else null

/*
@dynamicValue: Mumps dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Mumps dose 2 Expiration":
  null
  
/*
@complete: Second mumps dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Mumps-containing vaccines")"
*/
define "Second mumps dose from the primary series was administered. The primary series has been completed":
  Encounter."Two mumps primary series doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.2' then "Mumps dose 1"
    when Patient.id = '09.124' then "Mumps dose 1"
    when Patient.id = '10.124' then "Mumps dose 1"
    when Patient.id = '11.13' then "Mumps dose 2"
    when Patient.id = '12.134' then "Mumps dose 2"
    when Patient.id = '13.134' then "Mumps dose 2"
    when Patient.id = '14.1' then "Second mumps dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
