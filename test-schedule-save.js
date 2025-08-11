// Test schedule save directly
// Run this in browser console to debug

const testSchedule = {
  resourceType: "Schedule",
  active: true,
  identifier: [{
    system: "",
    value: "Test-Schedule-" + Date.now()
  }],
  serviceCategory: [{
    coding: [{
      system: "http://example.org/service-category",
      code: "17",
      display: "General Practice"
    }]
  }],
  serviceType: [{
    coding: [{
      system: "http://example.org/service-type",
      code: "185389009",
      display: "Follow-up appointment"
    }]
  }],
  actor: [{
    reference: "Practitioner/test",
    display: "Dr. Test"
  }],
  planningHorizon: {
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  comment: "Test schedule",
  notes: "Test notes"
};

console.log('Test schedule:', testSchedule);

// Try to save
Meteor.call('createSchedule', testSchedule, (error, result) => {
  if (error) {
    console.error('Save failed:', error);
  } else {
    console.log('Save succeeded:', result);
    // Check if it's in the database
    const saved = Schedules.findOne({_id: result});
    console.log('Saved schedule:', saved);
  }
});