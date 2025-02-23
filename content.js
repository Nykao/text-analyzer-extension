let analyzeButton = null;
let lastMousePosition = { x: 0, y: 0 };

function createAnalyzeButton() {
  try {
    // Remove existing button if any
    if (analyzeButton) {
      analyzeButton.remove();
    }

    // Create new button
    analyzeButton = document.createElement('button');
    analyzeButton.textContent = 'Analyze';
    analyzeButton.className = 'analyze-button';
    document.body.appendChild(analyzeButton);

    // Add click handler
    analyzeButton.addEventListener('click', handleAnalyzeClick);
  } catch (error) {
    console.error('Error creating analyze button:', error);
  }
}

function handleAnalyzeClick() {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    // Hide the button
    hideAnalyzeButton();
    
    // Create and show loading modal
    const modal = document.createElement('div');
    modal.className = 'analyzer-modal';
    modal.innerHTML = '<div>Analyzing transcript...</div>';
    
    const backdrop = document.createElement('div');
    backdrop.className = 'analyzer-modal-backdrop';
    
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // Store the selected text for follow-up questions
    modal.dataset.selectedText = selectedText;

    // Check if chrome.runtime is still available
    if (!chrome.runtime) {
      modal.innerHTML = `
        <div class="result-content">Extension needs to be reloaded. Please refresh the page.</div>
        <button class="close-button">Close</button>
      `;
      addModalEventListeners(modal);
      return;
    }

    const youtubePrompt = `Analyze the given transcript of a YouTube video and generate a structured, time-saving summary. Extract only the most relevant steps, key actions, hints, and useful insights based on the video's purpose. The summary should be clear, to the point, and well-organized, eliminating unnecessary details, filler words, and tangents.

Instructions:

Identify and list all steps/actions in a logical sequence.
If the video is a tutorial, extract each step concisely with clear actions.
If the video is a review, extract key opinions, pros, and cons.
If it's an analysis, summarize insights, conclusions, and takeaways.
Highlight useful tips, hints, or shortcuts mentioned in the video.
Extract any tools, resources, or references the video recommends.
Ignore unrelated content, anecdotes, introductions, and off-topic discussions.
Present the information in an easy-to-read format (bullet points, numbered steps, or sections as needed).
Output Format:

1️⃣ Video Title & Purpose:
(Summarize the main goal of the video in a single sentence.)

2️⃣ Step-by-Step Actions (if applicable):

Step 1: (Action + key details)
Step 2: (Action + key details)
…
3️⃣ Key Insights & Useful Hints:

(Shortcuts, best practices, common mistakes to avoid, etc.)
4️⃣ Tools & Resources Mentioned:

(Any software, websites, or materials recommended in the video)
5️⃣ Final Takeaways & Conclusion:

(Summarize the overall value of the video in 1-2 sentences)
Example Output:
🟢 Video Title: "How to Edit Videos Like a Pro in 10 Minutes"
🎯 Purpose: Learn quick and effective video editing techniques using [Software Name].

🔹 Step-by-Step Guide:
1️⃣ Import Media – Open the editor and drag clips into the timeline.
2️⃣ Trim & Cut – Remove unnecessary parts by using the blade tool.
3️⃣ Add Transitions – Use smooth fades and cuts to enhance flow.
4️⃣ Apply Color Correction – Adjust brightness, contrast, and saturation.
5️⃣ Export & Save – Choose the best format for YouTube or social media.

💡 Useful Hints:
✔ Use keyboard shortcuts for faster editing.
✔ Keep clips under 10 seconds for dynamic pacing.
✔ Avoid overusing transitions; keep it smooth.

🛠 Tools Mentioned:

Adobe Premiere Pro, DaVinci Resolve, Free LUTs (link)
✅ Final Takeaway: This video provides a fast-track method to improve editing efficiency without unnecessary details.

Here's the transcript to analyze:

${selectedText}`;

    // Send message to background script to analyze text
    chrome.runtime.sendMessage({
      action: 'analyzeText',
      text: youtubePrompt
    }, response => {
      if (response && response.result) {
        modal.innerHTML = `
          <h3>Video Analysis</h3>
          <div class="result-content"></div>
          <div class="follow-up">
            <input type="text" placeholder="Ask a follow-up question about the video..." id="followUpInput">
            <div>
              <button class="follow-up-button">Ask Follow-up</button>
              <button class="close-button secondary">Close</button>
            </div>
          </div>
        `;
        const resultContent = modal.querySelector('.result-content');
        typeWriter(resultContent, response.result);
        addModalEventListeners(modal);
      } else {
        modal.innerHTML = `
          <div class="result-content">Error analyzing transcript. Please make sure your API key is set correctly.</div>
          <button class="close-button">Close</button>
        `;
        addModalEventListeners(modal);
      }
    });
  }
}

