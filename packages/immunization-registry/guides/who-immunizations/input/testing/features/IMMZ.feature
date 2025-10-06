@ignore
Feature: Scenarios for IMMZ

  @bundle
  Scenario: Process a transaction bundle on the server
    Given url urlBase
    And request data
    And header Content-type = 'application/fhir+json'
    When method post
    Then status 200

  @create
  Scenario: Process a create transaction bundle on the server
    Given def data = read(file)
    And def created = call read('@bundle') 
    And match each created.response.entry..response.status == "#regex 20[01] (Created|OK)"

  @update
  Scenario: Process an update transaction bundle on the server
    Given def data = read(file)
    And def created = call read('@bundle')
    And match each created.response.entry..response.status == "200 OK"

  @delete
  Scenario: Process a delete transaction bundle on the server
    Given def data = read(file)
    And def deleted = call read('@bundle')
    And match each deleted.response.entry..response.status == "204 No Content"