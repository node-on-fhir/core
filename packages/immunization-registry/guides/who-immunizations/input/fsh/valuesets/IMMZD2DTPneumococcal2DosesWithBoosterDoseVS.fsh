ValueSet: IMMZD2DTPneumococcal2DosesWithBoosterDoseVS
Title: "IMMZD2DTPneumococcal2DosesWithBoosterDose ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTPneumococcal2DosesWithBoosterDose for IMMZ.D2.DT.Pneumococcal.2 doses with booster dose.
Business rule: Determine if the client is due for a pneumococcal vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 2 primary doses with a booster dose (2p+1)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"The client's age is less than 6 weeks-40"]], [[The client's age is less than 6 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for pneumococcal vaccination-48"]], [[Client is not due for pneumococcal vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No pneumococcal primary series doses were administered-121"]], [[No pneumococcal primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client's age is between 6 weeks and 5 years-50"]], [[The client's age is between 6 weeks and 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for pneumococcal vaccination-44"]], [[Client is due for pneumococcal vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One pneumococcal primary series dose was administered-121"]], [[One pneumococcal primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client's age is less than or equal to 5 years-41"]], [[The client's age is less than or equal to 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The first pneumococcal dose was administered within 24 months post birth-109"]], [[The first pneumococcal dose was administered within 24 months post birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest pneumococcal dose was administered less than 8 weeks ago-104"]], [[The latest pneumococcal dose was administered less than 8 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest pneumococcal dose was administered more than 8 weeks ago-104"]], [[The latest pneumococcal dose was administered more than 8 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The first pneumococcal dose was administered after 24 months post birth-109"]], [[The first pneumococcal dose was administered after 24 months post birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is at high risk for pneumococcal infection-48"]], [[Client is at high risk for pneumococcal infection]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not at high risk for pneumococcal infection-49"]], [[Client is not at high risk for pneumococcal infection]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Pneumococcal immunization schedule is complete-148"]], [[Pneumococcal immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two pneumococcal primary series doses were administered-121"]], [[Two pneumococcal primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No pneumococcal booster dose was administered-119"]], [[No pneumococcal booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client's age is less than or equal to 5 years-40"]], [[The client's age is less than or equal to 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The first pneumococcal dose was administered within 12 months post birth-131"]], [[The first pneumococcal dose was administered within 12 months post birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for pneumococcal booster dose-44"]], [[Client is due for pneumococcal booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The first pneumococcal dose was administered after 12 months post birth-131"]], [[The first pneumococcal dose was administered after 12 months post birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One pneumococcal booster dose was administered-119"]], [[One pneumococcal booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client's age is less than 12 months-42"]], [[The client's age is less than 12 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's HIV status is positive-29"]], [[Client's HIV status is positive]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for pneumococcal booster dose-48"]], [[Client is not due for pneumococcal booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client had preterm birth-22"]], [[Client had preterm birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client's age is more than or equal to 12 months and less than 24 months-54"]], [[The client's age is more than or equal to 12 months and less than 24 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest pneumococcal dose was administered within 12 months post birth-116"]], [[The latest pneumococcal dose was administered within 12 months post birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest pneumococcal dose was administered after 12 months post birth-116"]], [[The latest pneumococcal dose was administered after 12 months post birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Pneumococcal immunization schedule is complete-49"]], [[Pneumococcal immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's HIV status is negative or unknown-29"]], [[Client's HIV status is negative or unknown]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client did not have preterm birth-22"]], [[Client did not have preterm birth]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client's age is more than or equal to 24 months-42"]], [[The client's age is more than or equal to 24 months]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two pneumococcal booster doses were administered-119"]], [[Two pneumococcal booster doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The client's age is more than 5 years-40"]], [[The client's age is more than 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Clinical judgement is required. Create a clinical note-66"]], [[Clinical judgement is required. Create a clinical note]] )