ValueSet: IMMZD18SMeaslesSupplementaryDoseVS
Title: "IMMZD18SMeaslesSupplementaryDose ValueSet for Decision Table"
Description: """
ValueSet IMMZD18SMeaslesSupplementaryDose for IMMZ.D18.S.Measles.Supplementary dose schedule.
Business rule: Check for contraindications before administering the vaccine(s) due
Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
Table: Measles supplementary dose schedule
"""

* ^status = #active
* ^expansion.timestamp = 2025-09-29T20:59:26.458Z
    

* insert AddWithExpandCanonical( IMMZDAK, [[#"Routine measles immunization schedule is complete-167"]], [[Routine measles immunization schedule is complete]] )
* insert AddWithExpandCanonical( IMMZDAK, [[#"MCV supplementary dose was administered-131"]], [[MCV supplementary dose was administered]] )