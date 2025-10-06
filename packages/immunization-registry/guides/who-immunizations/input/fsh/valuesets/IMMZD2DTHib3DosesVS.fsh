ValueSet: IMMZD2DTHib3DosesVS
Title: "IMMZD2DTHib3Doses ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTHib3Doses for IMMZ.D2.DT.Hib.3 doses.
Business rule: Determine if the client is due for a Haemophilus influenzae type b (Hib) vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: 3 primary doses without a booster dose (3p)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 6 weeks-40"]], [[Client's age is less than 6 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for Hib vaccination-48"]], [[Client is not due for Hib vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No Hib primary series doses were administered-123"]], [[No Hib primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 6 weeks and 5 years-50"]], [[Client's age is between 6 weeks and 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for Hib vaccination-44"]], [[Client is due for Hib vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One Hib primary series dose was administered-122"]], [[One Hib primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is at least 6 weeks and not more than 5 years-50"]], [[Client's age is at least 6 weeks and not more than 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age was less than 1 year when first Hib dose was administered-129"]], [[Client's age was less than 1 year when first Hib dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest Hib dose was administered less than 4 weeks ago-113"]], [[The latest Hib dose was administered less than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest Hib dose was administered more than 4 weeks ago-113"]], [[The latest Hib dose was administered more than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age was more than 1 year when first Hib dose was administered-129"]], [[Client's age was more than 1 year when first Hib dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Hib immunization schedule is complete-150"]], [[Hib immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two Hib primary series doses were administered-124"]], [[Two Hib primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is between 6 weeks and not more than 5 years-50"]], [[Client's age is between 6 weeks and not more than 5 years]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three Hib primary series doses were administered-122"]], [[Three Hib primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than 5 years-40"]], [[Client's age is more than 5 years]] )