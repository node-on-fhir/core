
/*
 * Library: IMMZD2DTPoliobOPVIPVLogic (IMMZ.D2.DT.Polio.bOPV plus IPV)
 * Rule: Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
 * Decision Table:  "Bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV)" schedule (applicable for all countries)
 * Trigger: IMMZ.D2  Determine required vaccination(s) if any
 */
library IMMZD2DTPoliobOPVIPVLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZConcepts called Concepts
include IMMZD2DTPolioEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Client is not due for bOPV vaccination" then "Client is not due for bOPV vaccination Guidance"
    when "Client is due for bOPV vaccination" then "Client is due for bOPV vaccination Guidance"
    when "Client is due for bOPV and IPV vaccination" then "Client is due for bOPV and IPV vaccination Guidance"
    when "Client is not due for polio vaccination" then "Client is not due for polio vaccination Guidance"
    when "Client is due for IPV vaccination" then "Client is due for IPV vaccination Guidance"
    when "Polio immunization schedule is complete" then "Polio immunization schedule is complete Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Client is not due for bOPV vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for bOPV vaccination":
  Encounter."Client's age is less than 6 weeks"

/*
@output: Client is not due for bOPV vaccination Guidance
@guidance: Should not vaccinate client with first bOPV dose as client's age is less than 6 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for the first bOPV dose.
*/
define "Client is not due for bOPV vaccination Guidance":
  'Should not vaccinate client with first bOPV dose as client\'s age is less than 6 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for the first bOPV dose.'

/*
@output: Client is due for bOPV vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination Case 1":
  Encounter."No poliovirus primary series doses were administered"
    and Encounter."Client's age is between 6 weeks and 3 months"

/*
@output: Client is due for bOPV vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination Case 2":
  Encounter."One poliovirus primary series dose was administered"
    and Encounter."Client's age is between 6 weeks and 14 weeks"
    and Encounter."The latest bOPV dose was administered more than 4 weeks ago"

/*
@output: Client is due for bOPV vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination Case 3":
  Encounter."One poliovirus primary series dose was administered"
    and Encounter."The poliovirus dose administered is IPV"
    and Encounter."Client's age is more than or equal to 14 weeks"
    and Encounter."The latest IPV dose was administered less than 4 months ago"

/*
@output: Client is due for bOPV vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination Case 4":
  Encounter."Two poliovirus primary series doses were administered"
    and Encounter."The two doses administered are bOPV"
    and Encounter."Client's age is between 6 weeks and 14 weeks"
    and Encounter."The latest bOPV dose was administered more than 4 weeks ago"

/*
@output: Client is due for bOPV vaccination Case 5
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination Case 5":
  Encounter."Two poliovirus primary series doses were administered"
    and Encounter."From the two doses administered one is bOPV and one is IPV"
    and Encounter."The latest bOPV dose was administered more than 4 weeks ago"
    and Encounter."The latest IPV dose was administered less than 4 months ago"

/*
@output: Client is due for bOPV vaccination Case 6
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination Case 6":
  Encounter."Two poliovirus primary series doses were administered"
    and Encounter."The two doses administered are IPV"

/*
@output: Client is due for bOPV vaccination Case 7
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination Case 7":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."From the three doses administered, one is IPV and two are bOPV"
    and Encounter."The latest bOPV dose was administered more than 4 weeks ago"
    and Encounter."The latest IPV dose was administered less than 4 months ago"

/*
@output: Client is due for bOPV vaccination Case 8
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination Case 8":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."From the three doses administered, one is bOPV and two are IPV"
    and Encounter."The latest bOPV dose was administered more than 4 weeks ago"

/*
@output: Client is due for bOPV vaccination Case 9
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination Case 9":
  Encounter."Four poliovirus primary series doses were administered"
    and Encounter."From the four doses administered, two are IPV and two are bOPV"
    and Encounter."The latest bOPV dose was administered more than 4 weeks ago"

/*
@output: Client is due for bOPV vaccination
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV")
*/
define "Client is due for bOPV vaccination":
  "Client is due for bOPV vaccination Case 1"
    or "Client is due for bOPV vaccination Case 2"
    or "Client is due for bOPV vaccination Case 3"
    or "Client is due for bOPV vaccination Case 4"
    or "Client is due for bOPV vaccination Case 5"
    or "Client is due for bOPV vaccination Case 6"
    or "Client is due for bOPV vaccination Case 7"
    or "Client is due for bOPV vaccination Case 8"
    or "Client is due for bOPV vaccination Case 9"

