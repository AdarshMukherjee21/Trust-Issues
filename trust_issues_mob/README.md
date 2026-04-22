
#  Trust Issues: Mobile App (Flutter)

This directory contains the source code for the Android edge client of the Trust Issues ecosystem. Built with Flutter, this app intercepts and scans SMS/RCS messages in real-time, providing users with immediate ML-powered threat classification and Gemini-powered explanations.

##  Key Features
* **Real-Time Scanning:** Queries local SMS databases to classify incoming messages as Spam/Ham using the central Railway ML API.
* **Explainable AI:** Integrates with the Gemini API to break down exactly *why* a message is dangerous (e.g., highlighting spoofed links or urgency tactics).
* **Interactive Trust Graph:** Uses a WebView bridge to render a 60fps physics-based Neo4j community graph, allowing users to visually explore their threat network.
* **Community Reporting:** One-tap threat reporting that instantly updates the global Neo4j graph to warn connected friends.

##  Folder Structure
* `lib/services/` - Core business logic (API calls, Firebase Auth, Neo4j interactions).
* `lib/pages/` - Main UI screens (My Checks, Profile, Community Graph).
* `lib/components/` - Reusable UI widgets (e.g., the expandable `MessageTile`).

##  Getting Started

### Prerequisites
* Flutter SDK (v3.10+)
* Android Studio (for emulator and build tools)
* A valid `google-services.json` file from Firebase.

### Setup Instructions
1. **Clone and Install Dependencies:**
   ```bash
   flutter pub get


2.  **Environment Variables:**
    Create a `.env` file in the root of this mobile app folder and add your Railway API credentials:
    ```env
    RAILWAY_API_URL=[https://your-railway-app.up.railway.app](https://your-railway-app.up.railway.app)
    RAILWAY_API_KEY=your_custom_api_key_here
    ```
3.  **Firebase Setup:**
    Place your `google-services.json` file inside `android/app/`.
4.  **Run the App:**
    ```bash
    flutter run
    ```
    *(Note: SMS scanning requires testing on a physical Android device, as emulators do not have real SMS databases).*

