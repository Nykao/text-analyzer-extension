// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load existing API key if any
  chrome.storage.local.get(['mistralApiKey'], (result) => {
    if (result.mistralApiKey) {
      document.getElementById('apiKey').value = result.mistralApiKey;
    }
  });

  document.getElementById('saveKey').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value;
    
    // Save the API key
    chrome.storage.local.set({ mistralApiKey: apiKey }, () => {
      // Check for any chrome.runtime errors
      if (chrome.runtime.lastError) {
        console.error('Error saving API key:', chrome.runtime.lastError);
        return;
      }
      
      // Close the popup if save was successful
      window.close();
    });
  });
});