/*
@output: Client is due for bOPV vaccination Guidance
@guidance: Should vaccinate client with first bOPV dose as no poliovirus doses were administered and client's age is between 6 weeks and 3 months. 
Check for contraindications.
@guidance: Should vaccinate client with second bOPV dose as the latest bOPV dose was administered more than 4 weeks ago.
Check for contraindications
@guidance: Should vaccinate client with first bOPV dose as client's age is more than 14 weeks, bOPV dose was not administered and the first IPV dose was administered less than 4 months ago.
Check for contraindications.
@guidance: Should vaccinate client with third bOPV dose as client's age is between 6 and 14 weeks and the latest bOPV dose was administered more than 4 weeks ago. Check for contraindications.
@guidance: Should vaccinate client with second bOPV dose as one bOPV dose and one IPV dose were administered, the latest bOPV dose was administered more than 4 weeks ago and the latest IPV dose was administered less than 4 months ago. 
Check for contraindications.
@guidance: Should vaccinate client with first bOPV dose as bOPV dose was not administered and two IPV doses were administered. 
Check for contraindications.
@guidance: Should vaccinate client with third bOPV dose as two bOPV doses and one IPV dose were administered, the latest bOPV dose was administered more than 4 weeks ago and the latest IPV dose was administered less than 4 months ago. 
Check for contraindications.
@guidance: Should vaccinate client with second bOPV dose as one bOPV dose and two IPV doses were administered and the latest bOPV dose was administered more than 4 weeks ago. 
Check for contraindications.
@guidance: Should vaccinate client with third bOPV dose as two bOPV doses and two IPV doses were administered and the latest bOPV dose was administered more than 4 weeks ago. 
Check for contraindications.
*/
define "Client is due for bOPV vaccination Guidance":
  case
    when "Client is due for bOPV vaccination Case 1" then 'Should vaccinate client with first bOPV dose as no poliovirus doses were administered and client\'s age is between 6 weeks and 3 months. 
Check for contraindications.'
    when "Client is due for bOPV vaccination Case 2" then 'Should vaccinate client with second bOPV dose as the latest bOPV dose was administered more than 4 weeks ago.
Check for contraindications'
    when "Client is due for bOPV vaccination Case 3" then 'Should vaccinate client with first bOPV dose as client\'s age is more than 14 weeks, bOPV dose was not administered and the first IPV dose was administered less than 4 months ago.
Check for contraindications.'
    when "Client is due for bOPV vaccination Case 4" then 'Should vaccinate client with third bOPV dose as client\'s age is between 6 and 14 weeks and the latest bOPV dose was administered more than 4 weeks ago. Check for contraindications.'
    when "Client is due for bOPV vaccination Case 5" then 'Should vaccinate client with second bOPV dose as one bOPV dose and one IPV dose were administered, the latest bOPV dose was administered more than 4 weeks ago and the latest IPV dose was administered less than 4 months ago. 
Check for contraindications.'
    when "Client is due for bOPV vaccination Case 6" then 'Should vaccinate client with first bOPV dose as bOPV dose was not administered and two IPV doses were administered. 
Check for contraindications.'
    when "Client is due for bOPV vaccination Case 7" then 'Should vaccinate client with third bOPV dose as two bOPV doses and one IPV dose were administered, the latest bOPV dose was administered more than 4 weeks ago and the latest IPV dose was administered less than 4 months ago. 
Check for contraindications.'
    when "Client is due for bOPV vaccination Case 8" then 'Should vaccinate client with second bOPV dose as one bOPV dose and two IPV doses were administered and the latest bOPV dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when "Client is due for bOPV vaccination Case 9" then 'Should vaccinate client with third bOPV dose as two bOPV doses and two IPV doses were administered and the latest bOPV dose was administered more than 4 weeks ago. 
Check for contraindications.'
    else ''
  end

