
/*
 * Library: IMMZD18SPneumococcal3p0bLogic (IMMZ.D18.S.Pneumococcal.3 doses schedule)
 * Schedule Table: 3 primary doses (3p+0) schedule
 */
library IMMZD18SPneumococcal3p0bLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTPneumococcalEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: Pneumococcal dose 1
@description: Provision of the pneumococcal dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "Pneumococcal dose 1":
  Encounter."The client's age is less than or equal to 5 years"
  and Encounter."No pneumococcal primary series doses were administered"

/*
@output: Pneumococcal dose 1 Create
@create: Pneumococcal dose 1 should be provided if the client is older than 6 weeks
*/
define "Pneumococcal dose 1 Create":
  if "Pneumococcal dose 1" 
  then 'Pneumococcal dose 1 should be provided if the client is older than 6 weeks' + '
Due Date: ' + ToString("Pneumococcal dose 1 Due Date")
  else ''

/*
@dynamicValue: Pneumococcal dose 1 Due Date
@pseudocode: "Date of birth" +  6 weeks
*/
define "Pneumococcal dose 1 Due Date":
  if "Pneumococcal dose 1" then Patient.birthDate + 6 weeks
  else null

/*
@dynamicValue: Pneumococcal dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date. WHO does not currently have recommendations on the use of pneumococcal vaccine in individuals aged over 5 years.
*/
define "Pneumococcal dose 1 Overdue":
  null

/*
@dynamicValue: Pneumococcal dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date. WHO does not currently have recommendations on the use of pneumococcal vaccine in individuals aged over 5 years.
*/
define "Pneumococcal dose 1 Expiration":
  null
  
/*
@complete: First pneumococcal dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 1
*/
define "First pneumococcal dose from the primary series was administered":
  Encounter."One pneumococcal primary series dose was administered"

/*
@output: Pneumococcal dose 2, first within 24m
@description: Provision of the pneumococcal dose 2
@trigger: First pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age, within 24 months post birth
Today's date − "Date of birth" ≤ 5 years AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 1 AND "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") − "Date of birth" < 24 months
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines")
*/
define "Pneumococcal dose 2, first within 24m":
  "First pneumococcal dose from the primary series was administered"
  and Encounter."The client's age is less than or equal to 5 years"
  and Encounter."The first pneumococcal dose was administered within 24 months post birth"
  and not "Second pneumococcal dose from the primary series was administered"

/*
@output: Pneumococcal dose 2, first within 24m Create
@create: Pneumococcal dose 2 should be provided if the client was given the previous dose more than 4 weeks ago
*/
define "Pneumococcal dose 2, first within 24m Create":
  if "Pneumococcal dose 2, first within 24m" 
  then 'Pneumococcal dose 2 should be provided if the client was given the previous dose more than 4 weeks ago' + '
Due Date: ' + ToString("Pneumococcal dose 2, first within 24m Due Date")
  else ''

/*
@dynamicValue: Pneumococcal dose 2, first within 24m Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") + 4 weeks
*/
define "Pneumococcal dose 2, first within 24m Due Date":
  if "Pneumococcal dose 2, first within 24m" then Encounter."Date of Latest Pneumococcal Dose" + 4 weeks
  else null

/*
@dynamicValue: Pneumococcal dose 2, first within 24m Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date. WHO does not currently have recommendations on the use of pneumococcal vaccine in individuals aged over 5 years.
*/
define "Pneumococcal dose 2, first within 24m Overdue":
  null

/*
@dynamicValue: Pneumococcal dose 2, first within 24m Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date. WHO does not currently have recommendations on the use of pneumococcal vaccine in individuals aged over 5 years.
*/
define "Pneumococcal dose 2, first within 24m Expiration":
  null
  
/*
@complete: Second pneumococcal dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 2
*/
define "Second pneumococcal dose from the primary series was administered":
  Encounter."Two pneumococcal primary series doses were administered"

