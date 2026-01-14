
/*
 * Library: IMMZD18SHib3p1bLogic (IMMZ.D18.S.Hib.3 doses with booster dose schedule)
 * Schedule Table: 3 primary doses with a booster dose (3p+1) schedule
 */
library IMMZD18SHib3p1bLogic

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
@create: Immunization should start from 6 weeks of age, or as early as possible thereafter. Hib-containing vaccine is not required for healthy children aged over 5 years.
*/
define "Haemophilus influenzae type b (Hib) dose 1 Create":
  if "Haemophilus influenzae type b (Hib) dose 1" 
  then 'Immunization should start from 6 weeks of age, or as early as possible thereafter. Hib-containing vaccine is not required for healthy children aged over 5 years.' + '
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
  and not "Second Hib dose from the primary series was administered"
  and "Hib dose 2 Expiration" after day of Today

/*
@output: Hib dose 2 Create
@create: Hib dose 2 should be provided if the client was given the previous dose more than 4 weeks ago and the first Hib dose was received by the time the child turned 1 year old
*/
define "Hib dose 2 Create":
  if "Hib dose 2" 
  then 'Hib dose 2 should be provided if the client was given the previous dose more than 4 weeks ago and the first Hib dose was received by the time the child turned 1 year old' + '
Due Date: ' + ToString("Hib dose 2 Due Date") + '
Expiration: ' + ToString("Hib dose 2 Expiration")
  else ''

/*
@dynamicValue: Hib dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines") + 4 weeks
*/
define "Hib dose 2 Due Date":
  if "Hib dose 2" then Encounter."Date of Latest Hib Dose" + 4 weeks
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
@complete: Second Hib dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"= "Primary series") = 2
*/
define "Second Hib dose from the primary series was administered":
  Encounter."Two Hib primary series doses were administered"

/*
@output: Hib dose 3
@description: Provision of the Hib dose 3
@trigger: Second Hib dose from the primary series was administered. Client's age is less than 5 years
Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"= "Primary series") = 2 AND Today's date − "Date of birth" ≤ 5 years
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines")
*/
define "Hib dose 3":
  "Second Hib dose from the primary series was administered"
  and Encounter."Client's age is between 6 weeks and 5 years"
  and not "Third Hib dose from the primary series was administered. The primary series has been completed"
  and "Hib dose 3 Expiration" after day of Today

/*
@output: Hib dose 3 Create
@create: Hib dose 3 should be provided if the client was given the previous dose more than 4 weeks ago and the first Hib dose was received by the time the child turned 1 year old
*/
define "Hib dose 3 Create":
  if "Hib dose 3" 
  then 'Hib dose 3 should be provided if the client was given the previous dose more than 4 weeks ago and the first Hib dose was received by the time the child turned 1 year old' + '
Due Date: ' + ToString("Hib dose 3 Due Date") + '
Expiration: ' + ToString("Hib dose 3 Expiration")
  else ''

/*
@dynamicValue: Hib dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines") + 4 weeks
*/
define "Hib dose 3 Due Date":
  if "Hib dose 3" then Encounter."Date of Latest Hib Dose" + 4 weeks
  else null

/*
@dynamicValue: Hib dose 3 Overdue
@pseudocode: To be determined by Member States
*/
define "Hib dose 3 Overdue":
  null

/*
@dynamicValue: Hib dose 3 Expiration
@pseudocode: "Date of birth" + 6 years
*/
define "Hib dose 3 Expiration":
  Patient.birthDate + 6 years
  
/*
@complete: Third Hib dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Hib-containing vaccines")
*/
define "Third Hib dose from the primary series was administered. The primary series has been completed":
  Encounter."Three Hib primary series doses were administered"

/*
@output: Hib booster dose
@description: Provision of the Hib booster dose
@trigger: Third Hib dose from the primary series was administered. Child's age is less than 5 years
Count of vaccines administered (where "Vaccine type" = "Hib-containing vaccines" and "Type of dose"= "Primary series") = 3 AND Today's date − "Date of birth" ≤ 5 years
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Hib-containing vaccines")
*/
define "Hib booster dose":
  "Third Hib dose from the primary series was administered. The primary series has been completed"
  and Encounter."Client's age is between 6 weeks and 5 years"
  and not "One Hib booster dose was administered. Hib immunization schedule has been completed"
  and "Hib booster dose Expiration" after day of Today

/*
@output: Hib booster dose Create
@create: Hib booster dose should be provided if the client was given the previous dose more than 6 months ago and the first Hib dose was received by the time the child turned 1 year old
*/
define "Hib booster dose Create":
  if "Hib booster dose" 
  then 'Hib booster dose should be provided if the client was given the previous dose more than 6 months ago and the first Hib dose was received by the time the child turned 1 year old' + '
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
    when Patient.id = '24.Alt6w' then "Haemophilus influenzae type b (Hib) dose 1"
    when Patient.id = '25.Abt6w5y' then "Haemophilus influenzae type b (Hib) dose 1"
    when Patient.id = '26.D1Abt6w5yFlt1yDlt4w' then "Hib dose 2"
    when Patient.id = '27.D1Abt6w5yFlt1yDgt4w' then "Hib dose 2"
    when Patient.id = '28.D1Abt6w5yFgt1y' then "First Hib dose from the primary series was administered" and not "Hib dose 2"
    when Patient.id = '29.D2Abt6w5yDlt4w' then "Hib dose 3"
    when Patient.id = '30.D2Abt6w5yDgt4w' then "Hib dose 3"
    when Patient.id = '31.D3B0Abt6w5yDlt6m' then "Hib booster dose"
    when Patient.id = '32.D3B0Abt6w5yDgt6m' then "Hib booster dose"
    when Patient.id = '33.D3B1' then "One Hib booster dose was administered. Hib immunization schedule has been completed"
    when Patient.id = '34.Agt5y' then not "Haemophilus influenzae type b (Hib) dose 1"
    else 'No test case set'
  end
