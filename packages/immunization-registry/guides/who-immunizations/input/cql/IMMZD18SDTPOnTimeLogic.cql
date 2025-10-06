
/*
 * Library: IMMZD18SDTPOnTimeLogic (IMMZ.D18.S.DTP.On-time start schedule)
 * Schedule Table: Diphtheria–tetanus–pertussis (DTP) vaccination schedule, on-time start (at ≤ 12 months of age)
 */
library IMMZD18SDTPOnTimeLogic

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
@output: DTP dose 1
@description: Provision of DTP dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "DTP dose 1":
  Encounter."No DTP primary series doses were administered"
  and "DTP dose 1 Expiration" after day of Today

/*
@output: DTP dose 1 Create
@create: DTP dose 1 should be provided if the client is older than 6 weeks of age.
*/
define "DTP dose 1 Create":
  if "DTP dose 1" 
  then 'DTP dose 1 should be provided if the client is older than 6 weeks of age.' + '
Due Date: ' + ToString("DTP dose 1 Due Date") + '
Expiration: ' + ToString("DTP dose 1 Expiration")
  else ''

/*
@dynamicValue: DTP dose 1 Due Date
@pseudocode: "Date of birth" + 6 weeks
*/
define "DTP dose 1 Due Date":
  if "DTP dose 1" then Patient.birthDate + 6 weeks
  else null

/*
@dynamicValue: DTP dose 1 Overdue
@pseudocode: To be determined by Member States. The third dose of the primary series should be completed by 6 months of age if possible.
*/
define "DTP dose 1 Overdue":
  null

/*
@dynamicValue: DTP dose 1 Expiration
@pseudocode: "Date of birth" + 1 year
*/
define "DTP dose 1 Expiration":
  Patient.birthDate + 1 year

/*
@complete: First DTP dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First DTP dose from the primary series was administered":
  Encounter."One DTP primary series dose was administered"

/*
@output: DTP dose 2
@description: Provision of DTP dose 2
@trigger: First DTP dose from the primary series was administered 
Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 1
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "DTP dose 2":
  "First DTP dose from the primary series was administered" and
  not "Second DTP dose from the primary series was administered"

/*
@output: DTP dose 2 Create
@create: DTP dose 2 should be provided if the client was given the previous DTP dose more than 4 weeks ago.
*/
define "DTP dose 2 Create":
  if "DTP dose 2" 
  then 'DTP dose 2 should be provided if the client was given the previous DTP dose more than 4 weeks ago.' + '
Due Date: ' + ToString("DTP dose 2 Due Date") + '
Overdue: ' + ToString("DTP dose 2 Overdue")
  else ''

/*
@dynamicValue: DTP dose 2 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines") + 4 weeks
*/
define "DTP dose 2 Due Date":
  if "DTP dose 2" then Encounter."Date of Latest DTP Dose" + 4 weeks
  else null

/*
@dynamicValue: DTP dose 2 Overdue
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines") + 8 weeks
*/
define "DTP dose 2 Overdue":
  if "DTP dose 2" then Encounter."Date of Latest DTP Dose" + 8 weeks
  else null

/*
@dynamicValue: DTP dose 2 Expiration
@pseudocode: To be determined by Member States. However, there is no recommended expiration date and individuals remain eligible to be vaccinated.
*/
define "DTP dose 2 Expiration":
  null

/*
@complete: Second DTP dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 2
*/
define "Second DTP dose from the primary series was administered":
  Encounter."Two DTP primary series doses were administered"

/*
@output: DTP dose 3
@description: Provision of DTP dose 3
@trigger: Second DTP dose from the primary series was administered 
Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series" ) = 2
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "DTP dose 3":
  "Second DTP dose from the primary series was administered" and
  not "Third DTP dose from the primary series was administered. The primary DTP series has been completed"

/*
@output: DTP dose 3 Create
@create: DTP dose 3 should be provided if the client received the previous dose more than 4 weeks ago.
*/
define "DTP dose 3 Create":
  if "DTP dose 3" 
  then 'DTP dose 3 should be provided if the client received the previous dose more than 4 weeks ago.' + '
Due Date: ' + ToString("DTP dose 3 Due Date") + '
Overdue: ' + ToString("DTP dose 3 Overdue")
  else ''

/*
@dynamicValue: DTP dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines") + 4 weeks
*/
define "DTP dose 3 Due Date":
  if "DTP dose 3" then Encounter."Date of Latest DTP Dose" + 4 weeks
  else null