/*
@output: Pneumococcal dose 2, first after 24m
@description: Provision of the pneumococcal dose 2
@trigger: First pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age. Pneumococcal dose was not administered within 24 months post birth. Client is at high risk for pneumococcal infection.
Today's date − "Date of birth" ≤ 5 years AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 1 AND "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") − "Date of birth" ≥ 24 months AND "At high risk for pneumococcal infection" = TRUE
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines")
*/
define "Pneumococcal dose 2, first after 24m":
  "First pneumococcal dose from the primary series was administered"
  and Encounter."The client's age is less than or equal to 5 years"
  and Encounter."The first pneumococcal dose was administered after 24 months post birth"
  and Encounter."Client is at high risk for pneumococcal infection"
  and not "Second pneumococcal dose from the primary series was administered"

/*
@output: Pneumococcal dose 2, first after 24m Create
@create: Pneumococcal dose 2 should be provided if the client was given the previous dose more than 8 weeks ago
*/
define "Pneumococcal dose 2, first after 24m Create":
  if "Pneumococcal dose 2, first after 24m" 
  then 'Pneumococcal dose 2 should be provided if the client was given the previous dose more than 8 weeks ago' + '
Due Date: ' + ToString("Pneumococcal dose 2, first after 24m Due Date")
  else ''

/*
@dynamicValue: Pneumococcal dose 2, first after 24m Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") + 8 weeks
*/
define "Pneumococcal dose 2, first after 24m Due Date":
  if "Pneumococcal dose 2, first after 24m" then Encounter."Date of Latest Pneumococcal Dose" + 8 weeks
  else null

/*
@dynamicValue: Pneumococcal dose 2, first after 24m Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date. WHO does not currently have recommendations on the use of pneumococcal vaccine in individuals aged over 5 years.
*/
define "Pneumococcal dose 2, first after 24m Overdue":
  null

/*
@dynamicValue: Pneumococcal dose 2, first after 24m Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date. WHO does not currently have recommendations on the use of pneumococcal vaccine in individuals aged over 5 years.
*/
define "Pneumococcal dose 2, first after 24m Expiration":
  null
  
/*
@output: Pneumococcal dose 3
@description: Provision of the pneumococcal dose 3
@trigger: Second pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age. First pneumococcal dose was administered within 12 months post birth.
Today's date − "Date of birth" ≤ 5 years AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 2 AND "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines" AND "Dose number" = 1) − "Date of birth" < 12 months
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines")
*/
define "Pneumococcal dose 3":
  "Second pneumococcal dose from the primary series was administered"
  and Encounter."The client's age is less than or equal to 5 years"
  and Encounter."The first pneumococcal dose was administered within 24 months post birth"  and not "Third pneumococcal dose from the primary series was administered. The primary series has been completed."

/*
@output: Pneumococcal dose 3 Create
@create: Pneumococcal dose 3 should be provided if the client was given the previous dose more than 4 weeks ago
*/
define "Pneumococcal dose 3 Create":
  if "Pneumococcal dose 3" 
  then 'Pneumococcal dose 3 should be provided if the client was given the previous dose more than 4 weeks ago' + '
Due Date: ' + ToString("Pneumococcal dose 3 Due Date")
  else ''

/*
@dynamicValue: Pneumococcal dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") + 4 weeks
*/
define "Pneumococcal dose 3 Due Date":
  if "Pneumococcal dose 3" then Encounter."Date of Latest Pneumococcal Dose" + 4 weeks
  else null

/*
@dynamicValue: Pneumococcal dose 3 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date. WHO does not currently have recommendations on the use of pneumococcal vaccine in individuals aged over 5 years.
*/
define "Pneumococcal dose 3 Overdue":
  null

/*
@dynamicValue: Pneumococcal dose 3 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date. WHO does not currently have recommendations on the use of pneumococcal vaccine in individuals aged over 5 years.
*/
define "Pneumococcal dose 3 Expiration":
  null
  
/*
@complete: Third pneumococcal dose from the primary series was administered. The primary series has been completed.
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Pneumococcal vaccines")
*/
define "Third pneumococcal dose from the primary series was administered. The primary series has been completed.":
  Encounter."Three pneumococcal primary series doses were administered"

