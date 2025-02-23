# Text Analyzer Extension

A Chrome extension that analyzes selected text using Mistral AI to provide structured insights and summaries.

## Features

- 🔍 Analyze any selected text with one click
- �� Powered by Mistral AI for intelligent analysis
- ✨ Animated typing effect for results
- 💬 Interactive follow-up questions
- 🎨 Clean, modern interface
- 🔑 Secure API key management

## Installation

1. Set up your API key
   - Copy `config.template.js` to `config.js`
   - Add your Mistral AI API key to `config.js`
   - Note: `config.js` is gitignored to protect your API key

2. Load in Chrome
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

## How to Use

1. Select any text on a webpage
2. Click the "Analyze" button that appears
3. View the analysis with:
   - Title & Purpose
   - Step-by-Step Actions (if applicable)
   - Key Insights & Hints
   - Tools & Resources
   - Final Takeaways
4. Ask follow-up questions for deeper understanding

## Configuration

1. Get your API key from [Mistral AI](https://mistral.ai)
2. Open the extension popup
3. Enter your API key
4. Save and refresh the page

## Development

### Files Structure

├─manifest.json
├── content.js
├── content.css
├── background.js
├── popup.html
├─config.template.js
└── config.js (you need to create this) 


### Local Development
1. Make your changes
2. Reload the extension in Chrome
3. Test functionality

## Security Note

⚠️ Never commit your `config.js` with your actual API key. This file is listed in `.gitignore` to prevent accidental commits.

## License

MIT License

## Acknowledgments

- [Mistral AI](https://mistral.ai) for the AI model
- Chrome Extensions API