/*
@output: Client is due for bOPV and IPV vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV") AND (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for bOPV and IPV vaccination Case 1":
  Encounter."No poliovirus primary series doses were administered"
    and Encounter."Client's age is more than 3 months"

/*
@output: Client is due for bOPV and IPV vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV") AND (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for bOPV and IPV vaccination Case 2":
  Encounter."One poliovirus primary series dose was administered"
    and Encounter."The poliovirus dose administered is bOPV"
    and Encounter."Client's age is more than or equal to 14 weeks"
    and Encounter."The latest bOPV dose was administered more than 4 weeks ago"

/*
@output: Client is due for bOPV and IPV vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV") AND (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for bOPV and IPV vaccination Case 3":
  Encounter."One poliovirus primary series dose was administered"
    and Encounter."The poliovirus dose administered is IPV"
    and Encounter."Client's age is more than or equal to 14 weeks"
    and Encounter."The latest IPV dose was administered more than 4 months ago"

/*
@output: Client is due for bOPV and IPV vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV") AND (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for bOPV and IPV vaccination Case 4":
  Encounter."Two poliovirus primary series doses were administered"
    and Encounter."The two doses administered are bOPV"
    and Encounter."Client's age is more than or equal to 14 weeks"
    and Encounter."The latest bOPV dose was administered more than 4 weeks ago"

/*
@output: Client is due for bOPV and IPV vaccination Case 5
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV") AND (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for bOPV and IPV vaccination Case 5":
  Encounter."Two poliovirus primary series doses were administered"
    and Encounter."From the two doses administered one is bOPV and one is IPV"
    and Encounter."The latest bOPV dose was administered more than 4 weeks ago"
    and Encounter."The latest IPV dose was administered more than 4 months ago"

/*
@output: Client is due for bOPV and IPV vaccination Case 6
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV") AND (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for bOPV and IPV vaccination Case 6":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."From the three doses administered, one is IPV and two are bOPV"
    and Encounter."The latest bOPV dose was administered more than 4 weeks ago"
    and Encounter."The latest IPV dose was administered more than 4 months ago"

/*
@output: Client is due for bOPV and IPV vaccination
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "bOPV") AND (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for bOPV and IPV vaccination":
  "Client is due for bOPV and IPV vaccination Case 1"
    or "Client is due for bOPV and IPV vaccination Case 2"
    or "Client is due for bOPV and IPV vaccination Case 3"
    or "Client is due for bOPV and IPV vaccination Case 4"
    or "Client is due for bOPV and IPV vaccination Case 5"
    or "Client is due for bOPV and IPV vaccination Case 6"

/*
@output: Client is due for bOPV and IPV vaccination Guidance
@guidance: Should vaccinate client with first bOPV dose and first IPV dose as client's age is more than 3 months and no poliovirus doses were administered.
Check for contraindications.
@guidance: Should vaccinate client with first IPV dose and second bOPV dose as client's age is more than 14 weeks and the latest bOPV dose was administered more than 4 weeks ago.
Check for contraindications.
@guidance: Should vaccinate client with first bOPV dose and second IPV dose as client's age is more than 14 weeks, bOPV dose was not administered and the first IPV dose was administered more than 4 months ago.
Check for contraindications.
@guidance: Should vaccinate client with first IPV dose and third bOPV dose as client's age is more than 14 weeks, two bOPV doses and no IPV dose were administered and the latest bOPV dose was administered more than 4 weeks ago.
Check for contraindications.
@guidance: Should vaccinate client with second bOPV dose and second IPV dose as one bOPV dose and one IPV dose were administered, the latest bOPV dose was administered more than 4 weeks ago and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.
@guidance: Should vaccinate client with third bOPV dose and second IPV dose as two bOPV doses and one IPV dose were administered, the latest bOPV dose was administered more than 4 weeks ago and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.
*/
define "Client is due for bOPV and IPV vaccination Guidance":
  case
    when "Client is due for bOPV and IPV vaccination Case 1" then 'Should vaccinate client with first bOPV dose and first IPV dose as client\'s age is more than 3 months and no poliovirus doses were administered.
Check for contraindications.'
    when "Client is due for bOPV and IPV vaccination Case 2" then 'Should vaccinate client with first IPV dose and second bOPV dose as client\'s age is more than 14 weeks and the latest bOPV dose was administered more than 4 weeks ago.
