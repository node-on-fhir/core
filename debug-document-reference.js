// debug-document-reference.js
// Quick script to check document reference structure in the database

// Run this in the Meteor shell or browser console
if (typeof DocumentReferences !== 'undefined') {
  console.log('=== Document References Debug ===');
  
  const docs = DocumentReferences.find({}).fetch();
  console.log(`Total documents: ${docs.length}`);
  
  if (docs.length > 0) {
    const latestDoc = docs[docs.length - 1]; // Get most recent
    console.log('\nLatest document structure:');
    console.log(JSON.stringify(latestDoc, null, 2));
    
    console.log('\nChecking specific fields:');
    console.log('_id:', latestDoc._id);
    console.log('type:', latestDoc.type);
    console.log('type.coding:', latestDoc.type?.coding);
    console.log('type.coding[0]:', latestDoc.type?.coding?.[0]);
    console.log('type.text:', latestDoc.type?.text);
    console.log('content:', latestDoc.content);
    console.log('content[0].attachment:', latestDoc.content?.[0]?.attachment);
    console.log('subject:', latestDoc.subject);
  }
  
  // Check for test document
  const testDoc = DocumentReferences.findOne({
    'content.0.attachment.title': { $regex: 'Test Document' }
  });
  
  if (testDoc) {
    console.log('\nFound test document:');
    console.log(JSON.stringify(testDoc, null, 2));
  }
} else {
  console.log('DocumentReferences collection not available');
}