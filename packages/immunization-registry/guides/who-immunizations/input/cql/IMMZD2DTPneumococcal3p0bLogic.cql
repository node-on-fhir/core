
/*
 * Library: IMMZD2DTPneumococcal3p0bLogic (IMMZ.D2.DT.Pneumococcal.3 doses)
 * Rule: Determine if the client is due for a pneumococcal vaccination according to the national immunization schedule
 * Decision Table: 3 primary doses (3p+0)
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTPneumococcal3p0bLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTPneumococcalEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for pneumococcal vaccination" then "Client is not due for pneumococcal vaccination Guidance"
    when "Client is due for pneumococcal vaccination" then "Client is due for pneumococcal vaccination Guidance"
    when "Pneumococcal immunization schedule is complete" then "Pneumococcal immunization schedule is complete Guidance"
    when "Client is not due for pneumococcal booster dose" then "Client is not due for pneumococcal booster dose Guidance"
    when "Client is due for pneumococcal booster dose" then "Client is due for pneumococcal booster dose Guidance"
    when "Clinical judgement is required. Create a clinical note." then "Clinical judgement is required. Create a clinical note. Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for pneumococcal vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal vaccination Case 1":
  Encounter."The client's age is less than 6 weeks"

/*
@output: Client is not due for pneumococcal vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal vaccination Case 2":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to five years"
    and Encounter."The first pneumococcal dose was administered within 12 months post birth"
    and Encounter."The latest pneumococcal dose was administered less than 4 weeks ago"

/*
@output: Client is not due for pneumococcal vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal vaccination Case 3":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to five years"
    and Encounter."The first pneumococcal dose was administered at 12–24 months post birth"
    and Encounter."The latest pneumococcal dose was administered less than 4 weeks ago"
    and Encounter."Client is not at high risk for pneumococcal infection"

/*
@output: Client is not due for pneumococcal vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal vaccination Case 4":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to five years"
    and Encounter."The first pneumococcal dose was administered at 12–24 months post birth"
    and Encounter."The latest pneumococcal dose was administered less than 8 weeks ago"
    and Encounter."Client is at high risk for pneumococcal infection"

/*
@output: Client is not due for pneumococcal vaccination Case 5
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal vaccination Case 5":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to five years"
    and Encounter."The first pneumococcal dose was administered after 24 months post birth"
    and Encounter."The latest pneumococcal dose was administered less than 8 weeks ago"
    and Encounter."Client is at high risk for pneumococcal infection"

/*
@output: Client is not due for pneumococcal vaccination Case 6
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal vaccination Case 6":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."The client's age is less than or equal to five years"
    and Encounter."The first pneumococcal dose was administered within 12 months post birth"
    and Encounter."The latest pneumococcal dose was administered less than 4 weeks ago"

/*
@output: Client is not due for pneumococcal vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal vaccination":
  "Client is not due for pneumococcal vaccination Case 1"
    or "Client is not due for pneumococcal vaccination Case 2"
    or "Client is not due for pneumococcal vaccination Case 3"
    or "Client is not due for pneumococcal vaccination Case 4"
    or "Client is not due for pneumococcal vaccination Case 5"
    or "Client is not due for pneumococcal vaccination Case 6"

/*
@output: Client is not due for pneumococcal vaccination Guidance
@guidance: Should not vaccinate client with first pneumococcal dose as client's age is less than 6 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 4 weeks ago. Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 8 weeks ago and client is at high risk for pneumococcal infection. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 8 weeks ago and client is at high risk for pneumococcal infection. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with third pneumococcal dose as client's age is less than 5 years and latest pneumococcal dose was administered less than 4 weeks ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose
*/
define "Client is not due for pneumococcal vaccination Guidance":
  case
    when "Client is not due for pneumococcal vaccination Case 1" then 'Should not vaccinate client with first pneumococcal dose as client\'s age is less than 6 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for pneumococcal vaccination Case 2" then 'Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for pneumococcal vaccination Case 3" then 'Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 4 weeks ago. Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for pneumococcal vaccination Case 4" then 'Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 8 weeks ago and client is at high risk for pneumococcal infection. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for pneumococcal vaccination Case 5" then 'Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 8 weeks ago and client is at high risk for pneumococcal infection. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for pneumococcal vaccination Case 6" then 'Should not vaccinate client with third pneumococcal dose as client\'s age is less than 5 years and latest pneumococcal dose was administered less than 4 weeks ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose'
    else ''
  end