function addModalEventListeners(modal) {
  // Add close button listeners
  modal.querySelectorAll('.close-button').forEach(button => {
    button.addEventListener('click', () => {
      modal.remove();
      document.querySelector('.analyzer-modal-backdrop')?.remove();
    });
  });

  // Add follow-up button listener
  const followUpButton = modal.querySelector('.follow-up-button');
  if (followUpButton) {
    followUpButton.addEventListener('click', () => handleFollowUp(modal));
  }

  // Add enter key listener for input
  const input = modal.querySelector('#followUpInput');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleFollowUp(modal);
      }
    });
  }
}

function handleFollowUp(modal) {
  const input = modal.querySelector('#followUpInput');
  const question = input?.value.trim();
  const originalText = modal.dataset.selectedText;

  if (question && originalText) {
    // Clear input and show loading state
    input.value = '';
    modal.innerHTML = '<div>Analyzing...</div>';
    
    chrome.runtime.sendMessage({
      action: 'analyzeText',
      text: `Based on this video transcript: "${originalText}", please answer this specific question about the video: ${question}`
    }, response => {
      if (response && response.result) {
        modal.innerHTML = `
          <h3>Follow-up Response</h3>
          <div class="result-content"></div>
          <div class="follow-up">
            <input type="text" placeholder="Ask another question about the video..." id="followUpInput">
            <div>
              <button class="follow-up-button">Ask Follow-up</button>
              <button class="close-button secondary">Close</button>
            </div>
          </div>
        `;
        const resultContent = modal.querySelector('.result-content');
        typeWriter(resultContent, response.result);
        addModalEventListeners(modal);
      } else {
        modal.innerHTML = `
          <div class="result-content">Error analyzing response. Please try again.</div>
          <button class="close-button">Close</button>
        `;
        addModalEventListeners(modal);
      }
    });
  }
}

// Track mouse position
document.addEventListener('mousemove', (e) => {
  lastMousePosition = {
    x: e.clientX,
    y: e.clientY
  };
});

function showAnalyzeButton(e) {
  try {
    if (!analyzeButton) {
      createAnalyzeButton();
    }

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText) {
      // Position the button near the cursor
      const buttonWidth = analyzeButton.offsetWidth;
      const buttonHeight = analyzeButton.offsetHeight;
      
      // Calculate position relative to mouse cursor
      let left = lastMousePosition.x + window.scrollX;
      let top = lastMousePosition.y + window.scrollY + 20; // 20px below cursor
      
      // Ensure button stays within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (left + buttonWidth > viewportWidth) {
        left = viewportWidth - buttonWidth - 10;
      }
      
      if (top + buttonHeight > viewportHeight) {
        top = lastMousePosition.y + window.scrollY - buttonHeight - 10;
      }

      analyzeButton.style.display = 'block';
      analyzeButton.style.top = `${top}px`;
      analyzeButton.style.left = `${left}px`;
    } else {
      hideAnalyzeButton();
    }
  } catch (error) {
    console.error('Error in showAnalyzeButton:', error);
    // Try to recreate button if there was an error
    createAnalyzeButton();
  }
}

function hideAnalyzeButton() {
  try {
    if (analyzeButton) {
      analyzeButton.style.display = 'none';
    }
  } catch (error) {
    console.error('Error hiding analyze button:', error);
  }
}

