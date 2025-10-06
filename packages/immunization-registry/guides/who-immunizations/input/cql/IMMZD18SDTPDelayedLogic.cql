
/*
 * Library: IMMZD18SDTPDelayedLogic (IMMZ.D18.S.DTP.Delayed or interrupted schedule)
 * Schedule Table: Diphtheria–tetanus–pertussis (DTP) vaccination schedule for the following groups: children ≥ 1 year of age with no previous immunization, adolescents and adults with no previous immunization (including pregnant women) and supplementary immunization activities in high-risk areas, for women of reproductive age
 */
library IMMZD18SDTPDelayedLogic

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
@output: DTP dose 1 (delayed start)
@description: Provision of DTP dose 1 with a delayed start
@trigger: No DTP doses were administered and client's age is more than 1 year 
Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines") = 0 AND Today's date − "Date of birth" > 1 year
@triggerDate: Date of birth
*/
define "DTP dose 1 (delayed start)":
  Encounter."No DTP primary series doses were administered"
  and Encounter."Client's age is more than 1 year"

/*
@output: DTP dose 1 (delayed start) Create
@create: For children whose vaccination series has been interrupted, the series should be resumed without repeating previous doses. Children aged 1 year to under 7 years who have not previously been vaccinated should receive 3 doses of vaccine following a 0, 1, 6 month schedule.

If tetanus vaccination is started during adolescence or adulthood, a total of only 5 appropriately spaced doses are required to obtain lifelong protection.

Pregnant women and their newborn infants are protected from birth-associated tetanus if the mother received 5 doses if first vaccinated during adolescence/adulthood.
*/
define "DTP dose 1 (delayed start) Create":
  if "DTP dose 1 (delayed start)" 
  then 'For children whose vaccination series has been interrupted, the series should be resumed without repeating previous doses. Children aged 1 year to under 7 years who have not previously been vaccinated should receive 3 doses of vaccine following a 0, 1, 6 month schedule.

If tetanus vaccination is started during adolescence or adulthood, a total of only 5 appropriately spaced doses are required to obtain lifelong protection.

Pregnant women and their newborn infants are protected from birth-associated tetanus if the mother received 5 doses if first vaccinated during adolescence/adulthood.' + '
Due Date: ' + ToString("DTP dose 1 (delayed start) Due Date")
  else ''

/*
@dynamicValue: DTP dose 1 (delayed start) Due Date
@pseudocode: As soon as possible
*/
define "DTP dose 1 (delayed start) Due Date":
  if "DTP dose 1 (delayed start)" then Patient.birthDate + 1 year
  else null

/*
@dynamicValue: DTP dose 1 (delayed start) Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "DTP dose 1 (delayed start) Overdue":
  null

/*
@dynamicValue: DTP dose 1 (delayed start) Expiration
@pseudocode: To be determined by Member States. However, there is no recommended expiration date and individuals remain eligible to be vaccinated.
*/
define "DTP dose 1 (delayed start) Expiration":
  null
  
/*
@complete: First DTP dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First DTP dose from the primary series was administered":
  Encounter."One DTP primary series dose was administered"

/*
@output: DTP dose 2 (delayed start)
@description: Provision of DTP dose 2 with a delayed start
@trigger: First DTP dose from the primary series was administered 
Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines"
*/
define "DTP dose 2 (delayed start)":
  "First DTP dose from the primary series was administered" and
  not "Second DTP dose from the primary series was administered"

/*
@output: DTP dose 2 (delayed start) Create
@create: For children whose vaccination series has been interrupted, the series should be resumed without repeating previous doses. Children aged 1 year to under 7 years who have not previously been vaccinated should receive 3 doses of vaccine following a 0, 1, 6 month schedule.

If tetanus vaccination is started during adolescence or adulthood, a total of only 5 appropriately spaced doses are required to obtain lifelong protection.

Pregnant women and their newborn infants are protected from birth-associated tetanus if the mother received 5 doses if first vaccinated during adolescence/adulthood.
*/
define "DTP dose 2 (delayed start) Create":
  if "DTP dose 2 (delayed start)" 
  then 'For children whose vaccination series has been interrupted, the series should be resumed without repeating previous doses. Children aged 1 year to under 7 years who have not previously been vaccinated should receive 3 doses of vaccine following a 0, 1, 6 month schedule.