/*
@output: Client is due for pneumococcal vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal vaccination Case 1":
  Encounter."No pneumococcal primary series doses were administered"
    and Encounter."The client's age is between 6 weeks and 5 years"

/*
@output: Client is due for pneumococcal vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal vaccination Case 2":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to five years"
    and Encounter."The first pneumococcal dose was administered within 12 months post birth"
    and Encounter."The latest pneumococcal dose was administered more than 4 weeks ago"

/*
@output: Client is due for pneumococcal vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal vaccination Case 3":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to five years"
    and Encounter."The first pneumococcal dose was administered at 12–24 months post birth"
    and Encounter."The latest pneumococcal dose was administered more than 4 weeks ago"
    and Encounter."Client is not at high risk for pneumococcal infection"

/*
@output: Client is due for pneumococcal vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal vaccination Case 4":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to five years"
    and Encounter."The first pneumococcal dose was administered at 12–24 months post birth"
    and Encounter."The latest pneumococcal dose was administered more than 8 weeks ago"
    and Encounter."Client is at high risk for pneumococcal infection"

/*
@output: Client is due for pneumococcal vaccination Case 5
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal vaccination Case 5":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to five years"
    and Encounter."The first pneumococcal dose was administered after 24 months post birth"
    and Encounter."The latest pneumococcal dose was administered more than 8 weeks ago"
    and Encounter."Client is at high risk for pneumococcal infection"

/*
@output: Client is due for pneumococcal vaccination Case 6
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal vaccination Case 6":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."The client's age is less than or equal to five years"
    and Encounter."The first pneumococcal dose was administered within 12 months post birth"
    and Encounter."The latest pneumococcal dose was administered more than 4 weeks ago"

/*
@output: Client is due for pneumococcal vaccination
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal vaccination":
  "Client is due for pneumococcal vaccination Case 1"
    or "Client is due for pneumococcal vaccination Case 2"
    or "Client is due for pneumococcal vaccination Case 3"
    or "Client is due for pneumococcal vaccination Case 4"
    or "Client is due for pneumococcal vaccination Case 5"
    or "Client is due for pneumococcal vaccination Case 6"

/*
@output: Client is due for pneumococcal vaccination Guidance
@guidance: Should vaccinate client with first pneumococcal dose as no pneumococcal doses were administered and client is within the appropriate age range.
Check for contraindications.
@guidance: Should vaccinate client with second pneumococcal dose as first dose was administered within 12 months post birth and latest pneumococcal dose was administered more than 4 weeks ago.
Check for contraindications.
@guidance: Should vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered more than 4 weeks ago and client is not at high risk for pneumococcal infection.
Check for contraindications.
@guidance: Should vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered more than 8 weeks ago and client is at high risk for pneumococcal infection.
Check for contraindications.
@guidance: Should vaccinate client with second pneumococcal dose as first dose was administered 24 months post birth, latest pneumococcal dose was administered more than 8 weeks ago and client is at high risk for pneumococcal infection.
Check for contraindications.
@guidance: Should vaccinate client with third pneumococcal dose as client's age is less than 5 yers and latest pneumococcal dose was administered more than 4 weeks ago.
Check for contraindications.
*/
define "Client is due for pneumococcal vaccination Guidance":
  case
    when "Client is due for pneumococcal vaccination Case 1" then 'Should vaccinate client with first pneumococcal dose as no pneumococcal doses were administered and client is within the appropriate age range.
