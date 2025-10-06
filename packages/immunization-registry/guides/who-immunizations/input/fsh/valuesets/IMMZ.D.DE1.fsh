ValueSet: IMMZ.D.DE1
Title: "IMMZ.D.DE1 ValueSet for Immunization event status"
Description: "ValueSet for Immunization event status for IMMZ.D.DE1"

* ^status = #active
* ^name = "IMMZ_D_DE1"
* ^expansion.timestamp = 2025-06-25T16:39:07.092Z

* insert AddWithExpandCanonical( IMMZ.D, #DE2, Completed )
* insert AddWithExpandCanonical( IMMZ.D, #DE3, Entered in error )
* insert AddWithExpandCanonical( IMMZ.D, #DE4, Not done )
