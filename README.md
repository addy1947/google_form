# Browser Extension (GF Auto Answer)

This Chrome extension (Manifest V3) runs a content script on Google Forms pages, finds multiple-choice questions, and sends them to the backend server at `https://google-form-server.onrender.com/api/answer`. The server uses Gemini AI to answer the questions and the extension automatically fills in the correct answers.

## Load into Chrome:
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **"Load unpacked"** and choose this `browser/` folder
4. Navigate to any Google Form with multiple-choice questions
5. Click the **"Ask AI"** button that appears in the top-right corner

## Features:
- Automatically detects multiple-choice questions on Google Forms
- Sends questions to Gemini AI via backend server
- Auto-fills correct answers with a single click
- Works with deployed backend on Render
# google_form