/*
@output: Pneumococcal booster dose
@description: Provision of booster dose for HIV-positive infants and preterm neonates
@trigger: Third pneumococcal dose from the primary series was administered to client, who is more than 12 months of age. The latest pneumococcal dose was administered within 12 months post birth. Client is either HIV positive or had preterm birth.
Today's date − "Date of birth" > 12 months AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 3 AND Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") − "Date of birth" < 12 months AND ("HIV status" = "HIV-positive" OR "Preterm birth" = TRUE)
@triggerDate: "Date of birth"
*/
define "Pneumococcal booster dose":
  "Third pneumococcal dose from the primary series was administered. The primary series has been completed."
  and Encounter."The latest pneumococcal dose was administered within 12 months post birth"
  and (
    Encounter."Client's HIV status is positive"
    or Encounter."Client had preterm birth"
  )
  and "Pneumococcal booster dose Expiration" after day of Today
  and not "One pneumococcal booster dose was administered."

/*
@output: Pneumococcal booster dose Create
@create: HIV-positive infants and preterm neonates who have received their 3 primary vaccine doses before 12 months of age may benefit from a booster dose in the second year of life
*/
define "Pneumococcal booster dose Create":
  if "Pneumococcal booster dose" 
  then 'HIV-positive infants and preterm neonates who have received their 3 primary vaccine doses before 12 months of age may benefit from a booster dose in the second year of life' + '
Due Date: ' + ToString("Pneumococcal booster dose Due Date") + '
Overdue: ' + ToString("Pneumococcal booster dose Overdue") + '
Expiration: ' + ToString("Pneumococcal booster dose Expiration")
  else ''

/*
@dynamicValue: Pneumococcal booster dose Due Date
@pseudocode: "Date of birth" + 12 months
*/
define "Pneumococcal booster dose Due Date":
  if "Pneumococcal booster dose" then Patient.birthDate + 12 months
  else null

/*
@dynamicValue: Pneumococcal booster dose Overdue
@pseudocode: "Date of birth" +  24 months
*/
define "Pneumococcal booster dose Overdue":
  if "Pneumococcal booster dose" then Patient.birthDate + 24 months
  else null

/*
@dynamicValue: Pneumococcal booster dose Expiration
@pseudocode: "Date of birth" +  24 months
*/
define "Pneumococcal booster dose Expiration":
  Patient.birthDate + 24 months
  
/*
@complete: One pneumococcal booster dose was administered.
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Booster dose") = 1
*/
define "One pneumococcal booster dose was administered.":
  Encounter."One pneumococcal booster dose was administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '33.3' then "Pneumococcal dose 1"
    when Patient.id = '34.13' then "Pneumococcal dose 1"
    when Patient.id = '35.1345' then "Pneumococcal dose 2, first within 24m"
    when Patient.id = '36.1345' then "Pneumococcal dose 2, first within 24m"
    when Patient.id = '37.13456' then "Pneumococcal dose 2, first within 24m"
    when Patient.id = '38.13456' then "Pneumococcal dose 2, first within 24m"
    when Patient.id = '39.13456' then "Pneumococcal dose 2, first within 24m"
    when Patient.id = '40.13456' then "Pneumococcal dose 2, first within 24m"
    when Patient.id = '41.13456' then "Pneumococcal dose 2, first after 24m"
    when Patient.id = '42.13456' then "Pneumococcal dose 2, first after 24m"
    when Patient.id = '43.1346' then "First pneumococcal dose from the primary series was administered" 
      and not "Pneumococcal dose 2, first after 24m"
    when Patient.id = '44.1345' then "Pneumococcal dose 3"
    when Patient.id = '45.1345' then "Pneumococcal dose 3"
    when Patient.id = '46.134' then "Pneumococcal dose 3"
    when Patient.id = '47.123457' then "Pneumococcal booster dose"
    when Patient.id = '48.123458' then "Pneumococcal booster dose"
    when Patient.id = '49.123457' then "Pneumococcal booster dose"
    when Patient.id = '50.123458' then "Pneumococcal booster dose"
    when Patient.id = '51.1234' then "Third pneumococcal dose from the primary series was administered. The primary series has been completed." 
      and not "Pneumococcal booster dose"
    when Patient.id = '52.12378' then "Third pneumococcal dose from the primary series was administered. The primary series has been completed." 
      and not "Pneumococcal booster dose"
    when Patient.id = '53.123' then "Third pneumococcal dose from the primary series was administered. The primary series has been completed." 
      and not "Pneumococcal booster dose"
    when Patient.id = '54.12' then "One pneumococcal booster dose was administered."
    when Patient.id = '55.3' then not "Pneumococcal dose 1"
    else 'No test case set'
  end
