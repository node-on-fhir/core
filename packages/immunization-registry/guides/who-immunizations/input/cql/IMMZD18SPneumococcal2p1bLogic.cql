
/*
 * Library: IMMZD18SPneumococcal2p1bLogic (IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule)
 * Schedule Table: 2 primary doses with a booster dose (2p+1) schedule
 */
library IMMZD18SPneumococcal2p1bLogic

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
@note: Decision table notes that it is a clinical decision once past 5 years.
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
@pseudocode: "Date of birth" + 6 weeks
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
@output: Pneumococcal dose 2
@description: Provision of the pneumococcal dose 2
@trigger: First pneumococcal dose from the primary series was administered to the client, who is less than or equal to 5 years of age, either within 24 months of birth or if client is at high risk for pneumococcal infection
Today's date − "Date of birth" ≤ 5 years AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 1 AND ("Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") − "Date of birth" < 24 months OR "At high risk for pneumococcal infection" = TRUE
@triggerDate: Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines")
*/
define "Pneumococcal dose 2":
  "First pneumococcal dose from the primary series was administered"
  and Encounter."The client's age is less than or equal to 5 years"
  and (
    Encounter."The first pneumococcal dose was administered within 24 months post birth"
    or Encounter."Client is at high risk for pneumococcal infection"
  )
  and not "Second pneumococcal dose from the primary series was administered. The primary series has been completed."

/*
@output: Pneumococcal dose 2 Create
@create: Pneumococcal dose 2 should be provided if the client was given the previous dose more than 8 weeks ago
*/
define "Pneumococcal dose 2 Create":
  if "Pneumococcal dose 2" 
  then 'Pneumococcal dose 2 should be provided if the client was given the previous dose more than 8 weeks ago' + '
Due Date: ' + ToString("Pneumococcal dose 2 Due Date")
  else ''

/*
@dynamicValue: Pneumococcal dose 2 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") + 8 weeks
*/
define "Pneumococcal dose 2 Due Date":
  if "Pneumococcal dose 2" then Encounter."Date of Latest Pneumococcal Dose" + 8 weeks
  else null

/*
@dynamicValue: Pneumococcal dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date. WHO does not currently have recommendations on the use of pneumococcal vaccine in individuals aged over 5 years.
*/
define "Pneumococcal dose 2 Overdue":
  null

/*
@dynamicValue: Pneumococcal dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date. WHO does not currently have recommendations on the use of pneumococcal vaccine in individuals aged over 5 years.
*/
define "Pneumococcal dose 2 Expiration":
  null
  
/*
@complete: Second pneumococcal dose from the primary series was administered. The primary series has been completed.
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Pneumococcal vaccines")"
*/
define "Second pneumococcal dose from the primary series was administered. The primary series has been completed.":
  Encounter."Two pneumococcal primary series doses were administered"

/*
@output: Pneumococcal booster dose
@description: Provision of the pneumococcal booster dose
@trigger: Second pneumococcal dose from the primary series was administered and first pneumococcal dose was administered within 12 months post birth
Child's birth AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Primary series") = 2 AND ("Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines" AND "Dose number" = 1) − "Date of birth" < 12 months
@triggerDate: "Date of birth"
*/
define "Pneumococcal booster dose":
  "Second pneumococcal dose from the primary series was administered. The primary series has been completed."
  and Encounter."The first pneumococcal dose was administered within 12 months post birth"
  and not "Pneumococcal booster dose was administered"

/*
@output: Pneumococcal booster dose Create
@create: Pneumococcal booster dose should be provided if the client has received the 2 previous doses
*/
define "Pneumococcal booster dose Create":
  if "Pneumococcal booster dose" 
  then 'Pneumococcal booster dose should be provided if the client has received the 2 previous doses' + '
Due Date: ' + ToString("Pneumococcal booster dose Due Date") + '
Overdue: ' + ToString("Pneumococcal booster dose Overdue")
  else ''

/*
@dynamicValue: Pneumococcal booster dose Due Date
@pseudocode: "Date of birth" + 9 months
*/
define "Pneumococcal booster dose Due Date":
  if "Pneumococcal booster dose" then Patient.birthDate + 9 months
  else null

/*
@dynamicValue: Pneumococcal booster dose Overdue
@pseudocode: "Date of birth" + 18 months
*/
define "Pneumococcal booster dose Overdue":
  if "Pneumococcal booster dose" then Patient.birthDate + 18 months
  else null

/*
@dynamicValue: Pneumococcal booster dose Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date. WHO does not currently have recommendations on the use of pneumococcal vaccine in individuals aged over 5 years.
*/
define "Pneumococcal booster dose Expiration":
  null
  
