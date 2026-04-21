// background.js

// 1. Import the config variables so the background script can see them
importScripts('config.js');

console.log("Trust Issues Service Worker Booted Successfully! Config loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "SCAN_API") {
    console.log("1. Background received scan request for subject:", request.subject);

    // 1. Check if user is logged in
    chrome.storage.local.get(['uid', 'idToken'], async (store) => {
      console.log("2. Retrieved auth from Chrome Storage. UID:", store.uid || "MISSING");

      if (!store.uid || !store.idToken) {
        sendResponse({ success: false, error: "AUTH_REQUIRED" });
        return;
      }

      try {
        // 2. Hit Railway API
        console.log("3. Hitting Railway API at:", CONFIG.RAILWAY_API_URL);
        const railwayRes = await fetch(`${CONFIG.RAILWAY_API_URL}/api/v1/predict/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Trust-issue-API-Key': CONFIG.RAILWAY_API_KEY
          },
          body: JSON.stringify({
            subject: request.subject || "No Subject",
            body: request.body ? request.body.substring(0, 5000) : "No Body"
          })
        });

        const mlData = await railwayRes.json();
        console.log("4. Railway Response:", mlData);

        if (!railwayRes.ok) {
          throw new Error(`Railway API Failed: ${JSON.stringify(mlData)}`);
        }

        const prediction = mlData.data?.prediction || "UNKNOWN";
        console.log("5. Extracted Prediction:", prediction);

        // 3. Write to Firestore using REST API
        console.log("6. Attempting to save to Firestore...");
        const docId = new Date().toISOString().replace(/[:.]/g, '_');
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${store.uid}/email_checks?documentId=${docId}`;

        const firestoreRes = await fetch(firestoreUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${store.idToken}`
          },
          body: JSON.stringify({
            fields: {
              subject: { stringValue: request.subject || "No Subject" },
              message: { stringValue: request.body ? request.body.substring(0, 2000) : "No Body" },
              sender: { stringValue: request.sender || "Unknown" },
              prediction: { stringValue: prediction },
              pushed_to_community: { booleanValue: false },
              timestamp: { timestampValue: new Date().toISOString() }
            }
          })
        });

        const fsData = await firestoreRes.json();
        
        if (!firestoreRes.ok) {
          console.warn("⚠️ Firestore Save Failed (Check your Firebase Security Rules!):", fsData);
        } else {
          console.log("7. ✅ Successfully saved to Firestore!", fsData);
        }

        // 4. Send prediction back to the Gmail Button
        sendResponse({ success: true, prediction: prediction });

      } catch (error) {
        console.error("🚨 Background Fetch Error:", error);
        sendResponse({ success: false, error: error.message });
      }
    });

    return true; // Keeps the message channel open so we can await fetch
  }
});