/*
@dynamicValue: DTP dose 3 Overdue
@pseudocode: "Date of birth" + 6 months
*/
define "DTP dose 3 Overdue":
  if "DTP dose 3" then Patient.birthDate + 6 months
  else null

/*
@dynamicValue: DTP dose 3 Expiration
@pseudocode: To be determined by Member States. However, there is no recommended expiration date and individuals remain eligible to be vaccinated.
*/
define "DTP dose 3 Expiration":
  null

/*
@complete: Third DTP dose from the primary series was administered. The primary DTP series has been completed
@pseudocode: Count of vaccines administered (where "Vaccine type" = "DTP-containing vaccines" and "Type of dose" = "Primary series") = 3
*/
define "Third DTP dose from the primary series was administered. The primary DTP series has been completed":
  Encounter."Three DTP primary series doses were administered"

/*
@output: Tetanus and diphtheria-containing vaccine booster dose 1
@description: Provision of tetanus and diphtheria booster dose 1
@trigger: The primary DTP series has been completed
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "DTP-containing vaccines")
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "Tetanus and diphtheria-containing vaccine booster dose 1":
  "Third DTP dose from the primary series was administered. The primary DTP series has been completed" and
  Encounter."No tetanus and diphtheria booster doses were administered"

/*
@output: Tetanus and diphtheria-containing vaccine booster dose 1 Create
@create: Three booster doses of diphtheria-containing vaccine should be provided during childhood and adolescence. The diphtheria booster doses should be given in combination with tetanus using the same schedule (i.e at 12–23 months of age, 4–7 years of age and 9–15 years of age, using age-appropriate vaccine formulations). Ideally, there should be at least 4 years between booster doses. Member States may update this schedule based on their country context.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 1 Create":
  if "Tetanus and diphtheria-containing vaccine booster dose 1" 
  then 'Three booster doses of diphtheria-containing vaccine should be provided during childhood and adolescence. The diphtheria booster doses should be given in combination with tetanus using the same schedule (i.e at 12–23 months of age, 4–7 years of age and 9–15 years of age, using age-appropriate vaccine formulations). Ideally, there should be at least 4 years between booster doses. Member States may update this schedule based on their country context.' + '
Due Date: ' + ToString("Tetanus and diphtheria-containing vaccine booster dose 1 Due Date") + '
Overdue: ' + ToString("Tetanus and diphtheria-containing vaccine booster dose 1 Overdue")
  else ''

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 1 Due Date
@pseudocode: "Date of birth" + 12 months
*/
define "Tetanus and diphtheria-containing vaccine booster dose 1 Due Date":
  if "Tetanus and diphtheria-containing vaccine booster dose 1" then Patient.birthDate + 12 months
  else null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 1 Overdue
@pseudocode: "Date of birth" + 24 months
*/
define "Tetanus and diphtheria-containing vaccine booster dose 1 Overdue":
  if "Tetanus and diphtheria-containing vaccine booster dose 1" then Patient.birthDate + 24 months
  else null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 1 Expiration
@pseudocode: To be determined by Member States. However, there is no recommended expiration date and individuals remain eligible to be vaccinated.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 1 Expiration":
  null

/*
@complete: First tetanus and diphtheria booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 1
*/
define "First tetanus and diphtheria booster dose was administered":
  Encounter."One tetanus and diphtheria booster dose was administered"


