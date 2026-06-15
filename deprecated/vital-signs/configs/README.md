# Vital Signs Package Configuration

## Running with Vital Signs Settings

To run the Honeycomb application with the Vital Signs module activated:

```bash
# From the main honeycomb directory
meteor run --settings packages/vital-signs/configs/settings.vital-signs.json
```

## Configuration Options

The settings file includes:

- **Chart Library**: Switch between 'recharts' (default) or 'nivo'
- **Time Ranges**: Configure default time range for charts
- **Vital Sign Types**: Enable/disable specific vital sign codes
- **Theme**: Custom colors for vital signs visualization

## Vital Sign Codes

- `8867-4` - Heart Rate
- `8480-6` - Systolic Blood Pressure  
- `8462-4` - Diastolic Blood Pressure
- `8310-5` - Body Temperature
- `9279-1` - Respiratory Rate
- `59408-5` - Oxygen Saturation
- `29463-7` - Body Weight
- `39156-5` - Body Mass Index (BMI)