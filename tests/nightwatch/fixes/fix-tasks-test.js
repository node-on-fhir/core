// Fix for crud.tasks.js test issue
// Problem: Test is waiting for #tasksTable before navigating to the tasks page

// In test 07, around line 783-785, replace:
/*
browser
  .pause(500)
  .waitForElementVisible('#tasksTable', 5000);
*/

// With:
/*
browser
  .pause(500)
  .url('http://localhost:3000/tasks')
  .waitForElementVisible('#tasksPage', 5000)
  .pause(1000);

// Re-establish patient context after navigation
browser.execute(function(testIdentifier) {
  if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
    const patient = Patients.findOne({
      'identifier.value': testIdentifier
    });
    if (patient) {
      Session.set('selectedPatientId', patient._id);
      Session.set('selectedPatient', patient);
      console.log('Re-established patient context after navigation:', patient._id);
      return { success: true };
    }
  }
  return { success: false };
}, ['test-patient-' + timestamp]);

browser
  .pause(500)
  .waitForElementVisible('#tasksTable', 5000);
*/

// The issue is that the test expects to be on the tasks list page but hasn't navigated there yet.
// After updating a task, we need to navigate back to the list page before looking for the table.