Check for contraindications.'
    when "Client is due for pneumococcal vaccination Case 2" then 'Should vaccinate client with second pneumococcal dose as first dose was administered within 12 months post birth and latest pneumococcal dose was administered more than 4 weeks ago.
Check for contraindications.'
    when "Client is due for pneumococcal vaccination Case 3" then 'Should vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered more than 4 weeks ago and client is not at high risk for pneumococcal infection.
Check for contraindications.'
    when "Client is due for pneumococcal vaccination Case 4" then 'Should vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered more than 8 weeks ago and client is at high risk for pneumococcal infection.
Check for contraindications.'
    when "Client is due for pneumococcal vaccination Case 5" then 'Should vaccinate client with second pneumococcal dose as first dose was administered 24 months post birth, latest pneumococcal dose was administered more than 8 weeks ago and client is at high risk for pneumococcal infection.
Check for contraindications.'
    when "Client is due for pneumococcal vaccination Case 6" then 'Should vaccinate client with third pneumococcal dose as client\'s age is less than 5 yers and latest pneumococcal dose was administered more than 4 weeks ago.
Check for contraindications.'
    else ''
  end

/*
@output: Pneumococcal immunization schedule is complete Case 1
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete Case 1":
  Encounter."One pneumococcal primary series dose was administered"
    and Encounter."The client's age is less than or equal to five years"
    and Encounter."The first pneumococcal dose was administered after 24 months post birth"
    and Encounter."Client is not at high risk for pneumococcal infection"

/*
@output: Pneumococcal immunization schedule is complete Case 2
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete Case 2":
  Encounter."Two pneumococcal primary series doses were administered"
    and Encounter."The client's age is less than or equal to five years"
    and Encounter."The first pneumococcal dose was administered after 12 months post birth"

/*
@output: Pneumococcal immunization schedule is complete Case 3
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete Case 3":
  Encounter."Three pneumococcal primary series doses were administered"
    and Encounter."No pneumococcal booster dose was administered"
    and Encounter."The client's age is less than 24 months"
    and Encounter."The latest pneumococcal dose was administered after 12 months post birth"

/*
@output: Pneumococcal immunization schedule is complete Case 4
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete Case 4":
  Encounter."Three pneumococcal primary series doses were administered"
    and Encounter."No pneumococcal booster dose was administered"
    and Encounter."The client's age is less than 24 months"
    and Encounter."Client's HIV status is negative or unknown"
    and Encounter."Client did not have preterm birth"

/*
@output: Pneumococcal immunization schedule is complete Case 5
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete Case 5":
  Encounter."Three pneumococcal primary series doses were administered"
    and Encounter."No pneumococcal booster dose was administered"
    and Encounter."The client's age is more than or equal to 24 months"

/*
@output: Pneumococcal immunization schedule is complete Case 6
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete Case 6":
  Encounter."Three pneumococcal primary series doses were administered"
    and Encounter."One pneumococcal booster dose was administered"

/*
@output: Pneumococcal immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Pneumococcal immunization schedule is complete":
  "Pneumococcal immunization schedule is complete Case 1"
    or "Pneumococcal immunization schedule is complete Case 2"
    or "Pneumococcal immunization schedule is complete Case 3"
    or "Pneumococcal immunization schedule is complete Case 4"
    or "Pneumococcal immunization schedule is complete Case 5"
    or "Pneumococcal immunization schedule is complete Case 6"

/*
@output: Pneumococcal immunization schedule is complete Guidance
@guidance: Pneumococcal immunization schedule is complete. One pneumococcal dose was administered. 
Check for any other vaccines due.
@guidance: Pneumococcal immunization schedule is complete. Two pneumococcal pneumococcal doses were administered. 
Check for any other vaccines due.
@guidance: Pneumococcal immunization schedule is complete. Three pneumococcal primary serie doses were administered. 
Check for any other vaccines due.
@guidance: Pneumococcal immunization schedule is complete. Three pneumococcal primary series doses were administered. 
Check for any other vaccines due.
@guidance: Pneumococcal immunization schedule is complete. Three pneumococcal primary series doses were administered. 
Check for any other vaccines due.
@guidance: Pneumococcal immunization schedule is complete. Three pneumococcal primary series doses and one booster dose were administered. 
Check for any other vaccines due.
*/
define "Pneumococcal immunization schedule is complete Guidance":
  case
    when "Pneumococcal immunization schedule is complete Case 1" then 'Pneumococcal immunization schedule is complete. One pneumococcal dose was administered. 
