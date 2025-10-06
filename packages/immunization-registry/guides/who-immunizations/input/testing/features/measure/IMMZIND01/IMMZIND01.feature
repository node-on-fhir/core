Feature: IMMZ.IND.01 Immunization coverage for BCG vaccine

  Scenario: Evaluate the IND.01 measure
    Given call read('../../IMMZ.feature@create') { "file": "./Bundle-IMMZIND01.json" }

    And url urlBase
    And path 'Measure/IMMZIND01/$evaluate-measure'
    And params { periodStart: '2025-01-01', periodEnd: '2025-06-30' }
    When method get
    Then status 200
    And match response.group[0].population[?(@.id=='IMMZ.IND.01.IP')].count == [27]
    And match response.group[0].population[?(@.id=='IMMZ.IND.01.D')].count == [27]
    And match response.group[0].population[?(@.id=='IMMZ.IND.01.N')].count == [1]

    And call read('../../IMMZ.feature@delete') { "file": "./Bundle-DEL-IMMZIND01.json" }