/*
@output: Tetanus and diphtheria-containing vaccine booster dose 2
@description: Provision of tetanus and diphtheria booster dose 2
@trigger: First tetanus and diphtheria booster dose was administered 
Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 1
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2":
  "First tetanus and diphtheria booster dose was administered" and
  not "Second tetanus and diphtheria booster dose was administered"

/*
@output: Tetanus and diphtheria-containing vaccine booster dose 2 Create
@create: Three booster doses of diphtheria-containing vaccine should be provided during childhood and adolescence. The diphtheria booster doses should be given in combination with tetanus using the same schedule (i.e at 12–23 months of age, 4–7 years of age and 9–15 years of age, using age-appropriate vaccine formulations). Ideally, there should be at least 4 years between booster doses. Member States may update this schedule based on their country context.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 Create":
  if "Tetanus and diphtheria-containing vaccine booster dose 2" 
  then 'Three booster doses of diphtheria-containing vaccine should be provided during childhood and adolescence. The diphtheria booster doses should be given in combination with tetanus using the same schedule (i.e at 12–23 months of age, 4–7 years of age and 9–15 years of age, using age-appropriate vaccine formulations). Ideally, there should be at least 4 years between booster doses. Member States may update this schedule based on their country context.' + '
Due Date: ' + ToString("Tetanus and diphtheria-containing vaccine booster dose 2 Due Date") + '
Overdue: ' + ToString("Tetanus and diphtheria-containing vaccine booster dose 2 Overdue")
  else ''

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 2 Due Date
@pseudocode: "Date of birth" + 4 years
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 Due Date":
  if "Tetanus and diphtheria-containing vaccine booster dose 2" then Patient.birthDate + 4 years
  else null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 2 Overdue
@pseudocode: "Date of birth" + 8 years
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 Overdue":
  if "Tetanus and diphtheria-containing vaccine booster dose 2" then Patient.birthDate + 8 years
  else null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 2 Expiration
@pseudocode: To be determined by Member States. However, there is no recommended expiration date and individuals remain eligible to be vaccinated.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 2 Expiration":
  null

/*
@complete: Second tetanus and diphtheria booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 2
*/
define "Second tetanus and diphtheria booster dose was administered":
  Encounter."Two tetanus and diphtheria booster doses were administered"

/*
@output: Tetanus and diphtheria-containing vaccine booster dose 3
@description: Provision of tetanus and diphtheria booster dose 3
@trigger: Second tetanus and diphtheria booster dose was administered 
Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 2
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines")
*/
define "Tetanus and diphtheria-containing vaccine booster dose 3":
  "Second tetanus and diphtheria booster dose was administered" and
  not "Third tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed"

/*
@output: Tetanus and diphtheria-containing vaccine booster dose 3 Create
@create: Three booster doses of diphtheria-containing vaccine should be provided during childhood and adolescence. The diphtheria booster doses should be given in combination with tetanus using the same schedule (i.e at 12–23 months of age, 4–7 years of age and 9–15 years of age, using age-appropriate vaccine formulations). Ideally, there should be at least 4 years between booster doses. Member States may update this schedule based on their country context.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 3 Create":
  if "Tetanus and diphtheria-containing vaccine booster dose 3" 
  then 'Three booster doses of diphtheria-containing vaccine should be provided during childhood and adolescence. The diphtheria booster doses should be given in combination with tetanus using the same schedule (i.e at 12–23 months of age, 4–7 years of age and 9–15 years of age, using age-appropriate vaccine formulations). Ideally, there should be at least 4 years between booster doses. Member States may update this schedule based on their country context.' + '
Due Date: ' + ToString("Tetanus and diphtheria-containing vaccine booster dose 3 Due Date") + '
Overdue: ' + ToString("Tetanus and diphtheria-containing vaccine booster dose 3 Overdue")
  else ''

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 3 Due Date
@pseudocode: "Date of birth" + 9 years
*/
define "Tetanus and diphtheria-containing vaccine booster dose 3 Due Date":
  if "Tetanus and diphtheria-containing vaccine booster dose 3" then Patient.birthDate + 9 years
  else null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 3 Overdue
@pseudocode: "Date of birth" + 16 years
*/
define "Tetanus and diphtheria-containing vaccine booster dose 3 Overdue":
  if "Tetanus and diphtheria-containing vaccine booster dose 3" then Patient.birthDate + 16 years
  else null

/*
@dynamicValue: Tetanus and diphtheria-containing vaccine booster dose 3 Expiration
@pseudocode: To be determined by Member States. However, there is no recommended expiration date and individuals remain eligible to be vaccinated.
*/
define "Tetanus and diphtheria-containing vaccine booster dose 3 Expiration":
  null

/*
@complete: Third tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Tetanus and diphtheria-containing vaccines" and "Type of dose" = "Booster dose") = 3
*/
define "Third tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed":
  Encounter."Three tetanus and diphtheria booster doses were administered"

/*
@output: Pertussis-containing vaccine booster dose
@description: Provision of the pertussis-containing vaccine booster dose
@trigger: The primary DTP series has been completed and client's age is between 1 and 6 years
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "DTP-containing vaccines") AND 1 year ≤  Today's date − "Date of birth" ≤  6 years
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "DTP-containing vaccines")
*/
define "Pertussis-containing vaccine booster dose":
  "Third DTP dose from the primary series was administered. The primary DTP series has been completed" and
  Encounter."Client's age is between 1 year and 6 years" and
  not "Pertussis-containing booster dose was administered. Pertussis immunization schedule has been completed"
  and "Pertussis-containing vaccine booster dose Expiration" after day of Today