Check for contraindications.'
    when "Client is due for bOPV and IPV vaccination Case 3" then 'Should vaccinate client with first bOPV dose and second IPV dose as client\'s age is more than 14 weeks, bOPV dose was not administered and the first IPV dose was administered more than 4 months ago.
Check for contraindications.'
    when "Client is due for bOPV and IPV vaccination Case 4" then 'Should vaccinate client with first IPV dose and third bOPV dose as client\'s age is more than 14 weeks, two bOPV doses and no IPV dose were administered and the latest bOPV dose was administered more than 4 weeks ago.
Check for contraindications.'
    when "Client is due for bOPV and IPV vaccination Case 5" then 'Should vaccinate client with second bOPV dose and second IPV dose as one bOPV dose and one IPV dose were administered, the latest bOPV dose was administered more than 4 weeks ago and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.'
    when "Client is due for bOPV and IPV vaccination Case 6" then 'Should vaccinate client with third bOPV dose and second IPV dose as two bOPV doses and one IPV dose were administered, the latest bOPV dose was administered more than 4 weeks ago and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.'
    else ''
  end

/*
@output: Client is not due for polio vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for polio vaccination Case 1":
  Encounter."One poliovirus primary series dose was administered"
    and Encounter."Client's age is between 6 weeks and 14 weeks"
    and Encounter."The latest bOPV dose was administered less than 4 weeks ago"

/*
@output: Client is not due for polio vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for polio vaccination Case 2":
  Encounter."Two poliovirus primary series doses were administered"
    and Encounter."The two doses administered are bOPV"
    and Encounter."Client's age is between 6 weeks and 14 weeks"
    and Encounter."The latest bOPV dose was administered less than 4 weeks ago"

/*
@output: Client is not due for polio vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for polio vaccination Case 3":
  Encounter."Two poliovirus primary series doses were administered"
    and Encounter."From the two doses administered one is bOPV and one is IPV"
    and Encounter."The latest bOPV dose was administered less than 4 weeks ago"
    and Encounter."The latest IPV dose was administered less than 4 months ago"

/*
@output: Client is not due for polio vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for polio vaccination Case 4":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."The three doses administered are bOPV"
    and Encounter."Client's age is less than 14 weeks"

/*
@output: Client is not due for polio vaccination Case 5
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for polio vaccination Case 5":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."From the three doses administered, one is IPV and two are bOPV"
    and Encounter."The latest bOPV dose was administered less than 4 weeks ago"
    and Encounter."The latest IPV dose was administered less than 4 months ago"

/*
@output: Client is not due for polio vaccination Case 6
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for polio vaccination Case 6":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."From the three doses administered, one is bOPV and two are IPV"
    and Encounter."The latest bOPV dose was administered less than 4 weeks ago"

/*
@output: Client is not due for polio vaccination Case 7
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for polio vaccination Case 7":
  Encounter."Four poliovirus primary series doses were administered"
    and Encounter."From the four doses administered, one is IPV and three are bOPV"
    and Encounter."The latest IPV dose was administered less than 4 months ago"

/*
@output: Client is not due for polio vaccination Case 8
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for polio vaccination Case 8":
  Encounter."Four poliovirus primary series doses were administered"
    and Encounter."From the four doses administered, two are IPV and two are bOPV"
    and Encounter."The latest bOPV dose was administered less than 4 weeks ago"

/*
@output: Client is not due for polio vaccination
@pseudocode: "Immunization recommendation status" = "Not due"
*/
define "Client is not due for polio vaccination":
  "Client is not due for polio vaccination Case 1"
    or "Client is not due for polio vaccination Case 2"
    or "Client is not due for polio vaccination Case 3"
    or "Client is not due for polio vaccination Case 4"
    or "Client is not due for polio vaccination Case 5"
    or "Client is not due for polio vaccination Case 6"
    or "Client is not due for polio vaccination Case 7"
    or "Client is not due for polio vaccination Case 8"

