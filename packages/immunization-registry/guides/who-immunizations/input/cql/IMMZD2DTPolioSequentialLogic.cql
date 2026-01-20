
/*
 * Library: IMMZD2DTPolioSequentialLogic (IMMZ.D2.DT.Polio.Sequential IPV–bOPV)
 * Rule: Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
 * Decision Table: Sequential  "Bivalent oral polio vaccine (bOPV)–inactivated polio vaccine (IPV)" schedule (in countries with high vaccination coverage [e.g. 90–95%] and low importation risk [where neighbouring countries and/or countries that share substantial population movement have a similarly high coverage])
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTPolioSequentialLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTPolioEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for IPV vaccination" then "Client is not due for IPV vaccination Guidance"
    when "Client is due for IPV vaccination" then "Client is due for IPV vaccination Guidance"
    when "Client is due for bOPV vaccination" then "Client is due for bOPV vaccination Guidance"
    when "Client is not due for bOPV vaccination" then "Client is not due for bOPV vaccination Guidance"
    when "Primary series is complete" then "Primary series is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for IPV vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for IPV vaccination Case 1":
  Encounter."No poliovirus primary series doses were administered"
    and Encounter."Client's age is less than 8 weeks"

/*
@output: Client is not due for IPV vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for IPV vaccination Case 2":
  Encounter."One poliovirus primary series dose was administered"
    and Encounter."The latest poliovirus dose was administered less than 4 weeks ago"

/*
@output: Client is not due for IPV vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for IPV vaccination":
  "Client is not due for IPV vaccination Case 1"
    or "Client is not due for IPV vaccination Case 2"

/*
@output: Client is not due for IPV vaccination Guidance
@guidance: Should not vaccinate client with first IPV dose as client's age is less than 8 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for the first poliovirus dose.
@guidance: Should not vaccinate client with second IPV dose as the latest IPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.
*/
define "Client is not due for IPV vaccination Guidance":
  case
    when "Client is not due for IPV vaccination Case 1" then 'Should not vaccinate client with first IPV dose as client\'s age is less than 8 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for the first poliovirus dose.'
    when "Client is not due for IPV vaccination Case 2" then 'Should not vaccinate client with second IPV dose as the latest IPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    else ''
  end

/*
@output: Client is due for IPV vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for IPV vaccination Case 1":
  Encounter."No poliovirus primary series doses were administered"
    and Encounter."Client's age is more than or equal to 8 weeks"

/*
@output: Client is due for IPV vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for IPV vaccination Case 2":
  Encounter."One poliovirus primary series dose was administered"
    and Encounter."The latest poliovirus dose was administered more than 4 weeks ago"

/*
@output: Client is due for IPV vaccination
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for IPV vaccination":
  "Client is due for IPV vaccination Case 1"
    or "Client is due for IPV vaccination Case 2"

/*
@output: Client is due for IPV vaccination Guidance
@guidance: Should vaccinate client with first IPV dose as client is within appropriate age range and IPV dose was not administered. 
Check for contraindications.
@guidance: Should vaccinate client with second IPV dose as the latest IPV dose was administered more than 4 weeks ago.
Check for contraindications.
*/
define "Client is due for IPV vaccination Guidance":
  case
    when "Client is due for IPV vaccination Case 1" then 'Should vaccinate client with first IPV dose as client is within appropriate age range and IPV dose was not administered. 
Check for contraindications.'
    when "Client is due for IPV vaccination Case 2" then 'Should vaccinate client with second IPV dose as the latest IPV dose was administered more than 4 weeks ago.
Check for contraindications.'
    else ''
  end

/*
@output: Client is due for bOPV vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination Case 1":
  Encounter."Two poliovirus primary series doses were administered"

/*
@output: Client is due for bOPV vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination Case 2":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."The latest poliovirus dose was administered more than 4 weeks ago"

/*
@output: Client is due for bOPV vaccination
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination":
  "Client is due for bOPV vaccination Case 1"
    or "Client is due for bOPV vaccination Case 2"

/*
@output: Client is due for bOPV vaccination Guidance
@guidance: Should vaccinate client with first bOPV dose as two IPV doses were administered.
Check for contraindications.
@guidance: Should vaccinate client with second bOPV dose as the latest bOPV dose was administered more than 4 weeks ago.
Check for contraindications.
*/
define "Client is due for bOPV vaccination Guidance":
  case
    when "Client is due for bOPV vaccination Case 1" then 'Should vaccinate client with first bOPV dose as two IPV doses were administered.
Check for contraindications.'
    when "Client is due for bOPV vaccination Case 2" then 'Should vaccinate client with second bOPV dose as the latest bOPV dose was administered more than 4 weeks ago.
Check for contraindications.'
    else ''
  end

/*
@output: Client is not due for bOPV vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for bOPV vaccination":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."The latest poliovirus dose was administered less than 4 weeks ago"

/*
@output: Client is not due for bOPV vaccination Guidance
@guidance: Should not vaccinate client with second bOPV dose as the latest bOPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose
*/
define "Client is not due for bOPV vaccination Guidance":
  'Should not vaccinate client with second bOPV dose as the latest bOPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose'

/*
@output: Primary series is complete
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Primary series is complete":
  Encounter."Four poliovirus primary series doses were administered"

/*
@output: Primary series is complete Guidance
@guidance: Poliovirus primary series is complete. Assess if supplementary bOPV dose(s) are necessary and create a clinical note.
Check for any other vaccines due.
*/
define "Primary series is complete Guidance":
  'Poliovirus primary series is complete. Assess if supplementary bOPV dose(s) are necessary and create a clinical note.
Check for any other vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '56.Alt8w' then "Client is not due for IPV vaccination Case 1" and "Guidance" = 'Should not vaccinate client with first IPV dose as client\'s age is less than 8 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for the first poliovirus dose.'
    when Patient.id = '57.Agt8w' then "Client is due for IPV vaccination Case 1" and "Guidance" = 'Should vaccinate client with first IPV dose as client is within appropriate age range and IPV dose was not administered. 
Check for contraindications.'
    when Patient.id = '58.D1PDlt4w' then "Client is not due for IPV vaccination Case 2" and "Guidance" = 'Should not vaccinate client with second IPV dose as the latest IPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose.'
    when Patient.id = '59.D1PDgt4w' then "Client is due for IPV vaccination Case 2" and "Guidance" = 'Should vaccinate client with second IPV dose as the latest IPV dose was administered more than 4 weeks ago.
Check for contraindications.'
    when Patient.id = '60.D2' then "Client is due for bOPV vaccination Case 1" and "Guidance" = 'Should vaccinate client with first bOPV dose as two IPV doses were administered.
Check for contraindications.'
    when Patient.id = '61.D3PDlt4w' then "Client is not due for bOPV vaccination" and "Guidance" = 'Should not vaccinate client with second bOPV dose as the latest bOPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next dose'
    when Patient.id = '62.D3PDgt4w' then "Client is due for bOPV vaccination Case 2" and "Guidance" = 'Should vaccinate client with second bOPV dose as the latest bOPV dose was administered more than 4 weeks ago.
Check for contraindications.'
    when Patient.id = '63.D4' then "Primary series is complete" and "Guidance" = 'Poliovirus primary series is complete. Assess if supplementary bOPV dose(s) are necessary and create a clinical note.
Check for any other vaccines due.'
    else 'No test case set'
  end
