This page includes indicators and performance metrics that would be aggregated from core data elements identified and is extracted from the [WHO Digital Adaptation Kit for Immunizations](https://iris.who.int/handle/10665/380303). 

For full operational descriptions of the indicators included and their references, see Web Annex C of the DAK. 
For machine-readable representations, see the <a href="indicators-measures.html">Indicators and Measures</a>. 

These indicators may be aggregated automatically from the digital tracking tool to populate a digital health management information system (HMIS). 

### Indicator table column descriptions

| Data Element | Description |
|----|----|
|Indicator code|An identifier for the indicator|
|Indicator name|A short name for the indicator|
|Description|A description about the indicator|
|Numerator definition|The description of numerator used to calculate the indicator.|
|Numerator computation|The calculation or how to derive this numerator. Any specific data elements noted here should align directly with the individual-level Data Element Name.|
|Denominator definition|The dglossescription of denominator used to calculate the indicator.|
|Denominator definition|The description of denominator used to calculate the indicator.|
|Denominator computation|The calculation or how to derive this denominator. Any specific data elements noted here should align directly with the individual-level Data Element Name.|
|Disaggregations|Are there any dis-aggregations that you would like to be able to do in order to conduct the necessary analysis?|
|References|If there are any national or global guidelines (e.g. WHO guidelines) that dictate how and why this indicator should be calculated or reported, it should be noted here. If any guidelines or recommendations change, having a clear reference listed would help in updating or restructuring your data.|				
|References|If there are any national or global guidelines (e.g. WHO guidelines) that dictate how and why this indicator should be calculated or reported, it should be noted here. If any guidelines or recommendations change, having a clear reference listed would help in updating or restructuring your data.|
{: .grid }

### Indicators and performance metrics table
The following indicators are extracted from the DAK for Immunizations (January 2025). The full indicators and performance metrics table is available in [Web Annex C of the DAK](https://worldhealthorganization.github.io/smart-dak-immz/indicators.html). To see linkages to references and full details of the L2 content, please reference the DAK. 

<div style="width: 100%; height: 500px; overflow: scroll;">
  <table border="1" class="dataframe table table-striped table-bordered">
    <thead style="position: sticky; top: 0; z-index: 100; background-color: white;">
      <tr style="text-align: right;">
        <th rowspan="2">Indicator ID</th>
        <th rowspan="2">Indicator name</th>
        <th rowspan="2">Indicator definition</th>
        <th colspan="2">Numerator</th>
        <th colspan="2">Denominator</th>
        <th rowspan="2">Disaggregations</th>
        <th rowspan="2">References</th>
        <th rowspan="2">Annotations</th>
      </tr>
      <tr>
        <th>Description</th>
        <th>Computation</th>
        <th>Description</th>
        <th>Computation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>IMMZ.IND.01</td>
        <td>Immunization coverage for BCG vaccine</td>
        <td>The percentage in the target population who have received one dose of bacille Calmette–Guérin (BCG) vaccine during the reporting period</td>
        <td>Number of BCG doses administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "BCG vaccines" AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO/UNICEF joint reporting form (1) WHO Immunization data portal (2) WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>
          The calculation for this indicator is in line with the administrative calculation provided on the WHO Immunization data portal.<br />
          As per WHO Immunization data portal, recommended denominator used in the administrative coverage calculation is live births.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.02</td>
        <td>Immunization coverage for pentavalent vaccine, 1st dose</td>
        <td>The percentage in the target population who have received the 1st dose of pentavalent vaccine during the reporting period</td>
        <td>Number of pentavalent doses (1st dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Pentavalent vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.03</td>
        <td>Immunization coverage for pentavalent vaccine, 2nd dose</td>
        <td>The percentage in the target population who have received a 2nd dose of pentavalent vaccine during the reporting period</td>
        <td>Number of pentavalent doses (2nd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Pentavalent vaccines" for the 2nd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.04</td>
        <td>Immunization coverage for pentavalent vaccine, 3rd dose</td>
        <td>The percentage in the target population who have received a 3rd dose of pentavalent vaccine during the reporting period</td>
        <td>Number of pentavalent doses (3rd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Pentavalent vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.05</td>
        <td>Immunization coverage for hepatitis B-containing vaccines (birth dose)</td>
        <td>The percentage in the target population who received hepatitis B-containing vaccine birth dose within the first 24 hours of birth during the reporting period</td>
        <td>Number of hepatitis B-containing vaccine birth doses administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Hepatitis B-containing vaccines" AND "Dose 0 administered" = "Yes" AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group: &lt; 24 hours of birth
        </td>
        <td>WHO/UNICEF joint reporting form (1) WHO Immunization data portal (2) WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>
          The calculation for this indicator is in line with the administrative calculation provided on the WHO Immunization data portal.<br />
          As per WHO Immunization data portal, recommended denominator used in the administrative coverage calculation is live births.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.06</td>
        <td>Immunization coverage for oral polio vaccine (OPV), 1st dose</td>
        <td>The percentage in the target population who have received the 1st dose of oral polio vaccine (OPV) during the reporting period</td>
        <td>Number of OPV doses (1st dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Oral polio vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.07</td>
        <td>Immunization coverage for oral polio vaccine (OPV), 2nd dose</td>
        <td>The percentage in the target population who have received a 2nd dose of OPV during the reporting period</td>
        <td>Number of OPV doses (2nd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Oral polio vaccines" for the 2nd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.08</td>
        <td>Immunization coverage for oral polio vaccine (OPV), 3rd dose</td>
        <td>The percentage in the target population who have received a 3rd dose of OPV during the reporting period</td>
        <td>Number of OPV doses (3rd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Oral polio vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.09</td>
        <td>Immunization coverage for inactivated polio vaccine (IPV), 1st dose</td>
        <td>The percentage in the target population who have received the 1st dose of inactivated polio vaccine (IPV) during the reporting period</td>
        <td>Number of IPV doses (1st dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Inactivated polio vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.10</td>
        <td>Immunization coverage for inactivated polio vaccine (IPV), 2nd dose</td>
        <td>The percentage in the target population who have received a 2nd dose of IPV during the reporting period</td>
        <td>Number of IPV doses (2nd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Inactivated polio vaccines" for the 2nd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.11</td>
        <td>Immunization coverage for inactivated polio vaccine (IPV), 3rd dose</td>
        <td>The percentage in the target population who have received a 3rd dose of IPV during the reporting period</td>
        <td>Number of IPV doses (3rd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Inactivated polio vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.12</td>
        <td>Immunization coverage for measles and rubella-containing vaccine, 1st dose</td>
        <td>The percentage in the target population who have received a 1st dose of measles and rubella-containing vaccine during the reporting period</td>
        <td>Number of measles and rubella-containing vaccine doses (1st dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Measles and rubella-containing vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.13</td>
        <td>Immunization coverage for measles and rubella-containing vaccine, 2nd dose</td>
        <td>The percentage in the target population who have received the 2nd dose of measles and rubella-containing vaccine during the reporting period</td>
        <td>Number of measles and rubella-containing vaccine doses (2nd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Measles and rubella-containing vaccines" for the 2nd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.14</td>
        <td>Immunization coverage for HPV vaccine, 1st dose</td>
        <td>The percentage in the target population who have received the 1st dose of human papillomavirus (HPV) vaccine during the reporting period</td>
        <td>Number of HPV vaccine doses (1st dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "HPV vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.15</td>
        <td>Immunization coverage for HPV vaccine, 2nd dose</td>
        <td>The percentage in the target population who have received the 2nd dose of HPV vaccine during the reporting period</td>
        <td>Number of HPV vaccine doses (2nd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "HPV vaccines" for the 2nd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.16</td>
        <td>Immunization coverage for meningococcal vaccine</td>
        <td>The percentage in the target population who have received a meningococcal vaccine during the reporting period</td>
        <td>Number of meningococcal vaccine doses administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Meningococcal vaccines" AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO/UNICEF joint reporting form (1) WHO Immunization data portal (2) WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>
          The calculation for this indicator is in line with the administrative calculation provided on the WHO Immunization data portal.<br />
          As per WHO Immunization data portal, recommended denominator used in the administrative coverage calculation for meningococcal A conjugate vaccine is surviving infants. For other meningococcal vaccines, recommended denominator
          should be specified by Member States as recommended schedules may vary.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.17</td>
        <td>Immunization coverage for pneumococcal conjugate vaccine, 1st dose</td>
        <td>The percentage in the target population who have received the 1st dose of pneumococcal conjugate vaccine during the reporting period</td>
        <td>Number of pneumococcal vaccine doses (1st dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Pneumococcal vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO/UNICEF joint reporting form (1) WHO Immunization data portal (2) WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>
          The calculation for this indicator is in line with the administrative calculation provided on the WHO Immunization data portal.<br />
          As per WHO Immunization data portal, recommended denominator used in the administrative coverage calculation is surviving infants for doses recommended in the first year of life. Then, the single age cohort population estimates
          for the targeted cohort.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.18</td>
        <td>Immunization coverage for pneumococcal conjugate vaccine, 2nd dose</td>
        <td>The percentage in the target population who have received a 2nd dose of pneumococcal conjugate vaccine during the reporting period</td>
        <td>Number of pneumococcal vaccine doses (2nd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Pneumococcal vaccines" for the 2nd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO/UNICEF joint reporting form (1) WHO Immunization data portal (2) WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>
          The calculation for this indicator is in line with the administrative calculation provided on the WHO Immunization data portal.<br />
          As per WHO Immunization data portal, recommended denominator used in the administrative coverage calculation is surviving infants for doses recommended in the first year of life. Then, the single age cohort population estimates
          for the targeted cohort.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.19</td>
        <td>Immunization coverage for pneumococcal conjugate vaccine, 3rd dose</td>
        <td>The percentage in the target population who have received a 3rd dose of pneumococcal conjugate vaccine during the reporting period</td>
        <td>Number of pneumococcal vaccine doses (3rd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Pneumococcal vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>
          WHO/UNICEF joint reporting form (1)<br />
          WHO Immunization data portal (2)<br />
          WHO Immunization facility analysis guide (5)<br />
          WHO Handbook on immunization data (6)
        </td>
        <td>
          The calculation for this indicator is in line with the administrative calculation provided on the WHO Immunization data portal.<br />
          As per WHO Immunization data portal, recommended denominator used in the administrative coverage calculation is surviving infants for doses recommended in the first year of life. Then, the single age cohort population estimates
          for the targeted cohort.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.20</td>
        <td>Immunization coverage for rotavirus vaccines, 1st dose</td>
        <td>The percentage in the target population who have received a 1st dose of rotavirus vaccine during the reporting period</td>
        <td>Number of rotavirus vaccine doses (1st dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Rotavirus vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO/UNICEF joint reporting form (1) WHO Immunization data portal (2) WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>
          The calculation for this indicator is in line with the administrative calculation provided on the WHO Immunization data portal.<br />
          As per WHO Immunization data portal, recommended denominator used in the administrative coverage calculation is surviving infants.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.21</td>
        <td>Immunization coverage for rotavirus vaccines, 2nd dose</td>
        <td>The percentage in the target population who have received a 2nd dose of rotavirus vaccine during the reporting period</td>
        <td>Number of rotavirus vaccine doses (2nd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Rotavirus vaccines" for the 2nd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.22</td>
        <td>Immunization coverage for rotavirus vaccines, 3rd dose</td>
        <td>The percentage in the target population who have received a 3rd dose of rotavirus vaccine during the reporting period</td>
        <td>Number of rotavirus vaccine doses (3rd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Rotavirus vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.23</td>
        <td>Immunization coverage for tetanus and diphtheria-containing vaccines (DT), 4th dose</td>
        <td>The percentage in the target population who have received a 4th dose of a tetanus and diphtheria-containing vaccine (DT) during the reporting period</td>
        <td>Number of tetanus and diphtheria-containing vaccine doses (4th dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Tetanus and diphtheria-containing vaccines (DT)" for the 4th dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.24</td>
        <td>Immunization coverage for tetanus and diphtheria-containing vaccines (Td), 5th dose</td>
        <td>The percentage in the target population who have received a 5th dose of tetanus and diphtheria-containing vaccine (Td) during the reporting period</td>
        <td>Number of tetanus and diphtheria-containing vaccine doses (5th dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Tetanus and diphtheria-containing vaccines (Td)" for the fifth dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.25</td>
        <td>Immunization coverage for tetanus and diphtheria-containing vaccines (Td), 6th dose</td>
        <td>The percentage in the target population who have received a sixth dose of tetanus and diphtheria-containing vaccine (Td) during the reporting period</td>
        <td>Number of tetanus and diphtheria-containing vaccine doses (6th dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Tetanus and diphtheria-containing vaccines (Td)" for the sixth dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.26</td>
        <td>Immunization coverage for yellow fever vaccine</td>
        <td>The percentage in the target population who have received one dose of yellow fever vaccine during the reporting period</td>
        <td>Number of yellow fever vaccine doses administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Yellow fever vaccines" AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO/UNICEF joint reporting form (1) WHO Immunization data portal (2) WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>
          The calculation for this indicator is in line with the administrative calculation provided on the WHO Immunization data portal.<br />
          As per WHO Immunization data portal, recommended denominator used in the administrative coverage calculation is surviving infants for countries recommending yellow fever vaccination in the first year of life. Then, the single age
          cohort population estimates for the targeted cohort.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.27</td>
        <td>Immunization coverage for JE vaccines</td>
        <td>The percentage in the target population who have received Japanese encephalitis (JE) vaccine during the reporting period</td>
        <td>Number of JE vaccine doses administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "JE vaccines" AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO/UNICEF joint reporting form (1) WHO Immunization data portal (2) WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>
          The calculation for this indicator is in line with the administrative calculation provided on the WHO Immunization data portal.<br />
          As per WHO Immunization data portal, recommended denominator should be specified by Member States as recommended schedules may vary.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.28</td>
        <td>Immunization coverage for typhoid vaccines</td>
        <td>The percentage in the target population who have received typhoid vaccine during the reporting period</td>
        <td>Number of typhoid vaccine doses administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Typhoid vaccines" AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO/UNICEF joint reporting form (1) WHO Immunization data portal (2) WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>
          The calculation for this indicator is in line with the administrative calculation provided on the WHO Immunization data portal.<br />
          As per WHO Immunization data portal, recommended denominator should be specified by Member States as recommended schedules may vary.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.29</td>
        <td>Immunization coverage for seasonal influenza vaccines</td>
        <td>The percentage in the target population who have received seasonal influenza vaccines during the reporting period</td>
        <td>Number of seasonal influenza vaccine doses administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Seasonal influenza vaccines" AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)<br />
          Risk &amp; occupational group
        </td>
        <td>WHO/UNICEF joint reporting form (1) WHO Immunization data portal (2) WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>
          The calculation for this indicator is in line with the administrative calculation provided on the WHO Immunization data portal.<br />
          As per WHO Immunization data portal, recommended denominator should be specified by Member States as recommended schedules may vary.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.30</td>
        <td>Immunization coverage for COVID-19 vaccines</td>
        <td>The percentage in the target population who have received COVID-19 vaccine during the reporting period</td>
        <td>Number of COVID-19 vaccine doses administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "COVID-19 vaccines" AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)<br />
          Risk &amp; occupational group
        </td>
        <td>WHO/UNICEF joint reporting form (1) Monitoring COVID-19 vaccination (3) WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.31</td>
        <td>Immunization coverage for malaria vaccines, 1st dose</td>
        <td>The percentage in the target population who have received a 1st dose of malaria vaccine during the reporting period</td>
        <td>Number of malaria vaccine doses (1st dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Malaria vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.32</td>
        <td>Immunization coverage for malaria vaccines, 2nd dose</td>
        <td>The percentage in the target population who have received a 2nd dose of malaria vaccine during the reporting period</td>
        <td>Number of malaria vaccine doses (2nd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Malaria vaccines" for the 2nd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.33</td>
        <td>Immunization coverage for malaria vaccines, 3rd dose</td>
        <td>The percentage in the target population who have received the 3rd dose of malaria vaccine during the reporting period</td>
        <td>Number of malaria vaccine doses (3rd dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Malaria vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.34</td>
        <td>Immunization coverage for malaria vaccines, 4th dose</td>
        <td>The percentage in the target population who have received the 4th dose of malaria vaccine during the reporting period</td>
        <td>Number of malaria vaccine doses (4th dose) administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "Malaria vaccines" for the 4th dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5) WHO Handbook on immunization data (6)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.35</td>
        <td>Drop-out rate of pentavalent vaccine 1st dose to pentavalent vaccine 3rd dose</td>
        <td>
          The percentage in the target population who received a 1st dose of pentavalent vaccine but have not received the 3rd dose of pentavalent vaccine (i.e. are past due for the 3rd dose of pentavalent vaccine) during the reporting
          period
        </td>
        <td>
          Number of clients who received a 1st dose of pentavalent vaccine during the reporting period who should have received (via scheduling logic) the 3rd dose of pentavalent vaccine during the reporting period but did not receive it
        </td>
        <td>
          (COUNT of clients with an immunization event WHERE "Vaccine type" = "Pentavalent vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period) - (COUNT of clients with an
          immunization event WHERE "Vaccine type" = "Pentavalent vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period)
        </td>
        <td>Number of clients in the target population who received dose 1 of pentavalent vaccine during the reporting period</td>
        <td>Count clients with an immunization event WHERE "Vaccine type" = "pentavalent vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.36</td>
        <td>Drop-out rate of BCG to measles and rubella-containing vaccine 1st dose</td>
        <td>
          The percentage in the target population who received a dose of BCG vaccine at birth (or early life) but have not received the 1st dose of measles and rubella-containing vaccine (i.e. are past due for measles and rubella-containing
          vaccine 1st dose) during the reporting period
        </td>
        <td>Number of clients who received BCG vaccine during the reporting period who should have received 1st dose of measles and rubella-containing vaccine during the reporting period but did not receive it</td>
        <td>
          (COUNT of clients with an immunization event WHERE "Vaccine type"" = "BCG vaccines" AND "Date and time of vaccination" is during the reporting period) - (COUNT of clients with an immunization event WHERE "Vaccine type" = "Measles
          and rubella-containing vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period)
        </td>
        <td>Number of clients in the target population who received BCG vaccine during the reporting period</td>
        <td>COUNT clients with an immunization event WHERE "Vaccine type" = "BCG vaccines" AND "Date and time of vaccination" is during the reporting period</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.37</td>
        <td>Drop-out rate from the 1st dose of measles and rubella-containing vaccine to the 2nd dose</td>
        <td>
          The percentage in the target population who received a 1st dose of measles and rubella-containing vaccine in the primary series but have not received the 2nd dose of measles and rubella-containing vaccine in the primary series
          (i.e. are past due for measles and rubella-containing vaccine 2nd dose) during the reporting period
        </td>
        <td>
          Number of clients who received a 1st dose of measles and rubella-containing vaccine during the reporting period who should have received the 2nd dose of measles and rubella-containing vaccine during the reporting period but did
          not receive it
        </td>
        <td>
          (COUNT of clients with an immunization event WHERE "Vaccine type"" = "Measles and rubella-containing vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period) - (COUNT of
          clients with an immunization event WHERE "Vaccine type"" = "Measles and rubella-containing vaccines" for the 2nd dose in the primary series AND "Date and time of vaccination" is during the reporting period)
        </td>
        <td>Number of clients in the target population who received dose 1 of measles and rubella-containing vaccine during the reporting period</td>
        <td>COUNT clients with an immunization event WHERE "Vaccine type" = "Measles and rubella-containing vaccines" for a 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>WHO Immunization facility analysis guide (5)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.38</td>
        <td>Drop-out rate from the 1st dose of malaria vaccines to the 3rd dose</td>
        <td>The percentage in the target population who received a 1st dose of malaria vaccine but have not received the 3rd dose of malaria vaccine (i.e. are past due for malaria vaccine 3rd dose) during the reporting period</td>
        <td>Number of clients who received a 1st dose of malaria vaccine during the reporting period who should have received (via scheduling logic) the 3rd dose of malaria vaccine during the reporting period but did not receive it</td>
        <td>
          (COUNT of clients with an immunization event WHERE "Vaccine type" = "Malaria vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period) - (COUNT of clients with an
          immunization event WHERE "Vaccine type" = "Malaria vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period)
        </td>
        <td>Number of clients in the target population who received dose 1 of malaria vaccine during the reporting period</td>
        <td>COUNT clients with an immunization event WHERE "Vaccine type" = "Malaria vaccines" for the 1st dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>Guide to introduce malaria vaccine (4)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.39</td>
        <td>Drop-out rate from the 3rd dose of malaria vaccines to the 4th dose</td>
        <td>The percentage in the target population who received a 3rd dose of malaria vaccine but have not received the 4th dose of malaria vaccine (i.e. are past due for malaria vaccine 4th dose) during the reporting period</td>
        <td>Number of clients who received the 3rd dose of malaria vaccine during the reporting period who should have received (via scheduling logic) the 4th dose of malaria vaccine during the reporting period but did not receive it</td>
        <td>
          (COUNT of clients with an immunization event WHERE "Vaccine type" = "Malaria vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period) - (COUNT of clients with an
          immunization event WHERE "Vaccine type" = "Malaria vaccines" for the 4th dose in the primary series AND "Date and time of vaccination" is during the reporting period)
        </td>
        <td>Number of clients in the target population who received dose 3 of malaria vaccine during the reporting period</td>
        <td>COUNT clients with an immunization event WHERE "Vaccine type" = "Malaria vaccines" for the 3rd dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>Guide to introduce malaria vaccine (4)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.40</td>
        <td>Closed vial wastage rate</td>
        <td>The percentage of doses of vaccine that were not opened and discarded during the reporting period</td>
        <td>Number of doses of vaccine product that were discarded</td>
        <td>"Closed stock discarded" × "Number of doses per vial" during the reporting period</td>
        <td>Total number of doses in stock and available for use during the reporting period</td>
        <td>("Initial balance" + "Stock received") × "Number of doses per vial" during the reporting period</td>
        <td>
          Vaccine type: BCG, OPV, etc.<br />
          Closed stock discarded type (broken, expired product, etc)<br />
          Administrative area
        </td>
        <td>WHO Immunization facility analysis guide (5)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.41</td>
        <td>Open vial wastage rate</td>
        <td>The percentage of doses of vaccine that were opened, but discarded due to under-utilization during the reporting period</td>
        <td>Number of doses of vaccine product that were opened but not administered during the reporting period</td>
        <td>("Stock opened" × "Number of doses per vial") - "Administered doses" during the reporting period</td>
        <td>The total number of doses opened during the reporting period</td>
        <td>"Stock opened" × "Number of doses per vial" during the reporting period</td>
        <td>
          Vaccine type: BCG, OPV, etc.<br />
          Administrative area
        </td>
        <td>WHO Immunization facility analysis guide (5)</td>
        <td>
          The use of reporting these values on session or day will depend on the business processes and reporting requirements used in implementing countries. Some Member States track vaccine wastage using issued doses at the start and end
          of each vaccination session (scheduled, outreach, etc.) whilse others may report it using daily counts.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.42</td>
        <td>Availability of vaccine stock and supplies</td>
        <td>The proportion of vaccination locations that had availability of vaccine stock or injection supplies during (or for) the reporting period or sub-period</td>
        <td>The number of vaccination locations with stock available (i.e. no stock-outs) during (or for) the reporting period or sub-period</td>
        <td>COUNT of vaccination locations that were able to fulfill all vaccination activities</td>
        <td>Total number of vaccination locations</td>
        <td>COUNT all vaccination locations in the region</td>
        <td>
          Administrative area<br />
          Vaccine type/supply type
        </td>
        <td>WHO Immunization facility analysis guide (5)</td>
        <td>
          The implementer may choose to provide a mechanism for a designated electronic immunization registry user to enter these context-specific values (i.e. number of facilities that have no stock-outs) as an input.<br />
          Where an electronic immunization registry or logistics management system allows for it, tracking of stock-outs at a more granular level is preferred, such as number of days a product was out of stock.<br />
          On an individual level, stock-outs and supply chain issues may also be analysed using data collected on vaccinations that could not be administered where the reason given was from a stock-out (“Reason vaccine was not administered”
          = “Product out of stock”) to identify potential supply chain or workflow challenges.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.43</td>
        <td>Functional status of cold-chain storage equipment</td>
        <td>The proportion of refrigerators that are functional within a vaccination location during the reporting period</td>
        <td>The number of functional refrigerators in the vaccination location</td>
        <td>COUNT refrigerators that are functional during the reporting period</td>
        <td>The number of refrigerators that are present in the vaccination location.</td>
        <td>COUNT total refrigerators (regardless of status)</td>
        <td>Administrative area</td>
        <td>WHO Immunization facility analysis guide (5)</td>
        <td>
          The definition of functional status is at the discretion of Member States, contingent upon the types of vaccines the equipment stores and considering factors such as temperature range, and so on.<br />
          The implementer may choose to provide a mechanism for a designated electronic immunization registry user to enter these context-specific values (i.e. number of refrigerators) as an input or configuration.
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.44</td>
        <td>Adverse event following immunization (AEFI) cases</td>
        <td>The total number of adverse events following the administration of vaccines during the reporting period</td>
        <td>Number of AEFI cases during the reporting period</td>
        <td>COUNT of immunization events WHERE "Reaction reported" is "Yes" AND "Date and time of vaccination" is during the reporting period</td>
        <td>Not applicable</td>
        <td>Not applicable</td>
        <td>
          Vaccine type: BCG, OPV, etc.<br />
          Vaccine manufacturer<br />
          Type of reaction: non-serious, disability, etc.<br />
          Administrative area<br />
          Reaction manifestation: rash, vomiting, etc.
        </td>
        <td>WHO Immunization facility analysis guide (5)</td>
        <td>–</td>
      </tr>
      <tr>
        <td>IMMZ.IND.45</td>
        <td>Immunization session completion rate</td>
        <td>The percentage of immunization sessions completed during the reporting period</td>
        <td>Number of immunization sessions completed at the vaccination location during the reporting period</td>
        <td>COUNT of immunization events WHERE "Immunization event status" = "Completed" during the reporting period</td>
        <td>Number of planned immunization sessions at the vaccination location during the reporting period</td>
        <td>COUNT number of planned sessions during the reporting period</td>
        <td>
          Vaccination location<br />
          Administrative area
        </td>
        <td>WHO Immunization facility analysis guide (5)</td>
        <td>–</td>
      </tr>
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td colspan="10">
          For national or programmatic level tracking, it may be recommended for countries to monitor immunization coverage for individual doses and/or for additional vaccines that are currently not monitored globally (i.e. cholera, TBE).
          For such, the following indicator template can be used:
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.[serial number]</td>
        <td>Immunization coverage for [antigen name (e.g. cholera)] vaccines</td>
        <td>The percentage in the target population who have received [number of dose(s) (e.g. 1)] of [antigen name (e.g. cholera)] vaccine during the reporting period</td>
        <td>Number of [antigen name (e.g. cholera)] dose [dose number (e.g. 1)] administered through routine services during the reporting period</td>
        <td>COUNT of immunization events WHERE "Vaccine type" = "[antigen name (e.g. cholera)] vaccines" for the [dose number (e.g. 1st)] dose in the primary series AND "Date and time of vaccination" is during the reporting period</td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>[Add appropriate reference]</td>
        <td>[Add any additional notes or comments]</td>
      </tr>
      <tr>
        <td>IMMZ.IND.[serial number]</td>
        <td>Simultaneous vaccination coverage for [antigen name A (e.g. penta)] and [antigen name B (e.g. OPV)]</td>
        <td>
          The percentage in the target population who have received both [number of dose of antigen A (e.g. 3rd dose)] of [antigen name A (e.g. penta)] and [number of dose of antigen B (e.g. 3rd dose)] of [antigen name B (e.g. OPV)] on the
          same date
        </td>
        <td>Number of [antigen name A (e.g. penta)] dose [dose number (e.g. 3)] administered on the same date of [antigen name B (e.g. OPV)] dose [dose number (e.g. 3)]</td>
        <td>
          COUNT of immunization events WHERE "Vaccine type" = "[antigen name A (e.g. pentavalent)] vaccines" for the [dose number (e.g. 1st)] dose in the primary series AND "[antigen name B (e.g. OPV)] vaccines" for the [dose number (e.g.
          1st)] dose in the primary series AND "Date and time of vaccination" is on the same date
        </td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>[Add appropriate reference]</td>
        <td>[Add any additional notes or comments]</td>
      </tr>
      <tr>
        <td>IMMZ.IND.[serial number]</td>
        <td>Timeliness of vaccination for [number of dose(s) (e.g. 1 dose)] of [antigen name (e.g. cholera)]</td>
        <td>The percentage in the target population who have received the [number of dose(s) (e.g. 1)] dose of the [antigen name (e.g. cholera)] vaccine by [age defined by the Member State (e.g. 12 months of age)]</td>
        <td>Number of clients who received [number of dose(s) (e.g. 1)] dose of the [antigen name (e.g. cholera)] vaccine by [age defined by the Member State (e.g. 12 months of age)]</td>
        <td>
          COUNT of clients WHERE  "Vaccine type" = "[antigen name (e.g. cholera)] containing vaccines" for the [dose number (e.g. 1st)] dose in the primary series AND "Age" is within [age defined by the Member State (e.g. 12 months of age)]
        </td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>[Add appropriate reference]</td>
        <td>
          The time defined by the Member State needs to be less than the age included in the coverage estimation. For example, in a schedule DTP3 of 6 months. If the country considers the coverage doses of DTP3 received before 1 year, the
          time used to define timely doses for DTP3 should be 8 months.<br />
          [Add any additional notes or comments]
        </td>
      </tr>
      <tr>
        <td>IMMZ.IND.[serial number]</td>
        <td>Immunization coverage for complete schedule of [antigen name A, antigen name B, antigen name C, etc. (e.g. BCG, penta1, penta2, penta3, OPV1, OPV2 and OPV3)]</td>
        <td>The percentage in the target population who have received the complete immunization schedule consisting of [antigen names and dose numbers (e.g. BCG, penta1, penta2, penta3, OPV1, OPV2 and OPV3)] by the recommended age</td>
        <td>
          Number of clients who have completed the immunization schedule consisting of [number of dose of antigen A] of [antigen name A], [number of dose of antigen B] of [antigen name B], [number of dose of antigen C] of [antigen name C],
          [number of dose...] of [antigen name...] during reporting period
        </td>
        <td>
          COUNT of clients who received  "Vaccine type" = "[antigen name A] containing vaccines" for the [dose number (e.g. 1st)] dose in the primary series, "Vaccine type" = "[antigen name B] containing vaccines" for the [dose number] dose
          in the primary series,  "Vaccine type" = "[antigen name...] containing vaccines" for the [dose number...] dose in the primary series AND "Date and time of vaccination" is during the reporting period
        </td>
        <td>Number in target group</td>
        <td>As defined by the Member States</td>
        <td>
          Administrative area<br />
          Sex<br />
          Age in years<br />
          Age group (depending on schedule)
        </td>
        <td>[Add appropriate reference]</td>
        <td>
          The moment in the client's life that this indicator is going to be messured (e.g. 12 months) needs to be defined by the Member State and the "complete schedule" should include all the doses of vaccines included before that moment.
          <br />
          [Add any additional notes or comments]
        </td>
      </tr>
    </tbody>
  </table>
</div>