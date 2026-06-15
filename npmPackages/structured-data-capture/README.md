# clinical:structured-data-capture

FHIR Structured Data Capture implementation for Meteor applications. This package provides a comprehensive solution for rendering FHIR Questionnaires and capturing QuestionnaireResponses with full support for the FHIR R4 specification.

## Features

- **Complete FHIR Support**: All FHIR R4 question types including boolean, choice, date, decimal, integer, string, text, url, attachment, reference, and quantity
- **Tree Walking**: Robust recursive algorithms for navigating complex nested questionnaire structures
- **Conditional Logic**: Full support for enableWhen conditions with all operators
- **Validation**: Built-in validation for required fields, data types, and custom constraints
- **Progress Tracking**: Real-time completion tracking with visual indicators
- **Response Tracking**: Detailed analytics including timing, focus tracking, and change history
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Customizable**: Extensible architecture with custom renderers and hooks

## Installation

```bash
meteor add clinical:structured-data-capture
```

## Basic Usage

```javascript
import { QuestionnaireForm } from 'meteor/clinical:structured-data-capture';

function MyQuestionnairePage() {
  const questionnaire = {
    resourceType: 'Questionnaire',
    id: 'example-questionnaire',
    title: 'Patient Information Form',
    status: 'active',
    item: [
      {
        linkId: 'name',
        text: 'What is your name?',
        type: 'string',
        required: true
      },
      {
        linkId: 'dob',
        text: 'What is your date of birth?',
        type: 'date',
        required: true
      },
      {
        linkId: 'symptoms',
        text: 'Are you experiencing any symptoms?',
        type: 'boolean'
      },
      {
        linkId: 'symptom-list',
        text: 'Which symptoms are you experiencing?',
        type: 'choice',
        repeats: true,
        enableWhen: [{
          question: 'symptoms',
          operator: '=',
          answerBoolean: true
        }],
        answerOption: [
          { valueCoding: { code: 'fever', display: 'Fever' } },
          { valueCoding: { code: 'cough', display: 'Cough' } },
          { valueCoding: { code: 'fatigue', display: 'Fatigue' } }
        ]
      }
    ]
  };

  const handleSubmit = async (response, trackingData) => {
    // Save to database
    await Meteor.callAsync('QuestionnaireResponse.submit', response.id, questionnaire);
    console.log('Response submitted:', response);
    console.log('Tracking data:', trackingData);
  };

  return (
    <QuestionnaireForm
      questionnaire={questionnaire}
      onSubmit={handleSubmit}
      showProgress={true}
      showSidebar={true}
    />
  );
}
```

## Advanced Features

### Custom Renderers

```javascript
import { QuestionnaireForm } from 'meteor/clinical:structured-data-capture';

function CustomSliderQuestion({ item, value, onChange, readOnly }) {
  return (
    <Slider
      value={value || 0}
      onChange={(e, newValue) => onChange(newValue)}
      disabled={readOnly}
      min={0}
      max={10}
      marks
      valueLabelDisplay="on"
    />
  );
}

<QuestionnaireForm
  questionnaire={questionnaire}
  customRenderers={{
    'pain-scale': CustomSliderQuestion  // Use linkId
    // or
    'integer': CustomSliderQuestion      // Override all integer types
  }}
/>
```

### Thank You Page

```javascript
<QuestionnaireForm
  questionnaire={questionnaire}
  onSubmit={handleSubmit}
  thankYouPage={{
    show: true,
    message: "Thank you for completing the survey!",
    subMessage: "Your responses have been recorded.",
    redirectUrl: "/dashboard",
    redirectDelay: 5000
  }}
/>
```

### Response Tracking

```javascript
import { useResponseTracking } from 'meteor/clinical:structured-data-capture';

function TrackedQuestionnaire() {
  const tracking = useResponseTracking(response, {
    trackTiming: true,
    trackChanges: true,
    trackFocus: true
  });

  // Get statistics
  const stats = tracking.getStatistics();
  console.log('Time spent:', stats.durationMinutes, 'minutes');
  console.log('Total changes:', stats.totalChanges);

  // Undo/redo support
  if (tracking.canUndo) {
    const lastChange = tracking.undo();
    // Restore previous value
  }
}
```

### Server Methods

