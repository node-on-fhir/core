// packages/vital-signs/lib/valueSets/units/TemperatureUnits.js

export const TemperatureUnits = {
  resourceType: "ValueSet",
  id: "temperature-units",
  url: "http://hl7.org/fhir/ValueSet/ucum-vitals-temperature",
  version: "1.0.0",
  name: "TemperatureUnits",
  title: "Temperature Units",
  status: "active",
  experimental: false,
  date: "2025-01-01",
  publisher: "HL7 International",
  description: "Common UCUM units for measuring body temperature in vital signs",
  compose: {
    include: [{
      system: "http://unitsofmeasure.org",
      concept: [
        {
          code: "Cel",
          display: "degree Celsius"
        },
        {
          code: "[degF]",
          display: "degree Fahrenheit"
        },
        {
          code: "K",
          display: "kelvin"
        }
      ]
    }]
  }
};

export default TemperatureUnits;