If tetanus vaccination is started during adolescence or adulthood, a total of only 5 appropriately spaced doses are required to obtain lifelong protection.

Pregnant women and their newborn infants are protected from birth-associated tetanus if the mother received 5 doses if first vaccinated during adolescence/adulthood.' + '
Due Date: ' + ToString("DTP dose 2 (delayed start) Due Date")
  else ''

/*
@dynamicValue: DTP dose 2 (delayed start) Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines") + 4 weeks
*/
define "DTP dose 2 (delayed start) Due Date":
  if "DTP dose 2 (delayed start)" then Encounter."Date of Latest DTP Dose" + 4 weeks
  else null

/*
@dynamicValue: DTP dose 2 (delayed start) Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "DTP dose 2 (delayed start) Overdue":
  null

/*
@dynamicValue: DTP dose 2 (delayed start) Expiration
@pseudocode: To be determined by Member States. However, there is no recommended expiration date and individuals remain eligible to be vaccinated.
*/
define "DTP dose 2 (delayed start) Expiration":
  null
  
/*
@complete: Second DTP dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 2
*/
define "Second DTP dose from the primary series was administered":
  Encounter."Two DTP primary series doses were administered"

/*
@output: DTP dose 3 (delayed start)
@description: Provision of DTP dose 3 with a delayed start
@trigger: Second DTP dose from the primary series was administered 
Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 2
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines"
*/
define "DTP dose 3 (delayed start)":
  "Second DTP dose from the primary series was administered" and
  not "Third DTP dose from the primary series was administered. The primary DTP series has been completed"

/*
@output: DTP dose 3 (delayed start) Create
@create: For children whose vaccination series has been interrupted, the series should be resumed without repeating previous doses. Children aged 1 year to under 7 years who have not previously been vaccinated should receive 3 doses of vaccine following a 0, 1, 6 month schedule.

If tetanus vaccination is started during adolescence or adulthood, a total of only 5 appropriately spaced doses are required to obtain lifelong protection.

Pregnant women and their newborn infants are protected from birth-associated tetanus if the mother received 5 doses if first vaccinated during adolescence/adulthood.
*/
define "DTP dose 3 (delayed start) Create":
  if "DTP dose 3 (delayed start)" 
  then 'For children whose vaccination series has been interrupted, the series should be resumed without repeating previous doses. Children aged 1 year to under 7 years who have not previously been vaccinated should receive 3 doses of vaccine following a 0, 1, 6 month schedule.

If tetanus vaccination is started during adolescence or adulthood, a total of only 5 appropriately spaced doses are required to obtain lifelong protection.

Pregnant women and their newborn infants are protected from birth-associated tetanus if the mother received 5 doses if first vaccinated during adolescence/adulthood.' + '
Due Date: ' + ToString("DTP dose 3 (delayed start) Due Date")
  else ''

/*
@dynamicValue: DTP dose 3 (delayed start) Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines") + 6 months
*/
define "DTP dose 3 (delayed start) Due Date":
  if "DTP dose 3 (delayed start)" then Encounter."Date of Latest DTP Dose" + 6 months
  else null

/*
@dynamicValue: DTP dose 3 (delayed start) Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "DTP dose 3 (delayed start) Overdue":
  null

/*
@dynamicValue: DTP dose 3 (delayed start) Expiration
@pseudocode: To be determined by Member States. However, there is no recommended expiration date and individuals remain eligible to be vaccinated.
*/
define "DTP dose 3 (delayed start) Expiration":
  null
  