/*
@output: Client is not due for polio vaccination Guidance
@guidance: Should not vaccinate client with poliovirus dose as the latest bOPV dose was administered less than 4 weeks ago.
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.
@guidance: Should not vaccinate client with poliovirus dose as client's age is between 6 and 14 weeks, two bOPV doses were administered and the latest bOPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.
@guidance: Should not vaccinate client with poliovirus dose as the latest bOPV dose was administered less than 4 weeks ago and the latest IPV dose was administered less than 4 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.
@guidance: Should not vaccinate client with poliovirus dose as client's age is less than 14 weeks and three bOPV doses were administered.
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.
@guidance: Should not vaccinate client with poliovirus dose as two bOPV doses and one IPV dose were administered, the latest bOPV dose was administered less than 4 weeks ago and the latest IPV dose was administered less than 4 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.
@guidance: Should not vaccinate client with poliovirus dose as one bOPV dose and two IPV doses were administered and the latest bOPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.
@guidance: Should not vaccinate client with poliovirus dose as three bOPV doses and one IPV dose were administered and the latest IPV dose was administered less than 4 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.
@guidance: Should not vaccinate client with poliovirus dose as two bOPV doses and two IPV doses were administered and the latest bOPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.
*/
define "Client is not due for polio vaccination Guidance":
  case
    when "Client is not due for polio vaccination Case 1" then 'Should not vaccinate client with poliovirus dose as the latest bOPV dose was administered less than 4 weeks ago.
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when "Client is not due for polio vaccination Case 2" then 'Should not vaccinate client with poliovirus dose as client\'s age is between 6 and 14 weeks, two bOPV doses were administered and the latest bOPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when "Client is not due for polio vaccination Case 3" then 'Should not vaccinate client with poliovirus dose as the latest bOPV dose was administered less than 4 weeks ago and the latest IPV dose was administered less than 4 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when "Client is not due for polio vaccination Case 4" then 'Should not vaccinate client with poliovirus dose as client\'s age is less than 14 weeks and three bOPV doses were administered.
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when "Client is not due for polio vaccination Case 5" then 'Should not vaccinate client with poliovirus dose as two bOPV doses and one IPV dose were administered, the latest bOPV dose was administered less than 4 weeks ago and the latest IPV dose was administered less than 4 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when "Client is not due for polio vaccination Case 6" then 'Should not vaccinate client with poliovirus dose as one bOPV dose and two IPV doses were administered and the latest bOPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when "Client is not due for polio vaccination Case 7" then 'Should not vaccinate client with poliovirus dose as three bOPV doses and one IPV dose were administered and the latest IPV dose was administered less than 4 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when "Client is not due for polio vaccination Case 8" then 'Should not vaccinate client with poliovirus dose as two bOPV doses and two IPV doses were administered and the latest bOPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    else ''
  end

/*
@output: Client is due for IPV vaccination Case 1
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for IPV vaccination Case 1":
  Encounter."One poliovirus primary series dose was administered"
    and Encounter."The poliovirus dose administered is bOPV"
    and Encounter."Client's age is more than or equal to 14 weeks"
    and Encounter."The latest bOPV dose was administered less than 4 weeks ago"

/*
@output: Client is due for IPV vaccination Case 2
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for IPV vaccination Case 2":
  Encounter."Two poliovirus primary series doses were administered"
    and Encounter."The two doses administered are bOPV"
    and Encounter."Client's age is more than or equal to 14 weeks"
    and Encounter."The latest bOPV dose was administered less than 4 weeks ago"

/*
@output: Client is due for IPV vaccination Case 3
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for IPV vaccination Case 3":
  Encounter."Two poliovirus primary series doses were administered"
    and Encounter."From the two doses administered one is bOPV and one is IPV"
    and Encounter."The latest bOPV dose was administered less than 4 weeks ago"
    and Encounter."The latest IPV dose was administered more than 4 months ago"

/*
@output: Client is due for IPV vaccination Case 4
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for IPV vaccination Case 4":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."The three doses administered are bOPV"
    and Encounter."Client's age is more than or equal to 14 weeks"

/*
@output: Client is due for IPV vaccination Case 5
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for IPV vaccination Case 5":
  Encounter."Three poliovirus primary series doses were administered"
    and Encounter."From the three doses administered, one is IPV and two are bOPV"
    and Encounter."The latest bOPV dose was administered less than 4 weeks ago"
    and Encounter."The latest IPV dose was administered more than 4 months ago"

/*
@output: Client is due for IPV vaccination Case 6
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for IPV vaccination Case 6":
  Encounter."Four poliovirus primary series doses were administered"
    and Encounter."From the four doses administered, one is IPV and three are bOPV"
    and Encounter."The latest IPV dose was administered more than 4 months ago"

/*
@output: Client is due for IPV vaccination
@pseudocode: "Immunization recommendation status" = "Due" (where "Type of poliovirus dose" = "IPV")
*/
define "Client is due for IPV vaccination":
  "Client is due for IPV vaccination Case 1"
    or "Client is due for IPV vaccination Case 2"
    or "Client is due for IPV vaccination Case 3"
    or "Client is due for IPV vaccination Case 4"
    or "Client is due for IPV vaccination Case 5"
    or "Client is due for IPV vaccination Case 6"

