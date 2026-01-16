// Test script to verify eventCoding retrieval
// Run this in browser console on the message header detail page

const eventCodingField = document.querySelector('#eventCodingInput');
if (eventCodingField) {
  console.log('Field type:', eventCodingField.tagName);
  console.log('Field value:', eventCodingField.value);
  console.log('Field data-value:', eventCodingField.getAttribute('data-value'));
  console.log('Field disabled:', eventCodingField.disabled);
  
  if (eventCodingField.tagName === 'INPUT') {
    console.log('This is a TextField in view mode');
    console.log('Display value:', eventCodingField.value);
    console.log('Code value (data-value):', eventCodingField.getAttribute('data-value'));
  }
}

// Also check the database
if (typeof MessageHeaders !== 'undefined') {
  const messageHeaders = MessageHeaders.find().fetch();
  console.log('Total message headers:', messageHeaders.length);
  if (messageHeaders.length > 0) {
    const latest = messageHeaders[messageHeaders.length - 1];
    console.log('Latest message header eventCoding:', latest.eventCoding);
  }
}