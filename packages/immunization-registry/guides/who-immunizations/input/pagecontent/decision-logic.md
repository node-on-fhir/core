This page describes the decision support logic included in the [WHO Digital Adaptation Kit for Immunizations](https://iris.who.int/handle/10665/380303).

The decision-support logic component provides the decision logic and
algorithms, as well as the scheduling of services, in accordance with
WHO guidelines. The decision logic and algorithms in this implementation
guide deconstruct the recommendations within the Immunization guidelines
and guidance into a machine readable format that clearly labels the
inputs and outputs that would be operationalized in a digital
decision-support system.

### Decision Support Logic Overview
The table below provides an overview of the decision-support tables and
algorithms for the different business processes in an EIR. The structure
of the decision-support tables is based on an adaptation of the Decision
Model and Notation (DMN™), an industry standard for modelling and
executing decision logic. These decision-support tables detail the
business rules, data inputs and outputs to support EIR business
processes.

Immunization schedules vary by vaccine product, epidemiological situation, and national policies. The decision-support logic and scheduling logic in the DAK were curated based on the WHO recommended immunizations schedules and related position papers. Because of this, there are decision-support table “options” and scheduling-logic “options” based on the various immunization strategies outlined in the recommendations that countries can choose and adapt as relevant. 

**Overview of decision support tables**

| **Decision-support table (DT), contraindications table and scheduling-logic table (S) identification (ID)** | Table description |
|---|---|
| **IMMZ.D2.DT.BCG** | Recommended vaccinations for bacille Calmette-Guérin (BCG) as per WHO recommendations |
| **IMMZ.D5.DT.BCG contraindications** | Performing a contraindication check for BCG vaccines as per WHO recommendations |
| **IMMZ.D18.S.BCG schedule** | Recommended vaccination schedule for BCG as per WHO recommendations |
| **IMMZ.D2.DT.Hepatitis B.Birth dose** | Recommended administration of the birth dose for hepatitis B as per WHO recommendations |
| **IMMZ.D2.DT.Hepatitis B.3 doses** | Recommended vaccinations for hepatitis B following the 3-dose schedule as per WHO recommendations |
| **IMMZ.D2.DT.Hepatitis B.4 doses** | Recommended vaccinations for hepatitis B following the 4-dose schedule as per WHO recommendations |
| **IMMZ.D2.DT.Hepatitis B.Delayed start** | Recommended vaccinations for hepatitis B following the delayed start schedule as per WHO recommendations |
| **IMMZ.D5.DT.Hepatitis B contraindications** | Performing a contraindication check for hepatitis B vaccines as per WHO recommendations |
| **IMMZ.D18.S.Hepatitis B.Birth dose schedule** | Recommended birth dose vaccination schedule for hepatitis B as per WHO recommendations |
| **IMMZ.D18.S.Hepatitis B.3-dose schedule** | Recommended 3-dose vaccination schedule for hepatitis B as per WHO recommendations |
| **IMMZ.D18.S.Hepatitis B.4-dose schedule** | Recommended 4-dose vaccination schedule for hepatitis B as per WHO recommendations |
| **IMMZ.D18.S.Hepatitis B.Delayed start schedule** | Recommended delayed start vaccination schedule for hepatitis B as per WHO recommendations |
| **IMMZ.D2.DT.Polio.Birth dose** | Recommended administration of the birth dose for poliomyelitis (polio) as per WHO recommendations |
| **IMMZ.D2.DT.Polio.bOPV plus IPV** | Recommended vaccinations for polio following the bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV) schedule as per WHO recommendations |
| **IMMZ.D2.DT.Polio.Sequential IPV–bOPV** | Recommended vaccinations for polio following the sequential IPV–bOPV schedule as per WHO recommendations |
| **IMMZ.D2.DT.Polio.IPV-only** | Recommended vaccinations for polio following the IPV-only schedule as per WHO recommendations |
| **IMMZ.D5.DT.Polio contraindications** | Performing a contraindication check for poliovirus-containing vaccines as per WHO recommendations |
| **IMMZ.D18.S.Polio.Birth dose schedule** | Recommended birth dose vaccination schedule for polio as per WHO recommendations |
| **IMMZ.D18.S.Polio.bOPV plus IPV schedule** | Recommended bOPV plus IPV vaccination schedule for polio as per WHO recommendations |
| **IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule** | Recommended sequential IPV–bOPV vaccination schedule for polio as per WHO recommendations |
| **IMMZ.D18.S.Polio.IPV-only schedule** | Recommended IPV-only vaccination schedule for polio as per WHO recommendations |
| **IMMZ.D2.DT.DTP.On-time start** | Recommended vaccinations for diphtheria–tetanus–pertussis (DTP) following the on-time start schedule as per WHO recommendations |
| **IMMZ.D2.DT.DTP.Delayed or interrupted series** | Recommended vaccinations for DTP following the delayed start or interrupted series schedule as per WHO recommendations |
| **IMMZ.D2.DT.DTP.Pregnancy** | Determine whether DTP vaccinations are needed for pregnant women as per WHO recommendations |
| **IMMZ.D2.DT.DTP.Pregnancy starting with 3 doses** | Recommended vaccinations for diphtheria and tetanus following the schedule outlined for pregnant women who have received three childhood DTP doses as per WHO recommendations |
| **IMMZ.D2.DT.DTP.Pregnancy starting with 4 doses** | Recommended vaccinations for diphtheria and tetanus following the schedule outlined for pregnant women who have received four childhood DTP doses as per WHO recommendations |
| **IMMZ.D5.DT.DTP contraindications** | Performing a contraindication check for DTP vaccines as per WHO recommendations |
| **IMMZ.D18.S.DTP.On-time start schedule** | Recommended on-time start (at ≤12 months of age) vaccination schedule for DTP as per WHO recommendations |
| **IMMZ.D18.S.DTP.Delayed or interrupted schedule** | Recommended delayed or interrupted series vaccination schedule for DTP as per WHO recommendations |
| **IMMZ.D18.S.DTP.Pregnancy starting with 3 doses schedule** | Recommended vaccination schedule for pregnant women who received 3 childhood DTP doses as per WHO recommendations |
| **IMMZ.D18.S.DTP.Pregnancy starting with 4 doses schedule** | Recommended vaccination schedule for pregnant women who received 4 childhood DTP doses as per WHO recommendations |
| **IMMZ.D2.DT.Hib.3 doses** | Recommended vaccinations for Haemophilus influenzae type b (Hib) following the 3 primary doses without a booster schedule as per WHO recommendations |
| **IMMZ.D2.DT.Hib.3 doses with booster dose** | Recommended vaccinations for Hib following the 3 primary doses with a booster schedule as per WHO recommendations |
| **IMMZ.D2.DT.Hib.2 doses with booster dose** | Recommended vaccinations for Hib following the 2 primary doses with a booster schedule as per WHO recommendations |
| **IMMZ.D5.DT.Hib contraindications** | Performing a contraindication check for Hib vaccines as per WHO recommendations |
| **IMMZ.D18.S.Hib.3 doses schedule** | Recommended 3 primary doses without a booster vaccination schedule for Hib as per WHO recommendations |
| **IMMZ.D18.S.Hib.3 doses with booster dose schedule** | Recommended 3 primary doses with a booster vaccination schedule for Hib as per WHO recommendations |
| **IMMZ.D18.S.Hib.2 doses with booster dose schedule** | Recommended 2 primary doses with a booster vaccination schedule for Hib as per WHO recommendations |
| **IMMZ.D2.DT.Pneumococcal.2 doses with booster dose** | Recommended vaccinations for pneumococcal following the 2 primary doses with a booster schedule as per WHO recommendations |
| **IMMZ.D2.DT.Pneumococcal.3 doses** | Recommended vaccinations for pneumococcal following the 3 primary doses schedule as per WHO recommendations |
| **IMMZ.D5.DT.Pneumococcal contraindications** | Performing a contraindication check for pneumococcal vaccines as per WHO recommendations |
| **IMMZ.D18.S.Pneumococcal.2 doses with booster dose schedule** | Recommended 2 primary doses with a booster vaccination schedule for pneumococcal as per WHO recommendations |
| **IMMZ.D18.S.Pneumococcal.3 doses schedule** | Recommended 3 primary doses vaccination schedule for pneumococcal as per WHO recommendations |
| **IMMZ.D2.DT.Rotavirus** | Recommended vaccinations for rotavirus as per WHO recommendations |
| **IMMZ.D5.DT.Rotavirus contraindications** | Performing a contraindication check for rotavirus vaccines as per WHO recommendations |
| **IMMZ.D18.S.Rotavirus schedule** | Recommended vaccination schedule for rotavirus as per WHO recommendations |
| **IMMZ.D2.DT.Measles.Ongoing transmission** | Recommended vaccinations for measles following the ongoing transmission schedule as per WHO recommendations |
| **IMMZ.D2.DT.Measles.Low transmission** | Recommended vaccinations for measles following the low levels of measles transmission schedule as per WHO recommendations |
| **IMMZ.D2.DT.Measles.MCV dose 0** | Recommended administration of dose 0 for measles as per WHO recommendations |
| **IMMZ.D2.DT.Measles.Supplementary dose** | Recommended administration of supplementary dose for measles as per WHO recommendations |
| **IMMZ.D5.DT.Measles contraindications** | Performing a contraindication check for measles-containing vaccines (MCV) as per WHO recommendations |
| **IMMZ.D18.S.Measles.Ongoing transmission schedule** | Recommended ongoing transmission vaccination schedule for measles as per WHO recommendations |
| **IMMZ.D18.S.Measles.Low transmission schedule** | Recommended low levels of measles transmission vaccination schedule for measles as per WHO recommendations |
| **IMMZ.D18.S.Measles.MCV dose 0 schedule** | Recommended measles dose 0 vaccination schedule for measles as per WHO recommendations |
| **IMMZ.D18.S.Measles.Supplementary dose schedule** | Recommended measles supplementary dose vaccination schedule for measles as per WHO recommendations |
| **IMMZ.D2.DT.Rubella.High incidence** | Recommended vaccinations for rubella following the high incidence of measles schedule as per WHO recommendations |
| **IMMZ.D2.DT.Rubella.Low incidence** | Recommended vaccinations for rubella following the low incidence of measles schedule as per WHO recommendations |
| **IMMZ.D5.DT.Rubella contraindications** | Performing a contraindication check for rubella vaccines as per WHO recommendations |
| **IMMZ.D18.S.Rubella.High incidence schedule** | Recommended vaccination schedule for rubella for countries with high incidence of measles as per WHO recommendations |
| **IMMZ.D18.S.Rubella.Low incidence schedule** | Recommended vaccination schedule for rubella for countries with low incidence of measles as per WHO recommendations |
| **IMMZ.D2.DT.HPV.2 doses** | Recommended vaccinations for human papillomavirus (HPV) following the 2-dose schedule as per WHO recommendations |
| **IMMZ.D2.DT.HPV.Single dose** | Recommended vaccinations for HPV following the single-dose schedule as per WHO recommendations |
| **IMMZ.D5.DT.HPV contraindications** | Performing a contraindication check for HPV vaccines as per WHO recommendations |
| **IMMZ.D18.S.HPV.2-dose schedule** | Recommended 2-dose vaccination schedule for HPV as per WHO recommendations |
| **IMMZ.D18.S.HPV.Single-dose schedule** | Recommended single-dose vaccination schedule for HPV as per WHO recommendations |
| **IMMZ.D2.DT.JE.Inactivated Vero cell-derived vaccine** | Recommended vaccinations for Japanese encephalitis (JE) following the inactivated Vero cell-derived vaccine schedule as per WHO recommendations |
| **IMMZ.D2.DT.JE.Live attenuated vaccine** | Recommended vaccinations for JE following the live attenuated vaccine schedule as per WHO recommendations |
| **IMMZ.D2.DT.JE.Live recombinant vaccine** | Recommended vaccinations for JE following the live recombinant vaccine schedule as per WHO recommendations |
| **IMMZ.D5.DT.JE contraindications** | Performing a contraindication check for JE vaccines as per WHO recommendations |
| **IMMZ.D18.S.JE.Inactivated Vero cell-derived vaccine schedule** | Recommended inactivated Vero cell-derived vaccination schedule for JE as per WHO recommendations |
| **IMMZ.D18.S.JE.Live attenuated vaccine schedule** | Recommended live attenuated vaccination schedule for JE as per WHO recommendations |
| **IMMZ.D18.S.JE.Live recombinant vaccine schedule** | Recommended live recombinant vaccination schedule for JE as per WHO recommendations |
| **IMMZ.D2.DT.Yellow fever** | Recommended vaccinations for yellow fever as per WHO recommendations |
| **IMMZ.D5.DT.Yellow fever contraindications** | Performing a contraindication check for yellow fever vaccines as per WHO recommendations |
| **IMMZ.D18.S.Yellow fever schedule** | Recommended vaccination schedule for yellow fever as per WHO recommendations |
| **IMMZ.D2.DT.TBE.FSME-Immun** | Recommended vaccinations for tick-borne encephalitis (TBE) following the FSME-Immun schedule as per WHO recommendations |
| **IMMZ.D2.DT.TBE.Encepur** | Recommended vaccinations for TBE following the Encepur schedule as per WHO recommendations |
| **IMMZ.D2.DT.TBE.TBE-Moscow** | Recommended vaccinations for TBE following the TBE-Moscow schedule as per WHO recommendations |
| **IMMZ.D2.DT.TBE.EnceVir** | Recommended vaccinations for TBE following the EnceVir schedule as per WHO recommendations |
| **IMMZ.D5.DT.TBE contraindications** | Performing a contraindication check for TBE vaccines as per WHO recommendations |
| **IMMZ.D18.S.TBE.FSME-Immun schedule** | Recommended FSME-Immun vaccination schedule for TBE as per WHO recommendations |
| **IMMZ.D18.S.TBE.Encepur schedule** | Recommended Encepur vaccination schedule for TBE as per WHO recommendations |
| **IMMZ.D18.S.TBE.TBE-Moscow schedule** | Recommended TBE-Moscow vaccination schedule for TBE as per WHO recommendations |
| **IMMZ.D18.S.TBE.EnceVir** | Recommended EnceVir vaccination schedule for TBE as per WHO recommendations |
| **IMMZ.D2.DT.Typhoid.TCV** | Recommended vaccinations for typhoid following the typhoid conjugate vaccine (TCV) schedule as per WHO recommendations |
| **IMMZ.D2.DT.Typhoid.ViPS** | Recommended vaccinations for typhoid following the unconjugated Vi polysaccharide (ViPS) schedule as per WHO recommendations |
| **IMMZ.D2.DT.Typhoid.Ty21a** | Recommended vaccinations for typhoid following the live attenuated Ty21a vaccine schedule as per WHO recommendations |
| **IMMZ.D5.DT.Typhoid contraindications** | Performing a contraindication check for typhoid vaccines as per WHO recommendations |
| **IMMZ.D18.S.Typhoid.TCV schedule** | Recommended TCV vaccination schedule for typhoid as per WHO recommendations |
| **IMMZ.D18.S.Typhoid.ViPS schedule** | Recommended unconjugated ViPS vaccination schedule for typhoid as per WHO recommendations |
| **IMMZ.D18.S.Typhoid.Ty21a schedule** | Recommended live attenuated Ty21a vaccination schedule for typhoid as per WHO recommendations |
| **IMMZ.D2.DT.Cholera.WC vaccines** | Recommended vaccinations for cholera following the whole-cell (WC) vaccines schedule as per WHO recommendations |
| **IMMZ.D2.DT.Cholera.WC-rBS vaccine 3 doses** | Recommended vaccinations for cholera following the WC-recombinant B subunit (WC-rBS) vaccine 3 doses schedule as per WHO recommendations |
| **IMMZ.D2.DT.Cholera.WC-rBS vaccine 2 doses** | Recommended vaccinations for cholera following the WC-rBS vaccine 2 doses schedule as per WHO recommendations |
| **IMMZ.D18.S.Cholera.WC vaccines schedule** | Recommended WC vaccination schedule for cholera as per WHO recommendations |
| **IMMZ.D18.S.Cholera.WC-rBS vaccine 3 dose schedule** | Recommended WC-rBS vaccine 3 doses vaccination schedule for cholera as per WHO recommendations |
| **IMMZ.D18.S.Cholera.WC-rBS vaccine booster dose for children aged 2–5 years schedule** | Recommended WC-rBS vaccine booster dose for children aged 2–5 years vaccination schedule for cholera as per WHO recommendations |
| **IMMZ.D18.S.Cholera.WC-rBS vaccine 2 dose schedule** | Recommended WC-rBS vaccine 2 dose vaccination schedule for cholera as per WHO recommendations |
| **IMMZ.D18.S.Cholera.WC-rBS vaccine booster dose for children aged more than 6 years schedule** | Recommended WC-rBS vaccine booster dose for children aged more than 6 years vaccination schedule for cholera as per WHO recommendations |
| **IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 1 dose** | Recommended vaccinations for meningococcal following the MenA conjugate vaccine 1-dose schedule as per WHO recommendations |
| **IMMZ.D2.DT.Meningococcal.MenA conjugate vaccine 2 doses** | Recommended vaccinations for meningococcal following the MenA conjugate vaccine 2-dose schedule as per WHO recommendations |
| **IMMZ.D2.DT.Meningococcal.Monovalent MenC conjugate vaccine** | Recommended vaccinations for meningococcal following the monovalent MenC conjugate vaccine schedule as per WHO recommendations |
| **IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 1 dose** | Recommended vaccinations for meningococcal following the quadrivalent conjugate vaccines 1-dose schedule as per WHO recommendations |
| **IMMZ.D2.DT.Meningococcal.Quadrivalent conjugate vaccines 2 doses** | Recommended vaccinations for meningococcal following the quadrivalent conjugate vaccines 2-dose schedule as per WHO recommendations |
| **IMMZ.D2.DT.Meningococcal.Polysaccharide vaccines** | Recommended vaccinations for meningococcal following the polysaccharide vaccines schedule as per WHO recommendations |
| **IMMZ.D5.DT.Meningococcal contraindications** | Performing a contraindication check for meningococcal vaccines as per WHO recommendations |
| **IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 1-dose schedule** | Recommended MenA conjugate vaccine 1-dose vaccination schedule for meningococcal as per WHO recommendations |
| **IMMZ.D18.S.Meningococcal.MenA conjugate vaccine 2-dose schedule** | Recommended MenA conjugate vaccine 2-dose vaccination schedule for meningococcal as per WHO recommendations |
| **IMMZ.D18.S.Meningococcal.Monovalent MenC conjugate vaccine schedule** | Recommended monovalent MenC conjugate vaccination schedule for meningococcal as per WHO recommendations |
| **IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 1-dose schedule** | Recommended quadrivalent conjugate vaccines 1-dose vaccination schedule for meningococcal as per WHO recommendations |
| **IMMZ.D18.S.Meningococcal.Quadrivalent conjugate vaccines 2-dose schedule** | Recommended quadrivalent conjugate vaccines 2-dose vaccination schedule for meningococcal as per WHO recommendations |
| **IMMZ.D18.S.Meningococcal.Polysaccharide vaccines schedule** | Recommended polysaccharide vaccination schedule for meningococcal as per WHO recommendations |
| **IMMZ.D2.DT.Hepatitis A.Inactivated HAV 2 doses** | Recommended vaccinations for hepatitis A following the inactivated hepatitis A virus (HAV) 2-dose schedule as per WHO recommendations |
| **IMMZ.D2.DT.Hepatitis A.Inactivated HAV 1 dose** | Recommended vaccinations for hepatitis A following the inactivated HAV 1-dose schedule as per WHO recommendations |
| **IMMZ.D2.DT.Hepatitis A.Live attenuated HAV 1 dose** | Recommended vaccinations for hepatitis A following the live attenuated HAV 1-dose schedule as per WHO recommendations |
| **IMMZ.D5.DT.Hepatitis A contraindications** | Performing a contraindication check for hepatitis A vaccines as per WHO recommendations |
| **IMMZ.D18.S.Hepatitis A.Inactivated HAV 2-dose schedule** | Recommended inactivated HAV 2-dose vaccination schedule for hepatitis A as per WHO recommendations |
| **IMMZ.D18.S.Hepatitis A.Inactivated HAV 1-dose schedule** | Recommended inactivated HAV 1-dose vaccination schedule for hepatitis A as per WHO recommendations |
| **IMMZ.D18.S.Hepatitis A.Live attenuated HAV 1-dose schedule** | Recommended live attenuated HAV 1-dose vaccination schedule for hepatitis A as per WHO recommendations |
| **IMMZ.D2.DT.Rabies** | Recommended vaccinations for rabies as per WHO recommendations |
| **IMMZ.D5.DT.Rabies contraindications** | Performing a contraindication check for rabies vaccines as per WHO recommendations |
| **IMMZ.D18.S.Rabies schedule** | Recommended vaccination schedule for rabies as per WHO recommendations |
| **IMMZ.D2.DT.Dengue.3 doses with pre-vaccination screening** | Recommended vaccinations for dengue following the 3-dose schedule with pre-vaccination screening as per WHO recommendations |
| **IMMZ.D2.DT.Dengue.3 doses without pre-vaccination screening** | Recommended vaccinations for dengue following the 3-dose schedule without pre-vaccination screening as per WHO recommendations |
| **IMMZ.D5.DT.Dengue contraindications** | Performing a contraindication check for dengue vaccines as per WHO recommendations |
| **IMMZ.D18.S.Dengue schedule** | Recommended vaccination schedule for dengue as per WHO recommendations |
| **IMMZ.D2.DT.Malaria** | Recommended vaccinations for malaria as per WHO recommendations |
| **IMMZ.D5.DT.Malaria contraindications** | Performing a contraindication check for malaria vaccines as per WHO recommendations |
| **IMMZ.D18.S.Malaria schedule** | Recommended vaccination schedule for malaria as per WHO recommendations |
| **IMMZ.D2.DT.Mumps** | Recommended vaccinations for mumps as per WHO recommendations |
| **IMMZ.D5.DT.Mumps contraindications** | Performing a contraindication check for mumps vaccines as per WHO recommendations |
| **IMMZ.D18.S.Mumps schedule** | Recommended vaccination schedule for mumps as per WHO recommendations |
| **IMMZ.D2.DT.Seasonal influenza** | Recommended vaccinations for seasonal influenza as per WHO recommendations |
| **IMMZ.D5.DT.Seasonal influenza contraindications** | Performing a contraindication check for seasonal influenza vaccines as per WHO recommendations |
| **IMMZ.D18.S.Seasonal influenza schedule** | Recommended vaccination schedule for seasonal influenza as per WHO recommendations |
| **IMMZ.D2.DT.Varicella.1 dose** | Recommended vaccinations for varicella following the 1-dose schedule as per WHO recommendations |
| **IMMZ.D2.DT.Varicella.2 doses** | Recommended vaccinations for varicella following the 2-dose schedule as per WHO recommendations |
| **IMMZ.D5.DT.Varicella contraindications** | Performing a contraindication check for varicella vaccines as per WHO recommendations |
| **IMMZ.D18.S.Varicella.1-dose schedule** | Recommended 1-dose vaccination schedule for varicella as per WHO recommendations |
| **IMMZ.D18.S.Varicella.2-dose schedule** | Recommended 2-dose vaccination schedule for varicella as per WHO recommendations |
