// Debug script to verify workspace page loads correctly
const testWorkspacePage = () => {
  console.log('Testing workspace page...');
  console.log('URL:', window.location.href);
  
  // Check if React is loaded
  if (typeof React !== 'undefined') {
    console.log('✅ React is loaded');
  } else {
    console.log('❌ React not found');
  }
  
  // Check for any React errors in console
  const originalError = console.error;
  let reactErrors = [];
  
  console.error = function(...args) {
    if (args[0] && args[0].includes && args[0].includes('React')) {
      reactErrors.push(args[0]);
    }
    originalError.apply(console, args);
  };
  
  // Wait for component to render
  setTimeout(() => {
    if (reactErrors.length === 0) {
      console.log('✅ No React errors detected');
    } else {
      console.log('❌ React errors found:', reactErrors);
    }
    
    // Check if workspace content is visible
    const workspaceTitle = document.querySelector('h1');
    if (workspaceTitle) {
      console.log('✅ Workspace title found:', workspaceTitle.textContent);
    } else {
      console.log('❌ Workspace title not found');
    }
    
    // Restore original console.error
    console.error = originalError;
  }, 2000);
};

// Run test when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testWorkspacePage);
} else {
  testWorkspacePage();
}
