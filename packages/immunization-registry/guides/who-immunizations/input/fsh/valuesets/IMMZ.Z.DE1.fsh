ValueSet: IMMZ.Z.DE1
Title: "IMMZ.Z.DE1 ValueSet for BCG vaccines"
Description: "ValueSet for BCG vaccines for IMMZ.Z.DE1"

* ^status = #active
* ^name = "IMMZ_Z_DE1"
* ^expansion.timestamp = 2025-06-25T16:39:07.092Z

* insert AddWithExpandCanonical( IMMZ.Z, #DE1, [[BCG vaccines]] )
* insert AddWithExpand( $ICD11, #XM4639, [[Tuberculosis vaccines]] )
* insert AddWithExpand( $SCT, #418268006, [[Bacillus Calmette-Guerin antigen-containing product]] )
* insert AddWithExpand( $ATC, #L03AX03, [[BCG vaccine]] )
* insert AddWithExpand( $ICD11, #XM8142, [[Tuberculosis, live attenuated vaccines]] )
* insert AddWithExpand( $SCT, #774702006, [[Bacillus Calmette-Guerin antigen only product]] )
