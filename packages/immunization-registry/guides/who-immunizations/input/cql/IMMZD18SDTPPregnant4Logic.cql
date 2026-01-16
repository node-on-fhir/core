
/*
 * Library: IMMZD18SDTPPregnant4Logic (IMMZ.D18.S.DTP.Pregnancy starting with 4 doses schedule)
 * Schedule Table: Diphtheria and tetanus vaccination schedule in pregnant women who received 4 childhood diphtheria–tetanus–pertussis (DTP) doses
 */
library IMMZD18SDTPPregnant4Logic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTDTPEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy)
@description: Provision of tetanus and diphtheria booster dose 2 for pregnant women who received 4 tetanus-containing vaccines doses during childhood or pre-adulthood
@trigger: The primary DTP series has been completed, first tetanus and diphtheria booster dose was administered and client is currently pregnant
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "DTP-containing vaccines") AND Count of vaccines administered where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 1 AND "Currently pregnant" = TRUE
@triggerDate: First ANC contact date
"Contact date" WHEN "ANC contact number" = 1
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy)":
  Encounter."Three DTP primary series doses were administered" and
  Encounter."One tetanus and diphtheria booster dose was administered" and
  Encounter."Client is currently pregnant" and
  not "Second tetanus and diphtheria booster dose was administered"

/*
@output: Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Create
@create: Women who received 4 tetanus-containing vaccine doses during childhood or pre-adulthood need only 1 booster dose, which should be given at the first opportunity.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Create":
  if "Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy)" 
  then 'Women who received 4 tetanus-containing vaccine doses during childhood or pre-adulthood need only 1 booster dose, which should be given at the first opportunity.' + '
Due Date: ' + ToString("Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Due Date") + '
Overdue: ' + ToString("Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Overdue") + '
Expiration: ' + "Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Expiration"
  else ''

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Due Date
@pseudocode: "Contact date" WHEN "ANC contact number" = 1
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Due Date":
  if "Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy)" then Today
  else null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Overdue
@pseudocode: Every subsequent contact until 38 weeks
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Overdue":
  if "Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy)" then Today
  else null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Expiration
@pseudocode: Two weeks before birth for the pregnancy; however individuals remain eligible to be vaccinated
"Gestational age" < 38 weeks
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy) Expiration":
  if "Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy)" then 'Two weeks before birth'
  else null
  
/*
@complete: Second tetanus and diphtheria booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 2
*/
define "Second tetanus and diphtheria booster dose was administered":
  Encounter."Two tetanus and diphtheria booster doses were administered"

/*
@output: Tetanus and diphtheria-containing vaccine booster dose 3
@description: Provision of tetanus and diphtheria booster dose 3 for pregnant women who received 4 tetanus-containing vaccines doses during childhood or pre-adulthood
@trigger: Second tetanus and diphtheria booster dose was administered 
Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 2
@triggerDate: Latest "Date and time of vaccination" where "Vaccine type" = "Tetanus and diphtheria-containing vaccines"
*/
define "Tetanus and diphtheria-containing vaccine booster dose 3":
  "Second tetanus and diphtheria booster dose was administered" and
  not "Third tetanus and diphtheria-containing booster dose was administered. Tetanus and diphtheria immunization schedule has been completed."

/*
@output: Tetanus and diphtheria-containing vaccine booster dose 3 Create
@create: To provide lifelong protection for tetanus, a sixth dose should be provided at least 1 year after the fifth dose, or in next pregnancy.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 3 Create":
  if "Tetanus and diphtheria-containing vaccine booster dose 3" 
  then 'To provide lifelong protection for tetanus, a sixth dose should be provided at least 1 year after the fifth dose, or in next pregnancy.' + '
Due Date: ' + ToString("Tetanus and diphtheria-containing vaccine booster dose 3 Due Date")
  else ''

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines") + 1 year or during next pregnancy
*/
define "Tetanus and diphtheria-containing vaccine booster dose 3 Due Date":
  if "Tetanus and diphtheria-containing vaccine booster dose 3" then Encounter."Date of Latest Td Dose" + 1 year
  else null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 3 Overdue
@pseudocode: To be determined by Member States
*/
define "Tetanus and diphtheria-containing vaccine booster dose 3 Overdue":
  null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 3 Expiration
@pseudocode: To be determined by Member States. However, there is no recommended expiration date and individuals remain eligible to be vaccinated.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 3 Expiration":
  null
  
/*
@complete: Third tetanus and diphtheria-containing booster dose was administered. Tetanus and diphtheria immunization schedule has been completed.
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 3
*/
define "Third tetanus and diphtheria-containing booster dose was administered. Tetanus and diphtheria immunization schedule has been completed.":
  Encounter."Three tetanus and diphtheria booster doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '79.DTP3Td1PT' then "Tetanus and diphtheria-containing vaccine booster dose 2 (during pregnancy)"
    when Patient.id = '80.DTP3Td2Tdlt1y' then "Tetanus and diphtheria-containing vaccine booster dose 3"
    when Patient.id = '81.DTP3Td2Tdgt1y' then "Tetanus and diphtheria-containing vaccine booster dose 3"
    when Patient.id = '82.DTP3Td3' then "Third tetanus and diphtheria-containing booster dose was administered. Tetanus and diphtheria immunization schedule has been completed."
    else 'No test case set'
  end
