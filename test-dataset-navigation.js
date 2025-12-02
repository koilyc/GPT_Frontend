// Test dataset navigation
const testDatasetNavigation = () => {
  console.log('Testing dataset navigation...');
  
  // Check current URL
  console.log('Current URL:', window.location.href);
  
  // Find View Dataset buttons
  const viewButtons = document.querySelectorAll('button');
  let datasetButtons = [];
  
  viewButtons.forEach(button => {
    if (button.textContent && button.textContent.includes('View Dataset')) {
      datasetButtons.push(button);
      console.log('Found View Dataset button:', button);
    }
  });
  
  if (datasetButtons.length > 0) {
    console.log(`Found ${datasetButtons.length} View Dataset button(s)`);
    
    // Test click on first button
    const firstButton = datasetButtons[0];
    console.log('Testing click on first View Dataset button...');
    
    // Add event listener to see where it navigates
    const originalPushState = history.pushState;
    history.pushState = function(state, title, url) {
      console.log('Navigation attempt to:', url);
      originalPushState.call(history, state, title, url);
    };
    
    // Click the button
    firstButton.click();
    
    // Restore original pushState after a short delay
    setTimeout(() => {
      history.pushState = originalPushState;
      console.log('Final URL after click:', window.location.href);
    }, 1000);
    
  } else {
    console.log('No View Dataset buttons found');
  }
};

// Wait for page to load
setTimeout(testDatasetNavigation, 3000);
