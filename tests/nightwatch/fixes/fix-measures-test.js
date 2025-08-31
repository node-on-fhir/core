// Fix for crud.measures.js test issue
// Problem: #versionInput is not interactable - form may not be in edit mode

// In test 07, before updating fields, add a check to enter edit mode if needed:

// Around line 663, before updating fields, add:
/*
// Ensure we're in edit mode
browser.execute(function() {
  const versionInput = document.querySelector('#versionInput');
  if (versionInput && versionInput.disabled) {
    // Find and click edit button
    const buttons = document.querySelectorAll('button');
    for (let button of buttons) {
      if (button.textContent.includes('Edit')) {
        button.click();
        return 'clicked_edit';
      }
    }
  }
  return 'already_editable';
}, [], function(result) {
  console.log('Edit mode check:', result.value);
});

browser.pause(1000); // Give time for form to become editable
*/

// Alternative solution: Use execute to set value if setValue fails
/*
browser
  .clearValue('#titleInput')
  .setValue('#titleInput', updatedMeasure.title)
  .execute(function(version) {
    const versionInput = document.querySelector('#versionInput');
    if (versionInput) {
      // Clear and set value
      versionInput.value = '';
      versionInput.value = version;
      // Trigger change event
      versionInput.dispatchEvent(new Event('change', { bubbles: true }));
      versionInput.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
    return false;
  }, [updatedMeasure.version])
*/

// The issue is likely that the form needs to be in edit mode before fields can be modified.