// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/example.jsx

import React from 'react';
import { QuestionnaireForm } from 'meteor/clinical:structured-data-capture';

// Example questionnaire based on PHQ-9 depression screening
const phq9Questionnaire = {
  resourceType: 'Questionnaire',
  id: 'phq9',
  url: 'http://example.org/Questionnaire/phq9',
  title: 'Patient Health Questionnaire (PHQ-9)',
  status: 'active',
  subjectType: ['Patient'],
  date: '2024-01-01',
  description: 'A brief depression severity measure',
  item: [
    {
      linkId: 'intro',
      type: 'display',
      text: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?'
    },
    {
      linkId: 'interest',
      type: 'choice',
      text: 'Little interest or pleasure in doing things',
      required: true,
      answerOption: [
        { valueCoding: { code: '0', display: 'Not at all' } },
        { valueCoding: { code: '1', display: 'Several days' } },
        { valueCoding: { code: '2', display: 'More than half the days' } },
        { valueCoding: { code: '3', display: 'Nearly every day' } }
      ]
    },
    {
      linkId: 'depressed',
      type: 'choice',
      text: 'Feeling down, depressed, or hopeless',
      required: true,
      answerOption: [
        { valueCoding: { code: '0', display: 'Not at all' } },
        { valueCoding: { code: '1', display: 'Several days' } },
        { valueCoding: { code: '2', display: 'More than half the days' } },
        { valueCoding: { code: '3', display: 'Nearly every day' } }
      ]
    },
    {
      linkId: 'sleep',
      type: 'choice',
      text: 'Trouble falling or staying asleep, or sleeping too much',
      required: true,
      answerOption: [
        { valueCoding: { code: '0', display: 'Not at all' } },
        { valueCoding: { code: '1', display: 'Several days' } },
        { valueCoding: { code: '2', display: 'More than half the days' } },
        { valueCoding: { code: '3', display: 'Nearly every day' } }
      ]
    },
    {
      linkId: 'difficulty',
      type: 'choice',
      text: 'If you checked off any problems, how difficult have these problems made it for you?',
      enableWhen: [{
        question: 'interest',
        operator: '!=',
        answerCoding: { code: '0' }
      }],
      enableBehavior: 'any',
      answerOption: [
        { valueCoding: { code: 'not_difficult', display: 'Not difficult at all' } },
        { valueCoding: { code: 'somewhat', display: 'Somewhat difficult' } },
        { valueCoding: { code: 'very', display: 'Very difficult' } },
        { valueCoding: { code: 'extremely', display: 'Extremely difficult' } }
      ]
    },
    {
      linkId: 'contact',
      type: 'group',
      text: 'Contact Information',
      item: [
        {
          linkId: 'name',
          type: 'string',
          text: 'Full Name',
          required: true
        },
        {
          linkId: 'email',
          type: 'string',
          text: 'Email Address',
          required: true,
          extension: [{
            url: 'http://hl7.org/fhir/StructureDefinition/regex',
            valueString: '^[\\w._%+-]+@[\\w.-]+\\.[A-Za-z]{2,}$'
          }]
        },
        {
          linkId: 'phone',
          type: 'string',
          text: 'Phone Number',
          extension: [{
            url: 'http://hl7.org/fhir/StructureDefinition/regex',
            valueString: '^\\d{3}-\\d{3}-\\d{4}$'
          }, {
            url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-placeholder',
            valueString: '555-555-5555'
          }]
        }
      ]
    },
    {
      linkId: 'notes',
      type: 'text',
      text: 'Additional notes or concerns',
      maxLength: 500
    },
    {
      linkId: 'consent',
      type: 'boolean',
      text: 'I consent to share this information with my healthcare provider',
      required: true
    }
  ]
};

export function PHQ9Example() {
  const handleSubmit = async (response, trackingData) => {
    console.log('Questionnaire submitted:', response);
    console.log('Tracking data:', trackingData);
    
    // Calculate PHQ-9 score
    const score = ['interest', 'depressed', 'sleep']
      .map(linkId => {
        const item = response.item.find(i => i.linkId === linkId);
        return parseInt(item?.answer?.[0]?.valueCoding?.code || 0);
      })
      .reduce((sum, val) => sum + val, 0);
    
    console.log('PHQ-9 Score:', score);
    
    // Save to database
    try {
      const responseId = await Meteor.callAsync('QuestionnaireResponse.submit', response.id, phq9Questionnaire);
      console.log('Response saved with ID:', responseId);
    } catch (error) {
      console.error('Error saving response:', error);
    }
  };

  const handleSave = async (response) => {
    console.log('Saving progress...', response);
    try {
      await Meteor.callAsync('QuestionnaireResponse.update', response.id, response);
      console.log('Progress saved');
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  return (
    <QuestionnaireForm
      questionnaire={phq9Questionnaire}
      onSubmit={handleSubmit}
      onSave={handleSave}
      showProgress={true}
      showSidebar={true}
      showLinkIds={false}
      enableTracking={true}
      thankYouPage={{
        show: true,
        message: "Thank you for completing the PHQ-9 assessment",
        subMessage: "Your responses have been recorded and will be reviewed by your healthcare provider.",
        redirectUrl: "/dashboard",
        redirectDelay: 5000
      }}
    />
  );
}