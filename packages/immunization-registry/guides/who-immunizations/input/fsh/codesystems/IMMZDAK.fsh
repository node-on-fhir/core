CodeSystem: IMMZDAK
Title:        "IMMZDAK CodeSystem for Decision Tables"
Description:  "CodeSystem for Decision Tables for the Immunization DAK"

* ^experimental = false
* ^caseSensitive = false
* ^status = #active
* ^property[+].code = #table
* ^property[=].description = "Decision Table ID"
* ^property[=].type = #string


* #"At least one booster dose was administered-110" "At least one booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"TBE vaccines\" and \"Type of dose\" = \"Booster dose\") ≥ 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
* #"At least one booster series dose was administered-115" "At least one booster series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Booster dose\") >= 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"At least one cholera primary series dose was administered-117" "At least one cholera primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Primary series\") >= 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Inputs"
* #"BCG immunization schedule is complete-140" "BCG immunization schedule is complete" "'\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"BCG vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Output"
* #"BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.-67" "BCG vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." "'\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.BCG contraindications Output"
* #"BCG vaccination is contraindicated-57" "BCG vaccination is contraindicated" "'\"Immunization recommendation status\" = \"Contraindicated\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.BCG contraindications Output"
* #"Bacille Calmette–Guérin (BCG) vaccination is contraindicated-57" "Bacille Calmette–Guérin (BCG) vaccination is contraindicated" "'\"Immunization recommendation status\" = \"Contraindicated\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.BCG contraindications Output"
* #"Booster IPV dose was administered. Polio immunization schedule has been completed-112" "Booster IPV dose was administered. Polio immunization schedule has been completed" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"IPV\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.IPV-only schedule Completion"
* #"Booster dose was administered approximately less than 2 years ago-175" "Booster dose was administered approximately less than 2 years ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\" AND \"Type of dose\" = \"Booster dose\") ≤ 2 years ± Member States defined interval"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 2-dose schedule Completion"
* #"Booster dose was administered approximately less than 6 months ago-176" "Booster dose was administered approximately less than 6 months ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\" AND \"Type of dose\" = \"Booster dose\") ≤ 6 months ± Member States defined interval"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 3-dose schedule Completion"
* #"Booster series is complete-81" "Booster series is complete" "\"Completed the booster series\" (where \"Vaccine type\" = \"Cholera vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Output"
* #"Child's birth and no cholera doses have been administered-134" "Child's birth and no cholera doses have been administered" "Child's birth AND Count of vaccines administered (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC vaccines schedule Trigger"
* #"Child's birth when client's biological sex is female-34" "Child's birth when client's biological sex is female" "Child's birth AND \"Sex\" = \"Female\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.HPV.2-dose schedule Trigger"
* #"Child's birth-0" "Child's birth" ""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.BCG schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.Birth dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.bOPV plus IPV schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.IPV-only schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses with booster dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.2 doses with booster dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.3 doses schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rotavirus schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Measles.Ongoing transmission schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Measles.Low transmission schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Measles.MCV dose 0 schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rubella.High incidence schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rubella.Low incidence schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Single-dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Typhoid.TCV schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Typhoid.ViPS schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Typhoid.Ty21a schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.JE.Inactivated Vero cell-derived vaccination schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.JE.Live attenuated vaccination schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.JE.Live recombinant vaccination schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Yellow fever schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.FSME-Immun schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.Encepur schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.TBE-Moscow schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.EnceVir schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 1-dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 2-dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Monovalent MenC conjugate vaccine schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 1-dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 2-dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Polysaccharide vaccines schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hepatitis A.Inactivated HAV 2-dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hepatitis A.Inactivated HAV 1-dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hepatitis A.Live attenuated HAV 1-dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Malaria schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Mumps schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Varicella.1-dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Varicella.2-dose schedule Trigger"
* #"Child's birth-761" "Child's birth" "Count of vaccines administered (where \"Vaccine type\" = \"Cholera vaccines\") = 0 AND (Today's date − \"Date of birth\" ≥ 6 years)
OR Primary series interrupted for 6 or more weeks
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Cholera vaccines\") = FALSE AND Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") ≥ 6 weeks AND (Today's date − \"Date of birth\" ≥ 6 years)
OR more than 6 months have passed since completion of primary vaccination series
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Cholera vaccines\") = TRUE AND Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") > 2 years AND (Today's date − \"Date of birth\" ≥ 6 years)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 2-dose schedule Trigger"
* #"Child's birth-792" "Child's birth" "Count of vaccines administered (where \"Vaccine type\" = \"Cholera vaccines\") = 0 AND (2 years ≤ Today's date − \"Date of birth\" ≤ 5 years)
OR Primary series interrupted for 6 or more weeks
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Cholera vaccines\") = FALSE AND Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") ≥ 6 weeks AND (2 years ≤ Today's date − \"Date of birth\" ≤ 5 years)
OR more than 6 months have passed since completion of primary vaccination series
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Cholera vaccines\") = TRUE AND Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") > 6 months AND (2 years ≤ Today's date − \"Date of birth\" ≤ 5 years)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 3-dose schedule Trigger"
* #"Client did not have preterm birth-22" "Client did not have preterm birth" "\"Preterm birth\" ≠ TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"Client had preterm birth-22" "Client had preterm birth" "\"Preterm birth\" = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"Client is at high risk for pneumococcal infection-48" "Client is at high risk for pneumococcal infection" "\"At high risk for pneumococcal infection\" = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"Client is clinically well-24" "Client is clinically well" "\"Clinically well\" = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"Client is currently not receiving antiretroviral therapy-26" "Client is currently not receiving antiretroviral therapy" "\"Currently on ART\" = FALSE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"Client is currently pregnant-27" "Client is currently pregnant" "\"Currently pregnant\" = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses Inputs"
* #"Client is currently receiving antiretroviral therapy-25" "Client is currently receiving antiretroviral therapy" "\"Currently on ART\" = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"Client is due for BCG vaccination-44" "Client is due for BCG vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Output"
* #"Client is due for DTP vaccination-95" "Client is due for DTP vaccination" "\"Immunization recommendation status\" = \"Due\" (where \"Vaccine type\" = \"DTP-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Output"
* #"Client is due for HPV vaccination-44" "Client is due for HPV vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Output"
* #"Client is due for Hepatitis A vaccination-44" "Client is due for Hepatitis A vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 1 dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose Output"
* #"Client is due for Hib vaccination-44" "Client is due for Hib vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Output"
* #"Client is due for IPV vaccination-44" "Client is due for IPV vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Output"
* #"Client is due for IPV vaccination-86" "Client is due for IPV vaccination" "\"Immunization recommendation status\" = \"Due\" (where \"Type of poliovirus dose\" = \"IPV\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Output"
* #"Client is due for JE vaccination-44" "Client is due for JE vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live attenuated vaccine Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live recombinant vaccine Output"
* #"Client is due for MCV1-44" "Client is due for MCV1" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Output"
* #"Client is due for MCV2-44" "Client is due for MCV2" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Output"
* #"Client is due for TBE vaccination-44" "Client is due for TBE vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Output"
* #"Client is due for Typhoid vaccination-44" "Client is due for Typhoid vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.TCV Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.ViPS Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.Ty21a Output"
* #"Client is due for bOPV and IPV vaccination-133" "Client is due for bOPV and IPV vaccination" "\"Immunization recommendation status\" = \"Due\" (where \"Type of poliovirus dose\" = \"bOPV\") AND (where \"Type of poliovirus dose\" = \"IPV\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Output"
* #"Client is due for bOPV vaccination-87" "Client is due for bOPV vaccination" "\"Immunization recommendation status\" = \"Due\" (where \"Type of poliovirus dose\" = \"bOPV\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Output"
* #"Client is due for cholera booster dose-44" "Client is due for cholera booster dose" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Output"
* #"Client is due for cholera vaccination-155" "Client is due for cholera vaccination" "\"Immunization recommendation status\" = \"Due\"
\"Completed the booster series\" (where \"Vaccine type\" = \"Cholera vaccines\") = FALSE when dose 1 is administered"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Output"
* #"Client is due for cholera vaccination-167" "Client is due for cholera vaccination" "\"Immunization recommendation status\" = \"Due\"
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Cholera vaccines\") = FALSE when dose 1 is administered"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Output"
* #"Client is due for cholera vaccination-44" "Client is due for cholera vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Output"
* #"Client is due for dengue vaccination-44" "Client is due for dengue vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening Output"
* #"Client is due for malaria vaccination-44" "Client is due for malaria vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Malaria Output"
* #"Client is due for meningococcal vaccination-44" "Client is due for meningococcal vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 1 dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Output"
* #"Client is due for mumps vaccination-44" "Client is due for mumps vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Mumps Output"
* #"Client is due for pneumococcal booster dose-44" "Client is due for pneumococcal booster dose" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Output"
* #"Client is due for pneumococcal vaccination-44" "Client is due for pneumococcal vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Output"
* #"Client is due for rabies vaccination-44" "Client is due for rabies vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rabies Output"
* #"Client is due for rotavirus vaccination-44" "Client is due for rotavirus vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Output"
* #"Client is due for rubella vaccination-44" "Client is due for rubella vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.High incidence Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.Low incidence Output"
* #"Client is due for tetanus and diphtheria booster dose-114" "Client is due for tetanus and diphtheria booster dose" "\"Immunization recommendation status\" = \"Due\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses Output"
* #"Client is due for the bOPV birth dose-87" "Client is due for the bOPV birth dose" "\"Immunization recommendation status\" = \"Due\" (where \"Type of poliovirus dose\" = \"bOPV\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Birth dose Output"
* #"Client is due for typhoid booster dose-44" "Client is due for typhoid booster dose" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.Ty21a Output"
* #"Client is due for yellow fever vaccination-44" "Client is due for yellow fever vaccination" "\"Immunization recommendation status\" = \"Due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Yellow fever Output"
* #"Client is immunocompromised-26" "Client is immunocompromised" "\"Immunocompromised\" = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
* #"Client is immunologically stable-31" "Client is immunologically stable" "\"Immunologically stable\" = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"Client is not at high risk for pneumococcal infection-49" "Client is not at high risk for pneumococcal infection" "\"At high risk for pneumococcal infection\" = FALSE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"Client is not clinically well-25" "Client is not clinically well" "\"Clinically well\" = FALSE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"Client is not due for BCG vaccination-48" "Client is not due for BCG vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Output"
* #"Client is not due for DTP vaccination-99" "Client is not due for DTP vaccination" "\"Immunization recommendation status\" = \"Not due\" (where \"Vaccine type\" = \"DTP-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Output"
* #"Client is not due for HPV vaccination-48" "Client is not due for HPV vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Output"
* #"Client is not due for Hepatitis A vaccination-48" "Client is not due for Hepatitis A vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 1 dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose Output"
* #"Client is not due for Hib vaccination-48" "Client is not due for Hib vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Output"
* #"Client is not due for IPV vaccination-48" "Client is not due for IPV vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Output"
* #"Client is not due for JE vaccination-48" "Client is not due for JE vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live attenuated vaccine Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live recombinant vaccine Output"
* #"Client is not due for MCV0-48" "Client is not due for MCV0" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.MCV dose 0 Output"
* #"Client is not due for MCV1-48" "Client is not due for MCV1" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Output"
* #"Client is not due for MCV2-48" "Client is not due for MCV2" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Output"
* #"Client is not due for TBE vaccination-48" "Client is not due for TBE vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Output"
* #"Client is not due for Typhoid vaccination-48" "Client is not due for Typhoid vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.TCV Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.ViPS Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.Ty21a Output"
* #"Client is not due for bOPV vaccination-48" "Client is not due for bOPV vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Output"
* #"Client is not due for cholera booster dose-48" "Client is not due for cholera booster dose" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Output"
* #"Client is not due for cholera vaccination-48" "Client is not due for cholera vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Output"
* #"Client is not due for dengue vaccination-48" "Client is not due for dengue vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening Output"
* #"Client is not due for first dose of measles-containing vaccine (MCV1)-48" "Client is not due for first dose of measles-containing vaccine (MCV1)" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Output"
* #"Client is not due for malaria vaccination-48" "Client is not due for malaria vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Malaria Output"
* #"Client is not due for measles supplementary dose-48" "Client is not due for measles supplementary dose" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Output"
* #"Client is not due for meningococcal vaccination-48" "Client is not due for meningococcal vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 1 dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Output"
* #"Client is not due for mumps vaccination-48" "Client is not due for mumps vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Mumps Output"
* #"Client is not due for pertussis booster dose-48" "Client is not due for pertussis booster dose" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Output"
* #"Client is not due for pneumococcal booster dose-48" "Client is not due for pneumococcal booster dose" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Output"
* #"Client is not due for pneumococcal vaccination-48" "Client is not due for pneumococcal vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Output"
* #"Client is not due for polio vaccination-48" "Client is not due for polio vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Output"
* #"Client is not due for rabies vaccination-48" "Client is not due for rabies vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rabies Output"
* #"Client is not due for rotavirus vaccination if immunization schedule is not complete.-109" "Client is not due for rotavirus vaccination if immunization schedule is not complete." "\"Immunization recommendation status\" = \"Not due\" IF current \"Immunization recommendation status\" ≠ \"Complete\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Output"
* #"Client is not due for rotavirus vaccination-48" "Client is not due for rotavirus vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Output"
* #"Client is not due for rubella vaccination-48" "Client is not due for rubella vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.High incidence Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.Low incidence Output"
* #"Client is not due for second dose of measles-containing vaccine (MCV2)-48" "Client is not due for second dose of measles-containing vaccine (MCV2)" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Output"
* #"Client is not due for tetanus and diphtheria booster dose-118" "Client is not due for tetanus and diphtheria booster dose" "\"Immunization recommendation status\" = \"Not due\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses Output"
* #"Client is not due for the bOPV birth dose-48" "Client is not due for the bOPV birth dose" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Birth dose Output"
* #"Client is not due for typhoid booster dose-48" "Client is not due for typhoid booster dose" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.Ty21a Output"
* #"Client is not due for yellow fever vaccination-48" "Client is not due for yellow fever vaccination" "\"Immunization recommendation status\" = \"Not due\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Yellow fever Output"
* #"Client is not immunocompromised-26" "Client is not immunocompromised" "\"Immunocompromised\" ≠ TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
* #"Client is not immunologically stable-32" "Client is not immunologically stable" "\"Immunologically stable\" = FALSE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"Client should follow 'delayed or interrupted series' decision logic-0" "Client should follow 'delayed or interrupted series' decision logic" ""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy Output"
* #"Client should follow 'pregnancy starting with 3 doses' decision logic-0" "Client should follow 'pregnancy starting with 3 doses' decision logic" ""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy Output"
* #"Client should follow 'pregnancy starting with 4 doses' decision logic-0" "Client should follow 'pregnancy starting with 4 doses' decision logic" ""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy Output"
* #"Client's HIV status is negative or unknown-29" "Client's HIV status is negative or unknown" "\"HIV status\" ≠ \"HIV-positive\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
* #"Client's HIV status is positive-29" "Client's HIV status is positive" "\"HIV status\" = \"HIV-positive\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
* #"Client's TB infection test result is negative-39" "Client's TB infection test result is negative" "\"TB infection test result\" = \"Negative\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"Client's TB infection test result is positive-39" "Client's TB infection test result is positive" "\"TB infection test result\" = \"Positive\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"Client's TB infection test result is unknown (test not done or no result yet)-34" "Client's TB infection test result is unknown (test not done or no result yet)" "\"TB infection test result\" IS NULL"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"Client's age is 2–5 years-50" "Client's age is 2–5 years" "2 years ≤ Today's date − \"Date of birth\" ≤ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
* #"Client's age is 6–9 months-52" "Client's age is 6–9 months" "6 months ≤ Today's date − \"Date of birth\" < 9 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Yellow fever contraindications Inputs"
* #"Client's age is at least 6 weeks and not more than 5 years-49" "Client's age is at least 6 weeks and not more than 5 years" "6 weeks ≤ Today's date − \"Date of birth\"≤ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"Client's age is at least 6 weeks and not more than 5 years-50" "Client's age is at least 6 weeks and not more than 5 years" "6 weeks ≤ Today's date − \"Date of birth\" ≤ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"Client's age is between 1 year and 6 years-49" "Client's age is between 1 year and 6 years" "1 year ≤ Today's date − \"Date of birth\" ≤ 6 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"Client's age is between 28 days and 5 years-50" "Client's age is between 28 days and 5 years" "28 days < Today's date − \"Date of birth\" < 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"Client's age is between 6 months and 24 months-52" "Client's age is between 6 months and 24 months" "6 weeks ≤ Today's date – \"Date of birth\" ≤ 24 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"Client's age is between 6 months and 45 years-52" "Client's age is between 6 months and 45 years" "6 months ≤ Today's date − \"Date of birth\" < 45 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.TCV Inputs"
* #"Client's age is between 6 months and 9 months-52" "Client's age is between 6 months and 9 months" "6 months ≤ Today's date − \"Date of birth\" < 9 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.MCV dose 0 Inputs"
* #"Client's age is between 6 weeks and 1 year-49" "Client's age is between 6 weeks and 1 year" "6 weeks ≤ Today's date − \"Date of birth\" < 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
* #"Client's age is between 6 weeks and 14 weeks-51" "Client's age is between 6 weeks and 14 weeks" "6 weeks ≤ Today's date − \"Date of birth\" < 14 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"Client's age is between 6 weeks and 24 months-52" "Client's age is between 6 weeks and 24 months" "6 weeks ≤ Today's date – \"Date of birth\" < 24 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"Client's age is between 6 weeks and 3 months-51" "Client's age is between 6 weeks and 3 months" "6 weeks ≤ Today's date − \"Date of birth\" ≤ 3 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"Client's age is between 6 weeks and 5 years-50" "Client's age is between 6 weeks and 5 years" "6 weeks ≤ Today's date − \"Date of birth\" ≤ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"Client's age is between 6 weeks and not more than 5 years-50" "Client's age is between 6 weeks and not more than 5 years" "6 weeks ≤ Today's date − \"Date of birth\" ≤ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
* #"Client's age is between 9 and 14 years-51" "Client's age is between 9 and 14 years" "9 years ≤ Today's date − \"Date of birth\" ≤ 14 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
* #"Client's age is between 9 and 20 years-51" "Client's age is between 9 and 20 years" "9 years ≤ Today's date − \"Date of birth\" ≤ 20 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
* #"Client's age is between 9 years and 45 years-51" "Client's age is between 9 years and 45 years" "9 years ≤ Today's date − \"Date of birth\" ≤ 45 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening Inputs"
* #"Client's age is less than 1 week-39" "Client's age is less than 1 week" "Today's date − \"Date of birth\" < 1 week"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Birth dose Inputs"
* #"Client's age is less than 1 year-14" "Client's age is less than 1 year" "\"Age\" < 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.BCG contraindications Inputs"
* #"Client's age is less than 1 year-39" "Client's age is less than 1 year" "Today's date − \"Date of birth\" < 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"Client's age is less than 12 months-42" "Client's age is less than 12 months" "Today's date − \"Date of birth\" < 12 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.Low incidence Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 1 dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Mumps Inputs"
* #"Client's age is less than 14 weeks-41" "Client's age is less than 14 weeks" "Today's date − \"Date of birth\" < 14 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"Client's age is less than 15 months-42" "Client's age is less than 15 months" "Today's date − \"Date of birth\" < 15 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Inputs"
* #"Client's age is less than 18 months-42" "Client's age is less than 18 months" "Today's date − \"Date of birth\" < 18 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose Inputs"
* #"Client's age is less than 2 months-41" "Client's age is less than 2 months" "Today's date − \"Date of birth\" < 2 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
* #"Client's age is less than 2 years-40" "Client's age is less than 2 years" "Today's date − \"Date of birth\" < 2 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.ViPS Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 1 dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Inputs"
* #"Client's age is less than 3 months-41" "Client's age is less than 3 months" "Today's date − \"Date of birth\" < 3 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses Inputs"
* #"Client's age is less than 3 years-40" "Client's age is less than 3 years" "Today's date − \"Date of birth\" < 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Inputs"
* #"Client's age is less than 4 years-40" "Client's age is less than 4 years" "Today's date − \"Date of birth\" < 4 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
* #"Client's age is less than 5 months-41" "Client's age is less than 5 months" "Today's date − \"Date of birth\" < 5 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Malaria Inputs"
* #"Client's age is less than 6 months-41" "Client's age is less than 6 months" "Today's date − \"Date of birth\" < 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.MCV dose 0 Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.TCV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Yellow fever contraindications Inputs"
* #"Client's age is less than 6 weeks-40" "Client's age is less than 6 weeks" "Today's date − \"Date of birth\" < 6 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"Client's age is less than 6 weeks-41" "Client's age is less than 6 weeks" "'Today's date – \"Date of birth\" < 6 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"Client's age is less than 6 years-40" "Client's age is less than 6 years" "Today's date − \"Date of birth\" < 6 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.Ty21a Inputs"
* #"Client's age is less than 8 months-41" "Client's age is less than 8 months" "Today's date − \"Date of birth\" < 8 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live attenuated vaccine Inputs"
* #"Client's age is less than 8 weeks-40" "Client's age is less than 8 weeks" "Today's date − \"Date of birth\" < 8 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Inputs"
* #"Client's age is less than 9 months-41" "Client's age is less than 9 months" "Today's date − \"Date of birth\" < 9 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.High incidence Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live recombinant vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Yellow fever Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses Inputs"
* #"Client's age is less than 9 years-40" "Client's age is less than 9 years" "Today's date − \"Date of birth\" < 9 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening Inputs"
* #"Client's age is less than or equal to 28 days-40" "Client's age is less than or equal to 28 days" "Today's date − \"Date of birth\" ≤ 28 days"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"Client's age is more than 1 year-39" "Client's age is more than 1 year" "Today's date − \"Date of birth\" > 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"Client's age is more than 2 years-40" "Client's age is more than 2 years" "Today's date − \"Date of birth\" ≥ 2 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Inputs"
* #"Client's age is more than 20 years-41" "Client's age is more than 20 years" "Today's date − \"Date of birth\" > 20 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
* #"Client's age is more than 24 months-27" "Client's age is more than 24 months" "\"Date of birth\" > 24 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"Client's age is more than 3 months-41" "Client's age is more than 3 months" "Today's date − \"Date of birth\" > 3 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"Client's age is more than 45 years-41" "Client's age is more than 45 years" "Today's date − \"Date of birth\" > 45 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening Inputs"
* #"Client's age is more than 5 years-40" "Client's age is more than 5 years" "Today's date − \"Date of birth\" ≥ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Inputs"
* #"Client's age is more than 6 years-40" "Client's age is more than 6 years" "Today's date − \"Date of birth\" > 6 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"Client's age is more than 9 months-41" "Client's age is more than 9 months" "Today's date − \"Date of birth\" ≥ 9 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose Inputs"
* #"Client's age is more than or equal to 1 week-39" "Client's age is more than or equal to 1 week" "Today's date − \"Date of birth\" ≥ 1 week"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Birth dose Inputs"
* #"Client's age is more than or equal to 1 year-14" "Client's age is more than or equal to 1 year" "\"Age\" ≥ 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.BCG contraindications Inputs"
* #"Client's age is more than or equal to 1 year-39" "Client's age is more than or equal to 1 year" "Today's date − \"Date of birth\" ≥ 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"Client's age is more than or equal to 12 months-42" "Client's age is more than or equal to 12 months" "Today's date − \"Date of birth\" ≥ 12 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.Low incidence Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 1 dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Mumps Inputs"
* #"Client's age is more than or equal to 14 weeks-41" "Client's age is more than or equal to 14 weeks" "Today's date − \"Date of birth\" ≥ 14 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"Client's age is more than or equal to 15 months-42" "Client's age is more than or equal to 15 months" "Today's date − \"Date of birth\" ≥ 15 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Inputs"
* #"Client's age is more than or equal to 18 months-42" "Client's age is more than or equal to 18 months" "Today's date − \"Date of birth\" ≥ 18 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose Inputs"
* #"Client's age is more than or equal to 2 months-41" "Client's age is more than or equal to 2 months" "Today's date − \"Date of birth\" ≥ 2 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
* #"Client's age is more than or equal to 2 years-40" "Client's age is more than or equal to 2 years" "Today's date − \"Date of birth\" ≥ 2 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.ViPS Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 1 dose Inputs"
* #"Client's age is more than or equal to 3 months-41" "Client's age is more than or equal to 3 months" "Today's date − \"Date of birth\" ≥ 3 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses Inputs"
* #"Client's age is more than or equal to 3 years-40" "Client's age is more than or equal to 3 years" "Today's date − \"Date of birth\" ≥ 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Inputs"
* #"Client's age is more than or equal to 4 years-40" "Client's age is more than or equal to 4 years" "Today's date − \"Date of birth\" ≥ 4 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
* #"Client's age is more than or equal to 45 years-41" "Client's age is more than or equal to 45 years" "Today's date − \"Date of birth\" ≥ 45 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.TCV Inputs"
* #"Client's age is more than or equal to 5 months-41" "Client's age is more than or equal to 5 months" "Today's date − \"Date of birth\" ≥ 5 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Malaria Inputs"
* #"Client's age is more than or equal to 6 months-41" "Client's age is more than or equal to 6 months" "Today's date − \"Date of birth\" ≥ 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine Inputs"
* #"Client's age is more than or equal to 6 weeks-40" "Client's age is more than or equal to 6 weeks" "Today's date − \"Date of birth\" ≥ 6 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"Client's age is more than or equal to 6 years-40" "Client's age is more than or equal to 6 years" "Today's date − \"Date of birth\" ≥ 6 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.Ty21a Inputs"
* #"Client's age is more than or equal to 60 years-41" "Client's age is more than or equal to 60 years" "Today's date − \"Date of birth\" ≥ 60 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Yellow fever contraindications Inputs"
* #"Client's age is more than or equal to 8 months-41" "Client's age is more than or equal to 8 months" "Today's date − \"Date of birth\" ≥ 8 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live attenuated vaccine Inputs"
* #"Client's age is more than or equal to 8 weeks-40" "Client's age is more than or equal to 8 weeks" "Today's date − \"Date of birth\" ≥ 8 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Inputs"
* #"Client's age is more than or equal to 9 months-41" "Client's age is more than or equal to 9 months" "Today's date − \"Date of birth\" ≥ 9 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.MCV dose 0 Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.High incidence Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live recombinant vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Yellow fever Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses Inputs"
* #"Client's age is more than or equal to 9 years-40" "Client's age is more than or equal to 9 years" "Today's date − \"Date of birth\" ≥ 9 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
* #"Client's age more than or equal to 15 years-41" "Client's age more than or equal to 15 years" "Today's date − \"Date of birth\" ≥ 15 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
* #"Client's age was 6 weeks when the primary series was started-138" "Client's age was 6 weeks when the primary series was started" "\"Date and time of vaccination\" (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" AND \"Dose number\" = 1) − \"Date of birth\" = 6 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"Client's age was less than 1 year when first Hib dose was administered-129" "Client's age was less than 1 year when first Hib dose was administered" "\"Date and time of vaccination\" (where \"Vaccine type\"= \"Hib-containing vaccines\" and \"Dose number\" = 1) − \"Date of birth\" < 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"Client's age was less than or equal to 11 months when the primary series was started-110" "Client's age was less than or equal to 11 months when the primary series was started" "\"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") - \"Date of birth\" ≤ 11 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
* #"Client's age was less than or equal to 23 months when the primary series was started-110" "Client's age was less than or equal to 23 months when the primary series was started" "\"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") - \"Date of birth\" ≤ 23 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses Inputs"
* #"Client's age was more than 1 year when first Hib dose was administered-129" "Client's age was more than 1 year when first Hib dose was administered" "\"Date and time of vaccination\" (where \"Vaccine type\"= \"Hib-containing vaccines\" and \"Dose number\" = 1) − \"Date of birth\" ≥ 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"Client's age was more than 11 months when the primary series was started-110" "Client's age was more than 11 months when the primary series was started" "\"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") - \"Date of birth\" > 11 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
* #"Client's age was more than 23 months when the primary series was started-110" "Client's age was more than 23 months when the primary series was started" "\"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") - \"Date of birth\" > 23 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses Inputs"
* #"Client's age was more than 6 weeks when the primary series was started-138" "Client's age was more than 6 weeks when the primary series was started" "\"Date and time of vaccination\" (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" AND \"Dose number\" = 1) − \"Date of birth\" > 6 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"Client's biological sex is female-16" "Client's biological sex is female" "\"Sex\" = \"Female\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
* #"Client's biological sex is not female-16" "Client's biological sex is not female" "\"Sex\" ≠ \"Female\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
* #"Client's dengue serostatus is negative-32" "Client's dengue serostatus is negative" "\"Dengue serostatus\" = \"Negative\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Inputs"
* #"Client's dengue serostatus is positive-32" "Client's dengue serostatus is positive" "\"Dengue serostatus\" = \"Positive\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Inputs"
* #"Clinical judgement is required. Create a clinical note-66" "Clinical judgement is required. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rubella contraindications Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.TCV Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.JE contraindications Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Yellow fever contraindications Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.TBE contraindications Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rabies contraindications Output"
* #"Clinical judgement is required. Create a clinical note.-66" "Clinical judgement is required. Create a clinical note." "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Output"
* #"Clinical judgement is required. Create clinical note-66" "Clinical judgement is required. Create clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Varicella contraindications Output"
* #"Clinical judgement is required. Create clinical note-67" "Clinical judgement is required. Create clinical note" "'\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Varicella contraindications Output"
* #"Clinical judgement is required. Create clinical note.-66" "Clinical judgement is required. Create clinical note." "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Output"
* #"Clinical judgement is required. Create clinical note.-67" "Clinical judgement is required. Create clinical note." "'\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Output"
* #"Clinical judgement is required.-89" "Clinical judgement is required." "Create a clinical note
\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Output"
* #"Clinical judgement required. Create a clinical note-66" "Clinical judgement required. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Measles contraindications Output"
* #"Consider MCV0.-90" "Consider MCV0." "Create a clinical note.
\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.MCV dose 0 Output"
* #"Consider measles supplementary dose. Create a clinical note-66" "Consider measles supplementary dose. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Output"
* #"Decision ID-0" "Decision ID" ""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Inputs"
* #"Dengue immunization schedule is complete-143" "Dengue immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Dengue vaccines\")\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening Output"
* #"Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.-66" "Dengue vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Dengue contraindications Output"
* #"Dengue vaccination is contraindicated-56" "Dengue vaccination is contraindicated" "\"Immunization recommendation status\" = \"Contraindicated\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Dengue contraindications Output"
* #"Dose number of the latest dose is one-68" "Dose number of the latest dose is one" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"Dose number of the latest dose is two-68" "Dose number of the latest dose is two" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"Dose number of the latest primary series dose is less than three-106" "Dose number of the latest primary series dose is less than three" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Primary series\") < 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
* #"Dose number of the latest primary series dose is more than or equal to two-107" "Dose number of the latest primary series dose is more than or equal to two" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Primary series\") >= 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Inputs"
* #"Dose number of the latest primary series dose is one-106" "Dose number of the latest primary series dose is one" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Inputs"
* #"Dose number of the latest primary series dose is three-106" "Dose number of the latest primary series dose is three" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
* #"Dose number of the latest primary series dose is two-106" "Dose number of the latest primary series dose is two" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
* #"First DTP dose from the primary series was administered-123" "First DTP dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Delayed or interrupted schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Delayed or interrupted schedule Trigger"
* #"First HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised-140" "First HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\") = 1 AND (\"HIV status\" = \"HIV-positive\" OR \"Immunocompromised\" = TRUE)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Single-dose schedule Trigger"
* #"First HPV dose from the primary series was administered-112" "First HPV dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.HPV.2-dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.HPV.2-dose schedule Trigger"
* #"First HPV dose from the primary series was administered-74" "First HPV dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Single-dose schedule Completion"
* #"First Hib dose from the primary series was administered to the client within 1 year of age. Client's age is less than 5 years-302" "First Hib dose from the primary series was administered to the client within 1 year of age. Client's age is less than 5 years" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 1 AND \"Date and time of vaccination\" (where \"Vaccine type\"= \"Hib-containing vaccines\" and \"Dose number\" = 1) − \"Date of birth\" < 1 year AND Today's date − \"Date of birth\" ≤ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses with booster dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.2 doses with booster dose schedule Trigger"
* #"First Hib dose from the primary series was administered-279" "First Hib dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\"= \"Primary series\") = 1
The primary series has been completed for delayed start
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Hib-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses with booster dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.2 doses with booster dose schedule Completion"
* #"First IPV dose from the primary series was administered-76" "First IPV dose from the primary series was administered" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"IPV\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.bOPV plus IPV schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.bOPV plus IPV schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule Trigger"
* #"First IPV dose from the primary series was administered-92" "First IPV dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.IPV-only schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.IPV-only schedule Trigger"
* #"First TBE dose from the primary series was administered-112" "First TBE dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"TBE vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.FSME-Immun schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.FSME-Immun schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.Encepur schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.Encepur schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.TBE-Moscow schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.TBE-Moscow schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.EnceVir schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.EnceVir schedule Trigger"
* #"First bOPV dose from the primary series was administered-115" "First bOPV dose from the primary series was administered" "Count of vaccines administered (where \"Type of dose\" = \"Primary series\" and \"Type of poliovirus dose\" = \"bOPV\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.bOPV plus IPV schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.bOPV plus IPV schedule Trigger"
* #"First bOPV dose from the primary series was administered-77" "First bOPV dose from the primary series was administered" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"bOPV\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule Trigger"
* #"First cholera booster dose administered-103" "First cholera booster dose administered" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\"and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC vaccines schedule Trigger"
* #"First cholera booster dose was administered-105" "First cholera booster dose was administered" "'Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC vaccines schedule Completion"
* #"First cholera dose administered-105" "First cholera dose administered" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\"and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC vaccines schedule Trigger"
* #"First cholera dose was administered-107" "First cholera dose was administered" "'Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC vaccines schedule Completion"
* #"First cholera dose was administered-115" "First cholera dose was administered" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\") = 1 AND (Today's date − \"Date of birth\" ≥ 6 years)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 2-dose schedule Trigger"
* #"First cholera dose was administered-125" "First cholera dose was administered" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\") = 1 AND (2 years ≤ Today's date − \"Date of birth\" ≤ 5 years)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 3-dose schedule Trigger"
* #"First cholera dose was administered-68" "First cholera dose was administered" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 3-dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 2-dose schedule Completion"
* #"First dengue dose from the primary series was administered-115" "First dengue dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Dengue vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Dengue schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Dengue schedule Trigger"
* #"First hepatitis A dose from the primary series was administered-131" "First hepatitis A dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hepatitis A-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hepatitis A.Inactivated HAV 2-dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hepatitis A.Inactivated HAV 2-dose schedule Trigger"
* #"First hepatitis A dose from the primary series was administered. The primary series has been completed-108" "First hepatitis A dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Hepatitis A-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hepatitis A.Inactivated HAV 1-dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hepatitis A.Live attenuated HAV 1-dose schedule Completion"
* #"First malaria dose from the primary series was administered-116" "First malaria dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Malaria vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Malaria schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Malaria schedule Trigger"
* #"First meningococcal dose from the primary series was administered and client started the series when client's age was less than or equal to 11 months-237" "First meningococcal dose from the primary series was administered and client started the series when client's age was less than or equal to 11 months" "Count of vaccines administered (where \"Vaccine type\" = \"Meningococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 1 and \"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") - \"Date of birth\" ≤ 11 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Monovalent MenC conjugate vaccine schedule Trigger"
* #"First meningococcal dose from the primary series was administered-338" "First meningococcal dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Meningococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 1
The primary series has been completed for clients that started the series when client's age was more than 11 months
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Meningococcal vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Monovalent MenC conjugate vaccine schedule Completion"
* #"First meningococcal dose from the primary series was administered-84" "First meningococcal dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Meningococcal vaccines\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 2-dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 2-dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 2-dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 2-dose schedule Trigger"
* #"First mumps dose from the primary series was administered-125" "First mumps dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Mumps-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Mumps schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Mumps schedule Trigger"
* #"First pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age, within 24 months post birth-280" "First pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age, within 24 months post birth" "Today's date − \"Date of birth\" ≤ 5 years AND Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 1 AND \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") − \"Date of birth\" < 24 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.3 doses schedule Trigger"
* #"First pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age. Pneumococcal dose was not administered within 24 months post birth. Client is at high risk for pneumococcal infection.-333" "First pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age. Pneumococcal dose was not administered within 24 months post birth. Client is at high risk for pneumococcal infection." "Today's date − \"Date of birth\" ≤ 5 years AND Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 1 AND \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") − \"Date of birth\" ≥ 24 months AND \"At high risk for pneumococcal infection\" = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.3 doses schedule Trigger"
* #"First pneumococcal dose from the primary series was administered to the client, who is less than or equal to 5 years of age, either within 24 months of birth or if client is at high risk for pneumococcal infection-333" "First pneumococcal dose from the primary series was administered to the client, who is less than or equal to 5 years of age, either within 24 months of birth or if client is at high risk for pneumococcal infection" "Today's date − \"Date of birth\" ≤ 5 years AND Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 1 AND (\"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") − \"Date of birth\" < 24 months OR \"At high risk for pneumococcal infection\" = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule Trigger"
* #"First pneumococcal dose from the primary series was administered-121" "First pneumococcal dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.3 doses schedule Completion"
* #"First rabies dose from the primary series was administered-115" "First rabies dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rabies vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rabies schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rabies schedule Trigger"
* #"First rotavirus dose from the primary series was administered-118" "First rotavirus dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rotavirus vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rotavirus schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rotavirus schedule Trigger"
* #"First tetanus and diphtheria booster dose was administered-140" "First tetanus and diphtheria booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Delayed or interrupted schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Delayed or interrupted schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Pregnancy starting with 3 doses schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Pregnancy starting with 3 doses schedule Trigger"
* #"First varicella dose from the primary series was administered-128" "First varicella dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Varicella-containing vaccines\" and \"Type of dose\" = \"Primary series\") =1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Varicella.2-dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Varicella.2-dose schedule Trigger"
* #"Five poliovirus primary series doses were administered-130" "Five poliovirus primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 5"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"For a series containing more than two doses, two rotavirus primary series doses of mixed series or a series with unknown vaccine products were administered-324" "For a series containing more than two doses, two rotavirus primary series doses of mixed series or a series with unknown vaccine products were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rotavirus vaccines\"and \"Type of dose\" = \"Primary series\" ) = 2 
AND \"Vaccine brand\" (where \"Vaccine type\" = \"Rotavirus vaccines\" AND \"Dose number\" = 1) ≠ \"Vaccine brand\" (where \"Vaccine type\" = \"Rotavirus vaccines\" AND \"Dose number\" = 2) OR \"Total doses in series\" > 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rotavirus schedule Trigger"
* #"Four malaria primary series doses were administered-116" "Four malaria primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Malaria vaccines\" and \"Type of dose\" = \"Primary series\") = 4"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Malaria Inputs"
* #"Four poliovirus primary series doses were administered-130" "Four poliovirus primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 4"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Inputs"
* #"Fourth malaria dose from the primary series was administered. The primary series has been completed-94" "Fourth malaria dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Malaria vaccines\")\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Malaria schedule Completion"
* #"From the four doses administered, one is IPV and three are bOPV-115" "From the four doses administered, one is IPV and three are bOPV" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"bOPV\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"From the four doses administered, two are IPV and two are bOPV-115" "From the four doses administered, two are IPV and two are bOPV" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"bOPV\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"From the three doses administered, one is IPV and two are bOPV-115" "From the three doses administered, one is IPV and two are bOPV" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"bOPV\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"From the three doses administered, one is bOPV and two are IPV-115" "From the three doses administered, one is bOPV and two are IPV" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"bOPV\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"From the two doses administered one is bOPV and one is IPV-115" "From the two doses administered one is bOPV and one is IPV" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"bOPV\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"HPV immunization schedule is complete-49" "HPV immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Output"
* #"HPV vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66" "HPV vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.HPV contraindications Output"
* #"Hepatitis A immunization schedule is complete-158" "Hepatitis A immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Hepatitis A-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 1 dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose Output"
* #"Hepatitis A vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66" "Hepatitis A vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Hepatitis A contraindications Output"
* #"Hib immunization schedule is complete-150" "Hib immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Hib-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Output"
* #"Hib immunization schedule is complete-49" "Hib immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Output"
* #"Hib vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.-66" "Hib vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Hib contraindications Output"
* #"Human papillomavirus (HPV) vaccination is contraindicated-56" "Human papillomavirus (HPV) vaccination is contraindicated" "\"Immunization recommendation status\" = \"Contraindicated\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.HPV contraindications Output"
* #"IMMZ.D5.DT.Measles contraindications-0" "IMMZ.D5.DT.Measles contraindications" ""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Inputs"
* #"JE immunization schedule is complete-138" "JE immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"JE vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live attenuated vaccine Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live recombinant vaccine Output"
* #"Live attentuated Hepatitis A-containing vaccine is contraindicated-131" "Live attentuated Hepatitis A-containing vaccine is contraindicated" "\"Immunization recommendation status\" = \"Contraindicated\" (where \"Type of hepatitis A dose\" = \"Live attenuated hepatitis A vaccine\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Hepatitis A contraindications Output"
* #"Live vaccine was administered in last 4 weeks-92" "Live vaccine was administered in last 4 weeks" "Today's date - latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE) < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"Live vaccine was administered in the last 4 weeks-92" "Live vaccine was administered in the last 4 weeks" "Today's date - latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE) < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.MCV dose 0 Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.High incidence Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live attenuated vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live recombinant vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose Inputs"
* #"Live vaccine was administered in the last four weeks-92" "Live vaccine was administered in the last four weeks" "Today's date − latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE) < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"Live vaccine was administered in the last the 4 weeks-92" "Live vaccine was administered in the last the 4 weeks" "Today's date − latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE) < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.Low incidence Inputs"
* #"Live vaccine was administered in the past 4 weeks-92" "Live vaccine was administered in the past 4 weeks" "Today's date − latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE) < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Yellow fever Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Mumps Inputs"
* #"Live vaccine, other than typhoid, was administered in the past 4 weeks-132" "Live vaccine, other than typhoid, was administered in the past 4 weeks" "Today's date − latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE AND \"Vaccine type\" ≠ \"Typhoid vaccines\") < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.Ty21a Inputs"
* #"Live vaccines was administered in the last 4 weeks-92" "Live vaccines was administered in the last 4 weeks" "Today's date - latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE) < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"MCV supplementary dose was administered-131" "MCV supplementary dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Measles-containing vaccines\" and \"Type of dose\" = \"Supplementary dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Measles.Supplementary dose schedule Completion"
* #"MCV0 was administered-119" "MCV0 was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Measles-containing vaccines\" and \"Type of dose\" = \"Dose 0\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.MCV dose 0 Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Measles.MCV dose 0 schedule Completion"
* #"MCV0 was not administered-119" "MCV0 was not administered" "Count of vaccines administered (where \"Vaccine type\" = \"Measles-containing vaccines\" and \"Type of dose\" = \"Dose 0\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.MCV dose 0 Inputs"
* #"MCV1 was administered-127" "MCV1 was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Measles-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Measles.Ongoing transmission schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Measles.Ongoing transmission schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Measles.Low transmission schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Measles.Low transmission schedule Trigger"
* #"MCV2 was administered-127" "MCV2 was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Measles-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Inputs"
* #"MCV2 was administered. The primary series has been completed-104" "MCV2 was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Measles-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Measles.Low transmission schedule Completion"
* #"MCV2 was administered. The primary series has been completed.-104" "MCV2 was administered. The primary series has been completed." "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Measles-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Measles.Ongoing transmission schedule Completion"
* #"Malaria immunization schedule is complete-144" "Malaria immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Malaria vaccines\")\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Malaria Output"
* #"Malaria vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66" "Malaria vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Malaria contraindications Output"
* #"Measles immunization schedule is complete-49" "Measles immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Output"
* #"Measles primary series is complete-104" "Measles primary series is complete" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Measles-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Output"
* #"Measles routine immunization schedule is complete-104" "Measles routine immunization schedule is complete" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Measles-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Inputs"
* #"Measles supplementary dose was administered-131" "Measles supplementary dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Measles-containing vaccines\" and \"Type of dose\" = \"Supplementary dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Inputs"
* #"Measles supplementary dose was not administered-131" "Measles supplementary dose was not administered" "Count of vaccines administered (where \"Vaccine type\" = \"Measles-containing vaccines\" and \"Type of dose\" = \"Supplementary dose\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Inputs"
* #"Measles vaccination contraindicated-56" "Measles vaccination contraindicated" "\"Immunization recommendation status\" = \"Contraindicated\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Measles contraindications Output"
* #"Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note-66" "Measles vaccination could be contraindicated. Clinical judgement required. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Measles contraindications Output"
* #"Meningococcal booster dose was administered for the client that started the series when client's age was less than or equal to 11 months. Immunization schedule has been completed-120" "Meningococcal booster dose was administered for the client that started the series when client's age was less than or equal to 11 months. Immunization schedule has been completed" "Count of vaccines administered (where \"Vaccine type\" = \"Meningococcal vaccines\" AND \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Monovalent MenC conjugate vaccine schedule Completion"
* #"Meningococcal booster dose was administered-120" "Meningococcal booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Meningococcal vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Inputs"
* #"Meningococcal booster dose was administered. The immunization schedule has been completed-120" "Meningococcal booster dose was administered. The immunization schedule has been completed" "Count of vaccines administered (where \"Vaccine type\" = \"Meningococcal vaccines\" AND \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Polysaccharide vaccines schedule Completion"
* #"Meningococcal immunization schedule is complete-149" "Meningococcal immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Meningococcal vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 1 dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses Output"
* #"Meningococcal immunization schedule is complete-49" "Meningococcal immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Output"
* #"Meningococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-130" "Meningococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" "\"Immunization recommendation status\" (where \"Type of meningococcal dose\" = \"Polysaccharide vaccine\") = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Meningococcal contraindications Output"
* #"Mumps immunization schedule is complete-153" "Mumps immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Mumps-containing vaccines\")\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Mumps Output"
* #"Mumps vaccination could be contraindicated. Clinical judgement is required.-88" "Mumps vaccination could be contraindicated. Clinical judgement is required." "Create a clinical note.
Immunization recommendation status = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Mumps contraindications Output"
* #"Mumps vaccination is contraindicated-56" "Mumps vaccination is contraindicated" "\"Immunization recommendation status\" = \"Contraindicated\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Mumps contraindications Output"
* #"No BCG primary series dose was administered-112" "No BCG primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"BCG vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"No DTP doses were administered and client's age is more than 1 year-129" "No DTP doses were administered and client's age is more than 1 year" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\") = 0 AND Today's date − \"Date of birth\" > 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Delayed or interrupted schedule Trigger"
* #"No DTP primary series doses were administered-123" "No DTP primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
* #"No DTP primary series doses were administered-124" "No DTP primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\") and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy Inputs"
* #"No HPV primary series doses were administered-112" "No HPV primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
* #"No Hib booster doses were administered-120" "No Hib booster doses were administered" "Count of vaccines administered where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"No Hib booster doses were administered-121" "No Hib booster doses were administered" "Count of vaccines administered where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\"\" = \"Booster dose\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
* #"No Hib primary series doses were administered-123" "No Hib primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"No Hib primary series doses were administered-124" "No Hib primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\" = \"Primary series\" ) = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
* #"No JE primary series doses were administered-111" "No JE primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"JE vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live attenuated vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live recombinant vaccine Inputs"
* #"No TBE booster dose was administered-110" "No TBE booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"TBE vaccines\" and \"Type of dose\" = \"Booster dose\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
* #"No TBE primary series doses were administered-112" "No TBE primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"TBE vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Inputs"
* #"No cholera booster series dose was administered-114" "No cholera booster series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Booster dose\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"No cholera primary series dose was administered-116" "No cholera primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Inputs"
* #"No dengue doses from primary series were administered-115" "No dengue doses from primary series were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Dengue vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Dengue schedule Trigger"
* #"No dengue primary series doses were administered-115" "No dengue primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Dengue vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening Inputs"
* #"No hepatitis A primary series dose was administered-131" "No hepatitis A primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hepatitis A-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 1 dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose Inputs"
* #"No hepatitis A primary series doses were administered-131" "No hepatitis A primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hepatitis A-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses Inputs"
* #"No live vaccine was administered in last 4 weeks-92" "No live vaccine was administered in last 4 weeks" "Today's date - latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE) ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"No live vaccine was administered in the last 4 weeks-101" "No live vaccine was administered in the last 4 weeks" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"JE vaccines\") ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live attenuated vaccine Inputs"
* #"No live vaccine was administered in the last 4 weeks-92" "No live vaccine was administered in the last 4 weeks" "Today's date - latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE) ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.MCV dose 0 Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.High incidence Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.Low incidence Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live recombinant vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose Inputs"
* #"No live vaccine was administered in the last four weeks-92" "No live vaccine was administered in the last four weeks" "Today's date − latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE) ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"No live vaccine was administered in the past 4 weeks-92" "No live vaccine was administered in the past 4 weeks" "Today's date − latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE) ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Yellow fever Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Mumps Inputs"
* #"No live vaccine was administered-90" "No live vaccine was administered" "Today's date − latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE) IS NULL"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"No live vaccine, other than typhoid, was administered in the past 4 weeks-132" "No live vaccine, other than typhoid, was administered in the past 4 weeks" "Today's date − latest \"Date and time of vaccination\" (where \"Live vaccine\" = TRUE AND \"Vaccine type\" ≠ \"Typhoid vaccines\") ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.Ty21a Inputs"
* #"No malaria primary series doses were administered-116" "No malaria primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Malaria vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Malaria Inputs"
* #"No measles primary series doses were administered-127" "No measles primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Measles-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Ongoing transmission Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Low transmission Inputs"
* #"No meningococcal booster dose was administered-120" "No meningococcal booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Meningococcal vaccines\" and \"Type of dose\" = \"Booster dose\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Inputs"
* #"No meningococcal primary series dose was administered-122" "No meningococcal primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Meningococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 1 dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Inputs"
* #"No mumps primary series doses were administered-125" "No mumps primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Mumps-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Mumps Inputs"
* #"No pertussis booster doses were administered-126" "No pertussis booster doses were administered" "Count of vaccines administered where \"Vaccine type\" = \"Pertussis-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"No pertussis booster doses were administered-127" "No pertussis booster doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pertussis-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
* #"No pneumococcal booster dose was administered-119" "No pneumococcal booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Booster dose\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"No pneumococcal primary series doses were administered-121" "No pneumococcal primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"No polio booster dose was administered-128" "No polio booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"No poliovirus primary series doses were administered-130" "No poliovirus primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"No rabies primary series doses were administered-115" "No rabies primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rabies vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rabies Inputs"
* #"No rotavirus primary series doses were administered-118" "No rotavirus primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rotavirus vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"No rubella primary series dose was administered-127" "No rubella primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rubella-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.High incidence Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.Low incidence Inputs"
* #"No tetanus and diphtheria booster dose was administered-140" "No tetanus and diphtheria booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy Inputs"
* #"No tetanus and diphtheria booster doses were administered-140" "No tetanus and diphtheria booster doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Inputs"
* #"No tetanus and diphtheria booster doses were administered-141" "No tetanus and diphtheria booster doses were administered" "Count of vaccines administered where (\"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\" ) = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"No typhoid primary series doses were administered-116" "No typhoid primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Typhoid vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.TCV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.ViPS Inputs"
* #"No yellow fever primary series doses were administered-121" "No yellow fever primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Yellow fever vaccines\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Yellow fever Inputs"
* #"One BCG dose from the primary series was administered. The primary series has been completed-89" "One BCG dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"BCG vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.BCG schedule Completion"
* #"One BCG primary series dose was administered-112" "One BCG primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"BCG vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.BCG Inputs"
* #"One DTP primary series dose was administered-123" "One DTP primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
* #"One DTP primary series dose was administered-124" "One DTP primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\") and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"One HPV primary series dose was administered-112" "One HPV primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
* #"One Hib booster dose was administered-120" "One Hib booster dose was administered" "Count of vaccines administered where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"One Hib booster dose was administered. Hib immunization schedule has been completed-120" "One Hib booster dose was administered. Hib immunization schedule has been completed" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\"= \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses with booster dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.2 doses with booster dose schedule Completion"
* #"One Hib primary series dose was administered-122" "One Hib primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\"= \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
* #"One Hib primary series doses was administered-122" "One Hib primary series doses was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\"= \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"One JE dose from primary series was administered. The primary series has been completed-88" "One JE dose from primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"JE vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.JE.Live attenuated vaccination schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.JE.Live recombinant vaccination schedule Completion"
* #"One JE primary series dose was administered-111" "One JE primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"JE vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.JE.Inactivated Vero cell-derived vaccination schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.JE.Inactivated Vero cell-derived vaccination schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live attenuated vaccine Inputs"
* #"One JE primary series doses were administered-111" "One JE primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"JE vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Live recombinant vaccine Inputs"
* #"One TBE primary series dose was administered-112" "One TBE primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"TBE vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Inputs"
* #"One cholera primary series dose was administered-116" "One cholera primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"One dengue primary series dose was administered-115" "One dengue primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Dengue vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening Inputs"
* #"One hepatitis A primary series dose was administered-131" "One hepatitis A primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hepatitis A-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 1 dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose Inputs"
* #"One malaria primary series dose was administered-116" "One malaria primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Malaria vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Malaria Inputs"
* #"One meningococcal dose from primary series was administered. The primary series has been completed-99" "One meningococcal dose from primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Meningococcal vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 1-dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Polysaccharide vaccines schedule Completion"
* #"One meningococcal dose from the primary series was administered. The primary series has been completed-99" "One meningococcal dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Meningococcal vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 1-dose schedule Completion"
* #"One meningococcal primary series dose was administered-122" "One meningococcal primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Meningococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 1 dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Inputs"
* #"One mumps primary series dose was administered-125" "One mumps primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Mumps-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Mumps Inputs"
* #"One pertussis booster dose was administered-126" "One pertussis booster dose was administered" "Count of vaccines administered where \"Vaccine type\" = \"Pertussis-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"One pertussis booster dose was administered-127" "One pertussis booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pertussis-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
* #"One pneumococcal booster dose was administered-119" "One pneumococcal booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"One pneumococcal booster dose was administered.-119" "One pneumococcal booster dose was administered." "Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.3 doses schedule Completion"
* #"One pneumococcal primary series dose was administered-121" "One pneumococcal primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"One poliovirus primary series dose was administered-130" "One poliovirus primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"One rabies primary series doses were administered-115" "One rabies primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rabies vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rabies Inputs"
* #"One rotavirus primary series dose was administered-118" "One rotavirus primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rotavirus vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"One rubella dose from the primary series was administered. The primary series has been completed-104" "One rubella dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Rubella–containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rubella.High incidence schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rubella.Low incidence schedule Completion"
* #"One rubella primary series dose was administered-127" "One rubella primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rubella-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.High incidence Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.Low incidence Inputs"
* #"One tetanus and diphtheria booster dose was administered-140" "One tetanus and diphtheria booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy Inputs"
* #"One tetanus and diphtheria booster dose was administered-141" "One tetanus and diphtheria booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\" ) = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses Inputs"
* #"One tetanus and diphtheria booster doses were administered-140" "One tetanus and diphtheria booster doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Inputs"
* #"One typhoid dose from primary series was administered. The primary series has been completed-93" "One typhoid dose from primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Typhoid vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Typhoid.TCV schedule Completion"
* #"One typhoid dose from the primary series was administered. The primary series has been completed-93" "One typhoid dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Typhoid vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Typhoid.ViPS schedule Completion"
* #"One typhoid primary series dose was administered-116" "One typhoid primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Typhoid vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.TCV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.ViPS Inputs"
* #"One varicella dose from primary series was administered. The primary series has been completed-106" "One varicella dose from primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Varicella-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Varicella.1-dose schedule Completion"
* #"One yellow fever dose from primary series was administered. The primary series has been completed-98" "One yellow fever dose from primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Yellow fever vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Yellow fever schedule Completion"
* #"One yellow fever primary series dose was administered-121" "One yellow fever primary series dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Yellow fever vaccines\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Yellow fever Inputs"
* #"Pertussis immunization schedule is complete-106" "Pertussis immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\" (where \"Vaccine type\" = \"Pertussis-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Output"
* #"Pertussis-containing booster dose was administered. Pertussis immunization schedule has been completed-234" "Pertussis-containing booster dose was administered. Pertussis immunization schedule has been completed" "Count of vaccines administered (where \"Vaccine type\" = \"Pertussis-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 1
\"Immunization recommendation status\" = \"Complete\" (where \"Vaccine type\" = \"Pertussis-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Delayed or interrupted schedule Completion"
* #"Pneumococcal booster dose was administered-119" "Pneumococcal booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule Completion"
* #"Pneumococcal immunization schedule is complete-148" "Pneumococcal immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Pneumococcal vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Output"
* #"Pneumococcal immunization schedule is complete-49" "Pneumococcal immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Output"
* #"Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66" "Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Pneumococcal contraindications Output"
* #"Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.-66" "Pneumococcal vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Pneumococcal contraindications Output"
* #"Polio birth dose (a zero dose) was administered-146" "Polio birth dose (a zero dose) was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of dose\" = \"Dose 0\" AND \"Birth dose\" = TRUE) = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.Birth dose schedule Completion"
* #"Polio booster dose was administered-128" "Polio booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"Polio immunization schedule is complete-157" "Polio immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Poliovirus-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Output"
* #"Polio immunization schedule is complete-49" "Polio immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Output"
* #"Poliovirus vaccination could be contraindicated. Clinical judgement required-66" "Poliovirus vaccination could be contraindicated. Clinical judgement required" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Polio contraindications Output"
* #"Poliovirus vaccination with bOPV is contraindicated-281" "Poliovirus vaccination with bOPV is contraindicated" "Clinical judgement is required if vaccination with IPV is considered
\"Immunization recommendation status\" = \"Contraindicated\" (where \"Type of poliovirus dose\" = \"bOPV\") AND \"Immunization recommendation status\" = \"Further evaluation needed\" (where \"Type of poliovirus dose\" = \"IPV\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Polio contraindications Output"
* #"Primary DTP series is complete. Client is due for pertussis booster dose-202" "Primary DTP series is complete. Client is due for pertussis booster dose" "\"Immunization recommendation status\" = \"Due\" (where \"Vaccine type\" = \"Pertussis-containing vaccines\")
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"DTP-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Output"
* #"Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose-215" "Primary DTP series is complete. Client is due for tetanus and diphtheria booster dose" "\"Immunization recommendation status\" = \"Due\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\")
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"DTP-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Output"
* #"Primary DTP series is complete. Client is not due for pertussis booster dose-206" "Primary DTP series is complete. Client is not due for pertussis booster dose" "\"Immunization recommendation status\" = \"Not due\" (where \"Vaccine type\" = \"Pertussis-containing vaccines\")
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"DTP-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Output"
* #"Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose-218" "Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose" "\"Immunization recommendation status\" = \"Not due\" (where \"Vaccine type\" =\"Tetanus and diphtheria-containing vaccines\")
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"DTP-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Output"
* #"Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose-219" "Primary DTP series is complete. Client is not due for tetanus and diphtheria booster dose" "\"Immunization recommendation status\" = \"Not due\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\")
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"DTP-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Output"
* #"Primary series for cholera has been completed and latest cholera dose was administered approximately less than 2 years ago-284" "Primary series for cholera has been completed and latest cholera dose was administered approximately less than 2 years ago" "\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Cholera vaccines\") = TRUE AND Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") ≤ 2 years ± Member States defined interval AND (Today's date − \"Date of birth\" ≥ 6 years)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 2-dose schedule Trigger"
* #"Primary series for cholera has been completed and latest cholera dose was administered approximately less than 6 months ago-295" "Primary series for cholera has been completed and latest cholera dose was administered approximately less than 6 months ago" "\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Cholera vaccines\") = TRUE AND Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") ≤ 6 months ± Member States defined interval AND (2 years ≤ Today's date − \"Date of birth\" ≤ 5 years)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 3-dose schedule Trigger"
* #"Primary series for cholera has been completed and latest cholera dose was administered more than 3 years ago-204" "Primary series for cholera has been completed and latest cholera dose was administered more than 3 years ago" "\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Cholera vaccines\") = TRUE AND Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") ≥ 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC vaccines schedule Trigger"
* #"Primary series has been completed-99" "Primary series has been completed" "\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Meningococcal vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Polysaccharide vaccines schedule Trigger"
* #"Primary series is complete-174" "Primary series is complete" "\"Immunization recommendation status\" = \"Further evaluation needed\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Poliovirus-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Output"
* #"Primary series is complete-93" "Primary series is complete" "\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Typhoid vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.Ty21a Inputs"
* #"Primary series is complete. Client is due for Hib booster dose-145" "Primary series is complete. Client is due for Hib booster dose" "\"Immunization recommendation status\" = \"Due\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Hib-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Output"
* #"Primary series is complete. Client is due for IPV booster dose-152" "Primary series is complete. Client is due for IPV booster dose" "\"Immunization recommendation status\" = \"Due\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Poliovirus-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Output"
* #"Primary series is complete. Client is due for TBE booster dose-134" "Primary series is complete. Client is due for TBE booster dose" "\"Immunization recommendation status\" = \"Due\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"TBE vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Output"
* #"Primary series is complete. Client is due for cholera booster dose-126" "Primary series is complete. Client is due for cholera booster dose" "\"Immunization recommendation status\" = \"Due\"
\"Completed the booster series\" (where \"Vaccine type\" = \"Cholera vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Output"
* #"Primary series is complete. Client is due for cholera booster dose-138" "Primary series is complete. Client is due for cholera booster dose" "\"Immunization recommendation status\" = \"Due\"
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Cholera vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Output"
* #"Primary series is complete. Client is due for typhoid booster dose-138" "Primary series is complete. Client is due for typhoid booster dose" "\"Immunization recommendation status\" = \"Due\"
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Typhoid vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.ViPS Output"
* #"Primary series is complete. Client is not due for Hib booster dose-149" "Primary series is complete. Client is not due for Hib booster dose" "\"Immunization recommendation status\" = \"Not due\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Hib-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Output"
* #"Primary series is complete. Client is not due for IPV booster dose-156" "Primary series is complete. Client is not due for IPV booster dose" "\"Immunization recommendation status\" = \"Not due\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Poliovirus-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Output"
* #"Primary series is complete. Client is not due for TBE booster dose-138" "Primary series is complete. Client is not due for TBE booster dose" "\"Immunization recommendation status\" = \"Not due\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"TBE vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Output"
* #"Primary series is complete. Client is not due for cholera booster dose-130" "Primary series is complete. Client is not due for cholera booster dose" "\"Immunization recommendation status\" = \"Not due\"
\"Completed the booster series\" (where \"Vaccine type\" = \"Cholera vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Output"
* #"Primary series is complete. Client is not due for cholera booster dose-142" "Primary series is complete. Client is not due for cholera booster dose" "\"Immunization recommendation status\" = \"Not due\"
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Cholera vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Output"
* #"Primary series is complete. Client is not due for typhoid booster dose-142" "Primary series is complete. Client is not due for typhoid booster dose" "\"Immunization recommendation status\" = \"Not due\"
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Typhoid vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.ViPS Output"
* #"Primary series is not complete-93" "Primary series is not complete" "\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Typhoid vaccines\") ≠ TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.Ty21a Inputs"
* #"Rabies immunization schedule is complete-142" "Rabies immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Rabies vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rabies Output"
* #"Revaccination with booster series has been completed in the last 3 years-191" "Revaccination with booster series has been completed in the last 3 years" "\"Completed the booster series\" (where \"Vaccine type\" = \"Cholera vaccines\") = TRUE AND Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccine\") < 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC vaccines schedule Completion"
* #"Rotavirus immunization schedule is complete-49" "Rotavirus immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Output"
* #"Rotavirus immunization schedule is complete-50" "Rotavirus immunization schedule is complete" "'\"Immunization recommendation status\" = \"Complete\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Output"
* #"Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66" "Rotavirus vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Output"
* #"Rotavirus vaccination is contraindicated-56" "Rotavirus vaccination is contraindicated" "\"Immunization recommendation status\" = \"Contraindicated\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Output"
* #"Routine measles immunization schedule is complete-167" "Routine measles immunization schedule is complete" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Measles-containing vaccines\") AND Member States defined logic for supplementary dose applied"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Measles.Supplementary dose schedule Trigger"
* #"Rubella immunization schedule is complete-154" "Rubella immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Rubella-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.High incidence Output"
* #"Rubella immunization schedule is complete-155" "Rubella immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"

\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Rubella-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rubella.Low incidence Output"
* #"Rubella vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66" "Rubella vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rubella contraindications Output"
* #"Rubella vaccination is contraindicated-56" "Rubella vaccination is contraindicated" "\"Immunization recommendation status\" = \"Contraindicated\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rubella contraindications Output"
* #"Second DTP dose from the primary series was administered-123" "Second DTP dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Delayed or interrupted schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Delayed or interrupted schedule Trigger"
* #"Second DTP dose from the primary series was administered-124" "Second DTP dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\" and \"Type of dose\" = \"Primary series\" ) = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Trigger"
* #"Second HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised-140" "Second HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\") = 2 AND (\"HIV status\" = \"HIV-positive\" OR \"Immunocompromised\" = TRUE)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Single-dose schedule Trigger"
* #"Second HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised-178" "Second HPV dose from the primary series was administered and client's HIV status is positive or client is immunocompromised" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\" and \"Type of dose\" = \"Primary series\") = 2 AND (\"HIV status\" = \"HIV-positive\" OR \"Immunocompromised\" = TRUE)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.HPV.2-dose schedule Trigger"
* #"Second HPV dose from the primary series was administered-112" "Second HPV dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.HPV.2-dose schedule Completion"
* #"Second HPV dose from the primary series was administered-74" "Second HPV dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Single-dose schedule Completion"
* #"Second Hib dose from the primary series was administered-122" "Second Hib dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\"= \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses with booster dose schedule Completion"
* #"Second Hib dose from the primary series was administered. Client's age is less than 5 years-167" "Second Hib dose from the primary series was administered. Client's age is less than 5 years" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\"= \"Primary series\") = 2 AND Today's date − \"Date of birth\" ≤ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses with booster dose schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.2 doses with booster dose schedule Trigger"
* #"Second Hib dose from the primary series was administered. The primary series has been completed-99" "Second Hib dose from the primary series was administered. The primary series has been completed" "Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Hib-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.2 doses with booster dose schedule Completion"
* #"Second IPV dose from the primary series was administered-76" "Second IPV dose from the primary series was administered" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"IPV\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.bOPV plus IPV schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule Trigger"
* #"Second IPV dose from the primary series was administered-92" "Second IPV dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.IPV-only schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.IPV-only schedule Trigger"
* #"Second JE dose from the primary series was administered. The primary series has been completed-88" "Second JE dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"JE vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.JE.Inactivated Vero cell-derived vaccination schedule Completion"
* #"Second TBE dose from the primary series was administered-112" "Second TBE dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"TBE vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.FSME-Immun schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.FSME-Immun schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.Encepur schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.Encepur schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.TBE-Moscow schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.TBE-Moscow schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.EnceVir schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.EnceVir schedule Trigger"
* #"Second bOPV dose from the primary series was administered-115" "Second bOPV dose from the primary series was administered" "Count of vaccines administered (where \"Type of dose\" = \"Primary series\" and \"Type of poliovirus dose\" = \"bOPV\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.bOPV plus IPV schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.bOPV plus IPV schedule Trigger"
* #"Second bOPV dose from the primary series was administered. The primary series has been completed-107" "Second bOPV dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Poliovirus-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule Completion"
* #"Second cholera dose was administered-125" "Second cholera dose was administered" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\") = 2 AND (2 years ≤ Today's date − \"Date of birth\" ≤ 5 years)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 3-dose schedule Trigger"
* #"Second cholera dose was administered-68" "Second cholera dose was administered" "Latest \"Dose number\" (where \"Vaccine type\" = \"Cholera vaccines\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 3-dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 2-dose schedule Completion"
* #"Second dengue dose from the primary series was administered-115" "Second dengue dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Dengue vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Dengue schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Dengue schedule Trigger"
* #"Second hepatitis A dose from the primary series was administered. The primary series has been completed-108" "Second hepatitis A dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Hepatitis A-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hepatitis A.Inactivated HAV 2-dose schedule Completion"
* #"Second malaria dose from the primary series was administered-116" "Second malaria dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Malaria vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Malaria schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Malaria schedule Trigger"
* #"Second meningococcal dose from the primary series was administered. The primary series has been completed for clients that started the series when client's age was less than or equal to 11 months-99" "Second meningococcal dose from the primary series was administered. The primary series has been completed for clients that started the series when client's age was less than or equal to 11 months" "\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Meningococcal vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Monovalent MenC conjugate vaccine schedule Completion"
* #"Second meningococcal dose from the primary series was administered. The primary series has been completed-99" "Second meningococcal dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Meningococcal vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 2-dose schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 2-dose schedule Completion"
* #"Second mumps dose from the primary series was administered. The primary series has been completed-103" "Second mumps dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Mumps-containing vaccines\")\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Mumps schedule Completion"
* #"Second pneumococcal booster dose was administered-119" "Second pneumococcal booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Booster dose\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule Completion"
* #"Second pneumococcal dose from the primary series was administered and first pneumococcal dose was administered within 12 months post birth-276" "Second pneumococcal dose from the primary series was administered and first pneumococcal dose was administered within 12 months post birth" "Child's birth AND Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 2 AND (\"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\" AND \"Dose number\" = 1) − \"Date of birth\" < 12 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule Trigger"
* #"Second pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age. First pneumococcal dose was administered within 12 months post birth.-302" "Second pneumococcal dose from the primary series was administered to client, who is less than or equal to 5 years of age. First pneumococcal dose was administered within 12 months post birth." "Today's date − \"Date of birth\" ≤ 5 years AND Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 2 AND \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\" AND \"Dose number\" = 1) − \"Date of birth\" < 12 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.3 doses schedule Trigger"
* #"Second pneumococcal dose from the primary series was administered-121" "Second pneumococcal dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.3 doses schedule Completion"
* #"Second pneumococcal dose from the primary series was administered. The primary series has been completed.-99" "Second pneumococcal dose from the primary series was administered. The primary series has been completed." "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Pneumococcal vaccines\")\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule Completion"
* #"Second rabies dose from the primary series was administered. The primary series has been completed-92" "Second rabies dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Rabies vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rabies schedule Completion"
* #"Second rotavirus dose from the primary series was administered-118" "Second rotavirus dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rotavirus vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rotavirus schedule Completion"
* #"Second tetanus and diphtheria booster dose was administered-140" "Second tetanus and diphtheria booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Pregnancy starting with 3 doses schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Pregnancy starting with 3 doses schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Pregnancy starting with 4 doses schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Pregnancy starting with 4 doses schedule Trigger"
* #"Second tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed-260" "Second tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed" "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 2
\"Immunization recommendation status\" = \"Complete\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Delayed or interrupted schedule Completion"
* #"Second varicella dose from the primary series was administered. The primary series has been completed-107" "Second varicella dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Varicella-containing vaccines\")\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Varicella.2-dose schedule Completion"
* #"TBE booster dose was administered less than 3 years ago-217" "TBE booster dose was administered less than 3 years ago" "Count of vaccines administered (where \"Vaccine type\" = \"TBE vaccines\" and \"Type of dose\" = \"Booster dose\") ≥ 1 AND Today's date - Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") < 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.EnceVir schedule Completion"
* #"TBE booster dose was administered less than 3 years ago-218" "TBE booster dose was administered less than 3 years ago" "Count of vaccines administered (where \"Vaccine type\" = \"TBE vaccines\" and \"Type of dose\" = \"Booster dose\") ≥ 1 AND Today's date - Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") < 3 'year'"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.TBE-Moscow schedule Completion"
* #"TBE booster dose was administered-110" "TBE booster dose was administered" "Count of vaccines administered (where \"Vaccine type\" = \"TBE vaccines\" and \"Type of dose\" = \"Booster dose\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.FSME-Immun schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.Encepur schedule Completion"
* #"Tetanus and diphtheria immunization schedule is complete-119" "Tetanus and diphtheria immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Output"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses Output"
* #"Tetanus and pertussis vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-250" "Tetanus and pertussis vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\" (where \"Vaccine type\" = \"Pertussis-containing vaccines\")
AND 
\"Immunization recommendation status\" = \"Further evaluation needed\" (where \"Vaccine type\" = \"Tetanus-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.DTP contraindications Output"
* #"Tetanus vaccination is contraindicated-112" "Tetanus vaccination is contraindicated" "\"Immunization recommendation status\" = \"Contraindicated\" (where \"Vaccine type\" = \"Tetanus -containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.DTP contraindications Output"
* #"The booster series has been completed-81" "The booster series has been completed" "\"Completed the booster series\" = TRUE (where \"Vaccine type\" = \"Typhoid vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Typhoid.Ty21a schedule Completion"
* #"The client currently has a severe acute illness-54" "The client currently has a severe acute illness" "\"Potential contraindications\" = \"Severe acute illness\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.DTP contraindications Inputs"
* #"The client has TB disease-44" "The client has TB disease" "\"Potential contraindications\" = \"TB disease\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rubella contraindications Inputs"
* #"The client has a history of anaphylactic reactions-67" "The client has a history of anaphylactic reactions" "\"Potential contraindications\" = \"History of anaphylactic reactions\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.DTP contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Pneumococcal contraindications Inputs"
* #"The client has a history of severe allergic reactions-59" "The client has a history of severe allergic reactions" "\"Potential contraindications\" = \"Severe allergic reactions\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Hib contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Pneumococcal contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Yellow fever contraindications Inputs"
* #"The client has a history of severe allergic reactions-60" "The client has a history of severe allergic reactions" "'\"Potential contraindications\" = \"Severe allergic reactions\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Hepatitis A contraindications Inputs"
* #"The client has a symptomatic HIV infection-59" "The client has a symptomatic HIV infection" "\"Potential contraindications\" = \"Symptomatic HIV infection\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Measles contraindications Inputs"
* #"The client has acute gastroenteritis-55" "The client has acute gastroenteritis" "\"Potential contraindications\" = \"Acute gastroenteritis\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Inputs"
* #"The client has allergy to vaccine components-60" "The client has allergy to vaccine components" "'\"Potential contraindications\" = \"Severe allergic reactions\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Mumps contraindications Inputs"
* #"The client has altered immunocompetence-58" "The client has altered immunocompetence" "\"Potential contraindications\" = \"Altered immunocompetence\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Inputs"
* #"The client has bladder exstrophy-51" "The client has bladder exstrophy" "\"Potential contraindications\" = \"Bladder exstrophy\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Inputs"
* #"The client has chronic gastrointestinal disease-66" "The client has chronic gastrointestinal disease" "\"Potential contraindications\" = \"Chronic gastrointestinal disease\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Inputs"
* #"The client has history of anaphylactic reactions-66" "The client has history of anaphylactic reactions" "\"Potential contraindications\" =\"History of anaphylactic reactions\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Dengue contraindications Inputs"
* #"The client has history of anaphylactic reactions-67" "The client has history of anaphylactic reactions" "\"Potential contraindications\" = \"History of anaphylactic reactions\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Measles contraindications Inputs"
* #"The client has history of severe allergic reactions-59" "The client has history of severe allergic reactions" "\"Potential contraindications\" = \"Severe allergic reactions\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Polio contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Measles contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rubella contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.HPV contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Meningococcal contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rabies contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Dengue contraindications Inputs"
* #"The client has history of severe allergic reactions-60" "The client has history of severe allergic reactions" "'\"Potential contraindications\" = \"Severe allergic reactions\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.BCG contraindications Inputs"
* #"The client has hypersensitivity to any component of the vaccine-72" "The client has hypersensitivity to any component of the vaccine" "\"Potential contraindications\" = \"Hypersensitivity to vaccine components\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Typhoid contraindications Inputs"
* #"The client has hypersensitivity to any of the vaccine components-72" "The client has hypersensitivity to any of the vaccine components" "\"Potential contraindications\" = \"Hypersensitivity to vaccine components\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Malaria contraindications Inputs"
* #"The client has immune deficiency-60" "The client has immune deficiency" "\"Potential contraindications\" = \"Immunodeficiency syndromes\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Mumps contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Varicella contraindications Inputs"
* #"The client has immunodeficiency syndromes-60" "The client has immunodeficiency syndromes" "\"Potential contraindications\" = \"Immunodeficiency syndromes\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.BCG contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Polio contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rubella contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Dengue contraindications Inputs"
* #"The client has moderate to severe fever-58" "The client has moderate to severe fever" "\"Potential contraindications\" = \"Moderate to severe fever\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.TBE contraindications Inputs"
* #"The client has prior history of intussusception-66" "The client has prior history of intussusception" "\"Potential contraindications\" = \"Prior history of intussusception\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Inputs"
* #"The client has severe immunodeficiency-61" "The client has severe immunodeficiency" "'\"Potential contraindications\" = \"Immunodeficiency syndromes\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Inputs"
* #"The client has spina bifida-46" "The client has spina bifida" "\"Potential contraindications\" = \"Spina bifida\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rotavirus contraindications Inputs"
* #"The client has symptomatic HIV infection-59" "The client has symptomatic HIV infection" "\"Potential contraindications\" = \"Symptomatic HIV infection\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rubella contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Dengue contraindications Inputs"
* #"The client is currently lactating-48" "The client is currently lactating" "'\"Potential contraindications\" = \"Breastfeeding\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Dengue contraindications Inputs"
* #"The client is currently pregnant-52" "The client is currently pregnant" "\"Potential contraindications\" = \"Currently pregnant\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rubella contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.HPV contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Typhoid contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.JE contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Yellow fever contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.TBE contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Hepatitis A contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Dengue contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Mumps contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Varicella contraindications Inputs"
* #"The client is currently taking antibiotics-52" "The client is currently taking antibiotics" "\"Potential contraindications\" = \"Taking antibiotics\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Typhoid contraindications Inputs"
* #"The client is exposed to immunosuppressive treatment-72" "The client is exposed to immunosuppressive treatment" "\"Potential contraindications\" = \"Exposed to immunosuppressive treatment\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.BCG contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rubella contraindications Inputs"
* #"The client is immunocomprised-51" "The client is immunocomprised" "\"Potential contraindications\" = \"Immunocompromised\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.JE contraindications Inputs"
* #"The client is immunocompromised-51" "The client is immunocompromised" "\"Potential contraindications\" = \"Immunocompromised\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Dengue contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Varicella contraindications Inputs"
* #"The client is lactating-47" "The client is lactating" "\"Potential contraindications\" = \"Breastfeeding\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Yellow fever contraindications Inputs"
* #"The client is not immunologically stable-31" "The client is not immunologically stable" "\"Immunologically stable\" ≠ TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Typhoid contraindications Inputs"
* #"The client is planning to get pregnant in next month-76" "The client is planning to get pregnant in next month" "\"Potential contraindications\" = \"Planning to get pregnant in the next month\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rubella contraindications Inputs"
* #"The client is planning to get pregnant in the next month-76" "The client is planning to get pregnant in the next month" "\"Potential contraindications\" = \"Planning to get pregnant in the next month\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Varicella contraindications Inputs"
* #"The client is pregnant-52" "The client is pregnant" "\"Potential contraindications\" = \"Currently pregnant\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.BCG contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Measles contraindications Inputs"
* #"The client is receiving blood products-58" "The client is receiving blood products" "\"Potential contraindications\" = \"Receiving blood products\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Rubella contraindications Inputs"
* #"The client is receiving or has received medications that may be immunosuppressive-72" "The client is receiving or has received medications that may be immunosuppressive" "\"Potential contraindications\" = \"Exposed to immunosuppressive treatment\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Varicella contraindications Inputs"
* #"The client is severely immunocompromised-60" "The client is severely immunocompromised" "\"Potential contraindications\" = \"Severely immunocompromised\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Polio contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Yellow fever contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Hepatitis A contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Dengue contraindications Inputs"
* #"The client is severely immunosuppressed-59" "The client is severely immunosuppressed" "\"Potential contraindications\" = \"Severely immunosuppressed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Measles.Supplementary dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Measles contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Dengue contraindications Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Mumps contraindications Inputs"
* #"The client's HIV status is positive-29" "The client's HIV status is positive" "\"HIV status\" = \"HIV-positive\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Typhoid contraindications Inputs"
* #"The client's age is between 6 weeks and 5 years-50" "The client's age is between 6 weeks and 5 years" "6 weeks ≤ Today's date − \"Date of birth\" ≤ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The client's age is less than 12 months-42" "The client's age is less than 12 months" "Today's date − \"Date of birth\" < 12 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
* #"The client's age is less than 24 months-42" "The client's age is less than 24 months" "Today's date − \"Date of birth\" < 24 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The client's age is less than 6 weeks-40" "The client's age is less than 6 weeks" "Today's date − \"Date of birth\" < 6 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The client's age is less than or equal to 5 years-40" "The client's age is less than or equal to 5 years" "Today's date − \"Date of birth\" ≤ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
* #"The client's age is less than or equal to 5 years-41" "The client's age is less than or equal to 5 years" "'Today's date − \"Date of birth\" ≤ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
* #"The client's age is less than or equal to five years-40" "The client's age is less than or equal to five years" "Today's date − \"Date of birth\" ≤ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The client's age is more than 5 years-40" "The client's age is more than 5 years" "Today's date − \"Date of birth\" > 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The client's age is more than or equal to 12 months and less than 24 months-54" "The client's age is more than or equal to 12 months and less than 24 months" "12 months ≤ Today's date − \"Date of birth\" < 24 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
* #"The client's age is more than or equal to 24 months-42" "The client's age is more than or equal to 24 months" "Today's date − \"Date of birth\" ≥ 24 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The first pneumococcal dose was administered after 12 months post birth-131" "The first pneumococcal dose was administered after 12 months post birth" "\"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\" AND \"Dose number\" = 1) − \"Date of birth\" ≥ 12 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The first pneumococcal dose was administered after 24 months post birth-109" "The first pneumococcal dose was administered after 24 months post birth" "\"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") − \"Date of birth\" ≥ 24 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The first pneumococcal dose was administered at 12–24 months post birth-121" "The first pneumococcal dose was administered at 12–24 months post birth" "12 months ≤ \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") − \"Date of birth\" < 24 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The first pneumococcal dose was administered within 12 months post birth-109" "The first pneumococcal dose was administered within 12 months post birth" "\"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") − \"Date of birth\" < 12 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The first pneumococcal dose was administered within 12 months post birth-131" "The first pneumococcal dose was administered within 12 months post birth" "\"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\" AND \"Dose number\" = 1) − \"Date of birth\" < 12 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The first pneumococcal dose was administered within 24 months post birth-109" "The first pneumococcal dose was administered within 24 months post birth" "\"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") − \"Date of birth\" < 24 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
* #"The latest DTP dose was administered less than 1 year ago-112" "The latest DTP dose was administered less than 1 year ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"DTP-containing vaccines\") < 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"The latest DTP dose was administered less than 4 weeks ago-113" "The latest DTP dose was administered less than 4 weeks ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"DTP-containing vaccines\") < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"The latest DTP dose was administered less than 6 months ago-114" "The latest DTP dose was administered less than 6 months ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"DTP-containing vaccines\") < 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"The latest DTP dose was administered more than 1 year ago-112" "The latest DTP dose was administered more than 1 year ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"DTP-containing vaccines\") ≥ 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"The latest DTP dose was administered more than 4 weeks ago-113" "The latest DTP dose was administered more than 4 weeks ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"DTP-containing vaccines\") ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"The latest DTP dose was administered more than 6 months ago-114" "The latest DTP dose was administered more than 6 months ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"DTP-containing vaccines\") ≥ 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"The latest HPV dose was administered less than 6 months ago-103" "The latest HPV dose was administered less than 6 months ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"HPV vaccines\") < 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
* #"The latest HPV dose was administered more than 6 months ago-102" "The latest HPV dose was administered more than 6 months ago" "Today's date − latest \"Date and time of vaccination\"(where \"Vaccine type\" = \"HPV vaccines\") ≥ 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
* #"The latest HPV dose was administered more than 6 months ago-103" "The latest HPV dose was administered more than 6 months ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"HPV vaccines\") ≥ 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
* #"The latest Hepatitis A dose was administered less than 6 months ago-115" "The latest Hepatitis A dose was administered less than 6 months ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Hepatitis A-containing vaccines\") < 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses Inputs"
* #"The latest Hepatitis A dose was administered more than 6 months ago-115" "The latest Hepatitis A dose was administered more than 6 months ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Hepatitis A-containing vaccines\") ≥ 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses Inputs"
* #"The latest Hib dose was administered less than 4 weeks ago-113" "The latest Hib dose was administered less than 4 weeks ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Hib-containing vaccines\") < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
* #"The latest Hib dose was administered less than 6 months ago-114" "The latest Hib dose was administered less than 6 months ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Hib-containing vaccines\") < 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"The latest Hib dose was administered less than 8 weeks ago-113" "The latest Hib dose was administered less than 8 weeks ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Hib-containing vaccines\") < 8 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"The latest Hib dose was administered more than 4 weeks ago-113" "The latest Hib dose was administered more than 4 weeks ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Hib-containing vaccines\") ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
* #"The latest Hib dose was administered more than 6 months ago-114" "The latest Hib dose was administered more than 6 months ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Hib-containing vaccines\") ≥ 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"The latest Hib dose was administered more than 8 weeks ago-113" "The latest Hib dose was administered more than 8 weeks ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Hib-containing vaccines\") ≥ 8 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"The latest IPV dose was administered less than 4 months ago-159" "The latest IPV dose was administered less than 4 months ago" "Today's date − Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of poliovirus dose\" = \"IPV\") < 4 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"The latest IPV dose was administered more than 4 months ago-159" "The latest IPV dose was administered more than 4 months ago" "Today's date − Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of poliovirus dose\" = \"IPV\") ≥ 4 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"The latest JE dose was administered less than 4 weeks ago-94" "The latest JE dose was administered less than 4 weeks ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"JE vaccines\") < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine Inputs"
* #"The latest JE dose was administered more than 4 weeks ago-94" "The latest JE dose was administered more than 4 weeks ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"JE vaccines\") ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine Inputs"
* #"The latest TBE dose was administered less than 1 month ago-95" "The latest TBE dose was administered less than 1 month ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") < 1 month"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Inputs"
* #"The latest TBE dose was administered less than 12 months ago-104" "The latest TBE dose was administered less than 12 months ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") < 12 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Inputs"
* #"The latest TBE dose was administered less than 3 years ago-102" "The latest TBE dose was administered less than 3 years ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") < 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Inputs"
* #"The latest TBE dose was administered less than 3 years ago-103" "The latest TBE dose was administered less than 3 years ago" "'Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") < 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
* #"The latest TBE dose was administered less than 5 months ago-103" "The latest TBE dose was administered less than 5 months ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") < 5 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
* #"The latest TBE dose was administered less than 5 months ago-96" "The latest TBE dose was administered less than 5 months ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") < 5 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Inputs"
* #"The latest TBE dose was administered less than 9 months ago-103" "The latest TBE dose was administered less than 9 months ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") < 9 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
* #"The latest TBE dose was administered more than 1 month ago-95" "The latest TBE dose was administered more than 1 month ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") ≥ 1 month"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Inputs"
* #"The latest TBE dose was administered more than 12 months ago-97" "The latest TBE dose was administered more than 12 months ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") ≥ 12 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Inputs"
* #"The latest TBE dose was administered more than 3 years ago-102" "The latest TBE dose was administered more than 3 years ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") ≥ 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
* #"The latest TBE dose was administered more than 3 years ago-95" "The latest TBE dose was administered more than 3 years ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") ≥ 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Inputs"
* #"The latest TBE dose was administered more than 5 months ago-103" "The latest TBE dose was administered more than 5 months ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") ≥ 5 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
* #"The latest TBE dose was administered more than 5 months ago-96" "The latest TBE dose was administered more than 5 months ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") ≥ 5 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Inputs"
* #"The latest TBE dose was administered more than 9 months ago-103" "The latest TBE dose was administered more than 9 months ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"TBE vaccines\") ≥ 9 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
* #"The latest bOPV dose was administered less than 4 weeks ago-159" "The latest bOPV dose was administered less than 4 weeks ago" "Today's date − Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of poliovirus dose\" = \"bOPV\") < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"The latest bOPV dose was administered more than 4 weeks ago-159" "The latest bOPV dose was administered more than 4 weeks ago" "Today's date − Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of poliovirus dose\" = \"bOPV\") ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"The latest cholera dose was administered approximately less than 2 years ago {Member States defined interval}-139" "The latest cholera dose was administered approximately less than 2 years ago {Member States defined interval}" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") ≤ 2 years ± Member States defined interval"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Inputs"
* #"The latest cholera dose was administered approximately less than 6 months ago {Member States defined exact interval}-107" "The latest cholera dose was administered approximately less than 6 months ago {Member States defined exact interval}" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") ≤ 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
* #"The latest cholera dose was administered approximately more than 2 years ago {Member States defined interval}-139" "The latest cholera dose was administered approximately more than 2 years ago {Member States defined interval}" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") > 2 years ± Member States defined interval"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Inputs"
* #"The latest cholera dose was administered approximately more than 6 months ago {Member States defined exact interval}-107" "The latest cholera dose was administered approximately more than 6 months ago {Member States defined exact interval}" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") > 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
* #"The latest cholera dose was administered less than 1 week ago-105" "The latest cholera dose was administered less than 1 week ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") < 1 week"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Inputs"
* #"The latest cholera dose was administered less than 14 days ago-106" "The latest cholera dose was administered less than 14 days ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") < 14 days"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"The latest cholera dose was administered less than 3 years ago-106" "The latest cholera dose was administered less than 3 years ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") < 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"The latest cholera dose was administered less than {Member States defined lower limit} days ago-132" "The latest cholera dose was administered less than {Member States defined lower limit} days ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") ≤ Member States defined lower limit"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
* #"The latest cholera dose was administered more than 1 week and less than 6 weeks ago-115" "The latest cholera dose was administered more than 1 week and less than 6 weeks ago" "1 week ≤ Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") < 6 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Inputs"
* #"The latest cholera dose was administered more than 14 days ago and less than 3 years ago-118" "The latest cholera dose was administered more than 14 days ago and less than 3 years ago" "14 days <= Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") <= 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"The latest cholera dose was administered more than 14 days ago-106" "The latest cholera dose was administered more than 14 days ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") ≥ 14 days"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"The latest cholera dose was administered more than 3 years ago-106" "The latest cholera dose was administered more than 3 years ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") ≥ 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"The latest cholera dose was administered more than 6 weeks ago-106" "The latest cholera dose was administered more than 6 weeks ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Cholera vaccines\") ≥ 6 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses Inputs"
* #"The latest dengue dose was administered less than 6 months ago-106" "The latest dengue dose was administered less than 6 months ago" "Today's date - Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Dengue vaccines\") < 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening Inputs"
* #"The latest dengue dose was administered more than 6 months ago-106" "The latest dengue dose was administered more than 6 months ago" "Today's date - Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Dengue vaccines\") ≥ 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening Inputs"
* #"The latest malaria dose was administered less than 4 weeks ago-99" "The latest malaria dose was administered less than 4 weeks ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Malaria vaccines\") < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Malaria Inputs"
* #"The latest malaria dose was administered more than 4 weeks ago-106" "The latest malaria dose was administered more than 4 weeks ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Malaria vaccines\") ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Malaria Inputs"
* #"The latest meningococcal dose was administered less than 1 year ago-111" "The latest meningococcal dose was administered less than 1 year ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") < 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
* #"The latest meningococcal dose was administered less than 2 months ago-106" "The latest meningococcal dose was administered less than 2 months ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") < 2 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
* #"The latest meningococcal dose was administered less than 3 months ago-106" "The latest meningococcal dose was administered less than 3 months ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") < 3 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses Inputs"
* #"The latest meningococcal dose was administered less than 3 years ago-105" "The latest meningococcal dose was administered less than 3 years ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") < 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Inputs"
* #"The latest meningococcal dose was administered less than 8 weeks ago-105" "The latest meningococcal dose was administered less than 8 weeks ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") < 8 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses Inputs"
* #"The latest meningococcal dose was administered more than 1 year ago-111" "The latest meningococcal dose was administered more than 1 year ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") ≥ 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
* #"The latest meningococcal dose was administered more than 2 months ago-106" "The latest meningococcal dose was administered more than 2 months ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") ≥ 2 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
* #"The latest meningococcal dose was administered more than 3 months ago-106" "The latest meningococcal dose was administered more than 3 months ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") ≥ 3 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses Inputs"
* #"The latest meningococcal dose was administered more than 3 years ago-105" "The latest meningococcal dose was administered more than 3 years ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") ≥ 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Inputs"
* #"The latest meningococcal dose was administered more than 8 weeks ago-105" "The latest meningococcal dose was administered more than 8 weeks ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\") ≥ 8 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses Inputs"
* #"The latest mumps dose was administered less than 4 weeks ago-108" "The latest mumps dose was administered less than 4 weeks ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Mumps-containing vaccines\") < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Mumps Inputs"
* #"The latest mumps dose was administered more than 4 weeks ago-108" "The latest mumps dose was administered more than 4 weeks ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Mumps-containing vaccines\") ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Mumps Inputs"
* #"The latest pneumococcal dose was administered after 12 months post birth-116" "The latest pneumococcal dose was administered after 12 months post birth" "Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") − \"Date of birth\" ≥ 12 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The latest pneumococcal dose was administered less than 4 weeks ago-104" "The latest pneumococcal dose was administered less than 4 weeks ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The latest pneumococcal dose was administered less than 4 weeks ago-111" "The latest pneumococcal dose was administered less than 4 weeks ago" "Today's date - Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The latest pneumococcal dose was administered less than 8 weeks ago-104" "The latest pneumococcal dose was administered less than 8 weeks ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") < 8 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The latest pneumococcal dose was administered less than 8 weeks ago-111" "The latest pneumococcal dose was administered less than 8 weeks ago" "Today's date - latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") < 8 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The latest pneumococcal dose was administered more than 4 weeks ago-104" "The latest pneumococcal dose was administered more than 4 weeks ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The latest pneumococcal dose was administered more than 4 weeks ago-111" "The latest pneumococcal dose was administered more than 4 weeks ago" "Today's date - Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The latest pneumococcal dose was administered more than 8 weeks ago-104" "The latest pneumococcal dose was administered more than 8 weeks ago" "Today's date − \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") ≥ 8 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The latest pneumococcal dose was administered more than 8 weeks ago-111" "The latest pneumococcal dose was administered more than 8 weeks ago" "Today's date - latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") ≥ 8 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The latest pneumococcal dose was administered within 12 months post birth-116" "The latest pneumococcal dose was administered within 12 months post birth" "Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") − \"Date of birth\" < 12 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"The latest poliovirus dose was administered less than 4 weeks ago-120" "The latest poliovirus dose was administered less than 4 weeks ago" "Today's date − Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Poliovirus-containing vaccines\") < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"The latest poliovirus dose was administered less than 6 months ago-121" "The latest poliovirus dose was administered less than 6 months ago" "Today's date − Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Poliovirus-containing vaccines\") < 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"The latest poliovirus dose was administered more than 4 weeks ago-120" "The latest poliovirus dose was administered more than 4 weeks ago" "Today's date − Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Poliovirus-containing vaccines\") ≥ 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"The latest poliovirus dose was administered more than 6 months ago-121" "The latest poliovirus dose was administered more than 6 months ago" "Today's date − Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Poliovirus-containing vaccines\") ≥ 6 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"The latest rabies dose was administered less than 7 days ago-97" "The latest rabies dose was administered less than 7 days ago" "''Today's date - Latest \"Date of vaccination\" (where \"Vaccine type\" = \"Rabies vaccines\") < 7 days"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rabies Inputs"
* #"The latest rabies dose was administered more than 7 days ago-97" "The latest rabies dose was administered more than 7 days ago" "''Today's date - Latest \"Date of vaccination\" (where \"Vaccine type\" = \"Rabies vaccines\") ≥ 7 days"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rabies Inputs"
* #"The latest tetanus and diphtheria dose was administered less than 1 year ago-131" "The latest tetanus and diphtheria dose was administered less than 1 year ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\") < 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses Inputs"
* #"The latest tetanus and diphtheria dose was administered less than 4 weeks ago-132" "The latest tetanus and diphtheria dose was administered less than 4 weeks ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\") < 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Inputs"
* #"The latest tetanus and diphtheria dose was administered more than 1 year ago-131" "The latest tetanus and diphtheria dose was administered more than 1 year ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\") ≥ 1 year"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses Inputs"
* #"The latest tetanus and diphtheria dose was administered more than 4 weeks ago-132" "The latest tetanus and diphtheria dose was administered more than 4 weeks ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\") > 4 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Inputs"
* #"The latest typhoid dose was administered less than 3 years ago-106" "The latest typhoid dose was administered less than 3 years ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Typhoid vaccines\") < 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.ViPS Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.Ty21a Inputs"
* #"The latest typhoid dose was administered more than 3 years ago-106" "The latest typhoid dose was administered more than 3 years ago" "Today's date − latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Typhoid vaccines\") ≥ 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.ViPS Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.Ty21a Inputs"
* #"The poliovirus dose administered is IPV-115" "The poliovirus dose administered is IPV" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"bOPV\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"The poliovirus dose administered is bOPV-115" "The poliovirus dose administered is bOPV" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"bOPV\" and \"Type of dose\" = \"Primary series\") = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"The primary DTP series has been completed and client is currently pregnant-132" "The primary DTP series has been completed and client is currently pregnant" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"DTP-containing vaccines\") AND \"Currently pregnant\" = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Pregnancy starting with 3 doses schedule Trigger"
* #"The primary DTP series has been completed and client's age is between 1 and 6 years-154" "The primary DTP series has been completed and client's age is between 1 and 6 years" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"DTP-containing vaccines\") AND 1 year ≤ Today's date − \"Date of birth\" ≤ 6 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Trigger"
* #"The primary DTP series has been completed and client's age is between 1 year and 6 years-154" "The primary DTP series has been completed and client's age is between 1 year and 6 years" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"DTP-containing vaccines\") AND 1 year ≤ Today's date − \"Date of birth\" ≤ 6 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Delayed or interrupted schedule Trigger"
* #"The primary DTP series has been completed, first tetanus and diphtheria booster dose was administered and client is currently pregnant-276" "The primary DTP series has been completed, first tetanus and diphtheria booster dose was administered and client is currently pregnant" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"DTP-containing vaccines\") AND Count of vaccines administered where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 1 AND \"Currently pregnant\" = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Pregnancy starting with 4 doses schedule Trigger"
* #"The primary DTP series has been completed-100" "The primary DTP series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"DTP-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Delayed or interrupted schedule Trigger"
* #"The primary series has been completed and client started the series when client's age was less than or equal to 11 months-236" "The primary series has been completed and client started the series when client's age was less than or equal to 11 months" "\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Meningococcal vaccines\") = TRUE and \"Date and time of vaccination\" (where \"Vaccine type\" = \"Meningococcal vaccines\" and \"Dose number\" = 1) - \"Date of birth\" ≤ 11 months"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Meningococcal.Monovalent MenC conjugate vaccine schedule Trigger"
* #"The primary series has been completed and one booster dose was administered to the client, who is more than 12 months of age. The latest pneumococcal dose was administered within 12 months post birth. Client is either HIV positive or had a preterm birth-453" "The primary series has been completed and one booster dose was administered to the client, who is more than 12 months of age. The latest pneumococcal dose was administered within 12 months post birth. Client is either HIV positive or had a preterm birth" "'Today's date − \"Date of birth\" > 12 months AND \"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Pneumococcal vaccines\") AND Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Booster dose\") = 1 AND Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") − \"Date of birth\" < 12 months AND (\"HIV status\" = \"HIV-positive\" OR \"Preterm birth\" = TRUE)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule Trigger"
* #"The primary series has been completed-89" "The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"TBE vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.FSME-Immun schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.Encepur schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.TBE-Moscow schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.EnceVir schedule Trigger"
* #"The primary series has been completed-93" "The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Typhoid vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Typhoid.ViPS schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Typhoid.Ty21a schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Typhoid.Ty21a schedule Trigger"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC vaccines schedule Completion"
* #"The primary series is complete-169" "The primary series is complete" "Client is due for TBE booster dose
\"Immunization recommendation status\" = \"Due\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"TBE vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Output"
* #"The primary series is complete. Client is due for meningococcal booster dose-144" "The primary series is complete. Client is due for meningococcal booster dose" "\"Immunization recommendation status\" = \"Due\"
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Meningococcal vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Output"
* #"The primary series is complete. Client is not due for TBE booster dose-138" "The primary series is complete. Client is not due for TBE booster dose" "\"Immunization recommendation status\" = \"Not due\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"TBE vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Output"
* #"The primary series is complete. Client is not due for meningococcal booster dose.-148" "The primary series is complete. Client is not due for meningococcal booster dose." "\"Immunization recommendation status\" = \"Not due\"
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Meningococcal vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Output"
* #"The primary series is complete. Clinical judgement is required for meningococcal booster dose. Create a clinical note-166" "The primary series is complete. Clinical judgement is required for meningococcal booster dose. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\"
\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Meningococcal vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines Output"
* #"The series administered to the client contains the same product-169" "The series administered to the client contains the same product" "\"Vaccine brand\" (where \"Vaccine type\" = \"Rotavirus vaccines\" AND \"Dose number\" = 1) = \"Vaccine brand\" (where \"Vaccine type\" = \"Rotavirus vaccines\" AND \"Dose number\" = 2)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"The series administered to the client is a mixed series or a series with unknown vaccine products-169" "The series administered to the client is a mixed series or a series with unknown vaccine products" "\"Vaccine brand\" (where \"Vaccine type\" = \"Rotavirus vaccines\" AND \"Dose number\" = 1) ≠ \"Vaccine brand\" (where \"Vaccine type\" = \"Rotavirus vaccines\" AND \"Dose number\" = 2)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"The series contain less than or equal to two doses-27" "The series contain less than or equal to two doses" "\"Total doses in series\" ≤ 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"The series contain more than two doses-27" "The series contain more than two doses" "\"Total doses in series\" > 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"The three doses administered are bOPV-115" "The three doses administered are bOPV" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"bOPV\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"The two doses administered are IPV-115" "The two doses administered are IPV" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"bOPV\" and \"Type of dose\" = \"Primary series\") = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"The two doses administered are bOPV-115" "The two doses administered are bOPV" "Count of vaccines administered (where \"Type of poliovirus dose\" = \"bOPV\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
* #"Third DTP dose from the primary series was administered. The primary DTP series has been completed-224" "Third DTP dose from the primary series was administered. The primary DTP series has been completed" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 3
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"DTP-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Delayed or interrupted schedule Completion"
* #"Third HPV dose from the primary series was administered-112" "Third HPV dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.HPV.2-dose schedule Completion"
* #"Third HPV dose from the primary series was administered-74" "Third HPV dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Single-dose schedule Completion"
* #"Third Hib dose from the primary series was administered. Child's age is less than 5 years-167" "Third Hib dose from the primary series was administered. Child's age is less than 5 years" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\"= \"Primary series\") = 3 AND Today's date − \"Date of birth\" ≤ 5 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses with booster dose schedule Trigger"
* #"Third Hib dose from the primary series was administered. The primary series has been completed-100" "Third Hib dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Hib-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Hib.3 doses with booster dose schedule Completion"
* #"Third IPV dose from the primary series was administered and the client's age was 6 weeks when the primary series was started-235" "Third IPV dose from the primary series was administered and the client's age was 6 weeks when the primary series was started" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\") = 3 AND \"Date and time of vaccination\" (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" AND \"Dose number\" = 1) − \"Date of birth\" = 6 weeks"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.IPV-only schedule Trigger"
* #"Third IPV dose from the primary series was administered. The primary series has been completed-107" "Third IPV dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Poliovirus-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.IPV-only schedule Completion"
* #"Third TBE dose from the primary series was administered. The primary series has been completed-89" "Third TBE dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"TBE vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.FSME-Immun schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.Encepur schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.TBE-Moscow schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.TBE.EnceVir schedule Completion"
* #"Third bOPV dose from the primary series was administered. The primary series has been completed-107" "Third bOPV dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Poliovirus-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Polio.bOPV plus IPV schedule Completion"
* #"Third dengue dose from the primary series was administered. The primary series has been completed-93" "Third dengue dose from the primary series was administered. The primary series has been completed" "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Dengue vaccines\")\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Dengue schedule Completion"
* #"Third malaria dose from the primary series was administered-116" "Third malaria dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Malaria vaccines\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Malaria schedule Completion"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Malaria schedule Trigger"
* #"Third pneumococcal dose from the primary series was administered to client, who is more than 12 months of age. The latest pneumococcal dose was administered within 12 months post birth. Client is either HIV positive or had preterm birth.-351" "Third pneumococcal dose from the primary series was administered to client, who is more than 12 months of age. The latest pneumococcal dose was administered within 12 months post birth. Client is either HIV positive or had preterm birth." "Today's date − \"Date of birth\" > 12 months AND Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 3 AND Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Pneumococcal vaccines\") − \"Date of birth\" < 12 months AND (\"HIV status\" = \"HIV-positive\" OR \"Preterm birth\" = TRUE)"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.3 doses schedule Trigger"
* #"Third pneumococcal dose from the primary series was administered. The primary series has been completed.-98" "Third pneumococcal dose from the primary series was administered. The primary series has been completed." "\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Pneumococcal vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Pneumococcal.3 doses schedule Completion"
* #"Third rotavirus dose from the primary series was administered-118" "Third rotavirus dose from the primary series was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rotavirus vaccines\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rotavirus schedule Completion"
* #"Third tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed-260" "Third tetanus and diphtheria booster dose was administered. Tetanus and diphtheria immunization schedule has been completed" "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 3
\"Immunization recommendation status\" = \"Complete\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.On-time start schedule Completion"
* #"Third tetanus and diphtheria-containing booster dose was administered. Tetanus and diphtheria immunization schedule has been completed-260" "Third tetanus and diphtheria-containing booster dose was administered. Tetanus and diphtheria immunization schedule has been completed" "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 3
\"Immunization recommendation status\" = \"Complete\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Pregnancy starting with 3 doses schedule Completion"
* #"Third tetanus and diphtheria-containing booster dose was administered. Tetanus and diphtheria immunization schedule has been completed.-260" "Third tetanus and diphtheria-containing booster dose was administered. Tetanus and diphtheria immunization schedule has been completed." "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 3
\"Immunization recommendation status\" = \"Complete\" (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.DTP.Pregnancy starting with 4 doses schedule Completion"
* #"Three DTP primary series doses were administered-123" "Three DTP primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"Three DTP primary series doses were administered-124" "Three DTP primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\") and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses Inputs"
* #"Three HPV primary series doses were administered-112" "Three HPV primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
* #"Three Hib primary series doses were administered-122" "Three Hib primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\"= \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
* #"Three TBE primary series doses were administered-112" "Three TBE primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"TBE vaccines\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Inputs"
* #"Three dengue primary series doses were administered-115" "Three dengue primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Dengue vaccines\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening Inputs"
* #"Three doses from primary series were administered. The primary series has been completed-93" "Three doses from primary series were administered. The primary series has been completed" "\"Completed the primary vaccination series\" (where \"Vaccine type\" = \"Cholera vaccines\") = TRUE"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Cholera.WC-rBS vaccine 3-dose schedule Completion"
* #"Three malaria primary series doses were administered-116" "Three malaria primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Malaria vaccines\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Malaria Inputs"
* #"Three pneumococcal primary series doses were administered-121" "Three pneumococcal primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"Three poliovirus primary series doses were administered-130" "Three poliovirus primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"Three rotavirus primary series doses were administered-118" "Three rotavirus primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rotavirus vaccines\" and \"Type of dose\" = \"Primary series\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"Three tetanus and diphtheria booster doses were administered-140" "Three tetanus and diphtheria booster doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 3"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses Inputs"
* #"To be determined by Member States-0" "To be determined by Member States" ""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Rabies schedule Trigger"
* #"Two DTP primary series doses were administered-123" "Two DTP primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
* #"Two DTP primary series doses were administered-124" "Two DTP primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"DTP-containing vaccines\") and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
* #"Two HPV primary series doses were administered-112" "Two HPV primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"HPV vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.HPV.Single dose Inputs"
* #"Two Hib primary series doses were administered-122" "Two Hib primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\"= \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.2 doses with booster dose Inputs"
* #"Two Hib primary series doses were administered-124" "Two Hib primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hib-containing vaccines\" and \"Type of dose\" = \"Primary series\" ) = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hib.3 doses with booster dose Inputs"
* #"Two JE primary series doses were administered-111" "Two JE primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"JE vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine Inputs"
* #"Two TBE primary series doses were administered-112" "Two TBE primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"TBE vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.FSME-Immun Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.Encepur Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.TBE-Moscow Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.TBE.EnceVir Inputs"
* #"Two cholera primary series doses were administered-116" "Two cholera primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Cholera vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Cholera.WC vaccines Inputs"
* #"Two dengue primary series doses were administered-115" "Two dengue primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Dengue vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening Inputs"
* #"Two hepatitis A primary series doses were administered-131" "Two hepatitis A primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Hepatitis A-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses Inputs"
* #"Two malaria primary series doses were administered-116" "Two malaria primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Malaria vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Malaria Inputs"
* #"Two meningococcal primary series doses were administered-122" "Two meningococcal primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Meningococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses Inputs"
* #"Two mumps primary series doses were administered-125" "Two mumps primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Mumps-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Mumps Inputs"
* #"Two pneumococcal booster doses were administered-119" "Two pneumococcal booster doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Booster dose\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
* #"Two pneumococcal primary series doses were administered-121" "Two pneumococcal primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Pneumococcal vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.2 doses with booster dose Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Pneumococcal.3 doses Inputs"
* #"Two poliovirus primary series doses were administered-130" "Two poliovirus primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.bOPV plus IPV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Sequential IPV–bOPV Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.IPV-only Inputs"
* #"Two rabies primary series doses were administered-115" "Two rabies primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rabies vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rabies Inputs"
* #"Two rotavirus primary series doses were administered-118" "Two rotavirus primary series doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Rotavirus vaccines\" and \"Type of dose\" = \"Primary series\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Rotavirus Inputs"
* #"Two tetanus and diphtheria booster doses were administered-140" "Two tetanus and diphtheria booster doses were administered" "Count of vaccines administered (where \"Vaccine type\" = \"Tetanus and diphtheria-containing vaccines\" and \"Type of dose\" = \"Booster dose\") = 2"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.On-time start Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Delayed or interrupted series Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses Inputs"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses Inputs"
* #"Typhoid booster dose was administered less than 3 years ago-225" "Typhoid booster dose was administered less than 3 years ago" "Count of vaccines administered (where \"Vaccine type\" = \"Typhoid vaccines\" and \"Type of dose\" = \"Booster dose\") ≥ 1 AND Today's date - Latest \"Date and time of vaccination\" (where \"Vaccine type\" = \"Typhoid vaccines\") < 3 years"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D18.S.Typhoid.ViPS schedule Completion"
* #"Typhoid immunization schedule is complete-143" "Typhoid immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Typhoid vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Typhoid.TCV Output"
* #"Typhoid vaccination could be contraindicated. Clinical judgement is required. Create a clinical note.-66" "Typhoid vaccination could be contraindicated. Clinical judgement is required. Create a clinical note." "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Typhoid contraindications Output"
* #"Typhoid vaccination is contraindicated for Ty21a vaccine. Clinical judgement is required for Typbar-TCV or ViPS vaccine. Create a clinical note-224" "Typhoid vaccination is contraindicated for Ty21a vaccine. Clinical judgement is required for Typbar-TCV or ViPS vaccine. Create a clinical note" "\"Immunization recommendation status\" = \"Contraindicated\" (where \"Type of typhoid dose\" = \"Ty21a\") AND \"Immunization recommendation status\" = \"Further evaluation needed\" (where \"Type of typhoid dose\" = \"Typbar-TCV\" OR \"ViPS\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Typhoid contraindications Output"
* #"Typhoid vaccination is contraindicated for Ty21a vaccine.-97" "Typhoid vaccination is contraindicated for Ty21a vaccine." "\"Immunization recommendation status\" = \"Contraindicated\" (where \"Type of typhoid dose\" = \"Ty21a\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Typhoid contraindications Output"
* #"Varicella vaccination could be contraindicated. Clinical judgement is required. Create clinical note-66" "Varicella vaccination could be contraindicated. Clinical judgement is required. Create clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Varicella contraindications Output"
* #"Varicella vaccination is contraindicated-56" "Varicella vaccination is contraindicated" "\"Immunization recommendation status\" = \"Contraindicated\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Varicella contraindications Output"
* #"Yellow fever immunization schedule is complete-148" "Yellow fever immunization schedule is complete" "\"Immunization recommendation status\" = \"Complete\"
\"Completed the primary vaccination series\" = TRUE (where \"Vaccine type\" = \"Yellow fever vaccines\")"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Yellow fever Output"
* #"Yellow fever vaccination could be contraindicated. Clinical judgement is required. Create a clinical note-66" "Yellow fever vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" "\"Immunization recommendation status\" = \"Further evaluation needed\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Yellow fever contraindications Output"
* #"Yellow fever vaccination is contraindicated-56" "Yellow fever vaccination is contraindicated" "\"Immunization recommendation status\" = \"Contraindicated\""
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D5.DT.Yellow fever contraindications Output"
* #"bOPV birth dose (a zero dose) was administered-146" "bOPV birth dose (a zero dose) was administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of dose\" = \"Dose 0\" AND \"Birth dose\" = TRUE) = 1"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Birth dose Inputs"
* #"bOPV birth dose (a zero dose) was not administered-146" "bOPV birth dose (a zero dose) was not administered" "Count of vaccines administered (where \"Vaccine type\" = \"Poliovirus-containing vaccines\" and \"Type of dose\" = \"Dose 0\" AND \"Birth dose\" = TRUE) = 0"
  * ^property[+].code = #table
  * ^property[=].valueString = "IMMZ.D2.DT.Polio.Birth dose Inputs"