Check for any other vaccines due.'
    when "Pneumococcal immunization schedule is complete Case 2" then 'Pneumococcal immunization schedule is complete. Two pneumococcal pneumococcal doses were administered. 
Check for any other vaccines due.'
    when "Pneumococcal immunization schedule is complete Case 3" then 'Pneumococcal immunization schedule is complete. Three pneumococcal primary serie doses were administered. 
Check for any other vaccines due.'
    when "Pneumococcal immunization schedule is complete Case 4" then 'Pneumococcal immunization schedule is complete. Three pneumococcal primary series doses were administered. 
Check for any other vaccines due.'
    when "Pneumococcal immunization schedule is complete Case 5" then 'Pneumococcal immunization schedule is complete. Three pneumococcal primary series doses were administered. 
Check for any other vaccines due.'
    when "Pneumococcal immunization schedule is complete Case 6" then 'Pneumococcal immunization schedule is complete. Three pneumococcal primary series doses and one booster dose were administered. 
Check for any other vaccines due.'
    else ''
  end

/*
@output: Client is not due for pneumococcal booster dose Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal booster dose Case 1":
  Encounter."Three pneumococcal primary series doses were administered"
    and Encounter."No pneumococcal booster dose was administered"
    and Encounter."The client's age is less than 24 months"
    and Encounter."The latest pneumococcal dose was administered within 12 months post birth"
    and Encounter."The latest pneumococcal dose was administered less than 8 weeks ago"
    and Encounter."Client's HIV status is positive"

/*
@output: Client is not due for pneumococcal booster dose Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal booster dose Case 2":
  Encounter."Three pneumococcal primary series doses were administered"
    and Encounter."No pneumococcal booster dose was administered"
    and Encounter."The client's age is less than 24 months"
    and Encounter."The latest pneumococcal dose was administered within 12 months post birth"
    and Encounter."The latest pneumococcal dose was administered less than 8 weeks ago"
    and Encounter."Client had preterm birth"

/*
@output: Client is not due for pneumococcal booster dose
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for pneumococcal booster dose":
  "Client is not due for pneumococcal booster dose Case 1"
    or "Client is not due for pneumococcal booster dose Case 2"

/*
@output: Client is not due for pneumococcal booster dose Guidance
@guidance: Should not vaccinate client with pneumococcal booster dose as latest pneumococcal dose was administered within 12 months post birth and administered less than 8 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
@guidance: Should not vaccinate client with pneumococcal booster dose as latest pneumococcal dose was administered within 12 months post birth and administered less than 8 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
*/
define "Client is not due for pneumococcal booster dose Guidance":
  case
    when "Client is not due for pneumococcal booster dose Case 1" then 'Should not vaccinate client with pneumococcal booster dose as latest pneumococcal dose was administered within 12 months post birth and administered less than 8 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when "Client is not due for pneumococcal booster dose Case 2" then 'Should not vaccinate client with pneumococcal booster dose as latest pneumococcal dose was administered within 12 months post birth and administered less than 8 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    else ''
  end