/*
@output: Client is due for IPV vaccination Guidance
@guidance: Should vaccinate client with first IPV dose as client's age is more than 14 weeks and the latest bOPV was administered less than 4 weeks ago.
Check for contraindications.
@guidance: Should vaccinate client with first IPV dose as client's age is more than 14 weeks, IPV dose was not administered and the latest bOPV dose was administered less than 4 weeks ago.
Check for contraindications.
@guidance: Should vaccinate client with second IPV dose as one bOPV dose and one IPV dose were administered, the latest bOPV dose was administered less than 4 weeks ago and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.
@guidance: Should vaccinate client with first IPV dose as client's age is more than 14 weeks, three bOPV doses were administered and IPV dose was not administered. 
Check for contraindications.
@guidance: Should vaccinate client with second IPV dose as two bOPV doses and one IPV dose were administered, the latest bOPV dose was administered less than 4 weeks ago and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.
@guidance: Should vaccinate client with second IPV dose as three bOPV doses and one IPV dose were administered and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.
*/
define "Client is due for IPV vaccination Guidance":
  case
    when "Client is due for IPV vaccination Case 1" then 'Should vaccinate client with first IPV dose as client\'s age is more than 14 weeks and the latest bOPV was administered less than 4 weeks ago.
Check for contraindications.'
    when "Client is due for IPV vaccination Case 2" then 'Should vaccinate client with first IPV dose as client\'s age is more than 14 weeks, IPV dose was not administered and the latest bOPV dose was administered less than 4 weeks ago.
Check for contraindications.'
    when "Client is due for IPV vaccination Case 3" then 'Should vaccinate client with second IPV dose as one bOPV dose and one IPV dose were administered, the latest bOPV dose was administered less than 4 weeks ago and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.'
    when "Client is due for IPV vaccination Case 4" then 'Should vaccinate client with first IPV dose as client\'s age is more than 14 weeks, three bOPV doses were administered and IPV dose was not administered. 
Check for contraindications.'
    when "Client is due for IPV vaccination Case 5" then 'Should vaccinate client with second IPV dose as two bOPV doses and one IPV dose were administered, the latest bOPV dose was administered less than 4 weeks ago and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.'
    when "Client is due for IPV vaccination Case 6" then 'Should vaccinate client with second IPV dose as three bOPV doses and one IPV dose were administered and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.'
    else ''
  end

/*
@output: Polio immunization schedule is complete
@pseudocode: "Immunization recommendation status" = "Complete"
*/
define "Polio immunization schedule is complete":
  Encounter."Five poliovirus primary series doses were administered"

/*
@output: Polio immunization schedule is complete Guidance
@guidance: Polio routine immunization schedule is complete. Five poliovirus primary series doses were administered. 
Check for any vaccines due.
*/
define "Polio immunization schedule is complete Guidance":
  'Polio routine immunization schedule is complete. Five poliovirus primary series doses were administered. 
Check for any vaccines due.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '18.Alt6w' then "Client is not due for bOPV vaccination" and "Guidance" = 'Should not vaccinate client with first bOPV dose as client\'s age is less than 6 weeks. 
Check for any other vaccines due and inform the caregiver of when to come back for the first bOPV dose.'
    when Patient.id = '19.D0Abt6w3m' then "Client is due for bOPV vaccination Case 1" and "Guidance" = 'Should vaccinate client with first bOPV dose as no poliovirus doses were administered and client\'s age is between 6 weeks and 3 months. 
Check for contraindications.'
    when Patient.id = '20.D0Agt3m' then "Client is due for bOPV and IPV vaccination Case 1" and "Guidance" = 'Should vaccinate client with first bOPV dose and first IPV dose as client\'s age is more than 3 months and no poliovirus doses were administered.
