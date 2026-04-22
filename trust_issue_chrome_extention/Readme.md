
#  Trust Issues: Browser Extension (Chrome)

This directory contains the source code for the Trust Issues Chrome Extension. Serving as the desktop edge client for the ecosystem, this extension injects directly into the Gmail interface to provide users with real-time, inline phishing detection and AI-powered threat analysis without ever leaving their inbox.

##  Key Features
* **Inline Gmail Scanning:** Uses DOM manipulation to seamlessly inject a "Scan Threat" button directly into the Gmail UI.
* **Real-Time ML Analysis:** Securely transmits email subjects and bodies to the Railway backend, where the Extra Trees Classifier (ETC) determines if the email is a threat.
* **Continuous Synchronization:** Logs all scan results directly to the user's centralized Firebase `email_checks` collection, instantly reflecting on their Web Dashboard.
* **Secure REST Authentication:** Implements a custom background service worker to manage Firebase Auth via the REST API, including automated `refreshToken` exchanges to bypass the standard 1-hour token expiration limit.

##  Folder Structure
* `manifest.json` - The core configuration file detailing permissions (`storage`, `activeTab`) and background scripts.
* `background.js` - The Service Worker. Handles all external API calls (Railway & Firebase) and manages secure token refreshing.
* `content.js` - The DOM injector. Reads the email content and renders the Trust Issues UI elements inside Gmail.
* `popup.html` / `popup.js` - The extension dropdown menu for user login and quick-status checks.
* `config.js` - Stores the environment variables needed for API routing.

##  Getting Started

### Prerequisites
* Google Chrome (or any Chromium-based browser like Edge or Brave).

### Setup Instructions
1. **Configure Environment Variables:**
   Create a file named `config.js` in the root of this directory and add your API keys:
   ```javascript
   // config.js
   const CONFIG = {
       FIREBASE_API_KEY: "your_firebase_web_api_key",
       FIREBASE_PROJECT_ID: "your_project_id",
       RAILWAY_API_URL: "[https://your-railway-app.up.railway.app](https://your-railway-app.up.railway.app)",
       RAILWAY_API_KEY: "your_custom_api_key_here"
   };
   ```
2. **Load the Extension into Chrome:**
   * Open Chrome and navigate to `chrome://extensions/`.
   * Enable **"Developer mode"** (toggle in the top right corner).
   * Click the **"Load unpacked"** button in the top left.
   * Select this `chrome-extension` folder.
3. **Test the Integration:**
   * Click the Trust Issues puzzle piece icon in your Chrome toolbar and log in with your account.
   * Open Gmail, navigate to any email, and look for the injected **"Scan Threat"** button next to the reply options.

##  Development Notes
* **Firebase Auth Limits:** Because browser extensions do not support the standard Firebase Web SDK's background state persistence out-of-the-box, this extension relies entirely on the **Firebase Identity Toolkit REST API**. 
* Ensure `background.js` is correctly calling `securetoken.googleapis.com` to swap the `refreshToken` for a fresh `idToken` before attempting to write to the Firestore database.