/*
@output: Pertussis-containing vaccine booster dose Create
@create: A booster dose is recommended for children aged 1–6 years, preferably during the second year of life (≥6 months after last primary dose).
*/
define "Pertussis-containing vaccine booster dose Create":
  if "Pertussis-containing vaccine booster dose" 
  then 'A booster dose is recommended for children aged 1–6 years, preferably during the second year of life (≥6 months after last primary dose).' + '
Due Date: ' + ToString("Pertussis-containing vaccine booster dose Due Date") + '
Overdue: ' + ToString("Pertussis-containing vaccine booster dose Overdue") + '
Expiration: ' + ToString("Pertussis-containing vaccine booster dose Expiration")
  else ''

/*
@dynamicValue: Pertussis-containing vaccine booster dose Due Date
@pseudocode: Date of birth" + 1 'year' OR Latest "Date and time of vaccination" where "Vaccine type" = "DTP-containing vaccines" + 6 months
*/
define "Pertussis-containing vaccine booster dose Due Date":
  if "Pertussis-containing vaccine booster dose" 
  then WC.LatestOf({ Patient.birthDate + 1 year, Encounter."Date of Latest DTP Dose" + 6 months })
  else null

/*
@dynamicValue: Pertussis-containing vaccine booster dose Overdue
@pseudocode: "Date of birth" + 7 years
*/
define "Pertussis-containing vaccine booster dose Overdue":
  if "Pertussis-containing vaccine booster dose" then Patient.birthDate + 7 years
  else null

/*
@dynamicValue: Pertussis-containing vaccine booster dose Expiration
@pseudocode: "Date of birth" + 7 years
*/
define "Pertussis-containing vaccine booster dose Expiration":
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
    when Patient.id = '08.Alt6w' then "DTP dose 1"
    when Patient.id = '09.Abt6w1y' then "DTP dose 1"
    when Patient.id = '10.DTP1Dlt4w' then "DTP dose 2"
    when Patient.id = '11.DTP1Dgt4w' then "DTP dose 2"
    when Patient.id = '12.DTP2Dlt4w' then "DTP dose 3"
    when Patient.id = '13.DTP2Dgt4w' then "DTP dose 3"
    when Patient.id = '14.DTP3Td0Alt12m' then "Tetanus and diphtheria-containing vaccine booster dose 1"
    when Patient.id = '15.DTP3Td0Agt12m' then "Tetanus and diphtheria-containing vaccine booster dose 1" and "Pertussis-containing vaccine booster dose"
    when Patient.id = '16.DTP3Td1Alt4y' then "Tetanus and diphtheria-containing vaccine booster dose 2" and "Pertussis-containing vaccine booster dose"
    when Patient.id = '17.DTP3Td1Agt4y' then "Tetanus and diphtheria-containing vaccine booster dose 2" and "Pertussis-containing vaccine booster dose"
    when Patient.id = '18.DTP3Td2Alt9y' then "Tetanus and diphtheria-containing vaccine booster dose 3"
    when Patient.id = '19.DTP3Td2Agt9y' then "Tetanus and diphtheria-containing vaccine booster dose 3"
    when Patient.id = '20.DTP3Td3' then "Third tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed"
    when Patient.id = '21.DTP3P0Alt1y' then "Tetanus and diphtheria-containing vaccine booster dose 1"
    when Patient.id = '22.DTP3P0Abt1y6yDTPlt6m' then "Pertussis-containing vaccine booster dose" and "Tetanus and diphtheria-containing vaccine booster dose 1"
    when Patient.id = '23.DTP3P0Abt1y6yDTPgt6m' then "Pertussis-containing vaccine booster dose" and "Tetanus and diphtheria-containing vaccine booster dose 1"
    when Patient.id = '24.DTP3P0Agt6y' then not "Pertussis-containing vaccine booster dose" and "Tetanus and diphtheria-containing vaccine booster dose 1"
    when Patient.id = '25.DTP3P1' then "Pertussis-containing booster dose was administered. Pertussis immunization schedule has been completed" and "Tetanus and diphtheria-containing vaccine booster dose 1"
    else 'No test case set'
  end