```javascript
// Create a new response
const responseId = await Meteor.callAsync('QuestionnaireResponse.create', questionnaire, {
  subject: { reference: 'Patient/123' },
  encounter: { reference: 'Encounter/456' }
});

// Update response
await Meteor.callAsync('QuestionnaireResponse.update', responseId, {
  item: updatedItems,
  status: 'in-progress'
});

// Submit response
await Meteor.callAsync('QuestionnaireResponse.submit', responseId, questionnaire);

// List responses
const responses = await Meteor.callAsync('QuestionnaireResponse.list', {
  questionnaire: 'Questionnaire/example',
  status: 'completed',
  authored: {
    start: '2024-01-01',
    end: '2024-12-31'
  }
});

// Export response
const csvData = await Meteor.callAsync('QuestionnaireResponse.export', responseId, 'csv');
```

## Utilities

### QuestionnaireUtils

```javascript
import { QuestionnaireUtils } from 'meteor/clinical:structured-data-capture';

// Walk through questionnaire tree
QuestionnaireUtils.walkQuestionnaireTree(questionnaire.item, (item, index, depth) => {
  console.log(`${' '.repeat(depth * 2)}${item.linkId}: ${item.text}`);
});

// Find item by linkId
const item = QuestionnaireUtils.findItemByLinkId(questionnaire, 'symptoms');

// Check if item is enabled
const isEnabled = QuestionnaireUtils.isItemEnabled(item, response);

// Calculate completion
const stats = QuestionnaireUtils.calculateCompletionStatus(questionnaire, response);
console.log(`${stats.percentage}% complete (${stats.answered}/${stats.total})`);
```

### ResponseUtils

```javascript
import { ResponseUtils } from 'meteor/clinical:structured-data-capture';

// Initialize new response
const response = ResponseUtils.initializeResponse(questionnaire, {
  subject: { reference: 'Patient/123' }
});

// Update answer
const updatedResponse = ResponseUtils.updateAnswer(response, 'symptoms', true, 'boolean');

// Extract all answers
const answers = ResponseUtils.extractAnswers(response);
console.log(answers); // { symptoms: true, name: 'John Doe', ... }

// Validate response
const validation = ResponseUtils.validateResponse(questionnaire, response);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

## Component Props

### QuestionnaireForm

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| questionnaire | Object | required | FHIR Questionnaire resource |
| questionnaireResponse | Object | null | Existing response to edit |
| onSubmit | Function | null | Called when form is submitted |
| onSave | Function | null | Called to save progress |
| onCancel | Function | null | Called when cancel is clicked |
| showProgress | Boolean | true | Show completion progress |
| showSidebar | Boolean | false | Show navigation sidebar |
| showLinkIds | Boolean | false | Show linkId badges |
| showValidation | Boolean | true | Enable validation |
| enableTracking | Boolean | true | Enable response tracking |
| thankYouPage | Object | null | Thank you page configuration |
| customRenderers | Object | {} | Custom question renderers |
| readOnly | Boolean | false | Make form read-only |
| autoSave | Boolean | true | Enable auto-save |
| autoSaveDelay | Number | 1000 | Auto-save delay in ms |

## Supported Question Types

- **boolean**: Yes/no questions with radio or toggle switch
- **choice**: Single or multiple choice with radio, checkbox, or dropdown
- **open-choice**: Choice with "other" option
- **date**: Date picker
- **dateTime**: Date and time picker
- **time**: Time picker
- **decimal**: Decimal number input with optional slider
- **integer**: Integer input with optional spinner
- **string**: Single line text input
- **text**: Multi-line text area
- **url**: URL input with validation
- **attachment**: File upload with drag-and-drop
- **reference**: Reference to another resource
- **quantity**: Number with unit

## Conditional Logic

```javascript
{
  linkId: 'follow-up',
  text: 'Please provide more details',
  type: 'text',
  enableWhen: [{
    question: 'symptoms',
    operator: '=',
    answerBoolean: true
  }],
  enableBehavior: 'all' // 'all' or 'any'
}
```

Supported operators: `exists`, `=`, `!=`, `>`, `<`, `>=`, `<=`

## Extensions

The package supports various FHIR extensions:

- `questionnaire-itemControl`: UI rendering hints (radio, dropdown, slider, etc.)
- `questionnaire-placeholder`: Placeholder text
- `minValue` / `maxValue`: Numeric constraints
- `maxLength`: Text length constraint
- `regex`: Pattern validation
- `maxSize`: File size limit for attachments
- `mimeType`: Allowed file types

## License

MIT