/*
@complete: Pneumococcal booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Booster dose") = 1
*/
define "Pneumococcal booster dose was administered":
  Encounter."One pneumococcal booster dose was administered"

/*
@output: Pneumococcal second booster dose
@description: Provision of another booster dose for HIV-positive infants and preterm neonates
@trigger: The primary series has been completed and one booster dose was administered to the client, who is more than 12 months of age. The latest pneumococcal dose was administered within 12 months post birth. Client is either HIV positive or had a preterm birth
'Today's date − "Date of birth" > 12 months AND "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Pneumococcal vaccines") AND Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Booster dose") = 1 AND Latest "Date and time of vaccination" (where "Vaccine type" = "Pneumococcal vaccines") − "Date of birth" < 12 months AND ("HIV status" = "HIV-positive" OR "Preterm birth" = TRUE)
@triggerDate: "Date of birth"
*/
define "Pneumococcal second booster dose":
  "Pneumococcal booster dose was administered"
  and Encounter."The latest pneumococcal dose was administered within 12 months post birth"
  and Encounter."The client's age is less than 24 months"
  and (
    Encounter."Client's HIV status is positive"
    or Encounter."Client had preterm birth"
  )
  and not "Second pneumococcal booster dose was administered"
  and "Pneumococcal second booster dose Expiration" after day of Today

/*
@output: Pneumococcal second booster dose Create
@create: HIV-positive infants and preterm neonates who have received their 3 primary vaccine doses before 12 months of age may benefit from a booster dose in the second year of life
*/
define "Pneumococcal second booster dose Create":
  if "Pneumococcal second booster dose" 
  then 'HIV-positive infants and preterm neonates who have received their 3 primary vaccine doses before 12 months of age may benefit from a booster dose in the second year of life' + '
Due Date: ' + ToString("Pneumococcal second booster dose Due Date") + '
Overdue: ' + ToString("Pneumococcal second booster dose Overdue") + '
Expiration: ' + ToString("Pneumococcal second booster dose Expiration")
  else ''

/*
@dynamicValue: Pneumococcal second booster dose Due Date
@pseudocode: "Date of birth" + 12 months
*/
define "Pneumococcal second booster dose Due Date":
  if "Pneumococcal second booster dose" then Patient.birthDate + 12 months
  else null

/*
@dynamicValue: Pneumococcal second booster dose Overdue
@pseudocode: "Date of birth" + 24 months
*/
define "Pneumococcal second booster dose Overdue":
  if "Pneumococcal second booster dose" then Patient.birthDate + 24 months
  else null

/*
@dynamicValue: Pneumococcal second booster dose Expiration
@pseudocode: "Date of birth" + 24 months
*/
define "Pneumococcal second booster dose Expiration":
  Patient.birthDate + 24 months
  
/*
@complete: Second pneumococcal booster dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Pneumococcal vaccines" and "Type of dose" = "Booster dose") = 2
*/
define "Second pneumococcal booster dose was administered":
  Encounter."Two pneumococcal booster doses were administered"

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '08.3' then "Pneumococcal dose 1"
    when Patient.id = '09.13' then "Pneumococcal dose 1"
    when Patient.id = '10.1345' then "Pneumococcal dose 2"
    when Patient.id = '11.1345' then "Pneumococcal dose 2"
    when Patient.id = '12.13456' then "Pneumococcal dose 2"
    when Patient.id = '13.13456' then "Pneumococcal dose 2"
    when Patient.id = '14.1346' then "First pneumococcal dose from the primary series was administered" 
      and not "Pneumococcal dose 2"
    when Patient.id = '15.1234' then "Pneumococcal booster dose"
    when Patient.id = '16.1234' then "Second pneumococcal dose from the primary series was administered. The primary series has been completed." 
      and not "Pneumococcal booster dose"
    when Patient.id = '17.1237' then "Pneumococcal second booster dose"
    when Patient.id = '18.1238' then "Pneumococcal second booster dose"
    when Patient.id = '19.12347' then "Pneumococcal second booster dose"
    when Patient.id = '20.12348' then "Pneumococcal second booster dose"
    when Patient.id = '21.1234' then "Second pneumococcal dose from the primary series was administered. The primary series has been completed." 
      and not "Pneumococcal second booster dose"
    when Patient.id = '22.1278' then "Second pneumococcal dose from the primary series was administered. The primary series has been completed." 
      and not "Pneumococcal second booster dose"
    when Patient.id = '23.123' then "Second pneumococcal dose from the primary series was administered. The primary series has been completed." 
      and not "Pneumococcal second booster dose"
    when Patient.id = '24.12' then "Second pneumococcal booster dose was administered"
    when Patient.id = '25.3' then not "Pneumococcal dose 1"
    else 'No test case set'
  end