Check for contraindications.'
    when Patient.id = '21.D1Abt6w14wBlt4w' then "Client is not due for polio vaccination Case 1" and "Guidance" = 'Should not vaccinate client with poliovirus dose as the latest bOPV dose was administered less than 4 weeks ago.
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when Patient.id = '22.D1Abt6w14wBgt4w' then "Client is due for bOPV vaccination Case 2" and "Guidance" = 'Should vaccinate client with second bOPV dose as the latest bOPV dose was administered more than 4 weeks ago.
Check for contraindications'
    when Patient.id = '23.Db1Agt14wBlt4w' then "Client is due for IPV vaccination Case 1" and "Guidance" = 'Should vaccinate client with first IPV dose as client\'s age is more than 14 weeks and the latest bOPV was administered less than 4 weeks ago.
Check for contraindications.'
    when Patient.id = '24.Db1Agt14wBgt4w' then "Client is due for bOPV and IPV vaccination Case 2" and "Guidance" = 'Should vaccinate client with first IPV dose and second bOPV dose as client\'s age is more than 14 weeks and the latest bOPV dose was administered more than 4 weeks ago.
Check for contraindications.'
    when Patient.id = '25.DI1Agt14wIlt4m' then "Client is due for bOPV vaccination Case 3" and "Guidance" = 'Should vaccinate client with first bOPV dose as client\'s age is more than 14 weeks, bOPV dose was not administered and the first IPV dose was administered less than 4 months ago.
Check for contraindications.'
    when Patient.id = '26.DI1Agt14wIgt4m' then "Client is due for bOPV and IPV vaccination Case 3" and "Guidance" = 'Should vaccinate client with first bOPV dose and second IPV dose as client\'s age is more than 14 weeks, bOPV dose was not administered and the first IPV dose was administered more than 4 months ago.
Check for contraindications.'
    when Patient.id = '27.DB2Abt6w14wBlt4w' then "Client is not due for polio vaccination Case 2" and "Guidance" = 'Should not vaccinate client with poliovirus dose as client\'s age is between 6 and 14 weeks, two bOPV doses were administered and the latest bOPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when Patient.id = '28.DB2Abt6w14wBgt4w' then "Client is due for bOPV vaccination Case 4" and "Guidance" = 'Should vaccinate client with third bOPV dose as client\'s age is between 6 and 14 weeks and the latest bOPV dose was administered more than 4 weeks ago. Check for contraindications.'
    when Patient.id = '29.DB2Agt14wBlt4w' then "Client is due for IPV vaccination Case 2" and "Guidance" = 'Should vaccinate client with first IPV dose as client\'s age is more than 14 weeks, IPV dose was not administered and the latest bOPV dose was administered less than 4 weeks ago.
Check for contraindications.'
    when Patient.id = '30.DB2Agt14wBgt4w' then "Client is due for bOPV and IPV vaccination Case 4" and "Guidance" = 'Should vaccinate client with first IPV dose and third bOPV dose as client\'s age is more than 14 weeks, two bOPV doses and no IPV dose were administered and the latest bOPV dose was administered more than 4 weeks ago.
Check for contraindications.'
    when Patient.id = '31.DB1I1Blt4wIlt4m' then "Client is not due for polio vaccination Case 3" and "Guidance" = 'Should not vaccinate client with poliovirus dose as the latest bOPV dose was administered less than 4 weeks ago and the latest IPV dose was administered less than 4 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when Patient.id = '32.DB1I1Blt4wIgt4m' then "Client is due for IPV vaccination Case 3" and "Guidance" = 'Should vaccinate client with second IPV dose as one bOPV dose and one IPV dose were administered, the latest bOPV dose was administered less than 4 weeks ago and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.'
    when Patient.id = '33.DB1I1Bgt4wIlt4m' then "Client is due for bOPV vaccination Case 5" and "Guidance" = 'Should vaccinate client with second bOPV dose as one bOPV dose and one IPV dose were administered, the latest bOPV dose was administered more than 4 weeks ago and the latest IPV dose was administered less than 4 months ago. 
