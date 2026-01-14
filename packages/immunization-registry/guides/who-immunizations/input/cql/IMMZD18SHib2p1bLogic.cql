
/*
 * Library: IMMZD18SHib2p1bLogic (IMMZ.D18.S.Hib.2 doses with booster dose schedule)
 * Schedule Table: 2 primary doses with a booster dose (2p+1) schedule
 */
library IMMZD18SHib2p1bLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTHibEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Haemophilus influenzae type b (Hib) dose 1
@description: Provision of the Hib dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Haemophilus influenzae type b (Hib) dose 1":
  Encounter."No Hib primary series doses were administered"
  and "Haemophilus influenzae type b (Hib) dose 1 Expiration" after day of Today

/*
@output: Haemophilus influenzae type b (Hib) dose 1 Create
@create: Hib dose 1 should be provided if the client is older than 6 weeks
*/
define "Haemophilus influenzae type b (Hib) dose 1 Create":
  if "Haemophilus influenzae type b (Hib) dose 1" 
  then 'Hib dose 1 should be provided if the client is older than 6 weeks' + '
Due Date: ' + ToString("Haemophilus influenzae type b (Hib) dose 1 Due Date") + '
Expiration: ' + ToString("Haemophilus influenzae type b (Hib) dose 1 Expiration")
  else ''

/*
@dynamicValue: Haemophilus influenzae type b (Hib) dose 1 Due Date
@pseudocode: "Date of birth" + 6 weeks
*/
define "Haemophilus influenzae type b (Hib) dose 1 Due Date":
  if "Haemophilus influenzae type b (Hib) dose 1" then Patient.birthDate + 6 weeks
  else null

/*
@dynamicValue: Haemophilus influenzae type b (Hib) dose 1 Overdue
@pseudocode: To be determined by Member States
*/
define "Haemophilus influenzae type b (Hib) dose 1 Overdue":
  null

/*
@dynamicValue: Haemophilus influenzae type b (Hib) dose 1 Expiration
@pseudocode: "Date of birth" + 6 years
*/
define "Haemophilus influenzae type b (Hib) dose 1 Expiration":
  Patient.birthDate + 6 years
  
/*
@complete: First Hib dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"= "Primary series") = 1
*/
define "First Hib dose from the primary series was administered":
  Encounter."One Hib primary series dose was administered"

/*
@output: Hib dose 2
@description: Provision of the Hib dose 2
@trigger: First Hib dose from the primary series was administered to the client within 1 year of age. Client's age is less than 5 years
Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose" = "Primary series") = 1 AND "Date and time of vaccination" (where "Vaccine type"= "Hib-containing vaccines" and "Dose number" = 1) − "Date of birth" < 1 year AND Today's date − "Date of birth" ≤ 5 years
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines")
*/
define "Hib dose 2":
  "First Hib dose from the primary series was administered"
  and Encounter."Client's age was less than 1 year when first Hib dose was administered"
  and Encounter."Client's age is between 6 weeks and 5 years"
  and not "Second Hib dose from the primary series was administered. The primary series has been completed"
  and "Hib dose 2 Expiration" after day of Today

/*
@output: Hib dose 2 Create
@create: Hib dose 2 should be provided if the client was given the previous dose more than 8 weeks ago
*/
define "Hib dose 2 Create":
  if "Hib dose 2" 
  then 'Hib dose 2 should be provided if the client was given the previous dose more than 8 weeks ago' + '
Due Date: ' + ToString("Hib dose 2 Due Date") + '
Expiration: ' + ToString("Hib dose 2 Expiration")
  else ''

/*
@dynamicValue: Hib dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines") + 8 weeks
*/
define "Hib dose 2 Due Date":
  if "Hib dose 2" then Encounter."Date of Latest Hib Dose" + 8 weeks
  else null

/*
@dynamicValue: Hib dose 2 Overdue
@pseudocode: To be determined by Member States
*/
define "Hib dose 2 Overdue":
  null

/*
@dynamicValue: Hib dose 2 Expiration
@pseudocode: "Date of birth" + 6 years
*/
define "Hib dose 2 Expiration":
  Patient.birthDate + 6 years
  
/*
@complete: Second Hib dose from the primary series was administered. The primary series has been completed
@pseudocode: Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Hib-containing vaccines")
*/
define "Second Hib dose from the primary series was administered. The primary series has been completed":
  Encounter."Two Hib primary series doses were administered"

/*
@output: Hib booster dose
@description: Provision of the Hib booster dose
@trigger: Second Hib dose from the primary series was administered. Client's age is less than 5 years
Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"= "Primary series") = 2 AND Today's date − "Date of birth" ≤ 5 years
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines")
*/
define "Hib booster dose":
  "Second Hib dose from the primary series was administered. The primary series has been completed"
  and Encounter."Client's age is between 6 weeks and 5 years"
  and not "One Hib booster dose was administered. Hib immunization schedule has been completed"
  and "Hib booster dose Expiration" after day of Today

/*
@output: Hib booster dose Create
@create: Hib booster dose should be provided if the client was given the previous dose more than 6 months ago
*/
define "Hib booster dose Create":
  if "Hib booster dose" 
  then 'Hib booster dose should be provided if the client was given the previous dose more than 6 months ago' + '
Due Date: ' + ToString("Hib booster dose Due Date") + '
Expiration: ' + ToString("Hib booster dose Expiration")
  else ''

/*
@dynamicValue: Hib booster dose Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines") + 6 months
*/
define "Hib booster dose Due Date":
  if "Hib booster dose" then Encounter."Date of Latest Hib Dose" + 6 months
  else null

/*
@dynamicValue: Hib booster dose Overdue
@pseudocode: To be determined by Member States
*/
define "Hib booster dose Overdue":
  null

/*
@dynamicValue: Hib booster dose Expiration
@pseudocode: "Date of birth" + 6 years
*/
define "Hib booster dose Expiration":
  Patient.birthDate + 6 years
  
/*
@complete: One Hib booster dose was administered. Hib immunization schedule has been completed
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"= "Booster dose") = 1
*/
define "One Hib booster dose was administered. Hib immunization schedule has been completed":
  Encounter."One Hib booster dose was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '42.3' then "Haemophilus influenzae type b (Hib) dose 1"
    when Patient.id = '43.13' then "Haemophilus influenzae type b (Hib) dose 1"
    when Patient.id = '44.1345' then "Hib dose 2"
    when Patient.id = '45.1345' then "Hib dose 2"
    when Patient.id = '46.134' then "First Hib dose from the primary series was administered" and not "Hib dose 2"
    when Patient.id = '47.1235' then "Hib booster dose"
    when Patient.id = '48.12345' then "Hib booster dose"
    when Patient.id = '49.12' then "One Hib booster dose was administered. Hib immunization schedule has been completed"
    when Patient.id = '50.3' then not "Haemophilus influenzae type b (Hib) dose 1"
    else 'No test case set'
  end