/*
@output: Client is due for pneumococcal booster dose Case 1
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal booster dose Case 1":
  Encounter."Three pneumococcal primary series doses were administered"
    and Encounter."No pneumococcal booster dose was administered"
    and Encounter."The client's age is less than 24 months"
    and Encounter."The latest pneumococcal dose was administered within 12 months post birth"
    and Encounter."The latest pneumococcal dose was administered more than 8 weeks ago"
    and Encounter."Client's HIV status is positive"

/*
@output: Client is due for pneumococcal booster dose Case 2
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal booster dose Case 2":
  Encounter."Three pneumococcal primary series doses were administered"
    and Encounter."No pneumococcal booster dose was administered"
    and Encounter."The client's age is less than 24 months"
    and Encounter."The latest pneumococcal dose was administered within 12 months post birth"
    and Encounter."The latest pneumococcal dose was administered more than 8 weeks ago"
    and Encounter."Client had preterm birth"

/*
@output: Client is due for pneumococcal booster dose
@pseudocode: "Immunization recommendation status" = "Due"
*/
define "Client is due for pneumococcal booster dose":
  "Client is due for pneumococcal booster dose Case 1"
    or "Client is due for pneumococcal booster dose Case 2"

/*
@output: Client is due for pneumococcal booster dose Guidance
@guidance: Should vaccinate client with pneumococcal booster dose as client is HIV positive and latest pneumococcal dose was administered within 12 months post birth and administered more than 8 weeks ago .
Check for contraindications.
@guidance: Should vaccinate client with pneumococcal booster dose as client had preterm birth and latest pneumococcal dose was administered within 12 months post birth and administered more than 8 weeks ago.
Check for contraindications.
*/
define "Client is due for pneumococcal booster dose Guidance":
  case
    when "Client is due for pneumococcal booster dose Case 1" then 'Should vaccinate client with pneumococcal booster dose as client is HIV positive and latest pneumococcal dose was administered within 12 months post birth and administered more than 8 weeks ago .
Check for contraindications.'
    when "Client is due for pneumococcal booster dose Case 2" then 'Should vaccinate client with pneumococcal booster dose as client had preterm birth and latest pneumococcal dose was administered within 12 months post birth and administered more than 8 weeks ago.
Check for contraindications.'
    else ''
  end

/*
@output: Clinical judgement is required. Create a clinical note.
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note.":
  Encounter."The client's age is more than 5 years"

/*
@output: Clinical judgement is required. Create a clinical note. Guidance
@guidance: Members States should update this action according to the national immunization programme
*/
define "Clinical judgement is required. Create a clinical note. Guidance":
  'Members States should update this action according to the national immunization programme'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '33.3' then "Client is not due for pneumococcal vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first pneumococcal dose as client\'s age is less than 6 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '34.13' then "Client is due for pneumococcal vaccination Case 1" and "Guidance" = 'Should vaccinate client with first pneumococcal dose as no pneumococcal doses were administered and client is within the appropriate age range.
Check for contraindications.'
    when Patient.id = '35.1345' then "Client is not due for pneumococcal vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '36.1345' then "Client is due for pneumococcal vaccination Case 2" and "Guidance" = 'Should vaccinate client with second pneumococcal dose as first dose was administered within 12 months post birth and latest pneumococcal dose was administered more than 4 weeks ago.
Check for contraindications.'
    when Patient.id = '37.13456' then "Client is not due for pneumococcal vaccination Case 3" and "Guidance" = 'Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 4 weeks ago. Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '38.13456' then "Client is due for pneumococcal vaccination Case 3" and "Guidance" = 'Should vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered more than 4 weeks ago and client is not at high risk for pneumococcal infection.
Check for contraindications.'
    when Patient.id = '39.13456' then "Client is not due for pneumococcal vaccination Case 4" and "Guidance" = 'Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 8 weeks ago and client is at high risk for pneumococcal infection. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '40.13456' then "Client is due for pneumococcal vaccination Case 4" and "Guidance" = 'Should vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered more than 8 weeks ago and client is at high risk for pneumococcal infection.