/*
@complete: Third DTP dose from the primary series was administered. The primary DTP series has been completed
@pseudocode: Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 3
*/
define "Third DTP dose from the primary series was administered. The primary DTP series has been completed":
  Encounter."Three DTP primary series doses were administered"

/*
@output: Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start)
@description: Provision of tetanus and diphtheria booster dose 1
@trigger: The primary DTP series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "DTP-containing vaccines")
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines"
*/
define "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start)":
  "Third DTP dose from the primary series was administered. The primary DTP series has been completed" and
  Encounter."No tetanus and diphtheria booster doses were administered"

/*
@output: Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start) Create
@create: Two subsequent booster doses using tetanus toxoid with reduced diphteria toxoid (Td) or Td with acellular pertussis (TdaP) combination vaccines are needed with an interval of at least 1 year between doses.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start) Create":
  if "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start)" 
  then 'Two subsequent booster doses using tetanus toxoid with reduced diphteria toxoid (Td) or Td with acellular pertussis (TdaP) combination vaccines are needed with an interval of at least 1 year between doses.' + '
Due Date: ' + ToString("Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start) Due Date")
  else ''

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start) Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines") + 1 year
*/
define "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start) Due Date":
  if "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start)" then Encounter."Date of Latest DTP Dose" + 1 year
  else null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start) Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start) Overdue":
  null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start) Expiration
@pseudocode: To be determined by Member States. However, there is no recommended expiration date and individuals remain eligible to be vaccinated.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start) Expiration":
  null
  
/*
@complete: First tetanus and diphtheria booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 1
*/
define "First tetanus and diphtheria booster dose was administered":
  Encounter."One tetanus and diphtheria booster dose was administered"

/*
@output: Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start)
@description: Provision of tetanus and diphtheria booster dose 2
@trigger: First tetanus and diphtheria booster dose was administered 
Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 1
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start)":
  "First tetanus and diphtheria booster dose was administered" and
  not "Second tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed"

/*
@output: Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start) Create
@create: Two subsequent booster doses using tetanus toxoid with reduced diphteria toxoid (Td) or Td with acellular pertussis (TdaP) combination vaccines are needed with an interval of at least 1 year between doses.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start) Create":
  if "Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start)" 
  then 'Two subsequent booster doses using tetanus toxoid with reduced diphteria toxoid (Td) or Td with acellular pertussis (TdaP) combination vaccines are needed with an interval of at least 1 year between doses.' + '
Due Date: ' + ToString("Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start) Due Date")
  else ''

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start) Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Tetanus and diphtheria-containing  vaccines") + 1 year
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start) Due Date":
  if "Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start)" then Encounter."Date of Latest Td Dose" + 1 year
  else null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start) Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start) Overdue":
  null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start) Expiration
@pseudocode: To be determined by Member States. However, there is no recommended expiration date and individuals remain eligible to be vaccinated.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start) Expiration":
  null
  
/*
@complete: Second tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 2
*/
define "Second tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed":
  Encounter."Two tetanus and diphtheria booster doses were administered"

/*
@output: Pertussis-containing vaccine booster dose 1 (delayed start)
@description: Provision of the pertussis-containing booster dose 1
@trigger: The primary DTP series has been completed and client's age is between 1 year and 6 years
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "DTP-containing vaccines") AND 1 year ≤  Today's date − "Date of birth" ≤  6 years
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "Pertussis-containing vaccine booster dose 1 (delayed start)":
  "Third DTP dose from the primary series was administered. The primary DTP series has been completed" and
  Encounter."Client's age is between 1 year and 6 years" and
  "Pertussis-containing vaccine booster dose 1 (delayed start) Expiration" after day of Today and
  not "Pertussis-containing booster dose was administered. Pertussis immunization schedule has been completed"

/*
@output: Pertussis-containing vaccine booster dose 1 (delayed start) Create
@create: A booster dose is recommended for children aged 1–6 years, preferably during the second year of life (≥ 6 months after last primary dose).
*/
define "Pertussis-containing vaccine booster dose 1 (delayed start) Create":
  if "Pertussis-containing vaccine booster dose 1 (delayed start)" 
  then 'A booster dose is recommended for children aged 1–6 years, preferably during the second year of life (≥ 6 months after last primary dose).' + '
