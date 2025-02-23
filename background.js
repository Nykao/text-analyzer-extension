// Background script for potential future features
chrome.runtime.onInstalled.addListener(() => {
  console.log('Text Analyzer extension installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeText') {
    console.log('Received analyze request:', request.text.substring(0, 50) + '...');

    // Handle the analysis in an async wrapper
    (async () => {
      try {
        // Get the API key from storage
        const result = await chrome.storage.local.get(['mistralApiKey']);
        
        if (!result.mistralApiKey) {
          console.error('API key not found');
          sendResponse({ error: 'API key not found. Please set your Mistral AI API key.' });
          return;
        }

        console.log('Making API request...');
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.mistralApiKey}`
          },
          body: JSON.stringify({
            model: "mistral-tiny",
            messages: [
              {
                role: "user",
                content: request.text
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received API response:', data);

        if (data.choices && data.choices[0] && data.choices[0].message) {
          console.log('Sending success response');
          sendResponse({ result: data.choices[0].message.content });
        } else {
          throw new Error('Invalid response format from API');
        }

      } catch (error) {
        console.error('Error in background script:', error);
        sendResponse({
          error: `Failed to analyze text: ${error.message}`
        });
      }
    })();

    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});