// Initialize button
function initialize() {
  try {
    createAnalyzeButton();
    
    // Handle text selection
    document.addEventListener('mouseup', showAnalyzeButton);

    // Handle keyboard selection
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        showAnalyzeButton(e);
      }
    });

    // Hide button when clicking elsewhere
    document.addEventListener('mousedown', (e) => {
      if (analyzeButton && !analyzeButton.contains(e.target)) {
        hideAnalyzeButton();
      }
    });

    // Handle Ctrl+Enter shortcut
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
          handleAnalyzeClick();
        }
      }
    });
  } catch (error) {
    console.error('Error initializing:', error);
  }
}

// Initialize immediately and after DOM content loaded
initialize();
document.addEventListener('DOMContentLoaded', initialize);

// Handle extension reload
chrome.runtime.onConnect.addListener(() => {
  initialize();
});

// Add this function to format the response with highlights
function formatResponse(text) {
  // First, let's identify and store potential keywords from the content
  const keywordPatterns = [
    // Tools and platforms
    /\b(?:Glide|Zapier|Webflow|Airtable|Make|SaaS|API|SDK|No-code|Low-code)\b/gi,
    // Technical concepts
    /\b(?:front-end|backend|database|automation|integration|workflow|functionality)\b/gi,
    // Actions and processes
    /\b(?:build|create|design|implement|automate|configure|customize|deploy)\b/gi,
    // Important concepts
    /\b(?:best practices?|patterns?|principles?|architecture|design|scalability)\b/gi
  ];

  return text
    // Format emoji headers
    .replace(/(🟢|🎯|🔹|💡|🛠|✅)/g, match => `\n${match}`)
    // Format section titles with emojis
    .replace(/([1-5]️⃣[^:]+:)/g, '\n$1\n')
    // Add spacing after bullet points
    .replace(/([•*-])\s*/g, '\n$1 ')
    // Format steps
    .replace(/(Step \d+:?)/g, '\n$1')
    // Add line breaks before sections
    .replace(/(Key Insights|Tools Mentioned|Final Takeaway)/g, '\n$1')
    // Highlight tools and platforms
    .replace(/\b(Glide|Zapier|Webflow|Airtable|Make|SaaS)\b/g, 
      match => `<span class="highlight-tool">${match}</span>`)
    // Highlight technical terms
    .replace(/\b(front-end|backend|database|automation|workflow)\b/gi,
      match => `<span class="highlight-keyword">${match}</span>`)
    // Format emojis
    .replace(/[1-5]️⃣|✅|💡|🛠|🎯|🟢/g, match => `<span class="emoji-icon">${match}</span>`)
    // Clean up extra line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    // Convert line breaks to HTML
    .replace(/\n/g, '<br>');
}

// Add this new function for typing animation
function typeWriter(element, text, speed = 10) {
  let formattedText = formatResponse(text);
  element.innerHTML = ''; // Clear the element
  
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = formattedText;
  
  // Get text nodes and elements in correct order
  const nodes = [];
  function getNodes(node) {
    if (node.nodeType === 3) { // Text node
      nodes.push({ type: 'text', content: node.textContent });
    } else if (node.nodeType === 1) { // Element node
      nodes.push({ type: 'element-start', content: node.outerHTML.match(/^<[^>]+>/)[0] });
      Array.from(node.childNodes).forEach(child => getNodes(child));
      nodes.push({ type: 'element-end', content: `</${node.tagName.toLowerCase()}>` });
    }
  }
  Array.from(tempDiv.childNodes).forEach(node => getNodes(node));

  let i = 0;
  let currentHTML = '';
  
  function type() {
    if (i < nodes.length) {
      const node = nodes[i];
      if (node.type === 'text') {
        // Type text character by character
        const textArray = node.content.split('');
        let j = 0;
        
        function typeText() {
          if (j < textArray.length) {
            currentHTML += textArray[j];
            element.innerHTML = currentHTML;
            j++;
            setTimeout(typeText, speed);
          } else {
            i++;
            setTimeout(type, speed);
          }
        }
        typeText();
      } else {
        // Add HTML tags immediately
        currentHTML += node.content;
        element.innerHTML = currentHTML;
        i++;
        setTimeout(type, speed);
      }
    }
  }
  
  type();
}