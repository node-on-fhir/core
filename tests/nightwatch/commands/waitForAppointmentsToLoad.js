// tests/nightwatch/commands/waitForAppointmentsToLoad.js

exports.command = function(timeout = 10000) {
  const self = this;
  const startTime = Date.now();
  
  // First wait for any loading indicators to disappear
  this.waitForElementNotPresent('.MuiCircularProgress-root', timeout);
  
  // Then wait for the content to stabilize
  this.perform(function(done) {
    function checkReady() {
      self.execute(function() {
        const pageElement = document.querySelector('#appointmentsPage');
        if (!pageElement) return { ready: false, reason: 'Page not found' };
        
        const pageText = pageElement.textContent || '';
        
        // Check various states
        const isLoading = pageText.includes('Loading appointments...');
        const hasTable = document.querySelector('#appointmentsTable') !== null;
        const hasNoDataMessage = pageText.includes('0 appointments found') || 
                                pageText.includes('No Data Available');
        const hasAddButton = Array.from(document.querySelectorAll('button')).some(b => 
                           b.textContent.includes('Add Appointment'));
        
        // Page is ready when it's not loading and has expected content
        const isReady = !isLoading && (hasTable || hasNoDataMessage) && hasAddButton;
        
        return {
          ready: isReady,
          isLoading: isLoading,
          hasTable: hasTable,
          hasNoDataMessage: hasNoDataMessage,
          hasAddButton: hasAddButton
        };
      }, [], function(result) {
        if (result.value.ready) {
          done();
        } else if (Date.now() - startTime < timeout) {
          // Try again in 250ms
          setTimeout(checkReady, 250);
        } else {
          console.log('Timeout waiting for appointments to load. Last state:', result.value);
          done();
        }
      });
    }
    
    checkReady();
  });
  
  return this;
};