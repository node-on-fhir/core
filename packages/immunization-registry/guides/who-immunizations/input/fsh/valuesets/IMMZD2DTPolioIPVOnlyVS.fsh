ValueSet: IMMZD2DTPolioIPVOnlyVS
Title: "IMMZD2DTPolioIPVOnly ValueSet for Decision Table"
Description: """
ValueSet IMMZD2DTPolioIPVOnly for IMMZ.D2.DT.Polio.IPV-only.
Business rule: Determine if the client is due for a poliovirus vaccination according to the national immunization schedule
Trigger: IMMZ.D2 Determine required vaccination(s) if any
Table: Inactivated polio vaccine (IPV)-only (in countries, in polio-free regions, with a very low risk of importation and sustained high routine immunization coverage (third dose of the diphtheria–tetanus–pertussis vaccine [DTP3] > 90%)
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"No poliovirus primary series doses were administered-130"]], [[No poliovirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is less than 6 weeks-40"]], [[Client's age is less than 6 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is not due for IPV vaccination-48"]], [[Client is not due for IPV vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age is more than or equal to 6 weeks-40"]], [[Client's age is more than or equal to 6 weeks]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client is due for IPV vaccination-44"]], [[Client is due for IPV vaccination]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"One poliovirus primary series dose was administered-130"]], [[One poliovirus primary series dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest poliovirus dose was administered less than 4 weeks ago-120"]], [[The latest poliovirus dose was administered less than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest poliovirus dose was administered more than 4 weeks ago-120"]], [[The latest poliovirus dose was administered more than 4 weeks ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Two poliovirus primary series doses were administered-130"]], [[Two poliovirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Three poliovirus primary series doses were administered-130"]], [[Three poliovirus primary series doses were administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age was more than 6 weeks when the primary series was started-138"]], [[Client's age was more than 6 weeks when the primary series was started]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Polio immunization schedule is complete-157"]], [[Polio immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Client's age was 6 weeks when the primary series was started-138"]], [[Client's age was 6 weeks when the primary series was started]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest poliovirus dose was administered less than 6 months ago-121"]], [[The latest poliovirus dose was administered less than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series is complete. Client is not due for IPV booster dose-156"]], [[Primary series is complete. Client is not due for IPV booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"The latest poliovirus dose was administered more than 6 months ago-121"]], [[The latest poliovirus dose was administered more than 6 months ago]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"No polio booster dose was administered-128"]], [[No polio booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Primary series is complete. Client is due for IPV booster dose-152"]], [[Primary series is complete. Client is due for IPV booster dose]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Polio booster dose was administered-128"]], [[Polio booster dose was administered]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"Polio immunization schedule is complete-49"]], [[Polio immunization schedule is complete]] )