Check for contraindications.'
    when Patient.id = '34.DB1I1Bgt4wIgt4m' then "Client is due for bOPV and IPV vaccination Case 5" and "Guidance" = 'Should vaccinate client with second bOPV dose and second IPV dose as one bOPV dose and one IPV dose were administered, the latest bOPV dose was administered more than 4 weeks ago and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.'
    when Patient.id = '35.DI2' then "Client is due for bOPV vaccination Case 6" and "Guidance" = 'Should vaccinate client with first bOPV dose as bOPV dose was not administered and two IPV doses were administered. 
Check for contraindications.'
    when Patient.id = '36.DB3Alt14w' then "Client is not due for polio vaccination Case 4" and "Guidance" = 'Should not vaccinate client with poliovirus dose as client\'s age is less than 14 weeks and three bOPV doses were administered.
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when Patient.id = '37.DB3Agt14w' then "Client is due for IPV vaccination Case 4" and "Guidance" = 'Should vaccinate client with first IPV dose as client\'s age is more than 14 weeks, three bOPV doses were administered and IPV dose was not administered. 
Check for contraindications.'
    when Patient.id = '38.DB2I1Blt4wIlt4m' then "Client is not due for polio vaccination Case 5" and "Guidance" = 'Should not vaccinate client with poliovirus dose as two bOPV doses and one IPV dose were administered, the latest bOPV dose was administered less than 4 weeks ago and the latest IPV dose was administered less than 4 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when Patient.id = '39.DB2I1Blt4wIgt4m' then "Client is due for IPV vaccination Case 5" and "Guidance" = 'Should vaccinate client with second IPV dose as two bOPV doses and one IPV dose were administered, the latest bOPV dose was administered less than 4 weeks ago and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.'
    when Patient.id = '40.DB2I1Bgt4wIlt4m' then "Client is due for bOPV vaccination Case 7" and "Guidance" = 'Should vaccinate client with third bOPV dose as two bOPV doses and one IPV dose were administered, the latest bOPV dose was administered more than 4 weeks ago and the latest IPV dose was administered less than 4 months ago. 
Check for contraindications.'
    when Patient.id = '41.DB2I1Bgt4wIgt4m' then "Client is due for bOPV and IPV vaccination Case 6" and "Guidance" = 'Should vaccinate client with third bOPV dose and second IPV dose as two bOPV doses and one IPV dose were administered, the latest bOPV dose was administered more than 4 weeks ago and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.'
    when Patient.id = '42.DB1I2Blt4w' then "Client is not due for polio vaccination Case 6" and "Guidance" = 'Should not vaccinate client with poliovirus dose as one bOPV dose and two IPV doses were administered and the latest bOPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when Patient.id = '43.DB1I2Bgt4w' then "Client is due for bOPV vaccination Case 8" and "Guidance" = 'Should vaccinate client with second bOPV dose as one bOPV dose and two IPV doses were administered and the latest bOPV dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when Patient.id = '44.DB3I1Ilt4m' then "Client is not due for polio vaccination Case 7" and "Guidance" = 'Should not vaccinate client with poliovirus dose as three bOPV doses and one IPV dose were administered and the latest IPV dose was administered less than 4 months ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when Patient.id = '45.DB3I1Igt4m' then "Client is due for IPV vaccination Case 6" and "Guidance" = 'Should vaccinate client with second IPV dose as three bOPV doses and one IPV dose were administered and the latest IPV dose was administered more than 4 months ago. 
Check for contraindications.'
    when Patient.id = '46.DB2I2Blt4w' then "Client is not due for polio vaccination Case 8" and "Guidance" = 'Should not vaccinate client with poliovirus dose as two bOPV doses and two IPV doses were administered and the latest bOPV dose was administered less than 4 weeks ago. 
Check for any other vaccines due and inform the caregiver of when to come back for the next poliovirus dose.'
    when Patient.id = '47.DB2I2Bgt4w' then "Client is due for bOPV vaccination Case 9" and "Guidance" = 'Should vaccinate client with third bOPV dose as two bOPV doses and two IPV doses were administered and the latest bOPV dose was administered more than 4 weeks ago. 
Check for contraindications.'
    when Patient.id = '48.DB3I2' then "Polio immunization schedule is complete" and "Guidance" = 'Polio routine immunization schedule is complete. Five poliovirus primary series doses were administered. 
Check for any vaccines due.'
    else 'No test case set'
  end
