# Chrome Web Store Listing Content

Here is the content you can copy and paste into the Chrome Web Store dashboard.

## Product Details

**Title**: `AI Filler for Google Forms`
**Summary**: `Automatically detects and answers all question types on Google Forms by querying an AI server.`

**Description**:
```text
🚀 AI Filler for Google Forms - The Ultimate Time Saver!

Tired of manually filling out long Google Forms? Let AI do the heavy lifting for you!

AI Filler for Google Forms is a powerful Chrome extension that automatically detects questions on any Google Form and intelligently fills them out using advanced AI. Whether it's multiple-choice, checkboxes, dropdowns, or text answers, our extension handles it all with a single click.

✨ Key Features:
• 🤖 AI-Powered Accuracy: Uses state-of-the-art AI to understand context and provide relevant answers.
• ⚡ Instant Auto-Fill: Fill entire forms in seconds, not minutes.
• ✅ Supports All Question Types:
    - Multiple Choice (Radio Buttons)
    - Checkboxes (Multiple Selections)
    - Dropdown Menus
    - Short & Long Text Answers
• 🔒 Secure & Private: Your data is processed securely. We prioritize your privacy.
• 👆 Drag & Drop Button: The 'Auto Fill' button floats conveniently on your screen. Move it anywhere you like!

How to Use:
1. Open any Google Form.
2. Click the floating 'Auto Fill' button.
3. Watch as the AI magically fills in the answers!
4. Review and submit.

Perfect for testing forms, filling out surveys, or just saving time on repetitive tasks.

Download AI Filler for Google Forms today and experience the future of form filling!
```

**Category**: `Productivity` or `Developer Tools`
**Language**: `English`

## Graphic Assets

*   **Store Icon**: Upload `icons/128.png` (We just generated this).
*   **Screenshots**: You need to take at least **one** screenshot.
    *   *Tip*: Open a Google Form, click the "Auto Fill" button so it shows "Filled X/Y", and take a screenshot of the form with the filled answers and the button visible.
*   **Small Promo Tile (440x280)**: Upload `promo_tiles/small_promo_tile.png` (Generated for you).
*   **Marquee Promo Tile (1400x560)**: Upload `promo_tiles/marquee_promo_tile.png` (Generated for you).

## Additional Fields

**Official URL**: (Leave blank if you don't have a specific landing page)
**Homepage URL**: `https://github.com/addy1947/extension` (Or your GitHub profile if you prefer)
**Support URL**: `https://github.com/addy1947/extension/issues`

## Privacy Practices

**Privacy Policy**:
You need to host a Privacy Policy. You can create a simple GitHub Gist or a file in your repo. Here is a draft you can use:

```text
## Privacy Policy for AI Filler for Google Forms

**Last Updated:** [Current Date]

**1. Data Collection**
We collect the content of the Google Forms you visit (specifically the questions and options) only when you explicitly click the "Auto Fill" button. This data is sent to our AI server (onrender.com) solely for the purpose of generating answers.

**2. Data Usage**
The data collected is used exclusively to:
*   Analyze the questions.
*   Generate appropriate answers using AI.
*   Return the answers to your browser to fill the form.

**3. Data Retention**
We do not store your form data or personal information on our servers. The data is processed in real-time and discarded immediately after the response is generated.

**4. Third-Party Services**
We use a third-party AI service to process the text. Your data is transmitted securely via HTTPS.

**5. Contact**
If you have any questions, please contact us at [Your Email] or via our Support URL.

## Single Purpose Description
*Use this for the "Single Purpose" field in the Privacy tab:*

`This extension's single purpose is to automate the filling of Google Forms by detecting questions on the active tab and using an external AI service to generate and populate the answers.`

## Permission Justification
*Use this for the "activeTab" permission justification:*

`The "activeTab" permission is required to allow the extension to access the DOM of the currently open Google Form. This enables the extension to read the form questions and programmatically insert the generated answers only when the user is actively using the extension on that specific tab.`

## Host Permission Justification
*Use this for the "Host permissions" justification (for `https://google-form-server.onrender.com/*`):*

`The extension needs to communicate with our external AI server (hosted on onrender.com) to process the form questions and generate accurate answers. This host permission is strictly used to send the question text and receive the corresponding answers.`

## Remote Code Justification
*Use this if asked for justification regarding remote code (Select "No, I am not using remote code"):*

`The extension does not execute any remote code. All logic, including the content scripts and UI handling, is bundled locally within the extension package. The connection to the external server is solely for exchanging JSON data (sending questions and receiving text answers), which is then processed by the local scripts.`

## Data Collection (Privacy Tab)
*Select the following option:*

*   [x] **Website content** (Text, images, sounds, videos, or hyperlinks)

*Justification for Website Content:*
`The extension reads the text of the questions on the Google Form (website content) to send it to the AI server for processing and generating an answer.`

## Data Usage Certification
*You must verify and check all three boxes:*

*   [x] **I do not sell or transfer user data to third parties, outside of the approved use cases**
*   [x] **I do not use or transfer user data for purposes that are unrelated to my item's single purpose**
*   [x] **I do not use or transfer user data to determine creditworthiness or for lending purposes**

## Privacy Policy URL
*You need to host the privacy policy online. I have created a `PRIVACY_POLICY.md` file for you.*

**Option 1 (GitHub):**
1.  Push your code to GitHub.
2.  Click on `PRIVACY_POLICY.md`.
3.  Click "Raw".
4.  Copy that URL and paste it here.

**Option 2 (Gist):**
1.  Go to [gist.github.com](https://gist.github.com).
2.  Create a new Gist named `privacy_policy.md`.
3.  Paste the content of `PRIVACY_POLICY.md`.
4.  Create the Gist, click "Raw", and use that URL.
```

**Item Support**: Turn **ON**.
