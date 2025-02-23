import MistralClient from '@mistralai/mistralai';

const client = new MistralClient(import.meta.env.VITE_MISTRAL_API_KEY);

// Process text with Mistral AI
async function processWithMistral(text) {
  const prompt = `
    Analyze the given transcript of a YouTube video and generate a structured, time-saving summary. Extract only the most relevant steps, key actions, hints, and useful insights based on the video's purpose. The summary should be clear, to the point, and well-organized, eliminating unnecessary details, filler words, and tangents.

    Instructions:
    - Identify and list all steps/actions in a logical sequence.
    - If the video is a tutorial, extract each step concisely with clear actions.
    - If the video is a review, extract key opinions, pros, and cons.
    - If it's an analysis, summarize insights, conclusions, and takeaways.
    - Highlight useful tips, hints, or shortcuts mentioned in the video.
    - Extract any tools, resources, or references the video recommends.
    - Ignore unrelated content, anecdotes, introductions, and off-topic discussions.
    - Present the information in an easy-to-read format (bullet points, numbered steps, or sections as needed).

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

    Transcript:
    ${text}

  `;

  try {
    const response = await client.chat({
      model: "mistral-tiny",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error processing with Mistral:', error);
    throw new Error('Failed to analyze the text');
  }
}

// Main function to handle text analysis
async function analyzeText(text) {
  const resultDiv = document.getElementById('result');
  const loadingDiv = document.getElementById('loading');
  let updateStep; // Declare updateStep at the top level of the function
  
  const steps = [
    'Validating input',
    'Processing text',
    'Processing with AI'
  ];
  
  // Create steps UI
  loadingDiv.innerHTML = `
    <div class="steps">
      ${steps.map((step, index) => `
        <div class="step" id="step-${index}">
          <span class="step-icon">○</span>
          ${step}
        </div>
      `).join('')}
    </div>
  `;
  
  try {
    loadingDiv.classList.remove('hidden');
    resultDiv.innerHTML = '';
    
    // Define updateStep function
    updateStep = (index, status) => {
      const stepEl = document.getElementById(`step-${index}`);
      const iconEl = stepEl.querySelector('.step-icon');
      stepEl.className = `step ${status}`;
      iconEl.textContent = status === 'completed' ? '✓' : status === 'error' ? '✗' : '○';
    };
    
    // Step 1: Validate URL
    updateStep(0, 'active');
    if (!text.trim()) {
      updateStep(0, 'error');
      throw new Error('Please enter some text to analyze');
    }
    updateStep(0, 'completed');
    
    // Step 2: Process text
    updateStep(1, 'active');
    const processedText = text.trim();
    updateStep(1, 'completed');

    // Process with Mistral AI
    updateStep(2, 'active');
    const analysis = await processWithMistral(processedText);
    updateStep(2, 'completed');

    // Display results
    resultDiv.innerHTML = analysis.replace(/\n/g, '<br>');
  } catch (error) {
    // Mark remaining steps as error
    for (let i = 0; i < steps.length; i++) {
      const stepEl = document.getElementById(`step-${i}`);
      if (stepEl && !stepEl.classList.contains('completed')) {
        updateStep(i, 'error');
      }
    }
    
    resultDiv.innerHTML = `
      <div class="error">
        ${error.message || 'An error occurred while analyzing the text. Please try again.'}
      </div>
    `;
  } finally {
    // Don't hide the steps, they show the process status
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Get elements if they exist (they might not on all pages)
  const analyzeBtn = document.getElementById('analyzeBtn') || null;
  const clearBtn = document.getElementById('clearBtn') || null;
  const textInput = document.getElementById('textInput') || null;
  const resultDiv = document.getElementById('result') || null;
  const loadingDiv = document.getElementById('loading') || null;
  let selectedText = '';

  // Check for text parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const textFromUrl = urlParams.get('text');
  
  // If we have text from URL and we're on the main page, populate and analyze it
  if (textFromUrl && textInput && analyzeBtn) {
    textInput.value = decodeURIComponent(textFromUrl);
    analyzeText(textInput.value);
    // Clean up the URL
    window.history.replaceState({}, '', '/');
  }

  // Create a floating analyze button for selected text
  const floatingBtn = document.createElement('button');
  floatingBtn.className = 'floating-analyze-btn hidden';
  floatingBtn.textContent = 'Analyze Selection';
  document.body.appendChild(floatingBtn);

  // Listen for text selection across the page
  document.addEventListener('selectionchange', () => {
    const selection = document.getSelection();
    const text = selection.toString().trim();
    if (text) {
      selectedText = text;
      
      // Show floating button near selection
      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Ensure the button is visible within viewport
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        let top = window.scrollY + rect.bottom + 10;
        let left = window.scrollX + rect.left;
        
        // Adjust if would appear off-screen
        if (left + floatingBtn.offsetWidth > viewportWidth) {
          left = viewportWidth - floatingBtn.offsetWidth - 10;
        }
        if (top + floatingBtn.offsetHeight > window.scrollY + viewportHeight) {
          top = window.scrollY + rect.top - floatingBtn.offsetHeight - 10;
        }
        
        floatingBtn.style.top = `${top}px`;
        floatingBtn.style.left = `${left}px`;
        floatingBtn.classList.remove('hidden');
      } catch (e) {
        console.error('Error positioning floating button:', e);
      }

      // Update main analyze button if it exists
      if (analyzeBtn) {
        analyzeBtn.textContent = 'Analyze Selection';
        analyzeBtn.style.backgroundColor = '#27ae60';
      }
    } else {
      selectedText = '';
      floatingBtn.classList.add('hidden');
      
      // Reset main analyze button if it exists
      if (analyzeBtn) {
        analyzeBtn.textContent = 'Analyze Text';
        analyzeBtn.style.backgroundColor = '#3498db';
      }
    }
  });

  // Clear functionality
  const clearAll = () => {
    if (textInput) textInput.value = '';
    if (resultDiv) resultDiv.innerHTML = '';
    if (loadingDiv) loadingDiv.classList.add('hidden');
    selectedText = '';
    floatingBtn.classList.add('hidden');
    if (analyzeBtn) {
      analyzeBtn.textContent = 'Analyze Text';
      analyzeBtn.style.backgroundColor = '#3498db';
    }
    if (textInput) textInput.focus();
  };

  if (clearBtn) {
    clearBtn.addEventListener('click', clearAll);
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      const text = selectedText || (textInput ? textInput.value : '');
      if (text) {
        analyzeText(text);
      }
    });
  }

  // Handle floating button click
  floatingBtn.addEventListener('click', () => {
    if (selectedText) {
      // Clear the selection
      window.getSelection().removeAllRanges();
      
      // If we're not on the main page, redirect to it with the selected text
      if (!resultDiv) {
        const url = new URL('/', window.location.origin);
        url.searchParams.set('text', selectedText);
        window.location.href = url.toString();
        return;
      }
      analyzeText(selectedText);
      floatingBtn.classList.add('hidden');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      const text = selectedText || (textInput ? textInput.value : '');
      if (text.trim()) {
        // Clear the selection
        window.getSelection().removeAllRanges();
        
        if (!resultDiv) {
          // If not on main page, redirect
          const url = new URL('/', window.location.origin);
          url.searchParams.set('text', text);
          window.location.href = url.toString();
        } else {
          analyzeText(text);
        }
        e.preventDefault();
      }
    }
  });

  // Add keyboard shortcut for clearing (Ctrl+K)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      clearAll();
    }
  });
});