Due Date: ' + ToString("Pertussis-containing vaccine booster dose 1 (delayed start) Due Date") + '
Overdue: ' + ToString("Pertussis-containing vaccine booster dose 1 (delayed start) Overdue") + '
Expiration: ' + ToString("Pertussis-containing vaccine booster dose 1 (delayed start) Expiration")
  else ''

/*
@dynamicValue: Pertussis-containing vaccine booster dose 1 (delayed start) Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Pertussis-containing vaccines") + 6 months
*/
define "Pertussis-containing vaccine booster dose 1 (delayed start) Due Date":
  if "Pertussis-containing vaccine booster dose 1 (delayed start)" then Encounter."Date of Latest Pertussis Dose" + 6 months
  else null

/*
@dynamicValue: Pertussis-containing vaccine booster dose 1 (delayed start) Overdue
@pseudocode: "Date of birth" + 7 years
*/
define "Pertussis-containing vaccine booster dose 1 (delayed start) Overdue":
  if "Pertussis-containing vaccine booster dose 1 (delayed start)" then Patient.birthDate + 7 years
  else null

/*
@dynamicValue: Pertussis-containing vaccine booster dose 1 (delayed start) Expiration
@pseudocode: "Date of birth" + 7 years
*/
define "Pertussis-containing vaccine booster dose 1 (delayed start) Expiration":
  Patient.birthDate + 7 years
  
/*
@complete: Pertussis-containing booster dose was administered. Pertussis immunization schedule has been completed
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Pertussis-containing vaccines" and "Type of dose" = "Booster dose") = 1
*/
define "Pertussis-containing booster dose was administered. Pertussis immunization schedule has been completed":
  Encounter."One pertussis booster dose was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '33.Agt1y' then "DTP dose 1 (delayed start)"
    when Patient.id = '34.DTP1Dlt4w' then "DTP dose 2 (delayed start)"
    when Patient.id = '35.DTP1Dgt4w' then "DTP dose 2 (delayed start)"
    when Patient.id = '36.DTP2Dlt6m' then "DTP dose 3 (delayed start)"
    when Patient.id = '37.DTP2Dgt6m' then "DTP dose 3 (delayed start)"
    when Patient.id = '38.DTP3Dlt1y' then "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start)" and "Pertussis-containing vaccine booster dose 1 (delayed start)"
    when Patient.id = '39.DTP3Dgt1y' then "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start)" and "Pertussis-containing vaccine booster dose 1 (delayed start)"
    when Patient.id = '40.DTP3Td1Dlt1y' then "Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start)" and "Pertussis-containing vaccine booster dose 1 (delayed start)"
    when Patient.id = '41.DTP3Td1Dgt1y' then "Tetanus and diphtheria-containing vaccine booster dose 2 (delayed start)" and "Pertussis-containing vaccine booster dose 1 (delayed start)"
    when Patient.id = '42.DTP3Td2' then "Second tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed" and "Pertussis-containing vaccine booster dose 1 (delayed start)"
    when Patient.id = '43.DTP3P0Abt1y6yDlt6m' then "Pertussis-containing vaccine booster dose 1 (delayed start)" and "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start)"
    when Patient.id = '44.DTP3P0Abt1y6yDgt6m' then "Pertussis-containing vaccine booster dose 1 (delayed start)" and "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start)"
    when Patient.id = '45.DTP3P0Agt6y' then not "Pertussis-containing vaccine booster dose 1 (delayed start)" and "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start)"
    when Patient.id = '46.DTP3P1' then "Pertussis-containing booster dose was administered. Pertussis immunization schedule has been completed" and "Tetanus and diphtheria-containing vaccine booster dose 1 (delayed start)"
    else 'No test case set'
  end
