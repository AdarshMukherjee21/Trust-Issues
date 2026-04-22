
#  Trust Issues: Web Dashboard (Next.js)

This directory contains the React/Next.js source code for the Trust Issues Web Dashboard. It serves as the centralized portal where users can view their global security posture, analyze recent scans from both their mobile device and Chrome extension, and explore community threat metrics.

##  Key Features
* **Unified Security Posture:** Syncs in real-time with Firebase Firestore to display unified metrics from both the Mobile App (SMS) and Chrome Extension (Gmail).
* **Interactive Visualizations:** Renders the Neo4j Community Graph directly in the browser using `vis-network`.
* **Cross-Platform Auth:** Uses Firebase Authentication to ensure seamless session management across the entire ecosystem.

##  Folder Structure
* `app/` (or `pages/`) - Next.js routing and main page layouts (Dashboard, Profile, Graph View).
* `components/` - Reusable React components (Stat Cards, Charts, Layout elements).
* `lib/` - Helper functions for Firebase initialization and API calls.

##  Getting Started

### Prerequisites
* Node.js (v18+)
* npm or yarn

### Setup Instructions
1. **Install Dependencies:**
   ```bash
   npm install
   # or
   yarn install


2.  **Environment Variables:**
    Create a `.env.local` file in the root of this folder and add your Firebase and Railway credentials:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_RAILWAY_API_URL=[https://your-railway-app.up.railway.app](https://your-railway-app.up.railway.app)
    ```
3.  **Run the Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
4.  Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