Check for contraindications.'
    when Patient.id = '41.13456' then "Client is not due for pneumococcal vaccination Case 5" and "Guidance" = 'Should not vaccinate client with second pneumococcal dose as the latest pneumococcal dose was administered less than 8 weeks ago and client is at high risk for pneumococcal infection. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '42.13456' then "Client is due for pneumococcal vaccination Case 5" and "Guidance" = 'Should vaccinate client with second pneumococcal dose as first dose was administered 24 months post birth, latest pneumococcal dose was administered more than 8 weeks ago and client is at high risk for pneumococcal infection.
Check for contraindications.'
    when Patient.id = '43.1346' then "Pneumococcal immunization schedule is complete Case 1" and "Guidance" = 'Pneumococcal immunization schedule is complete. One pneumococcal dose was administered. 
Check for any other vaccines due.'
    when Patient.id = '44.1345' then "Client is not due for pneumococcal vaccination Case 6" and "Guidance" = 'Should not vaccinate client with third pneumococcal dose as client\'s age is less than 5 years and latest pneumococcal dose was administered less than 4 weeks ago. 
Check for any vaccines due and inform the caregiver of when to come back for the next dose'
    when Patient.id = '45.1345' then "Client is due for pneumococcal vaccination Case 6" and "Guidance" = 'Should vaccinate client with third pneumococcal dose as client\'s age is less than 5 yers and latest pneumococcal dose was administered more than 4 weeks ago.
Check for contraindications.'
    when Patient.id = '46.134' then "Pneumococcal immunization schedule is complete Case 2" and "Guidance" = 'Pneumococcal immunization schedule is complete. Two pneumococcal pneumococcal doses were administered. 
Check for any other vaccines due.'
    when Patient.id = '47.123457' then "Client is not due for pneumococcal booster dose Case 1" and "Guidance" = 'Should not vaccinate client with pneumococcal booster dose as latest pneumococcal dose was administered within 12 months post birth and administered less than 8 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '48.123458' then "Client is not due for pneumococcal booster dose Case 2" and "Guidance" = 'Should not vaccinate client with pneumococcal booster dose as latest pneumococcal dose was administered within 12 months post birth and administered less than 8 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '49.123457' then "Client is due for pneumococcal booster dose Case 1" and "Guidance" = 'Should vaccinate client with pneumococcal booster dose as client is HIV positive and latest pneumococcal dose was administered within 12 months post birth and administered more than 8 weeks ago .
Check for contraindications.'
    when Patient.id = '50.123458' then "Client is due for pneumococcal booster dose Case 2" and "Guidance" = 'Should vaccinate client with pneumococcal booster dose as client had preterm birth and latest pneumococcal dose was administered within 12 months post birth and administered more than 8 weeks ago.
Check for contraindications.'
    when Patient.id = '51.1234' then "Pneumococcal immunization schedule is complete Case 3" and "Guidance" = 'Pneumococcal immunization schedule is complete. Three pneumococcal primary serie doses were administered. 
Check for any other vaccines due.'
    when Patient.id = '52.12378' then "Pneumococcal immunization schedule is complete Case 4" and "Guidance" = 'Pneumococcal immunization schedule is complete. Three pneumococcal primary series doses were administered. 
Check for any other vaccines due.'
    when Patient.id = '53.123' then "Pneumococcal immunization schedule is complete Case 5" and "Guidance" = 'Pneumococcal immunization schedule is complete. Three pneumococcal primary series doses were administered. 
Check for any other vaccines due.'
    when Patient.id = '54.12' then "Pneumococcal immunization schedule is complete Case 6" and "Guidance" = 'Pneumococcal immunization schedule is complete. Three pneumococcal primary series doses and one booster dose were administered. 
Check for any other vaccines due.'
    when Patient.id = '55.3' then "Clinical judgement is required. Create a clinical note." and "Guidance" = 'Members States should update this action according to the national immunization programme'
    else 'No test case set'
  end
